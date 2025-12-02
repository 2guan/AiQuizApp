'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Trophy, Medal } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function LeaderboardPage() {
    const router = useRouter();
    const params = useParams();
    const competitionId = params.id as string;
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageSettings, setPageSettings] = useState({ title: '', subtitle: '' });

    useEffect(() => {
        // Fetch records
        fetchApi(`/api/leaderboard?competitionId=${competitionId}`)
            .then(res => res.json())
            .then(data => {
                setRecords(data);
                setLoading(false);
            });

        // Fetch settings
        fetchApi(`/api/settings?competitionId=${competitionId}`)
            .then(res => res.json())
            .then(data => {
                setPageSettings({
                    title: data.title || '知识竞赛',
                    subtitle: data.subtitle || '承办机构'
                });
            });
    }, [competitionId]);

    const topThree = records.slice(0, 3);
    const otherRecords = records.slice(3);

    return (
        <main className="min-h-screen bg-gradient-to-b from-red-700 via-red-800 to-red-900 p-4 text-white animate-fade-in">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="relative z-10 space-y-4">
                    {/* Back Button */}
                    <div className="absolute top-0 left-0">
                        <button
                            onClick={() => router.back()}
                            className="p-3 bg-white/10 backdrop-blur-md rounded-full shadow-lg text-white hover:bg-white/20 transition-all hover:scale-110 border border-white/10"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    </div>

                    {/* Title Section - Centered and Pushed Down */}
                    <div className="pt-16 flex flex-col items-center justify-center space-y-4">
                        <h1 className="text-3xl font-bold text-yellow-400 flex items-center gap-3 drop-shadow-[0_2px_10px_rgba(234,179,8,0.5)] animate-bounce-in">
                            <Trophy className="text-yellow-400 drop-shadow-lg animate-breathe" size={32} />
                            荣耀榜单
                        </h1>

                        {/* Competition Titles */}
                        <div className="text-center space-y-2 animate-fade-in-up">
                            <h2 className="text-xl font-bold text-white/90 tracking-wide">{pageSettings.title}</h2>
                            <p className="text-sm text-yellow-300 font-medium bg-red-950/50 inline-block px-4 py-1 rounded-full border border-red-500/30 backdrop-blur-sm">
                                {pageSettings.subtitle}
                            </p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-12 h-12 border-4 border-red-500/30 border-t-yellow-400 rounded-full animate-spin"></div>
                        <p className="text-red-200/70 font-medium animate-pulse">正在加载榜单...</p>
                    </div>
                ) : records.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 backdrop-blur-md rounded-3xl shadow-xl border border-white/10">
                        <Trophy size={64} className="mx-auto mb-4 text-white/20" />
                        <p className="text-white/40 text-lg">暂无上榜记录</p>
                    </div>
                ) : (
                    <>
                        {/* Top 3 Podium */}
                        <div className="flex justify-center items-end gap-4 mb-12 px-4 pt-8">
                            {/* 2nd Place */}
                            {topThree[1] && (
                                <div className="flex-1 flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                                    <div className="relative mb-3 group">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 p-[2px] shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:scale-110 transition-transform duration-300">
                                            <div className="w-full h-full rounded-full bg-red-950 flex items-center justify-center text-xl font-bold text-gray-200 border-2 border-gray-400/50">
                                                {topThree[1].userName[0]}
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg border border-white/20">
                                            NO.2
                                        </div>
                                    </div>
                                    <div className="w-full bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md rounded-t-2xl p-4 text-center shadow-2xl border-t-4 border-gray-400 min-h-[140px] flex flex-col justify-end hover:bg-white/15 transition-colors">
                                        <div className="font-bold text-white/90 truncate w-full mb-1">{topThree[1].userName}</div>
                                        <div className="text-2xl font-black text-gray-300 drop-shadow-md">{topThree[1].score}</div>
                                        <div className="text-xs text-white/40">{topThree[1].timeTaken}s</div>
                                    </div>
                                </div>
                            )}

                            {/* 1st Place */}
                            {topThree[0] && (
                                <div className="flex-1 flex flex-col items-center z-10 -mx-2 animate-slide-up">
                                    <div className="relative mb-4 group">
                                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                                            <Medal size={40} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-bounce" />
                                        </div>
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 p-[3px] shadow-[0_0_30px_rgba(234,179,8,0.6)] ring-4 ring-yellow-500/20 group-hover:scale-110 transition-transform duration-300">
                                            <div className="w-full h-full rounded-full bg-red-900 flex items-center justify-center text-3xl font-bold text-yellow-400 border-2 border-yellow-300/50">
                                                {topThree[0].userName[0]}
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-sm font-bold px-4 py-0.5 rounded-full shadow-lg border border-yellow-200/30">
                                            NO.1
                                        </div>
                                    </div>
                                    <div className="w-full bg-gradient-to-b from-yellow-500/20 to-yellow-600/5 backdrop-blur-md rounded-t-2xl p-5 text-center shadow-[0_0_30px_rgba(234,179,8,0.15)] border-t-4 border-yellow-400 min-h-[180px] flex flex-col justify-end transform scale-105 hover:bg-yellow-500/25 transition-colors relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent opacity-50"></div>
                                        <div className="font-bold text-white truncate w-full mb-1 text-lg relative z-10">{topThree[0].userName}</div>
                                        <div className="text-4xl font-black text-yellow-400 drop-shadow-lg relative z-10">{topThree[0].score}</div>
                                        <div className="text-sm text-yellow-200/60 font-medium relative z-10">{topThree[0].timeTaken}s</div>
                                    </div>
                                </div>
                            )}

                            {/* 3rd Place */}
                            {topThree[2] && (
                                <div className="flex-1 flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
                                    <div className="relative mb-3 group">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 p-[2px] shadow-[0_0_15px_rgba(249,115,22,0.3)] group-hover:scale-110 transition-transform duration-300">
                                            <div className="w-full h-full rounded-full bg-red-950 flex items-center justify-center text-xl font-bold text-orange-400 border-2 border-orange-400/50">
                                                {topThree[2].userName[0]}
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg border border-white/20">
                                            NO.3
                                        </div>
                                    </div>
                                    <div className="w-full bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md rounded-t-2xl p-4 text-center shadow-2xl border-t-4 border-orange-500 min-h-[120px] flex flex-col justify-end hover:bg-white/15 transition-colors">
                                        <div className="font-bold text-white/90 truncate w-full mb-1">{topThree[2].userName}</div>
                                        <div className="text-2xl font-black text-orange-400 drop-shadow-md">{topThree[2].score}</div>
                                        <div className="text-xs text-white/40">{topThree[2].timeTaken}s</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* List View for Others */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
                            {otherRecords.map((record, index) => (
                                <div
                                    key={record.id}
                                    className="flex items-center p-4 border-b border-white/5 last:border-0 hover:bg-white/10 transition-all duration-300 animate-fade-in-up group"
                                    style={{ animationDelay: `${0.5 + index * 0.05}s` }}
                                >
                                    <div className="w-8 font-bold text-white/30 text-center mr-4 group-hover:text-white/60 transition-colors">{index + 4}</div>
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 font-bold mr-4 flex-shrink-0 border border-white/10 group-hover:scale-110 transition-transform">
                                        {record.userName[0]}
                                    </div>
                                    <div className="flex-1 min-w-0 mr-4">
                                        <div className="font-bold text-white/90 truncate group-hover:text-white transition-colors">{record.userName}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-yellow-400 text-lg drop-shadow-sm">{record.score}</div>
                                        <div className="text-xs text-white/30">{record.timeTaken}s</div>
                                    </div>
                                </div>
                            ))}
                            {otherRecords.length === 0 && records.length > 3 && (
                                <div className="p-8 text-center text-white/30 text-sm">
                                    没有更多记录了
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
