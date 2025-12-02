import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const { apiKey, prompt, test } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key is required' }, { status: 400 });
        }

        if (!prompt && !test) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const apiUrl = 'http://3.guantools.top:3007/v1/images/generations';

        // Default parameters for Jimeng 4.0
        const payload = {
            model: "jimeng-4.0",
            prompt: prompt || "Test prompt",
            negative_prompt: "",
            width: 1024,
            height: 576,
            sample_strength: 0.8,
            response_format: "url"
        };

        console.log('Generating image with Jimeng 4.0:', payload.prompt);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Jimeng API Error:', errorText);
            return NextResponse.json({ error: `Image generation failed: ${response.status} ${errorText}` }, { status: response.status });
        }

        const data = await response.json();

        // Response format: { created: number, data: [ { url: "..." }, ... ] }
        if (!data.data || data.data.length === 0) {
            return NextResponse.json({ error: 'No image generated' }, { status: 500 });
        }

        // Return all generated URLs directly
        const imageUrls = data.data.map((item: any) => item.url);

        return NextResponse.json({ success: true, imageUrls });

    } catch (error: any) {
        console.error('Image generation error:', error);
        return NextResponse.json({ error: `Internal error: ${error.message}` }, { status: 500 });
    }
}
