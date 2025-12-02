import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const competitionId = searchParams.get('competitionId');

        let row;
        let competitionTitle = '知识竞赛';
        let competitionSubtitle = '承办机构';

        if (competitionId) {
            row = db.prepare("SELECT value FROM settings WHERE key = 'certificate_config' AND competition_id = ?").get(competitionId);

            // Fetch competition details for defaults
            const comp = db.prepare("SELECT title, subtitle FROM competitions WHERE id = ?").get(competitionId) as any;
            if (comp) {
                if (comp.title) competitionTitle = comp.title;
                if (comp.subtitle) competitionSubtitle = comp.subtitle;
            }
        }

        if (!row) {
            row = db.prepare("SELECT value FROM settings WHERE key = 'certificate_config' AND competition_id IS NULL").get();
        }

        const config = row ? JSON.parse(row.value) : {};

        // Apply defaults if missing
        if (!config.activityName) config.activityName = competitionTitle;
        if (!config.issuer) config.issuer = competitionSubtitle;

        return NextResponse.json(config);
    } catch (error) {
        console.error('Certificate config fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch certificate config' }, { status: 500 });
    }
}

import { unlink } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { competitionId, ...config } = body;

        // 1. Get current config to check for image changes
        let currentConfig: any = {};
        if (competitionId) {
            const row = db.prepare("SELECT value FROM settings WHERE key = 'certificate_config' AND competition_id = ?").get(competitionId) as any;
            if (row) {
                try {
                    currentConfig = JSON.parse(row.value);
                } catch (e) { }
            }
        }

        // 2. Check if background image changed and delete old one if necessary
        if (currentConfig.backgroundImage && currentConfig.backgroundImage !== config.backgroundImage) {
            const oldUrl = currentConfig.backgroundImage;
            // Only delete if it's a custom upload (in /uploads/) and not the default one
            if (oldUrl.startsWith('/images/') && !oldUrl.includes('default_certificate_bg')) {
                try {
                    const oldFilePath = path.join(process.cwd(), 'public', oldUrl);
                    await unlink(oldFilePath);
                    console.log('Deleted old certificate background (on save):', oldFilePath);
                } catch (e) {
                    console.log('Failed to delete old certificate background (might not exist):', e);
                }
            }
        }

        db.prepare(`
            INSERT INTO settings (competition_id, key, value) VALUES (?, 'certificate_config', ?)
            ON CONFLICT(competition_id, key) DO UPDATE SET value = excluded.value
        `).run(competitionId || null, JSON.stringify(config));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Certificate config save error:', error);
        return NextResponse.json({ error: 'Failed to save certificate config' }, { status: 500 });
    }
}
