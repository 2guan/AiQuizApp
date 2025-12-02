import { NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import db from '@/lib/db';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const competitionId = formData.get('competitionId') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // 1. Get current config to find old image
        let currentConfig: any = {};
        if (competitionId) {
            const row = db.prepare("SELECT value FROM settings WHERE key = 'certificate_config' AND competition_id = ?").get(competitionId) as any;
            if (row) {
                try {
                    currentConfig = JSON.parse(row.value);
                } catch (e) {
                    console.error('Error parsing certificate config:', e);
                }
            }
        }

        // 2. Delete old image if it exists and is a custom upload
        const oldUrl = currentConfig.backgroundImage;
        if (oldUrl && oldUrl.startsWith('/images/') && !oldUrl.includes('default_certificate_bg')) {
            try {
                const oldFilePath = path.join(process.cwd(), 'public', oldUrl);
                await unlink(oldFilePath);
                console.log('Deleted old certificate background:', oldFilePath);
            } catch (e) {
                // Ignore error if file doesn't exist
                console.log('Failed to delete old certificate background (might not exist):', e);
            }
        }

        // 3. Save new file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `cert_bg_${Date.now()}_${Math.random().toString(36).slice(2)}${path.extname(file.name)}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        const filepath = path.join(uploadDir, filename);

        await writeFile(filepath, buffer);
        const newUrl = `/uploads/${filename}`;

        // 4. Update DB with new image URL
        currentConfig.backgroundImage = newUrl;

        if (competitionId) {
            db.prepare(`
                INSERT INTO settings (competition_id, key, value) VALUES (?, 'certificate_config', ?)
                ON CONFLICT(competition_id, key) DO UPDATE SET value = excluded.value
            `).run(competitionId, JSON.stringify(currentConfig));
        }

        return NextResponse.json({ url: newUrl });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
