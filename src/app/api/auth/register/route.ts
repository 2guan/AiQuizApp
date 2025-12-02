import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }

        const db = getDb();

        // Check if user exists
        const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (existing) {
            return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
        }

        // Get default role from settings
        const defaultRoleSetting = db.prepare("SELECT value FROM settings WHERE key = 'default_user_role' AND competition_id IS NULL").get();
        const defaultRole = defaultRoleSetting ? defaultRoleSetting.value : 'pending';

        // Create user
        const result = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
            .run(username, password, defaultRole);

        return NextResponse.json({
            success: true,
            user: { id: result.lastInsertRowid, username, role: defaultRole }
        });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }
}
