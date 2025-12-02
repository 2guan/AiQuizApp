import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const competitionId = searchParams.get('competitionId');

        let query = 'SELECT * FROM quiz_records';
        const params: any[] = [];

        if (competitionId) {
            query += ' WHERE competition_id = ?';
            params.push(competitionId);
        }

        query += ' ORDER BY created_at DESC';

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
        return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
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
