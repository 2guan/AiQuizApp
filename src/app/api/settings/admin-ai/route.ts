import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
    const db = getDb();

    // Fetch admin user's AI settings
    // We assume the admin username is 'admin' as per db.ts initialization
    const admin = db.prepare('SELECT ai_api_key, ai_base_url, ai_model, img_gen_api_key FROM users WHERE username = ?').get('admin');

    if (!admin) {
        // Fallback if admin user doesn't exist (unlikely given db.ts)
        return NextResponse.json({
            ai_api_key: '',
            ai_base_url: '',
            ai_model: 'gpt-3.5-turbo',
            img_gen_api_key: ''
        });
    }

    return NextResponse.json({
        ai_api_key: admin.ai_api_key || '',
        ai_base_url: admin.ai_base_url || '',
        ai_model: admin.ai_model || 'gpt-3.5-turbo',
        img_gen_api_key: admin.img_gen_api_key || ''
    });
}
