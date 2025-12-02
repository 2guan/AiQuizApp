'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, ChevronRight, Award, Download, X } from 'lucide-react';
import CertificateCanvas from '@/components/CertificateCanvas';
import { fetchApi, getAssetPath } from '@/lib/api';

function HistoryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userName = searchParams.get('name');
    const params = useParams();
    const competitionId = params.id as string;
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCert, setShowCert] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [certConfig, setCertConfig] = useState<any>(null);

    useEffect(() => {
        if (userName) {
            fetchApi(`/api/history?userName=${encodeURIComponent(userName)}&competitionId=${competitionId}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setHistory(data);
                    } else {
                        console.error('Failed to fetch history:', data);
                        setHistory([]);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching history:', err);
                    setHistory([]);
                    setLoading(false);
                });
        }
    }, [userName, competitionId]);

    useEffect(() => {
        fetchApi(`/api/settings/certificate?competitionId=${competitionId}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.activityName) {
                    if (data.backgroundImage) {
                        data.backgroundImage = getAssetPath(data.backgroundImage);
                    } else {
                        data.backgroundImage = getAssetPath('/images/default_certificate_bg.jpg');
                    }
                    setCertConfig(data);
                } else {
                    setCertConfig({
                        activityName: '知识竞赛',
                        issuer: '承办机构',
                        backgroundImage: getAssetPath('/images/default_certificate_bg.jpg'),
                        layout: {
                            mainText: { x: 421, y: 400, width: 500, fontSize: 36, lineHeight: 1.8, color: '#333333', bold: true, textAlign: 'center' },
                            issuerInfo: { x: 421, y: 800, width: 400, fontSize: 24, lineHeight: 1.5, color: '#333333', bold: false, textAlign: 'center' }
                        }
                    });
                }
            });
    }, [competitionId]);

    if (!userName) return <div className="p-8 text-center">请先输入姓名</div>;

    return (
        <main className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-md mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 bg-white rounded-full shadow text-gray-600">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {userName} 的答题记录
                    </h1>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center text-gray-500">加载中...</div>
                    ) : Array.isArray(history) && history.length === 0 ? (
                        <div className="text-center text-gray-500">暂无记录</div>
                    ) : Array.isArray(history) ? (
                        history.map((record) => (
                            <div
                                key={record.id}
                                className="card hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => router.push(`/${competitionId}/result?id=${record.id}`)}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-lg font-bold text-red-600">{record.score} 分</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (record.score >= 80) {
                                                    setSelectedRecord(record);
                                                    setShowCert(true);
                                                }
                                            }}
                                            className={`p-2 rounded-full transition-colors ${record.score >= 80
                                                ? 'text-yellow-600 hover:bg-yellow-50'
                                                : 'text-gray-300 cursor-not-allowed'
                                                }`}
                                            title={record.score >= 80 ? "获取证书" : "分数未达标 (需80分)"}
                                        >
                                            <Award size={20} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <span className="flex items-center gap-1"><Clock size={14} /> {record.timeTaken}秒</span>
                                        <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(record.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <ChevronRight className="text-gray-400" size={20} />
                                </div>
                            </div>
                        ))
                    ) : null}
                </div>
            </div>

            {/* Certificate Modal */}
            {showCert && certConfig && selectedRecord && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Award className="text-yellow-500" /> 荣誉证书
                            </h3>
                            <button onClick={() => setShowCert(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={24} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 bg-gray-50 flex-1 overflow-auto flex justify-center">
                            <div className="shadow-lg">
                                <CertificateCanvas
                                    config={certConfig}
                                    userName={selectedRecord.userName}
                                    score={selectedRecord.score}
                                    date={new Date(selectedRecord.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    mode="generate"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                            <button
                                onClick={() => setShowCert(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium"
                            >
                                关闭
                            </button>
                            <button
                                onClick={() => {
                                    const canvas = document.querySelector('canvas');
                                    if (canvas) {
                                        const link = document.createElement('a');
                                        link.download = `${selectedRecord.userName}_荣誉证书.png`;
                                        link.href = canvas.toDataURL('image/png');
                                        link.click();
                                    }
                                }}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-md flex items-center gap-2"
                            >
                                <Download size={18} /> 下载证书
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default function HistoryPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">加载中...</div>}>
            <HistoryContent />
        </Suspense>
    );
}
