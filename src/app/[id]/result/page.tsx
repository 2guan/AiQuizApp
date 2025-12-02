'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { CheckCircle, XCircle, Home, Download, Award, X } from 'lucide-react';
import CertificateCanvas from '@/components/CertificateCanvas';
import { fetchApi, getAssetPath } from '@/lib/api';
import LatexText from '@/components/LatexText';

function ResultContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id'); // recordId
    const router = useRouter();
    const params = useParams();
    const competitionId = params.id as string;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showCert, setShowCert] = useState(false);
    const [certConfig, setCertConfig] = useState<any>(null);

    useEffect(() => {
        if (!id) return;
        fetchApi(`/api/quiz/result?id=${id}`)
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));

        fetchApi(`/api/settings/certificate?competitionId=${competitionId}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.activityName) {
                    if (data.backgroundImage) {
                        data.backgroundImage = getAssetPath(data.backgroundImage);
                    } else {
                        data.backgroundImage = getAssetPath('/images/default_certificate_bg.jpg');
                    }
                    if (!data.layout) {
                        data.layout = {
                            mainText: { x: 421, y: 400, width: 500, fontSize: 36, lineHeight: 1.8, color: '#333333', bold: true, textAlign: 'center' },
                            issuerInfo: { x: 421, y: 800, width: 400, fontSize: 24, lineHeight: 1.5, color: '#333333', bold: false, textAlign: 'center' }
                        };
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
    }, [id, competitionId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-red-600">加载中...</div>;
    if (!data) return <div className="min-h-screen flex items-center justify-center">未找到记录</div>;

    const { record, rank, totalParticipants, details } = data;

    return (
        <main className="min-h-screen bg-gray-50 p-4 pb-20">
            <div className="max-w-md mx-auto space-y-6">
                {/* Score Card */}
                <div className="card text-center space-y-4 bg-gradient-to-br from-white to-red-50">
                    <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center text-3xl">
                        👤
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{record.userName}</h2>
                        <p className="text-gray-500 text-sm">答题时间: {new Date(record.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-red-100">
                        <div>
                            <div className="text-3xl font-bold text-red-600">{record.score}</div>
                            <div className="text-xs text-gray-500">得分</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-gray-800">{record.timeTaken}秒</div>
                            <div className="text-xs text-gray-500">用时</div>
                        </div>
                    </div>
                </div>

                {/* Analysis */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 border-l-4 border-red-600 pl-3">答案解析</h3>
                    {(Array.isArray(details) ? details : Object.values(details)).map((item: any, index: number) => (
                        <div key={index} className="card space-y-3">
                            <p className="font-medium text-gray-800">
                                {index + 1}. <LatexText text={item.questionContent} />
                            </p>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {Object.entries(item.options).map(([key, val]: any) => {
                                    const isCorrect = item.correctAnswer.includes(key);
                                    const isSelected = item.userAnswer.includes(key);
                                    const isMultiple = item.type === 'multiple' || item.correctAnswer.length > 1;

                                    let bgClass = "bg-gray-50 border-gray-200";
                                    let label = null;

                                    if (isMultiple) {
                                        // Multiple Choice Logic
                                        if (isSelected && isCorrect) {
                                            bgClass = "bg-green-50 border-green-200 text-green-700";
                                            label = <span className="ml-1 text-green-600 text-[9px] font-bold bg-green-50 px-1 py-[1px] rounded border border-green-600 whitespace-nowrap">你的选择、正确答案</span>;
                                        } else if (!isSelected && isCorrect) {
                                            bgClass = "bg-blue-50 border-blue-200 text-blue-700";
                                            label = <span className="ml-1 text-blue-600 text-[9px] font-bold bg-blue-50 px-1 py-[1px] rounded border border-blue-600 whitespace-nowrap">正确答案</span>;
                                        } else if (isSelected && !isCorrect) {
                                            bgClass = "bg-red-50 border-red-200 text-red-700";
                                            label = <span className="ml-1 text-red-600 text-[9px] font-bold bg-red-50 px-1 py-[1px] rounded border border-red-600 whitespace-nowrap">你的选择</span>;
                                        }
                                    } else {
                                        // Single Choice Logic
                                        if (isSelected && isCorrect) {
                                            bgClass = "bg-green-50 border-green-200 text-green-700";
                                            label = <span className="ml-1 text-green-600 text-[9px] font-bold bg-green-50 px-1 py-[1px] rounded border border-green-600 whitespace-nowrap">你的选择、正确答案</span>;
                                        } else if (!isSelected && isCorrect) {
                                            bgClass = "bg-green-50 border-green-200 text-green-700";
                                            label = <span className="ml-1 text-green-600 text-[9px] font-bold bg-green-50 px-1 py-[1px] rounded border border-green-600 whitespace-nowrap">正确答案</span>;
                                        } else if (isSelected && !isCorrect) {
                                            bgClass = "bg-red-50 border-red-200 text-red-700";
                                            label = <span className="ml-1 text-red-600 text-[9px] font-bold bg-red-50 px-1 py-[1px] rounded border border-red-600 whitespace-nowrap">你的选择</span>;
                                        }
                                    }

                                    return (
                                        <div key={key} className={`p-2 rounded border ${bgClass}`}>
                                            <span className="font-bold mr-1">{key}.</span> <LatexText text={val} />
                                            {label}
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="bg-red-50 p-3 rounded-lg text-sm text-gray-700 space-y-1">
                                <div className="font-bold text-gray-900">正确答案: {item.correctAnswer}</div>
                                <div>
                                    <span className="font-bold text-red-800">解析：</span>
                                    <div className="whitespace-pre-wrap">
                                        <LatexText text={item.explanation || "暂无解析"} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Actions */}
                <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 flex gap-4 justify-center shadow-lg max-w-md mx-auto right-0">
                    <button
                        onClick={() => router.push(`/${competitionId}`)}
                        className="flex-1 btn-primary bg-gray-600 hover:bg-gray-700 flex items-center justify-center gap-2"
                    >
                        <Home size={18} /> 返回首页
                    </button>
                    <button
                        onClick={() => setShowCert(true)}
                        disabled={record.score < 80}
                        className={`flex-1 btn-primary flex items-center justify-center gap-2 ${record.score >= 80
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            : 'bg-gray-300 cursor-not-allowed text-gray-500'
                            }`}
                    >
                        {record.score >= 80 ? (
                            <>
                                <Award size={18} /> 获取荣誉证书
                            </>
                        ) : (
                            '请再接再厉'
                        )}
                    </button>
                </div>
            </div>

            {/* Certificate Modal */}
            {showCert && certConfig && (
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
                                    userName={record.userName}
                                    score={record.score}
                                    date={new Date(record.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
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
                                        link.download = `${record.userName}_荣誉证书.png`;
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

export default function ResultPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-red-600">加载中...</div>}>
            <ResultContent />
        </Suspense>
    );
}
