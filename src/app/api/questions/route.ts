import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode');
        const competitionId = searchParams.get('competitionId');

        const db = getDb();
        let questions;

        if (competitionId) {
            questions = db.prepare('SELECT * FROM questions WHERE competition_id = ? ORDER BY created_at DESC').all(competitionId);
        } else {
            // Fallback for legacy or admin view without specific competition
            questions = db.prepare('SELECT * FROM questions ORDER BY created_at DESC').all();
        }

        if (mode === 'quiz') {
            // Fetch settings for question counts
            const settingsStmt = db.prepare('SELECT key, value FROM settings WHERE competition_id = ?');
            const settingsRows = competitionId ? settingsStmt.all(competitionId) : [];
            const settings = settingsRows.reduce((acc: any, curr: any) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {});

            const singleCount = parseInt(settings.single_choice_count || '10');
            const multipleCount = parseInt(settings.multiple_choice_count || '0');

            const singleQuestions = questions.filter((q: any) => q.type === 'single');
            const multipleQuestions = questions.filter((q: any) => q.type === 'multiple');

            // Randomly shuffle and slice
            const selectedSingle = singleQuestions.sort(() => 0.5 - Math.random()).slice(0, singleCount);
            const selectedMultiple = multipleQuestions.sort(() => 0.5 - Math.random()).slice(0, multipleCount);

            questions = [...selectedSingle, ...selectedMultiple];
        }

        // Parse options JSON
        const formattedQuestions = questions.map((q: any) => ({
            ...q,
            options: JSON.parse(q.options),
        }));

        return NextResponse.json(formattedQuestions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, content, options, answer, explanation, competitionId } = body;

        if (!content || !options || !answer) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const db = getDb();
        const stmt = db.prepare(`
            INSERT INTO questions (competition_id, type, content, options, answer, explanation, created_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);

        const result = stmt.run(competitionId || null, type, content, JSON.stringify(options), answer, explanation || '');

        return NextResponse.json({ id: result.lastInsertRowid, success: true });
    } catch (error) {
        console.error('Error creating question:', error);
        return NextResponse.json({ error: 'Failed to create question', details: String(error) }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const all = searchParams.get('all');
        const id = searchParams.get('id');
        const competitionId = searchParams.get('competitionId');

        const db = getDb();

        if (all === 'true') {
            if (competitionId) {
                db.prepare('DELETE FROM questions WHERE competition_id = ?').run(competitionId);
            } else {
                db.prepare('DELETE FROM questions').run();
                // Reset auto-increment counter only if deleting everything
                db.prepare("DELETE FROM sqlite_sequence WHERE name='questions'").run();
            }
            return NextResponse.json({ success: true, message: 'Questions deleted' });
        }

        if (id) {
            db.prepare('DELETE FROM questions WHERE id = ?').run(id);
            return NextResponse.json({ success: true, message: 'Question deleted' });
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    } catch (error) {
        console.error('Error deleting questions:', error);
        return NextResponse.json({ error: 'Failed to delete questions' }, { status: 500 });
    }
}
