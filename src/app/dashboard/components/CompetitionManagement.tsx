'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGrid, FileText, Trash2, User, Trophy, Calendar, ArrowRight, Loader2, History, X, BookOpen, Play } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { QuizDetailContent } from '../../[id]/quizdetail/page';

interface CompetitionManagementProps {
    currentUser: any;
}

export default function CompetitionManagement({ currentUser }: CompetitionManagementProps) {
    const router = useRouter();
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // History Modal State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);
    const [historyRecords, setHistoryRecords] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Question Bank Modal State
    const [showQuestionBankModal, setShowQuestionBankModal] = useState(false);

    useEffect(() => {
        fetchAllCompetitions();
    }, []);

    const fetchAllCompetitions = async () => {
        try {
            const res = await fetchApi(`/api/competitions?all=true&userId=${currentUser.id}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setCompetitions(data);
            }
        } catch (error) {
            console.error('Failed to fetch all competitions', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('确定要删除这个竞赛吗？此操作不可恢复，将删除所有相关题目和记录！')) return;

        try {
            const res = await fetchApi(`/api/competitions?id=${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                fetchAllCompetitions();
            } else {
                alert('删除失败');
            }
        } catch (error) {
            console.error('Delete failed', error);
            alert('删除出错');
        }
    };

    const handleViewHistory = async (competitionId: string) => {
        setSelectedCompetitionId(competitionId);
        setShowHistoryModal(true);
        setLoadingHistory(true);
        setHistoryRecords([]);

        try {
            const res = await fetchApi(`/api/admin/records?competitionId=${competitionId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setHistoryRecords(data);
            }
        } catch (error) {
            console.error('Failed to fetch history records', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleDeleteHistoryRecord = async (recordId: number) => {
        if (!window.confirm('确定删除该历史记录吗？')) return;
        try {
            await fetchApi(`/api/admin/records?id=${recordId}&competitionId=${selectedCompetitionId}`, { method: 'DELETE' });
            // Refresh records
            if (selectedCompetitionId) {
                const res = await fetchApi(`/api/admin/records?competitionId=${selectedCompetitionId}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setHistoryRecords(data);
                }
            }
        } catch (error) {
            console.error('Failed to delete record', error);
            alert('删除失败');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">竞赛管理</h2>
                    <p className="text-sm text-gray-500">管理系统内所有竞赛</p>
                </div>
                <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                    管理员模式
                </div>
            </div>

            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 uppercase border-b border-gray-100">
                            <tr>
                                <th className="px-3 py-2 font-semibold whitespace-nowrap">创建者</th>
                                <th className="px-3 py-2 font-semibold">竞赛标题</th>
                                <th className="px-3 py-2 font-semibold whitespace-nowrap">题目数量</th>
                                <th className="px-3 py-2 font-semibold whitespace-nowrap">创建时间</th>
                                <th className="px-3 py-2 font-semibold text-right whitespace-nowrap">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                                        <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                                        加载中...
                                    </td>
                                </tr>
                            ) : competitions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                                        暂无竞赛数据
                                    </td>
                                </tr>
                            ) : (
                                competitions.map((comp) => (
                                    <tr key={comp.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                                                    {(comp.creator_name || 'U')[0].toUpperCase()}
                                                </div>
                                                <span className="font-medium text-gray-700 text-xs">{comp.creator_name || '未知用户'}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 font-medium text-gray-900">{comp.title}</td>
                                        <td className="px-3 py-2 text-gray-500 text-xs">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded-full">{comp.question_count || 0} 题</span>
                                        </td>
                                        <td className="px-3 py-2 text-gray-500 text-[10px] whitespace-nowrap">
                                            {new Date(comp.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 py-2 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedCompetitionId(comp.id);
                                                        setShowQuestionBankModal(true);
                                                    }}
                                                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors flex items-center gap-1 text-[10px]"
                                                    title="查看题库"
                                                >
                                                    <BookOpen size={14} /> 题库
                                                </button>
                                                <button
                                                    onClick={() => window.open(`/quiz/${comp.id}`, '_blank')}
                                                    className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors flex items-center gap-1 text-[10px]"
                                                    title="开始答题"
                                                >
                                                    <Play size={14} /> 答题
                                                </button>
                                                <button
                                                    onClick={() => handleViewHistory(comp.id)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center gap-1 text-[10px]"
                                                    title="查看答题记录"
                                                >
                                                    <History size={14} /> 记录
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(comp.id)}
                                                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    title="删除竞赛"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div >

            {/* Mobile View: Cards */}
            <div className="md:hidden grid gap-4">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">
                        <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                        加载中...
                    </div>
                ) : competitions.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
                        暂无竞赛数据
                    </div>
                ) : (
                    competitions.map((comp) => (
                        <div key={comp.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                        {(comp.creator_name || 'U')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 line-clamp-1">{comp.title}</h3>
                                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                            <span>{comp.creator_name || '未知用户'}</span>
                                            <span>•</span>
                                            <span>{new Date(comp.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-600 font-medium whitespace-nowrap">
                                    {comp.question_count || 0} 题
                                </span>
                            </div>

                            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-50">
                                <button
                                    onClick={() => {
                                        setSelectedCompetitionId(comp.id);
                                        setShowQuestionBankModal(true);
                                    }}
                                    className="flex flex-col items-center justify-center p-2 rounded-lg bg-green-50 text-green-600 active:bg-green-100"
                                >
                                    <BookOpen size={18} className="mb-1" />
                                    <span className="text-[10px]">题库</span>
                                </button>
                                <button
                                    onClick={() => window.open(`/quiz/${comp.id}`, '_blank')}
                                    className="flex flex-col items-center justify-center p-2 rounded-lg bg-purple-50 text-purple-600 active:bg-purple-100"
                                >
                                    <Play size={18} className="mb-1" />
                                    <span className="text-[10px]">答题</span>
                                </button>
                                <button
                                    onClick={() => handleViewHistory(comp.id)}
                                    className="flex flex-col items-center justify-center p-2 rounded-lg bg-blue-50 text-blue-600 active:bg-blue-100"
                                >
                                    <History size={18} className="mb-1" />
                                    <span className="text-[10px]">记录</span>
                                </button>
                                <button
                                    onClick={() => handleDelete(comp.id)}
                                    className="flex flex-col items-center justify-center p-2 rounded-lg bg-red-50 text-red-600 active:bg-red-100"
                                >
                                    <Trash2 size={18} className="mb-1" />
                                    <span className="text-[10px]">删除</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* History Modal */}
            {
                showHistoryModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowHistoryModal(false)}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <History size={20} className="text-blue-600" />
                                    答题记录
                                </h3>
                                <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                {loadingHistory ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                        <Loader2 className="animate-spin mb-2 text-blue-600" size={32} />
                                        <p>加载记录中...</p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 text-gray-700 uppercase border-b border-gray-100">
                                                    <tr>
                                                        <th className="px-4 py-3 font-semibold">ID</th>
                                                        <th className="px-4 py-3 font-semibold">姓名</th>
                                                        <th className="px-4 py-3 font-semibold">分数</th>
                                                        <th className="px-4 py-3 font-semibold">用时</th>
                                                        <th className="px-4 py-3 font-semibold">提交时间</th>
                                                        <th className="px-4 py-3 font-semibold text-right">操作</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {historyRecords.map((record) => (
                                                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 text-gray-500">#{record.id}</td>
                                                            <td className="px-4 py-3 font-medium text-gray-900">{record.userName}</td>
                                                            <td className="px-4 py-3 font-bold text-red-600">{record.score}</td>
                                                            <td className="px-4 py-3 text-gray-500">{record.timeTaken} 秒</td>
                                                            <td className="px-4 py-3 text-gray-500">{new Date(record.createdAt).toLocaleString()}</td>
                                                            <td className="px-4 py-3 text-right">
                                                                <button
                                                                    onClick={() => handleDeleteHistoryRecord(record.id)}
                                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="删除记录"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {historyRecords.length === 0 && (
                                                        <tr>
                                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                                                <History size={48} className="mx-auto mb-4 opacity-20" />
                                                                <p>暂无答题记录</p>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Question Bank Modal */}
            {
                showQuestionBankModal && selectedCompetitionId && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowQuestionBankModal(false)}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <BookOpen size={20} className="text-green-600" />
                                    竞赛题库
                                </h3>
                                <button onClick={() => setShowQuestionBankModal(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <QuizDetailContent competitionId={selectedCompetitionId} isModal={true} />
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
