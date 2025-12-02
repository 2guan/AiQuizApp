'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Trophy, History, Play, Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';
import { extractDominantColors, getContrastColor, adjustColorBrightness, hexToRgbString } from '@/lib/colorUtils';

interface HomeClientProps {
    initialBannerUrl: string;
    initialSettings: {
        title: string;
        subtitle: string;
    };
    competitionId: string;
}

export default function HomeClient({ initialBannerUrl, initialSettings, competitionId }: HomeClientProps) {
    const [name, setName] = useState('');
    const router = useRouter();
    const [bannerUrl, setBannerUrl] = useState(initialBannerUrl);

    const [pageSettings, setPageSettings] = useState(initialSettings);
    const [shimmerAngle, setShimmerAngle] = useState(110); // Default angle
    const [isThemeReady, setIsThemeReady] = useState(false);

    // Dynamic Theme State
    const [themeColors, setThemeColors] = useState({
        primary: '#E60012', // Default Red
        secondary: '#FFF5F5', // Default Light Red
        text: '#991B1B', // Default Dark Red
        titleColor: '#991B1B', // Default Darker Red for Title
        historyBgColor: '#FEE2E2', // Default slightly darker background for history
        backgroundFrom: '#DC2626',
        backgroundTo: 'transparent',
        buttonText: 'white',
        pulseRgb: '230, 0, 18'
    });

    useEffect(() => {
        // Load name from cookie
        const savedName = Cookies.get('quiz_user_name');
        if (savedName) {
            setName(savedName);
        }

        // Randomize shimmer angle between 100 and 140 degrees
        setShimmerAngle(Math.floor(Math.random() * 40) + 100);
    }, []);

    // Extract colors when banner changes
    useEffect(() => {
        if (!bannerUrl) {
            setIsThemeReady(true);
            return;
        }

        const processColors = async () => {
            try {
                const colors = await extractDominantColors(bannerUrl, 4);
                if (colors.length > 0) {
                    let primary = colors[0];

                    // If the color is light, darken it by 50%
                    if (getContrastColor(primary) === 'black') {
                        primary = adjustColorBrightness(primary, -40);
                    }

                    setThemeColors({
                        primary: primary,
                        secondary: adjustColorBrightness(primary, 95), // Very light version for backgrounds
                        text: primary,
                        titleColor: adjustColorBrightness(primary, -10), // Darker version for title
                        historyBgColor: adjustColorBrightness(primary, 85), // Darker background for history
                        backgroundFrom: adjustColorBrightness(primary, 85),
                        backgroundTo: adjustColorBrightness(primary, 95),
                        buttonText: getContrastColor(primary),
                        pulseRgb: hexToRgbString(primary)
                    });
                }
            } catch (error) {
                console.error("Failed to extract colors:", error);
            } finally {
                setIsThemeReady(true);
            }
        };

        processColors();
    }, [bannerUrl]);

    const handleStart = () => {
        if (!name.trim()) {
            alert('请输入您的姓名');
            return;
        }
        Cookies.set('quiz_user_name', name.trim(), { expires: 365 });
        router.push(`/${competitionId}/start?name=${encodeURIComponent(name)}`);
    };

    const handleHistory = () => {
        if (!name.trim()) {
            // Try to get from cookie if current input is empty
            const savedName = Cookies.get('quiz_user_name');
            if (savedName) {
                router.push(`/${competitionId}/history?name=${encodeURIComponent(savedName)}`);
                return;
            }
            alert('请输入您的姓名以查看历史');
            return;
        }
        Cookies.set('quiz_user_name', name.trim(), { expires: 365 });
        router.push(`/${competitionId}/history?name=${encodeURIComponent(name)}`);
    };

    if (!isThemeReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <main
            className="min-h-screen flex flex-col items-center p-4 relative overflow-hidden transition-colors duration-700 animate-fade-in-up"
            style={{
                background: `linear-gradient(to bottom, ${themeColors.backgroundFrom} 0%, ${themeColors.secondary} 100%)`,
                '--pulse-color': themeColors.pulseRgb
            } as React.CSSProperties}
        >
            {/* Background Decoration */}
            <div
                className="absolute top-0 left-0 w-full h-64 -z-10 opacity-20 transition-all duration-700"
                style={{ background: `linear-gradient(to bottom, ${themeColors.backgroundFrom}, transparent)` }}
            />

            {/* Banner */}
            <div className="w-full max-w-md aspect-video bg-gray-200 rounded-xl shadow-2xl mb-8 overflow-hidden relative animate-fade-in-up">
                {/* Placeholder for Banner */}
                <div className="absolute inset-0 flex items-center justify-center text-white text-opacity-50">
                    <img
                        src={bannerUrl}
                        alt="Banner"
                        className="w-full h-full object-cover animate-breathe"
                        onError={(e) => e.currentTarget.src = 'https://placehold.co/600x400/E60012/FFFFFF?text=Banner'}
                        crossOrigin="anonymous"
                    />
                    {/* Shimmer Overlay */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div
                            className="absolute inset-0 animate-shimmer"
                            style={{ '--shimmer-angle': `${shimmerAngle}deg` } as React.CSSProperties}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Main Card */}
            <div className="card w-full max-w-md space-y-8 animate-slide-up border-none shadow-xl" style={{ animationDelay: '0.2s' }}>
                <div className="text-center space-y-2">
                    <h1
                        className="text-2xl font-bold transition-colors duration-500"
                        style={{ color: themeColors.titleColor }}
                    >
                        {pageSettings.title}
                    </h1>
                    <p className="text-gray-500 text-sm">{pageSettings.subtitle}</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">您的姓名</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="请输入您的姓名"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 outline-none transition-all"
                            style={{ '--tw-ring-color': themeColors.primary } as React.CSSProperties}
                        />
                    </div>

                    <button
                        onClick={handleStart}
                        className="w-full flex items-center justify-center gap-2 text-lg font-bold py-3 rounded-xl shadow-lg animate-pulse-soft hover:animate-none transform hover:-translate-y-1 transition-all duration-300"
                        style={{
                            backgroundColor: themeColors.primary,
                            color: themeColors.buttonText
                        }}
                    >
                        <Play size={20} />
                        开始答题
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => router.push(`/${competitionId}/leaderboard`)}
                            className="flex flex-col items-center justify-center p-4 rounded-lg transition-all hover:scale-105 active:scale-95 border-none"
                            style={{ backgroundColor: '#FEFCE8', color: '#A16207' }} // Keep yellow for trophy
                        >
                            <Trophy size={24} className="mb-1" />
                            <span className="text-sm font-medium">查看排行榜</span>
                        </button>
                        <button
                            onClick={handleHistory}
                            className="flex flex-col items-center justify-center p-4 rounded-lg transition-all hover:scale-105 active:scale-95 border-none"
                            style={{
                                backgroundColor: themeColors.historyBgColor,
                                color: themeColors.titleColor
                            }}
                        >
                            <History size={24} className="mb-1" />
                            <span className="text-sm font-medium">历史记录</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer / Admin */}
            <div className="mt-auto py-6 flex flex-col items-center gap-4">
                <p className="text-xs text-gray-400">© 2025 {pageSettings.subtitle}</p>
            </div>
        </main>
    );
}
