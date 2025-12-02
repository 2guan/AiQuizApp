'use client';

import { useEffect, useRef, useState } from 'react';

interface ShareCardCanvasProps {
    title: string;
    subtitle: string;
    bannerUrl: string;
    quizUrl: string;
    onDownload?: (dataUrl: string) => void;
}

export default function ShareCardCanvas({ title, subtitle, bannerUrl, quizUrl, onDownload }: ShareCardCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Canvas dimensions
        const width = 600;
        const height = 900;
        canvas.width = width;
        canvas.height = height;

        let loadedCount = 0;
        const totalImages = 2;
        let isMounted = true;

        const bannerImg = new Image();
        bannerImg.crossOrigin = 'anonymous';

        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';

        const drawCanvas = () => {
            if (!isMounted) return;

            // 1. Background (White)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            // 2. Banner (Top 40%)
            const bannerHeight = 360;

            try {
                // Draw banner with "cover" fit
                const scale = Math.max(width / bannerImg.width, bannerHeight / bannerImg.height);
                const x = (width / 2) - (bannerImg.width / 2) * scale;
                const y = (bannerHeight / 2) - (bannerImg.height / 2) * scale;

                ctx.save();
                ctx.beginPath();
                ctx.rect(0, 0, width, bannerHeight);
                ctx.clip();
                ctx.drawImage(bannerImg, x, y, bannerImg.width * scale, bannerImg.height * scale);
                ctx.restore();
            } catch (e) {
                // Fallback if banner fails to draw (e.g. broken image)
                ctx.fillStyle = '#f3f4f6';
                ctx.fillRect(0, 0, width, bannerHeight);
            }

            // 3. Content Container (Bottom 60%)
            const cardTop = 340; // Overlap by 20px
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(0, cardTop, width, height - cardTop, [30, 30, 0, 0]);
            ctx.fill();

            // 4. Text
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            // Title
            ctx.font = 'bold 36px sans-serif';
            ctx.fillStyle = '#b91c1c'; // Red-700
            const maxTextWidth = 500;
            wrapText(ctx, title, width / 2, cardTop + 60, maxTextWidth, 48);

            // Subtitle
            ctx.font = '24px sans-serif';
            ctx.fillStyle = '#6b7280'; // Gray-500
            ctx.fillText(subtitle, width / 2, cardTop + 130);

            // 5. QR Code
            const qrSize = 250;
            const qrX = (width - qrSize) / 2;
            const qrY = cardTop + 200;
            try {
                ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
            } catch (e) {
                // Fallback for QR
                ctx.strokeStyle = '#ccc';
                ctx.strokeRect(qrX, qrY, qrSize, qrSize);
                ctx.fillStyle = '#666';
                ctx.font = '16px sans-serif';
                ctx.fillText('QR Code Error', width / 2, qrY + 100);
            }
        };

        const handleLoad = () => {
            if (!isMounted) return;
            loadedCount++;
            if (loadedCount === totalImages) {
                drawCanvas();
                setIsLoaded(true);
            }
        };

        // Attach handlers BEFORE setting src
        bannerImg.onload = handleLoad;
        bannerImg.onerror = () => {
            console.warn('Failed to load banner');
            handleLoad(); // Count it anyway to proceed
        };

        qrImg.onload = handleLoad;
        qrImg.onerror = () => {
            console.warn('Failed to load QR code');
            handleLoad(); // Count it anyway to proceed
        };

        // Set src to trigger load
        bannerImg.src = bannerUrl || '/images/default_banner.jpg';
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(quizUrl)}`;

        // Helper for text wrapping
        const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
            const words = text.split('');
            let line = '';
            let currentY = y;

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n];
                const metrics = context.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    context.fillText(line, x, currentY);
                    line = words[n];
                    currentY += lineHeight;
                } else {
                    line = testLine;
                }
            }
            context.fillText(line, x, currentY);
        };

        return () => {
            isMounted = false;
        };

    }, [title, subtitle, bannerUrl, quizUrl]);

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `competition-share-${Date.now()}.png`;
            link.href = dataUrl;
            document.body.appendChild(link); // Required for some browsers
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error('Download failed:', e);
            alert('下载失败，可能是因为图片跨域问题。请尝试截图保存。');
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="border border-gray-200 shadow-lg rounded-xl overflow-hidden">
                <canvas
                    ref={canvasRef}
                    className="max-w-full h-auto"
                    style={{ maxHeight: '600px' }}
                />
            </div>
            <button
                onClick={handleDownload}
                disabled={!isLoaded}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoaded ? '下载分享海报' : '生成中...'}
            </button>
        </div>
    );
}
