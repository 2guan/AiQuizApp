
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { apiKey, baseUrl, model } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ error: '请提供 API Key' }, { status: 400 });
        }

        // Normalize Base URL
        let finalUrl = baseUrl ? baseUrl.replace(/\/+$/, '') : 'https://api.openai.com/v1';
        if (!finalUrl.endsWith('/v1')) {
            finalUrl += '/v1';
        }

        console.log(`Testing AI Connection: ${finalUrl} with model ${model}`);

        const response = await fetch(`${finalUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'gpt-3.5-turbo',
                messages: [
                    { role: 'user', content: 'Hello, are you working?' }
                ],
                max_tokens: 10
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: `连接失败: ${response.status} ${errorText}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({ success: true, message: '连接成功！', data });

    } catch (error: unknown) {
        console.error('AI Test Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: `请求出错: ${errorMessage}` }, { status: 500 });
    }
}
