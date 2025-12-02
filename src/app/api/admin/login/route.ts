import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();

        const row = db.prepare("SELECT value FROM settings WHERE key = 'admin_password'").get() as { value: string } | undefined;
        const correctPassword = row?.value || '2025'; // Fallback to default if not found

        if (password === correctPassword) {
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ success: false }, { status: 401 });
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
