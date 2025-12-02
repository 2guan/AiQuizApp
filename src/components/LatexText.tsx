'use client';

import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexTextProps {
    text: string;
    className?: string;
}

const LatexText: React.FC<LatexTextProps> = ({ text, className = '' }) => {
    const containerRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Simple parser to split text by $...$
        // Note: This is a basic implementation. For nested or complex scenarios, a more robust parser might be needed.
        // We assume $...$ for inline math.

        const renderText = () => {
            const container = containerRef.current;
            if (!container) return;

            container.innerHTML = ''; // Clear previous content

            // Regex to match $...$ but not \$ (escaped dollar sign)
            // This regex captures the content inside $...$
            const regex = /(\$[^$]+\$)/g;
            const parts = text.split(regex);

            parts.forEach(part => {
                if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
                    // It's a math formula
                    const formula = part.slice(1, -1);
                    const span = document.createElement('span');
                    try {
                        katex.render(formula, span, {
                            throwOnError: false,
                            displayMode: false // Inline math
                        });
                    } catch (e) {
                        span.textContent = part; // Fallback
                    }
                    container.appendChild(span);
                } else {
                    // Regular text
                    // Handle newlines if needed, or just append text node
                    // To preserve whitespace/newlines, we might want to use whitespace-pre-wrap in CSS
                    const span = document.createElement('span');
                    span.textContent = part;
                    container.appendChild(span);
                }
            });
        };

        renderText();
    }, [text]);

    return (
        <span
            ref={containerRef}
            className={`${className} whitespace-pre-wrap`}
            style={{ display: 'inline-block' }} // Or 'block' depending on usage, but inline-block is safer for mixing
        />
    );
};

export default LatexText;
