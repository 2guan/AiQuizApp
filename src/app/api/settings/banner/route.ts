import { NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import db from '@/lib/db';

async function deleteOldBanner(competitionId: string | null) {
    try {
        let oldBannerUrl: string | null = null;
        if (competitionId) {
            const comp: any = db.prepare('SELECT banner FROM competitions WHERE id = ?').get(competitionId);
            if (comp) oldBannerUrl = comp.banner;
        } else {
            const setting: any = db.prepare("SELECT value FROM settings WHERE key = 'banner_url' AND competition_id IS NULL").get();
            if (setting) oldBannerUrl = setting.value;
        }

        if (oldBannerUrl && oldBannerUrl.startsWith('/uploads/')) {
            const oldFilePath = path.join(process.cwd(), 'public', oldBannerUrl);
            await unlink(oldFilePath).catch(() => { }); // Ignore if file doesn't exist
        }
    } catch (e) {
        console.error('Error deleting old banner:', e);
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const competitionId = searchParams.get('competitionId');

        let bannerUrl: string | null = null;
        if (competitionId) {
            const comp: any = db.prepare('SELECT banner FROM competitions WHERE id = ?').get(competitionId);
            if (comp) bannerUrl = comp.banner;
        }

        if (!bannerUrl) {
            const setting: any = db.prepare("SELECT value FROM settings WHERE key = 'banner_url' AND competition_id IS NULL").get();
            if (setting) bannerUrl = setting.value;
        }

        return NextResponse.json({ url: bannerUrl });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const bannerUrlParam = formData.get('bannerUrl') as string;
        const competitionId = formData.get('competitionId') as string;

        if (!file && !bannerUrlParam) {
            return NextResponse.json({ error: 'No file or bannerUrl provided' }, { status: 400 });
        }

        // Delete old banner first (only if we are replacing it)
        // If we are setting a new generated banner, the old one should be deleted if it exists.
        // However, if the new bannerUrl is the same as old, we shouldn't delete.
        // But here we are likely setting a NEW generated banner which is a different file.
        await deleteOldBanner(competitionId);

        let bannerUrl = '';

        if (file) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const ext = path.extname(file.name) || '.png';
            const filename = `banner_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
            const uploadDir = path.join(process.cwd(), 'public/uploads');

            try {
                await mkdir(uploadDir, { recursive: true });
            } catch (e) {
                // ignore
            }

            const filepath = path.join(uploadDir, filename);
            await writeFile(filepath, buffer);

            bannerUrl = `/uploads/${filename}`;
        } else if (bannerUrlParam) {
            bannerUrl = bannerUrlParam;
        }

        // Save to DB (Update competitions table)
        if (competitionId) {
            db.prepare('UPDATE competitions SET banner = ? WHERE id = ?').run(bannerUrl, competitionId);
        } else {
            // Legacy fallback or global setting if needed, but primarily we use competition table now
            db.prepare(`
                INSERT INTO settings (competition_id, key, value) VALUES (NULL, 'banner_url', ?)
                ON CONFLICT(competition_id, key) DO UPDATE SET value = excluded.value
            `).run(bannerUrl);
        }

        return NextResponse.json({ url: bannerUrl });
    } catch (error) {
        console.error('Error uploading banner:', error);
        return NextResponse.json({ error: 'Failed to upload/update banner' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const competitionId = searchParams.get('competitionId');

        if (!competitionId) {
            return NextResponse.json({ error: 'Competition ID required' }, { status: 400 });
        }

        // Delete old banner file
        await deleteOldBanner(competitionId);

        // Clear DB entry
        const result = db.prepare('UPDATE competitions SET banner = NULL WHERE id = ?').run(competitionId);

        return NextResponse.json({ success: true, changes: result.changes });
    } catch (error) {
        console.error('Error deleting banner:', error);
        return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
    }
}
