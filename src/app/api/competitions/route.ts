import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Buffer } from 'buffer';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';


export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const fetchAll = searchParams.get('all') === 'true';

        if (!userId) {
            return NextResponse.json({ error: '未提供用户ID' }, { status: 400 });
        }

        const db = getDb();

        if (fetchAll) {
            // Verify admin role
            const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
            if (!user || user.role !== 'admin') {
                return NextResponse.json({ error: '无权访问' }, { status: 403 });
            }

            const competitions = db.prepare(`
                SELECT 
                    c.id, 
                    c.title, 
                    c.created_at, 
                    u.username as creator_name,
                    (SELECT COUNT(*) FROM questions q WHERE q.competition_id = c.id) as question_count
                FROM competitions c
                LEFT JOIN users u ON c.created_by = u.id
                ORDER BY c.created_at DESC
            `).all();
            return NextResponse.json(competitions);
        } else {
            const competitions = db.prepare('SELECT * FROM competitions WHERE created_by = ? ORDER BY created_at DESC').all(userId);
            return NextResponse.json(competitions);
        }
    } catch (error) {
        console.error('Fetch competitions error:', error);
        return NextResponse.json({ error: '获取竞赛列表失败' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        console.log('POST /api/competitions called');
        const formData = await req.formData();
        const title = formData.get('title') as string;
        const subtitle = formData.get('subtitle') as string;
        const userId = formData.get('userId') as string;
        const bannerFile = formData.get('banner') as File | string;

        if (!title || !userId) {
            return NextResponse.json({ error: '缺少必要信息' }, { status: 400 });
        }

        let bannerUrl = '';

        // Handle banner upload
        if (bannerFile && typeof bannerFile === 'object' && bannerFile.name) {
            const buffer = Buffer.from(await bannerFile.arrayBuffer());
            const ext = path.extname(bannerFile.name) || '.png';
            const filename = `banner_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
            const uploadDir = path.join(process.cwd(), 'public/uploads');

            try {
                await mkdir(uploadDir, { recursive: true });
                const filepath = path.join(uploadDir, filename);
                await writeFile(filepath, buffer);
                bannerUrl = `/uploads/${filename}`;
            } catch (e) {
                console.error('Error saving banner file:', e);
                // Continue without banner if upload fails, or handle error
            }
        } else if (typeof bannerFile === 'string') {
            bannerUrl = bannerFile;
        }

        const id = crypto.randomUUID();
        const db = getDb();

        db.prepare('INSERT INTO competitions (id, title, subtitle, banner, created_by) VALUES (?, ?, ?, ?, ?)').run(id, title, subtitle, bannerUrl, userId);

        // Initialize default settings for this competition
        db.prepare("INSERT INTO settings (competition_id, key, value) VALUES (?, 'admin_password', '2025')").run(id);
        db.prepare("INSERT INTO settings (competition_id, key, value) VALUES (?, 'question_timer', '20')").run(id);

        // Also initialize certificate settings if needed, or rely on defaults in code

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error('Create competition error:', error);
        return NextResponse.json({ error: '创建竞赛失败' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: '缺少竞赛ID' }, { status: 400 });
        }

        const db = getDb();

        // Fetch assets to delete
        const competition = db.prepare('SELECT banner FROM competitions WHERE id = ?').get(id) as any;
        const certBg = db.prepare("SELECT value FROM settings WHERE competition_id = ? AND key = 'certificate_bg'").get(id) as any;

        // Delete files
        const deleteFile = async (url: string) => {
            if (url && url.startsWith('/uploads/')) {
                try {
                    const filepath = path.join(process.cwd(), 'public', url);
                    await unlink(filepath);
                    console.log(`Deleted file: ${filepath}`);
                } catch (e) {
                    console.error(`Failed to delete file ${url}:`, e);
                }
            }
        };

        if (competition?.banner) {
            await deleteFile(competition.banner);
        }
        if (certBg?.value) {
            await deleteFile(certBg.value);
        }

        // Transaction to delete everything related to this competition
        const deleteCompetition = db.transaction(() => {
            db.prepare('DELETE FROM questions WHERE competition_id = ?').run(id);
            db.prepare('DELETE FROM quiz_records WHERE competition_id = ?').run(id);
            db.prepare('DELETE FROM settings WHERE competition_id = ?').run(id);
            db.prepare('DELETE FROM competitions WHERE id = ?').run(id);
        });

        deleteCompetition();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete competition error:', error);
        return NextResponse.json({ error: '删除竞赛失败' }, { status: 500 });
    }
}
