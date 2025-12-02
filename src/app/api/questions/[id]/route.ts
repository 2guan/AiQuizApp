import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { type, content, options, answer, explanation } = body;

        db.prepare(`
      UPDATE questions 
      SET type = ?, content = ?, options = ?, answer = ?, explanation = ?
      WHERE id = ?
    `).run(type, content, JSON.stringify(options), answer, explanation || '', id);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        db.prepare('DELETE FROM questions WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
    }
}
