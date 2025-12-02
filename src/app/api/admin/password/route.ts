import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { oldPassword, newPassword } = await request.json();

        if (!oldPassword || !newPassword) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Verify old password
        const row = db.prepare("SELECT value FROM settings WHERE key = 'admin_password'").get() as { value: string } | undefined;
        const currentPassword = row?.value || '2025';

        if (oldPassword !== currentPassword) {
            return NextResponse.json({ error: 'Incorrect old password' }, { status: 401 });
        }

        // Update password
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('admin_password', ?)").run(newPassword);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Password change error:', error);
        return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }
}
