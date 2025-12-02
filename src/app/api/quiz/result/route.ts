import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const record: any = db.prepare('SELECT * FROM quiz_records WHERE id = ?').get(id);

        if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

        const formattedRecord = {
            id: record.id,
            userName: record.user_name,
            score: record.score,
            timeTaken: record.time_taken,
            createdAt: record.created_at,
        };

        const questions: any[] = db.prepare('SELECT * FROM questions').all();
        let userAnswers;
        try {
            userAnswers = JSON.parse(record.details);
        } catch (e) {
            userAnswers = {};
        }

        const details: any[] = [];

        if (Array.isArray(userAnswers)) {
            // New format: ordered array
            userAnswers.forEach((item: any) => {
                const qId = item.questionId;
                const q = questions.find(question => question.id === qId);
                if (q) {
                    details.push({
                        id: qId,
                        userAnswer: item.answer,
                        correctAnswer: item.correctAnswer || q.answer,
                        isCorrect: item.answer === (item.correctAnswer || q.answer),
                        explanation: q.explanation,
                        questionContent: q.content,
                        options: item.options || JSON.parse(q.options)
                    });
                }
            });
        } else {
            // Legacy format: map
            Object.keys(userAnswers).forEach(qIdStr => {
                const qId = parseInt(qIdStr);
                const q = questions.find(question => question.id === qId);
                if (q) {
                    details.push({
                        id: qId,
                        userAnswer: userAnswers[qId],
                        correctAnswer: q.answer,
                        isCorrect: userAnswers[qId] === q.answer,
                        explanation: q.explanation,
                        questionContent: q.content,
                        options: JSON.parse(q.options)
                    });
                }
            });
        }

        const rankResult: any = db.prepare('SELECT COUNT(*) as count FROM quiz_records WHERE score > ?').get(record.score);
        const rank = rankResult.count + 1;

        const totalResult: any = db.prepare('SELECT COUNT(*) as count FROM quiz_records').get();
        const totalParticipants = totalResult.count;

        return NextResponse.json({
            record: formattedRecord,
            rank,
            totalParticipants,
            details,
        });

    } catch (error) {
        console.error('Error fetching result:', error);
        return NextResponse.json({ error: 'Failed to fetch result' }, { status: 500 });
    }
}
