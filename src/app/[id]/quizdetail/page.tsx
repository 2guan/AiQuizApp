'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Home, ArrowLeft, Share2, X, Play } from 'lucide-react';
import { fetchApi, getAssetPath } from '@/lib/api';
import LatexText from '@/components/LatexText';
import ShareCardCanvas from './components/QuestionBankShareCanvas';

interface QuizDetailContentProps {
    competitionId: string;
    isModal?: boolean;
}

export function QuizDetailContent({ competitionId, isModal = false }: QuizDetailContentProps) {
    const router = useRouter();
    const [questions, setQuestions] = useState<any[]>([]);
    const [competition, setCompetition] = useState<any>(null);
    const [showShareModal, setShowShareModal] = useState(false);

    useEffect(() => {
        fetchApi(`/api/questions?competitionId=${competitionId}`)
            .then(res => res.json())
            .then(data => setQuestions(data));

        fetchApi(`/api/settings?competitionId=${competitionId}`)
            .then(res => res.json())
            .then(data => setCompetition(data));
    }, [competitionId]);

    return (
        <main className={`min-h-screen bg-gray-50 p-4 pb-20 ${isModal ? 'min-h-0' : ''}`}>
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">题库</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowShareModal(true)}
                            className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-green-700 transition-all active:scale-95 flex items-center gap-2 text-sm"
                        >
                            <Share2 size={16} /> 题库分享
                        </button>
                        {!isModal && (
                            <button
                                onClick={() => router.push(`/${competitionId}`)}
                                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 text-sm"
                            >
                                <Play size={16} /> 开始答题
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    {questions.map((q, index) => (
                        <div key={q.id} className="card space-y-4">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <span className="inline-block px-2 py-1 rounded text-xs font-bold mr-2 mb-1 align-middle bg-red-100 text-red-600">
                                        {index + 1}
                                    </span>
                                    <h3 className="inline font-medium text-gray-800 text-lg align-middle">
                                        <LatexText text={q.content} />
                                    </h3>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs flex-shrink-0 ${q.type === 'single' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                    {q.type === 'single' ? '单选' : '多选'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-2 text-sm">
                                {Object.entries(q.options).map(([key, val]: any) => {
                                    const isCorrect = q.answer.includes(key);
                                    let bgClass = "bg-gray-50 border-gray-200";
                                    if (isCorrect) bgClass = "bg-green-50 border-green-200 text-green-700";

                                    return (
                                        <div key={key} className={`p-3 rounded border ${bgClass} flex flex-wrap justify-between items-center transition-colors`}>
                                            <span><span className="font-bold mr-2">{key}.</span> <LatexText text={val} /></span>
                                            {isCorrect && <span className="text-green-600 text-[9px] font-bold bg-green-50 px-1 py-[1px] rounded border border-green-600 whitespace-nowrap flex-shrink-0">正确答案</span>}
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="bg-orange-50 p-4 rounded-lg text-sm text-gray-700 border border-orange-100 space-y-2">
                                <div className="font-bold text-gray-900">正确答案: {q.answer}</div>
                                <div>
                                    <span className="font-bold text-orange-800 block mb-1">💡 答案解析：</span>
                                    <div className="leading-relaxed whitespace-pre-wrap"><LatexText text={q.explanation || "暂无解析"} /></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center text-gray-400 text-sm py-8">
                    共 {questions.length} 道题目
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && competition && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-scale-in">
                        <button
                            onClick={() => setShowShareModal(false)}
                            className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors z-10"
                        >
                            <X size={20} />
                        </button>
                        <div className="p-8">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">分享题库</h3>
                            <ShareCardCanvas
                                title={`${competition.title}题库`}
                                subtitle={competition.subtitle || ''}
                                bannerUrl={competition.banner ? getAssetPath(competition.banner) : ''}
                                quizUrl={window.location.href}
                            />
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default function QuizDetailPage() {
    const params = useParams();
    const competitionId = params.id as string;
    return <QuizDetailContent competitionId={competitionId} />;
}
