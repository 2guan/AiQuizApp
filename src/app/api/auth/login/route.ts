import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();
        const db = getDb();

        const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);

        if (user) {
            return NextResponse.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
        } else {
            return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
        }
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: '登录失败' }, { status: 500 });
    }
}
