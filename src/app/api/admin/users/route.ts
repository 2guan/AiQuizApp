import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const db = getDb();
        const users = db.prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC').all();
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const db = getDb();

        // Prevent deleting the last admin or self (though frontend should handle self)
        const user = db.prepare('SELECT username FROM users WHERE id = ?').get(id) as any;
        if (user && user.username === 'admin') {
            return NextResponse.json({ error: 'Cannot delete the main admin user' }, { status: 403 });
        }

        db.prepare('DELETE FROM users WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, password, role } = body;

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const db = getDb();

        if (password) {
            db.prepare('UPDATE users SET password = ? WHERE id = ?').run(password, id);
        }

        if (role) {
            // Prevent demoting the main admin
            const user = db.prepare('SELECT username FROM users WHERE id = ?').get(id) as any;
            if (user && user.username === 'admin' && role !== 'admin') {
                return NextResponse.json({ error: 'Cannot change role of main admin' }, { status: 403 });
            }
            db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
