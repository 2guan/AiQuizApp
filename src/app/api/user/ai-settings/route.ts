import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT ai_api_key, ai_base_url, ai_model, img_gen_api_key FROM users WHERE id = ?').get(userId);

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
        ai_api_key: user.ai_api_key || '',
        ai_base_url: user.ai_base_url || '',
        ai_model: user.ai_model || 'gpt-3.5-turbo',
        img_gen_api_key: user.img_gen_api_key || ''
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, ai_api_key, ai_base_url, ai_model, img_gen_api_key } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const db = getDb();
        const stmt = db.prepare(`
            UPDATE users 
            SET ai_api_key = ?, ai_base_url = ?, ai_model = ?, img_gen_api_key = ?
            WHERE id = ?
        `);

        stmt.run(ai_api_key, ai_base_url, ai_model, img_gen_api_key, userId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Save AI settings error:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
