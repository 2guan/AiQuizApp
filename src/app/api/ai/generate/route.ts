
import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { getSettings, getDb } from '@/lib/db';

// Define the expected structure of the AI response
interface GeneratedQuestion {
    content: string;
    type: 'single' | 'multiple';
    options: Record<string, string>;
    answer: string[];
    explanation: string;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const text = formData.get('text') as string;
        const file = formData.get('file') as File;
        const singleCount = parseInt(formData.get('singleCount') as string) || 0;
        const multipleCount = parseInt(formData.get('multipleCount') as string) || 0;
        const competitionId = formData.get('competitionId') as string;

        let context = text || '';

        // If file is provided, parse it
        if (file) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const result = await mammoth.extractRawText({ buffer });
            context += '\n' + result.value;
        }

        if (!context.trim()) {
            return NextResponse.json({ error: '请提供文本或上传文件' }, { status: 400 });
        }

        // Get AI settings from User (Creator of the competition)
        const db = getDb();

        // Find the creator of the competition
        let creatorId;
        if (competitionId) {
            const competition = db.prepare('SELECT created_by FROM competitions WHERE id = ?').get(competitionId);
            if (competition) {
                creatorId = competition.created_by;
            }
        }

        let apiKey, baseUrl, model;

        if (creatorId) {
            const user = db.prepare('SELECT ai_api_key, ai_base_url, ai_model FROM users WHERE id = ?').get(creatorId);
            if (user) {
                apiKey = user.ai_api_key;
                baseUrl = user.ai_base_url;
                model = user.ai_model;
            }
        }

        // Fallback to env vars if not found in user settings
        apiKey = apiKey || process.env.OPENAI_API_KEY;
        baseUrl = baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
        model = model || 'gpt-3.5-turbo';

        if (!apiKey) {
            console.warn("No API Key found. Please configure it in Dashboard Settings.");
            return NextResponse.json({ error: '未配置 AI API Key，请在控制台“智能出题设置”中配置' }, { status: 500 });
        }

        const prompt = `
        基于以下内容生成题目：
        - 单选题：${singleCount} 道
        - 多选题：${multipleCount} 道
        
        内容：
        ${context.slice(0, 4000)} 
        
        请严格按照以下 JSON 格式返回，不要包含 markdown 格式标记。
        注意：
        1. 所有字符串必须使用双引号。
        2. 如果内容中包含双引号，请使用反斜杠转义 (\\")。
        3. 如果内容中包含反斜杠，请使用双反斜杠转义 (\\\\)。
        4. 不要使用任何控制字符。
        
        [
            {
                "content": "题目内容",
                "type": "single" (或 "multiple"),
                "options": { "A": "选项A", "B": "选项B", "C": "选项C", "D": "选项D" },
                "answer": ["A"] (如果是多选则为 ["A", "B"]),
                "explanation": "解析" (应不少于100字，请按照【题目出处】、【原文内容】、【题目解析】的顺序分段回复，题目会乱序，请不要在解析中列出字母选项，比如，不要写“A是对的”。请在【原文内容】、【题目解析】前插入换行符。最后合并为一个字符串返回。)
            }
        ]
        `;

        // Normalize Base URL
        let finalUrl = baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
        if (!finalUrl.endsWith('/v1')) {
            finalUrl += '/v1';
        }

        try {
            const response = await fetch(`${finalUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: '你是一个专业的出题助手。请只返回纯 JSON 数组，不要包含 ```json ... ``` 标记。确保所有特殊字符（特别是反斜杠和双引号）都已正确转义。' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`AI API Error: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            let content = data.choices[0].message.content;

            // Clean up markdown code blocks if present
            content = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();

            // Attempt to sanitize common JSON errors
            // 1. Fix unescaped backslashes (this is tricky, but common in LaTeX or paths)
            // We want to replace \ that is NOT followed by " or \ or / or b or f or n or r or t or u with \\
            // But doing this safely with regex on a full JSON string is hard. 
            // Instead, let's try a more specific fix for common "Bad escaped character" which is often \ followed by something invalid.

            // A safer approach for "Bad escaped character" is often just to try parsing, and if it fails, try to fix.
            // But let's try to pre-process:
            // Replace single backslashes that are likely part of text but not valid escapes.
            // content = content.replace(/\\(?![/u"\\bfnrt])/g, '\\\\'); 

            // However, aggressive replacement might break valid unicode escapes. 
            // Let's rely on the prompt first, but if we really want to be safe, we can try-catch parse and retry with sanitization?
            // For now, let's just use the improved prompt. If "Bad escaped character" persists, we can add:
            // content = content.replace(/\\/g, '\\\\'); // This is too aggressive.

            let questions: GeneratedQuestion[];
            try {
                questions = JSON.parse(content);
            } catch (e) {
                console.warn("Initial JSON parse failed, attempting to sanitize...", e);
                // Simple sanitization: escape backslashes that look like they are causing issues
                // This is a heuristic: replace \ with \\ if it's not a valid escape sequence
                // For simplicity, let's just try to replace all single backslashes with double, 
                // BUT we need to be careful not to double-escape valid escapes.
                // A common issue is LaTeX: \frac -> \frac which is invalid JSON string. Needs \\frac.

                // Regex to find backslashes that are NOT followed by valid escape chars
                const sanitizedContent = content.replace(/\\(?![/u"\\bfnrt])/g, '\\\\');
                questions = JSON.parse(sanitizedContent);
            }
            return NextResponse.json(questions);

        } catch (error: unknown) {
            console.error('AI Generation Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return NextResponse.json({ error: `生成失败: ${errorMessage}` }, { status: 500 });
        }

    } catch (error) {
        console.error('Request Error:', error);
        return NextResponse.json({ error: '处理请求失败' }, { status: 500 });
    }
}
