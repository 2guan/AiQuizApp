'use client';

import { useEffect, useRef, useState } from 'react';

interface ShareCardCanvasProps {
    title: string;
    subtitle: string;
    bannerUrl: string;
    quizUrl: string;
    onDownload?: (dataUrl: string) => void;
}

export default function QuestionBankShareCanvas({ title, subtitle, bannerUrl, quizUrl, onDownload }: ShareCardCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Target dimensions
        const width = 500;
        const height = 300;
        canvas.width = width;
        canvas.height = height;

        let isMounted = true;

        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';

        const getLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
            const words = text.split('');
            let line = '';
            const lines = [];

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n];
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    lines.push(line);
                    line = words[n];
                } else {
                    line = testLine;
                }
            }
            lines.push(line);
            return lines;
        };

        const drawCanvas = () => {
            if (!isMounted) return;

            // 1. Background (White)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            const padding = 24;
            const qrSize = 180; // Larger QR code
            const gap = 24;

            // 2. QR Code (Right)
            const qrX = width - padding - qrSize;
            const qrY = (height - qrSize) / 2; // Vertically centered

            try {
                ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
            } catch (e) {
                ctx.strokeStyle = '#ccc';
                ctx.strokeRect(qrX, qrY, qrSize, qrSize);
            }

            // 3. Text (Left)
            const textMaxWidth = width - padding * 2 - qrSize - gap;
            const textCenterX = padding + textMaxWidth / 2;

            // --- Dynamic Font Scaling Logic ---

            // Function to find best font size
            const findFontSize = (text: string, maxLines: number, startSize: number, minSize: number, isBold: boolean) => {
                let size = startSize;
                let lines: string[] = [];
                let lineHeight = 0;

                while (size >= minSize) {
                    ctx.font = `${isBold ? 'bold' : ''} ${size}px sans-serif`;
                    lines = getLines(ctx, text, textMaxWidth);
                    if (lines.length <= maxLines) {
                        break;
                    }
                    size -= 2; // Decrease step
                }
                // Recalculate lines with final size
                ctx.font = `${isBold ? 'bold' : ''} ${size}px sans-serif`;
                lines = getLines(ctx, text, textMaxWidth);

                return { size, lines, lineHeight: size * 1.4 }; // Approx line height
            };

            // Calculate Title
            const titleConfig = findFontSize(title, 2, 34, 20, true);
            const titleLines = titleConfig.lines;
            const titleFontSize = titleConfig.size;
            const titleLineHeight = titleConfig.lineHeight;
            const totalTitleHeight = titleLines.length * titleLineHeight;

            // Calculate Subtitle
            const subtitleConfig = findFontSize(subtitle, 1, 20, 12, false);
            const subtitleLines = subtitleConfig.lines;
            const subtitleFontSize = subtitleConfig.size;
            const subtitleLineHeight = subtitleConfig.lineHeight;
            const totalSubtitleHeight = subtitleLines.length * subtitleLineHeight;

            // Total text height
            const totalTextHeight = totalTitleHeight + totalSubtitleHeight + 8; // +8 gap

            // Draw
            ctx.textBaseline = 'top';
            ctx.textAlign = 'center';
            let currentY = (height - totalTextHeight) / 2;

            // Draw Title
            ctx.fillStyle = '#000000';
            ctx.font = `bold ${titleFontSize}px sans-serif`;
            titleLines.forEach(line => {
                ctx.fillText(line, textCenterX, currentY);
                currentY += titleLineHeight;
            });

            // Draw Subtitle
            currentY += 8; // Gap
            ctx.fillStyle = '#666666'; // Gray
            ctx.font = `${subtitleFontSize}px sans-serif`;
            subtitleLines.forEach(line => {
                ctx.fillText(line, textCenterX, currentY);
                currentY += subtitleLineHeight;
            });
        };

        const handleLoad = () => {
            if (!isMounted) return;
            drawCanvas();
            setIsLoaded(true);
        };

        qrImg.onload = handleLoad;
        qrImg.onerror = () => {
            console.warn('Failed to load QR code');
            handleLoad();
        };

        // Set src to trigger load
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(quizUrl)}`;

        return () => {
            isMounted = false;
        };

    }, [title, subtitle, quizUrl]);

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `question-bank-share-${Date.now()}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
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
                {isLoaded ? '下载分享' : '生成中...'}
            </button>
        </div>
    );
}
