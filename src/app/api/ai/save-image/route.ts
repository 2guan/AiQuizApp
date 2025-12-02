import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const { imageUrl } = await req.json();

        if (!imageUrl) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        // Download the image to save locally
        const imageRes = await fetch(imageUrl);
        if (!imageRes.ok) {
            return NextResponse.json({ error: 'Failed to download generated image' }, { status: 500 });
        }

        const arrayBuffer = await imageRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Save to file
        const filename = `generated_${Date.now()}_${Math.random().toString(36).slice(2)}.jpeg`;
        const uploadDir = path.join(process.cwd(), 'public/uploads');

        await mkdir(uploadDir, { recursive: true });
        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        const localUrl = `/uploads/${filename}`;

        return NextResponse.json({ success: true, localUrl });

    } catch (error: any) {
        console.error('Save image error:', error);
        return NextResponse.json({ error: `Internal error: ${error.message}` }, { status: 500 });
    }
}
