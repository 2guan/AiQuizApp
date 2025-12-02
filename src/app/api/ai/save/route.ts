
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { questions, competitionId } = body;

        if (!Array.isArray(questions) || questions.length === 0) {
            return NextResponse.json({ error: '没有提供题目' }, { status: 400 });
        }

        const db = getDb();
        const insertStmt = db.prepare(`
            INSERT INTO questions (competition_id, content, type, options, answer, explanation, created_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);

        const insertMany = db.transaction((qs: any[]) => {
            for (const q of qs) {
                insertStmt.run(
                    competitionId || null,
                    q.content,
                    q.type,
                    JSON.stringify(q.options),
                    Array.isArray(q.answer) ? q.answer.sort().join('') : q.answer,
                    typeof q.explanation === 'object' ? JSON.stringify(q.explanation) : (q.explanation || '')
                );
            }
        });

        insertMany(questions);

        return NextResponse.json({ success: true, count: questions.length });
    } catch (error) {
        console.error('Save Error:', error);
        return NextResponse.json({ error: '保存题目失败' }, { status: 500 });
    }
}
