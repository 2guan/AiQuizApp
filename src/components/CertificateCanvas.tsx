'use client';

import { useEffect, useRef, useState } from 'react';

interface CertificateCanvasProps {
    config: any;
    userName?: string;
    score?: number;
    date?: string;
    mode: 'preview' | 'generate';
    onConfigChange?: (newConfig: any) => void;
}

export default function CertificateCanvas({ config, userName = '张三', score = 100, date = '2025年11月26日', mode, onConfigChange }: CertificateCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const bgImageRef = useRef<HTMLImageElement | null>(null);

    // Load image
    useEffect(() => {
        if (config.backgroundImage) {
            const img = new Image();
            img.src = config.backgroundImage;
            img.onload = () => {
                bgImageRef.current = img;
                setImageLoaded(true);
            };
            img.onerror = () => {
                console.error('Failed to load certificate background:', config.backgroundImage);
                // Still set loaded to true to allow text drawing
                setImageLoaded(true);
            };
        } else {
            setImageLoaded(true);
        }
    }, [config.backgroundImage]);

    // Draw canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageLoaded) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background
        if (bgImageRef.current) {
            ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Helper to draw text with auto-wrapping
        const drawText = (text: string, settings: any) => {
            const fontSize = Number(settings.fontSize) || 24;
            const x = Number(settings.x) || 0;
            const y = Number(settings.y) || 0;
            const width = Number(settings.width) || 600;
            const lineHeightMult = Number(settings.lineHeight) || 1.5;

            ctx.font = `${settings.bold ? 'bold' : ''} ${fontSize}px sans-serif`;
            ctx.fillStyle = settings.color || '#000000';
            ctx.textAlign = (settings.textAlign as CanvasTextAlign) || 'center';
            ctx.textBaseline = 'middle';

            const maxWidth = width;
            const lineHeight = fontSize * lineHeightMult;

            // Handle manual newlines first
            const paragraphs = text.split('\n');
            let currentY = y;

            paragraphs.forEach(paragraph => {
                const words = paragraph.split('');
                let line = '';

                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n];
                    const metrics = ctx.measureText(testLine);
                    const testWidth = metrics.width;

                    if (testWidth > maxWidth && n > 0) {
                        ctx.fillText(line, x, currentY);
                        line = words[n];
                        currentY += lineHeight;
                    } else {
                        line = testLine;
                    }
                }
                ctx.fillText(line, x, currentY);
                currentY += lineHeight;
            });
        };

        // Draw Main Text (Name and Score)
        if (config.layout?.mainText) {
            const template = `　　恭喜 ${userName} 在《${config.activityName}》中获得 ${score} 分的优异成绩。\n　　特发此证，以资鼓励。`;
            drawText(template, config.layout.mainText);
        }

        // Draw Issuer Info
        if (config.layout?.issuerInfo) {
            const template = `${config.issuer}\n${date}`;
            drawText(template, config.layout.issuerInfo);
        }

    }, [config, userName, score, date, imageLoaded]);

    // Dragging logic for preview mode
    const [dragging, setDragging] = useState<'mainText' | 'issuerInfo' | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (mode !== 'preview') return;
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvasRef.current!.width / rect.width);
        const y = (e.clientY - rect.top) * (canvasRef.current!.height / rect.height);

        // Simple hit detection
        const checkHit = (key: 'mainText' | 'issuerInfo') => {
            const settings = config.layout[key];
            // Approximate bounding box
            if (Math.abs(x - settings.x) < 200 && Math.abs(y - settings.y) < 100) {
                setDragging(key);
                return true;
            }
            return false;
        };

        if (!checkHit('mainText')) checkHit('issuerInfo');
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging || !onConfigChange) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvasRef.current!.width / rect.width);
        const y = (e.clientY - rect.top) * (canvasRef.current!.height / rect.height);

        onConfigChange({
            ...config,
            layout: {
                ...config.layout,
                [dragging]: {
                    ...config.layout[dragging],
                    x,
                    y
                }
            }
        });
    };

    const handleMouseUp = () => {
        setDragging(null);
    };

    return (
        <div className="relative border border-gray-200 shadow-sm inline-block">
            <canvas
                ref={canvasRef}
                width={842}
                height={1200}
                className="max-w-full h-auto"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: mode === 'preview' ? 'move' : 'default' }}
            />
            {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
                    加载证书模板...
                </div>
            )}
        </div>
    );
}
