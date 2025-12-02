import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const competitionId = searchParams.get('competitionId');

        let query = `
            WITH RankedRecords AS (
                SELECT *,
                       ROW_NUMBER() OVER (PARTITION BY user_name ORDER BY score DESC, time_taken ASC) as rn
                FROM quiz_records
                WHERE 1=1
        `;
        const params: any[] = [];

        if (competitionId) {
            query += ` AND competition_id = ?`;
            params.push(competitionId);
        }

        query += `
            )
            SELECT * FROM RankedRecords 
            WHERE rn = 1
            ORDER BY score DESC, time_taken ASC 
            LIMIT 50
        `;

        const records = db.prepare(query).all(...params);

        const formattedRecords = records.map((r: any) => ({
            id: r.id,
            userName: r.user_name,
            score: r.score,
            timeTaken: r.time_taken,
            createdAt: r.created_at,
        }));

        return NextResponse.json(formattedRecords);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const all = searchParams.get('all');
        const competitionId = searchParams.get('competitionId');

        if (all === 'true') {
            if (competitionId) {
                db.prepare('DELETE FROM quiz_records WHERE competition_id = ?').run(competitionId);
            } else {
                db.prepare('DELETE FROM quiz_records').run();
            }
            return NextResponse.json({ success: true, message: 'Records deleted' });
        }

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        // If deleting a specific record, we might want to verify competitionId, but ID is unique so it's probably fine.
        // However, for strictness:
        if (competitionId) {
            const result = db.prepare('DELETE FROM quiz_records WHERE id = ? AND competition_id = ?').run(id, competitionId);
            if (result.changes === 0) {
                return NextResponse.json({ error: 'Record not found or not in this competition' }, { status: 404 });
            }
        } else {
            db.prepare('DELETE FROM quiz_records WHERE id = ?').run(id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
    }
}
