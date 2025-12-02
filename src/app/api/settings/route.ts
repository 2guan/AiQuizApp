import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const competitionId = searchParams.get('competitionId');

    const db = getDb();
    let settings;

    if (competitionId) {
        settings = db.prepare('SELECT key, value FROM settings WHERE competition_id = ?').all(competitionId);
    } else {
        // Global settings (legacy or admin)
        settings = db.prepare('SELECT key, value FROM settings WHERE competition_id IS NULL').all();
    }

    const settingsMap = settings.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {});

    // Merge competition data if available
    if (competitionId) {
        const comp: any = db.prepare('SELECT title, subtitle, banner FROM competitions WHERE id = ?').get(competitionId);
        if (comp) {
            settingsMap.title = comp.title;
            settingsMap.subtitle = comp.subtitle;
            settingsMap.banner = comp.banner;
        }
    }

    return NextResponse.json(settingsMap);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('POST /api/settings body:', body);
        const { competitionId, title, subtitle, banner, ai_api_key, ai_base_url, ai_model, ...settings } = body;
        const db = getDb();

        // Update competition title, subtitle and banner
        if (competitionId && (title !== undefined || subtitle !== undefined || banner !== undefined)) {
            console.log('Updating competition:', { competitionId, title, subtitle, banner });
            const updates = [];
            const params = [];
            if (title !== undefined) {
                updates.push('title = ?');
                params.push(title);
            }
            if (subtitle !== undefined) {
                updates.push('subtitle = ?');
                params.push(subtitle);
            }
            if (banner !== undefined) {
                updates.push('banner = ?');
                params.push(banner);
            }

            if (updates.length > 0) {
                params.push(competitionId);
                const stmt = db.prepare(`UPDATE competitions SET ${updates.join(', ')} WHERE id = ?`);
                console.log('Update SQL:', stmt.source);
                stmt.run(...params);
            }
        }

        const insert = db.prepare(`
            INSERT INTO settings (competition_id, key, value) 
            VALUES (?, ?, ?) 
            ON CONFLICT(competition_id, key) DO UPDATE SET value = excluded.value
        `);

        const insertMany = db.transaction((items: any) => {
            for (const [key, value] of Object.entries(items)) {
                console.log('Saving setting:', { key, value });
                insert.run(competitionId || null, key, String(value));
            }
        });

        insertMany(settings);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Settings save error:', error);
        return NextResponse.json({ error: 'Failed to save settings', details: error.message }, { status: 500 });
    }
}
