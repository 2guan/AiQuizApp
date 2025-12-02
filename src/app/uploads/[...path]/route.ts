import { NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
    try {
        const { path: pathArray } = await params;
        const filePath = path.join(process.cwd(), 'public', 'uploads', ...pathArray);

        const fileBuffer = await readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();

        let contentType = 'application/octet-stream';
        if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.svg') contentType = 'image/svg+xml';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        });
    } catch (error) {
        return new NextResponse('File not found', { status: 404 });
    }
}
