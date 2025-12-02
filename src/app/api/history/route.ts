import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userName = searchParams.get('userName');
        const competitionId = searchParams.get('competitionId');

        const db = getDb();

        let query = 'SELECT * FROM quiz_records';
        const params = [];

        if (userName) {
            query += ' WHERE user_name = ?';
            params.push(userName);
            if (competitionId) {
                query += ' AND competition_id = ?';
                params.push(competitionId);
            }
        } else if (competitionId) {
            query += ' WHERE competition_id = ?';
            params.push(competitionId);
        }

        query += ' ORDER BY created_at DESC';

        const history = db.prepare(query).all(...params);

        const formattedHistory = history.map((r: any) => ({
            id: r.id,
            userName: r.user_name,
            score: r.score,
            timeTaken: r.time_taken,
            createdAt: r.created_at,
        }));

        return NextResponse.json(formattedHistory);
    } catch (error) {
        console.error('History API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
