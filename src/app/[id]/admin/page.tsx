'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Lock, Upload, Trash2, Save, FileText, Database, Image as ImageIcon, Trophy, Plus, Edit, X, Menu, Clock, Calendar, History, Award, Download, BookOpen, Home, Share, Loader2, Check, Settings } from 'lucide-react';
import CertificateCanvas from '@/components/CertificateCanvas';
import AIGenerator from './components/AIGenerator';
import ShareCardCanvas from './components/ShareCardCanvas';
import { fetchApi, getAssetPath } from '@/lib/api';
import LatexText from '@/components/LatexText';
import * as XLSX from 'xlsx';

export default function AdminPage() {
    const router = useRouter();
    const params = useParams();
    const competitionId = params.id as string;
    const [activeTab, setActiveTab] = useState('settings'); // questions, leaderboard, settings, ai, img-gen
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Questions State
    const [questions, setQuestions] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({
        type: 'single',
        content: '',
        options: { A: '', B: '', C: '', D: '' },
        answer: '',
        explanation: ''
    });

    const [importText, setImportText] = useState('');
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importStatus, setImportStatus] = useState('');

    // Leaderboard State
    const [records, setRecords] = useState<any[]>([]);

    // History Records State
    const [historyRecords, setHistoryRecords] = useState<any[]>([]);

    // Banner State
    const [bannerFile, setBannerFile] = useState<File | null>(null);

    // Page Settings State
    const [pageSettings, setPageSettings] = useState({
        title: '',
        subtitle: '',
        question_timer: '20',
        banner: '',
        single_choice_count: '10',
        multiple_choice_count: '0',
        allow_back_tracking: 'false',
        random_options: 'false'
    });

    // Certificate Settings State
    const [certConfig, setCertConfig] = useState({
        activityName: '',
        issuer: '',
        backgroundImage: '',
        layout: {
            mainText: { x: 421, y: 400, width: 500, fontSize: 36, lineHeight: 1.8, color: '#333333', bold: true, textAlign: 'center' },
            issuerInfo: { x: 421, y: 800, width: 400, fontSize: 24, lineHeight: 1.5, color: '#333333', bold: false, textAlign: 'center' }
        }
    });
    const [certFile, setCertFile] = useState<File | null>(null);

    // Notification State
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Confirmation State
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        message: '',
        onConfirm: () => { },
    });

    const openConfirm = (message: string, onConfirm: () => void) => {
        setConfirmState({ isOpen: true, message, onConfirm });
    };

    const closeConfirm = () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    };

    // Image Generation State
    const [generatingImg, setGeneratingImg] = useState(false);
    const [generatedImgUrls, setGeneratedImgUrls] = useState<string[]>([]);
    const [selectedImgUrl, setSelectedImgUrl] = useState<string | null>(null);
    const [imgGenPrompt, setImgGenPrompt] = useState('');

    const handleGenerateImage = async () => {
        if (!user?.img_gen_api_key) {
            // Try to fetch user settings to see if key exists
            const res = await fetchApi(`/api/user/ai-settings?userId=${user.id}`);
            const data = await res.json();
            if (!data.img_gen_api_key) {
                showNotification('请先在“大模型设置”中配置 API Key / Session ID', 'error');
                return;
            }
            // Update local user object if needed, or just use the key from response
            user.img_gen_api_key = data.img_gen_api_key;
        }

        setGeneratingImg(true);
        setGeneratedImgUrls([]);
        setSelectedImgUrl(null);

        try {
            const prompt = imgGenPrompt || `生成一个完整的图片，中间文字标题是“${pageSettings.title}”，其它部分请随意设计元素，不要有文字或文字图案！`;

            const res = await fetchApi('/api/ai/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey: user.img_gen_api_key,
                    prompt: prompt
                })
            });
            const data = await res.json();
            if (res.ok) {
                setGeneratedImgUrls(data.imageUrls);
                showNotification('图片生成成功，请选择一张', 'success');
            } else {
                showNotification(`生成失败: ${data.error}`, 'error');
            }
        } catch (e: any) {
            showNotification(`生成出错: ${e.message}`, 'error');
        } finally {
            setGeneratingImg(false);
        }
    };

    const handleSaveGeneratedBanner = async () => {
        if (!selectedImgUrl) return;

        try {
            // First, save the remote image locally
            const saveRes = await fetchApi('/api/ai/save-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: selectedImgUrl })
            });
            const saveData = await saveRes.json();

            if (!saveRes.ok) {
                showNotification(`保存图片失败: ${saveData.error}`, 'error');
                return;
            }

            const localUrl = saveData.localUrl;

            // Then update the competition banner with the local URL
            const formData = new FormData();
            formData.append('bannerUrl', localUrl);
            formData.append('competitionId', competitionId);

            const res = await fetchApi('/api/settings/banner', {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                showNotification('Banner 更新成功');
                setPageSettings(prev => ({ ...prev, banner: localUrl }));
                setBannerFile(null);
            } else {
                showNotification('更新失败', 'error');
            }
        } catch (e) {
            showNotification('更新出错', 'error');
        }
    };

    const fetchSettings = () => {
        fetchApi(`/api/settings?competitionId=${competitionId}&t=${Date.now()}`)
            .then(res => res.json())
            .then(data => {
                console.log('Fetched settings:', data);
                setPageSettings({
                    title: data.title || '',
                    subtitle: data.subtitle || '',
                    question_timer: data.question_timer || '20',
                    banner: data.banner ? getAssetPath(data.banner) : '',
                    single_choice_count: data.single_choice_count || '10',
                    multiple_choice_count: data.multiple_choice_count || '0',
                    allow_back_tracking: data.allow_back_tracking || 'false',
                    random_options: data.random_options || 'false'
                });
            });
    };



    const handleResetTitleSettings = () => {
        setPageSettings(prev => ({
            ...prev,
            title: '知识竞赛',
            subtitle: '承办机构'
        }));
    };

    const handleResetQuizSettings = () => {
        setPageSettings(prev => ({
            ...prev,
            question_timer: '20',
            single_choice_count: '10',
            multiple_choice_count: '0',
            allow_back_tracking: 'false',
            random_options: 'false'
        }));
    };

    const handleResetCertBasicInfo = () => {
        setCertConfig(prev => ({
            ...prev,
            activityName: pageSettings.title || '知识竞赛',
            issuer: pageSettings.subtitle || '承办机构'
        }));
    };

    const handleSaveSettings = async () => {
        try {
            const res = await fetchApi('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...pageSettings, competitionId })
            });
            if (res.ok) {
                showNotification('设置保存成功');
            } else {
                showNotification('保存失败', 'error');
            }
        } catch (e) {
            showNotification('保存出错', 'error');
        }
    };







    const fetchLeaderboard = () => {
        fetchApi(`/api/leaderboard?competitionId=${competitionId}`)
            .then(res => res.json())
            .then(setRecords);
    };

    const fetchQuestions = () => {
        fetchApi(`/api/questions?competitionId=${competitionId}`)
            .then(res => res.json())
            .then(setQuestions);
    };

    const fetchHistoryRecords = () => {
        fetchApi(`/api/admin/records?competitionId=${competitionId}`)
            .then(res => res.json())
            .then(setHistoryRecords);
    };
    const fetchCertConfig = async () => {
        try {
            const [certRes, settingsRes] = await Promise.all([
                fetchApi(`/api/settings/certificate?competitionId=${competitionId}`),
                fetchApi(`/api/settings?competitionId=${competitionId}`)
            ]);

            const data = await certRes.json();
            const settings = await settingsRes.json();

            if (data && data.activityName) {
                // Ensure background image has a default if missing
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
                // Set defaults using global settings if available
                setCertConfig({
                    activityName: settings.title || '知识竞赛',
                    issuer: settings.subtitle || '承办机构',
                    backgroundImage: getAssetPath('/images/default_certificate_bg.jpg'),
                    layout: {
                        mainText: { x: 421, y: 400, width: 500, fontSize: 36, lineHeight: 1.8, color: '#333333', bold: true, textAlign: 'center' },
                        issuerInfo: { x: 421, y: 800, width: 400, fontSize: 24, lineHeight: 1.5, color: '#333333', bold: false, textAlign: 'center' }
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching certificate config:', error);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/');
            return;
        }
        setUser(JSON.parse(storedUser));

        // Fetch initial data
        fetchSettings();
        fetchQuestions();
        fetchLeaderboard();
        fetchHistoryRecords();
        fetchCertConfig();
    }, [competitionId]);

    const handleImport = async () => {
        const formData = new FormData();
        formData.append('competitionId', competitionId);
        if (importFile) {
            formData.append('file', importFile);
        } else if (importText) {
            formData.append('text', importText);
        } else {
            return;
        }

        setImportStatus('导入中...');
        try {
            const res = await fetchApi('/api/questions/import', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.count) {
                setImportStatus(`成功导入 ${data.count} 道题目`);
                setImportFile(null);
                setImportText('');
                fetchQuestions();
            } else {
                setImportStatus('导入失败');
            }
        } catch (e) {
            setImportStatus('导入出错');
        }
    };

    const handleDeleteRecord = async (id: number) => {
        openConfirm('确定删除该记录吗？', async () => {
            try {
                await fetchApi(`/api/leaderboard?id=${id}&competitionId=${competitionId}`, { method: 'DELETE' });
                fetchLeaderboard();
                showNotification('删除成功');
            } catch (e) {
                showNotification('删除失败', 'error');
            }
        });
    };

    const handleDeleteHistoryRecord = async (id: number) => {
        openConfirm('确定删除该历史记录吗？', async () => {
            try {
                await fetchApi(`/api/admin/records?id=${id}&competitionId=${competitionId}`, { method: 'DELETE' });
                fetchHistoryRecords();
                showNotification('删除成功');
            } catch (e) {
                showNotification('删除失败', 'error');
            }
        });
    };

    const handleBannerUpload = async () => {
        if (!bannerFile) return;
        const formData = new FormData();
        formData.append('file', bannerFile);
        formData.append('competitionId', competitionId);

        try {
            const res = await fetchApi('/api/settings/banner', {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                showNotification('Banner 上传成功');
                fetchSettings();
            } else {
                showNotification('上传失败', 'error');
            }
        } catch (e) {
            showNotification('上传出错', 'error');
        }
    };

    const handleRestoreBanner = async () => {
        openConfirm('确定要恢复默认 Banner 吗？', async () => {
            try {
                const res = await fetchApi(`/api/settings/banner?competitionId=${competitionId}`, {
                    method: 'DELETE',
                });
                if (res.ok) {
                    setBannerFile(null);
                    showNotification('已恢复默认 Banner');
                    fetchSettings();
                } else {
                    showNotification('操作失败', 'error');
                }
            } catch (e) {
                showNotification('操作失败', 'error');
            }
        });
    };

    const handleRestoreCertBg = () => {
        openConfirm('确定要恢复默认证书底板吗？', () => {
            setCertConfig(prev => ({ ...prev, backgroundImage: getAssetPath('/images/default_certificate_bg.jpg') }));
            showNotification('已恢复默认证书底板');
        });
    };

    const handleClearLeaderboard = async () => {
        openConfirm('确定要清空所有排行榜数据吗？此操作不可恢复！', async () => {
            try {
                await fetchApi(`/api/leaderboard?all=true&competitionId=${competitionId}`, { method: 'DELETE' });
                fetchLeaderboard();
                showNotification('排行榜已清空');
            } catch (e) {
                showNotification('操作失败', 'error');
            }
        });
    };

    const handleClearHistory = async () => {
        openConfirm('确定要清空所有答题记录吗？此操作不可恢复！', async () => {
            try {
                await fetchApi(`/api/admin/records?all=true&competitionId=${competitionId}`, { method: 'DELETE' });
                fetchHistoryRecords();
                showNotification('答题记录已清空');
            } catch (e) {
                showNotification('操作失败', 'error');
            }
        });
    };

    const handleCertUpload = async () => {
        if (!certFile) return;
        const formData = new FormData();
        formData.append('file', certFile);
        formData.append('competitionId', competitionId);

        try {
            const res = await fetchApi('/api/settings/certificate/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.url) {
                setCertConfig(prev => ({ ...prev, backgroundImage: data.url }));
                showNotification('证书模板上传成功');
            } else {
                showNotification('上传失败', 'error');
            }
        } catch (e) {
            showNotification('上传出错', 'error');
        }
    };

    const handleSaveCertConfig = async () => {
        try {
            const res = await fetchApi('/api/settings/certificate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...certConfig, competitionId })
            });
            if (res.ok) {
                showNotification('证书配置保存成功');
            } else {
                showNotification('保存失败', 'error');
            }
        } catch (e) {
            showNotification('保存出错', 'error');
        }
    };

    const handleAddQuestion = () => {
        setEditingId(null);
        setEditForm({
            type: 'single',
            content: '',
            options: { A: '', B: '', C: '', D: '' },
            answer: '',
            explanation: ''
        });
        setIsEditing(true);
    };

    const handleEditQuestion = (q: any) => {
        setEditingId(q.id);
        setEditForm({
            type: q.type,
            content: q.content,
            options: { ...q.options },
            answer: q.answer,
            explanation: q.explanation || ''
        });
        setIsEditing(true);
    };

    const handleSaveQuestion = async () => {
        if (!editForm.content || !editForm.answer) {
            showNotification('请填写完整题目信息', 'error');
            return;
        }

        try {
            const url = editingId ? `/api/questions/${editingId}` : '/api/questions';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetchApi(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...editForm, competitionId })
            });

            if (res.ok) {
                showNotification('保存成功');
                setIsEditing(false);
                fetchQuestions();
            } else {
                showNotification('保存失败', 'error');
            }
        } catch (e) {
            showNotification('保存出错', 'error');
        }
    };

    const handleClearQuestions = async () => {
        openConfirm('确定要清空所有题目吗？此操作不可恢复！', async () => {
            try {
                await fetchApi(`/api/questions?all=true&competitionId=${competitionId}`, { method: 'DELETE' });
                fetchQuestions();
                showNotification('题库已清空');
            } catch (e) {
                showNotification('清空失败', 'error');
            }
        });
    };

    const handleDeleteQuestion = async (id: number) => {
        openConfirm('确定删除该题目吗？', async () => {
            try {
                await fetchApi(`/api/questions/${id}?competitionId=${competitionId}`, { method: 'DELETE' });
                fetchQuestions();
                showNotification('删除成功');
            } catch (e) {
                showNotification('删除出错', 'error');
            }
        });
    };

    const handleDownloadQuestions = () => {
        if (questions.length === 0) {
            showNotification('暂无题目可下载', 'error');
            return;
        }

        const data = questions.map(q => ({
            '题目类型': q.type === 'single' ? '单选题' : '多选题',
            '题目': q.content,
            '答案': q.answer,
            '选项A': q.options.A || '',
            '选项B': q.options.B || '',
            '选项C': q.options.C || '',
            '选项D': q.options.D || '',
            '答案解析': q.explanation || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
        XLSX.writeFile(workbook, `questions_${competitionId}.xlsx`);
    };



    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm z-10 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-3">
                            <button
                                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                            <div className="bg-red-600 p-2 rounded-lg hidden sm:block">
                                <Database className="text-white" size={20} />
                            </div>
                            <h1 className="font-bold text-xl text-gray-800 tracking-tight">竞赛管理平台 - {pageSettings.title || '加载中...'}</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                                <Home size={18} />
                                <span className="hidden sm:inline">返回我的竞赛</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl p-6 space-y-2 animate-slide-in overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 px-2">
                            <span className="font-bold text-lg text-gray-800">功能菜单</span>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 hover:text-red-600">
                                <X size={24} />
                            </button>
                        </div>
                        <button
                            onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'settings' ? 'bg-red-50 text-red-600 shadow-sm font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <Settings size={20} /> 答题设置
                        </button>
                        <button
                            onClick={() => { setActiveTab('questions'); setIsMobileMenuOpen(false); }}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'questions' ? 'bg-red-50 text-red-600 shadow-sm font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <Database size={20} /> 题目管理
                        </button>
                        <button
                            onClick={() => { setActiveTab('ai'); setIsMobileMenuOpen(false); }}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'ai' ? 'bg-blue-50 text-blue-600 shadow-sm font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <FileText size={20} /> 智能出题
                        </button>
                        <button
                            onClick={() => { setActiveTab('img-gen'); setIsMobileMenuOpen(false); }}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'img-gen' ? 'bg-purple-50 text-purple-600 shadow-sm font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <ImageIcon size={20} /> 头图设置
                        </button>
                        <button
                            onClick={() => { setActiveTab('certificate'); setIsMobileMenuOpen(false); }}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'certificate' ? 'bg-red-50 text-red-600 shadow-sm font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <Award size={20} /> 证书设置
                        </button>
                        <button
                            onClick={() => { setActiveTab('history'); setIsMobileMenuOpen(false); }}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'history' ? 'bg-red-50 text-red-600 shadow-sm font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <History size={20} /> 答题记录
                        </button>
                        <button
                            onClick={() => { setActiveTab('leaderboard'); setIsMobileMenuOpen(false); }}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'leaderboard' ? 'bg-red-50 text-red-600 shadow-sm font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <Trophy size={20} /> 排行榜管理
                        </button>
                        <button
                            onClick={() => { setActiveTab('share'); setIsMobileMenuOpen(false); }}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'share' ? 'bg-blue-50 text-blue-600 shadow-sm font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <Share size={20} /> 竞赛分享
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden md:block w-64 bg-white border-r border-gray-100 overflow-y-auto">
                    <div className="p-6">
                        <div className="mb-6 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider">功能菜单</div>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all font-medium ${activeTab === 'settings' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <Settings size={20} /> 答题设置
                        </button>
                        <button
                            onClick={() => setActiveTab('questions')}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all font-medium ${activeTab === 'questions' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <Database size={20} /> 题目管理
                        </button>
                        <button
                            onClick={() => setActiveTab('ai')}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all font-medium ${activeTab === 'ai' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <FileText size={20} /> 智能出题
                        </button>
                        <button
                            onClick={() => setActiveTab('img-gen')}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all font-medium ${activeTab === 'img-gen' ? 'bg-purple-50 text-purple-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <ImageIcon size={20} /> 头图设置
                        </button>
                        <button
                            onClick={() => setActiveTab('certificate')}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all font-medium ${activeTab === 'certificate' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <Award size={20} /> 证书设置
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all font-medium ${activeTab === 'history' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <History size={20} /> 答题记录
                        </button>
                        <button
                            onClick={() => setActiveTab('leaderboard')}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all font-medium ${activeTab === 'leaderboard' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <Trophy size={20} /> 排行榜管理
                        </button>
                        <button
                            onClick={() => setActiveTab('share')}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all font-medium ${activeTab === 'share' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <Share size={20} /> 竞赛分享
                        </button>
                    </div>
                </aside>

                {/* Content */}
                <main className="flex-1 p-8 overflow-y-auto scrollbar-hide">
                    {activeTab === 'img-gen' && (
                        <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
                            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">头图设置</h2>
                                    <p className="text-sm text-gray-500">生成或上传竞赛 Banner</p>
                                </div>
                            </div>

                            {/* AI Generation Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <div className="bg-purple-50 p-2 rounded-lg">
                                        <ImageIcon size={20} className="text-purple-600" />
                                    </div>
                                    AI 智能生成 (生图模型)
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">生成提示词 (Prompt)</label>
                                        <textarea
                                            value={imgGenPrompt}
                                            onChange={e => setImgGenPrompt(e.target.value)}
                                            className="w-full p-4 border border-gray-200 rounded-xl h-32 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none bg-gray-50 focus:bg-white transition-all"
                                            placeholder={`默认提示词：生成一个完整的图片，中间文字标题是“${pageSettings.title}”，其它部分请随意设计元素，不要有文字或文字图案！`}
                                        />
                                        <p className="text-xs text-gray-500 mt-2">留空则使用默认提示词。建议使用英文提示词以获得更好效果。</p>
                                    </div>
                                    <button
                                        onClick={handleGenerateImage}
                                        disabled={generatingImg}
                                        className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${generatingImg ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl'}`}
                                    >
                                        {generatingImg ? (
                                            <>
                                                <Loader2 className="animate-spin" size={20} />
                                                正在生成中 (约需15-30秒)...
                                            </>
                                        ) : (
                                            <>
                                                <ImageIcon size={20} />
                                                开始生成
                                            </>
                                        )}
                                    </button>

                                    {generatedImgUrls.length > 0 && (
                                        <div className="space-y-4 animate-fade-in">
                                            <div className="flex justify-between items-center">
                                                <label className="block text-sm font-semibold text-gray-700">生成结果 (请选择一张)</label>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                {generatedImgUrls.map((url, index) => (
                                                    <div
                                                        key={index}
                                                        className={`relative group cursor-pointer rounded-xl overflow-hidden border-4 transition-all ${selectedImgUrl === url ? 'border-purple-600 shadow-xl scale-[1.02]' : 'border-transparent hover:border-gray-200'}`}
                                                        onClick={() => setSelectedImgUrl(url)}
                                                    >
                                                        <img
                                                            src={url}
                                                            alt={`Generated ${index + 1}`}
                                                            className="w-full h-auto object-cover aspect-video"
                                                        />
                                                        {selectedImgUrl === url && (
                                                            <div className="absolute top-2 right-2 bg-purple-600 text-white p-1 rounded-full shadow-lg">
                                                                <Check size={20} />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {selectedImgUrl && (
                                                <div className="flex justify-end pt-4 border-t border-gray-100">
                                                    <button
                                                        onClick={handleSaveGeneratedBanner}
                                                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center gap-2"
                                                    >
                                                        <Save size={18} />
                                                        设为竞赛 Banner
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Manual Upload Section */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col">
                                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-3 mb-6">
                                    <div className="bg-blue-50 p-2 rounded-lg">
                                        <Upload size={20} className="text-blue-600" />
                                    </div>
                                    手动上传 Banner
                                </h3>
                                <div className="flex-1 flex flex-col">
                                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all flex-1 flex flex-col items-center justify-center group cursor-pointer">
                                        {bannerFile ? (
                                            <div className="space-y-3">
                                                <div className="bg-green-100 p-3 rounded-full inline-block">
                                                    <ImageIcon size={32} className="text-green-600" />
                                                </div>
                                                <p className="text-green-700 font-bold">{bannerFile.name}</p>
                                                <p className="text-xs text-gray-500">点击更换图片</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 text-gray-400 group-hover:text-blue-500 transition-colors">
                                                <Upload size={40} className="mx-auto mb-2" />
                                                <p className="font-medium">点击上传或拖拽图片到此处</p>
                                                <p className="text-xs opacity-70">支持 JPG, PNG (建议尺寸 1920x1080)</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <button
                                        onClick={handleBannerUpload}
                                        disabled={!bannerFile}
                                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                    >
                                        <Save size={18} /> 上传并保存 Banner
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRestoreBanner}
                                        className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl shadow-sm hover:shadow transition-all mt-3 flex items-center justify-center gap-2"
                                    >
                                        <History size={18} /> 恢复默认 Banner
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ai' && (
                        <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
                            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">智能出题</h2>
                                    <p className="text-sm text-gray-500">上传文档或输入文本，AI 自动生成题目</p>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <AIGenerator onSaveSuccess={fetchQuestions} competitionId={competitionId} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'questions' && (
                        <div className="space-y-6 max-w-5xl mx-auto">
                            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">题目管理</h2>
                                    <p className="text-sm text-gray-500">共 {questions.length} 道题目</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push(`/${competitionId}/quizdetail`)}
                                        className="px-3 py-2 border border-blue-200 text-blue-600 rounded hover:bg-blue-50 flex items-center gap-1 transition-colors text-sm"
                                    >
                                        <BookOpen size={16} /> <span className="hidden sm:inline">查看题库</span><span className="sm:hidden">题库</span>
                                    </button>
                                    <button
                                        onClick={handleDownloadQuestions}
                                        className="px-3 py-2 border border-green-200 text-green-600 rounded hover:bg-green-50 flex items-center gap-1 transition-colors text-sm"
                                    >
                                        <Download size={16} /> <span className="hidden sm:inline">下载题目</span><span className="sm:hidden">下载</span>
                                    </button>
                                    <button
                                        onClick={handleClearQuestions}
                                        className="px-3 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50 flex items-center gap-1 transition-colors text-sm"
                                    >
                                        <Trash2 size={16} /> <span className="hidden sm:inline">清空题库</span><span className="sm:hidden">清空</span>
                                    </button>
                                    <button
                                        onClick={handleAddQuestion}
                                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded hover:shadow-lg flex items-center gap-1 transition-all text-sm"
                                    >
                                        <Plus size={16} /> <span className="hidden sm:inline">新增题目</span><span className="sm:hidden">新增</span>
                                    </button>
                                </div>
                            </div>

                            {/* Edit Modal / Form */}
                            {isEditing && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
                                        <div className="sticky top-0 bg-white z-10 px-8 py-5 border-b border-gray-100 flex justify-between items-center">
                                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                                {editingId ? <Edit size={20} className="text-blue-600" /> : <Plus size={20} className="text-green-600" />}
                                                {editingId ? '编辑题目' : '新增题目'}
                                            </h3>
                                            <button onClick={() => setIsEditing(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                                <X size={24} />
                                            </button>
                                        </div>
                                        <div className="p-8 space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">题目类型</label>
                                                    <select
                                                        value={editForm.type}
                                                        onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-gray-50 focus:bg-white transition-all"
                                                    >
                                                        <option value="single">单选题</option>
                                                        <option value="multiple">多选题</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2">正确答案</label>
                                                    <input
                                                        value={editForm.answer}
                                                        onChange={e => setEditForm({ ...editForm, answer: e.target.value })}
                                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-gray-50 focus:bg-white transition-all"
                                                        placeholder="如: A 或 AB"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">题目内容</label>
                                                <textarea
                                                    value={editForm.content}
                                                    onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                                                    className="w-full p-4 border border-gray-200 rounded-xl h-32 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none bg-gray-50 focus:bg-white transition-all"
                                                    placeholder="请输入题目描述..."
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="block text-sm font-bold text-gray-700">选项内容</label>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {['A', 'B', 'C', 'D'].map(opt => (
                                                        <div key={opt} className="flex items-center gap-3 group">
                                                            <span className="font-bold text-gray-400 w-8 text-center bg-gray-100 rounded py-1 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">{opt}</span>
                                                            <input
                                                                value={(editForm.options as any)[opt]}
                                                                onChange={e => setEditForm({
                                                                    ...editForm,
                                                                    options: { ...editForm.options, [opt]: e.target.value }
                                                                })}
                                                                className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-gray-50 focus:bg-white transition-all"
                                                                placeholder={`输入选项 ${opt} 的内容`}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">答案解析 <span className="text-gray-400 font-normal">(可选)</span></label>
                                                <textarea
                                                    value={editForm.explanation}
                                                    onChange={e => setEditForm({ ...editForm, explanation: e.target.value })}
                                                    className="w-full p-4 border border-gray-200 rounded-xl h-24 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none bg-gray-50 focus:bg-white transition-all"
                                                    placeholder="请输入答案解析，帮助用户理解..."
                                                />
                                            </div>
                                        </div>
                                        <div className="sticky bottom-0 bg-white px-8 py-5 border-t border-gray-100 flex justify-end gap-3">
                                            <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 font-medium transition-colors">取消</button>
                                            <button onClick={handleSaveQuestion} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center gap-2">
                                                <Save size={18} /> 保存题目
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Question List - Optimized UI */}
                            <div className="grid gap-4">
                                {questions.map((q, index) => (
                                    <div key={q.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                            <div className="flex-1 space-y-2 w-full">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${q.type === 'single' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                        {q.type === 'single' ? '单选' : '多选'}
                                                    </span>
                                                    <span className="text-xs text-gray-400">ID: {questions.length - index}</span>
                                                </div>
                                                <h3 className="font-medium text-gray-800 leading-relaxed break-words">
                                                    <LatexText text={q.content} />
                                                </h3>
                                                <div className="text-sm text-gray-500">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 mb-2">
                                                        {Object.entries(q.options).map(([key, val]) => (
                                                            <div key={key} className={`text-xs p-2 rounded border ${q.answer.includes(key) ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-gray-50 border-gray-100'}`}>
                                                                <span className="mr-1">{key}.</span>
                                                                <LatexText text={val as string} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="mt-2 space-y-1">
                                                        <div className="font-medium text-gray-700">正确答案: <span className="font-bold text-green-600">{q.answer}</span></div>
                                                        {q.explanation && (
                                                            <div className="text-gray-500 text-sm bg-gray-50 p-2 rounded whitespace-pre-wrap">
                                                                <span className="font-bold">解析:</span> <LatexText text={q.explanation} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 w-full md:w-auto justify-end md:justify-start mt-2 md:mt-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                <button onClick={() => handleEditQuestion(q)} className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1" title="编辑">
                                                    <Edit size={16} /> <span className="md:hidden">编辑</span>
                                                </button>
                                                <button onClick={() => handleDeleteQuestion(q.id)} className="px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1" title="删除">
                                                    <Trash2 size={16} /> <span className="md:hidden">删除</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {questions.length === 0 && (
                                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                                        <Database size={48} className="mx-auto mb-4 opacity-20" />
                                        <p>暂无题目，请点击右上角新增或导入</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <FileText size={20} className="text-red-500" /> 批量导入题目
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-medium text-sm text-gray-600">方式一：Excel 文件导入</h4>
                                            <a
                                                href={getAssetPath("/images/default_banner.jpg")}
                                                download
                                                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline"
                                            >
                                                <Download size={14} /> 下载模版
                                            </a>
                                        </div>
                                        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-300 transition-colors bg-gray-50">
                                            <input
                                                type="file"
                                                accept=".xlsx, .xls"
                                                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="pointer-events-none">
                                                {importFile ? (
                                                    <div className="text-green-600 font-medium flex items-center justify-center gap-2">
                                                        <FileText size={20} /> {importFile.name}
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-400">
                                                        <Upload size={24} className="mx-auto mb-2" />
                                                        <p className="text-sm">点击或拖拽 Excel 文件到此处</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="font-medium text-sm text-gray-600">方式二：文本粘贴导入</h4>
                                        <textarea
                                            value={importText}
                                            onChange={(e) => setImportText(e.target.value)}
                                            placeholder={`格式示例：\n1. 题目内容\nA. 选项A\nB. 选项B\n答案：A\n解析：...`}
                                            className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-red-500 outline-none resize-none"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end items-center gap-4">
                                    {importStatus && <span className="text-sm font-bold text-red-600 animate-pulse">{importStatus}</span>}
                                    <button
                                        onClick={handleImport}
                                        disabled={!importFile && !importText}
                                        className="btn-primary py-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                    >
                                        开始导入
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}


                    {activeTab === 'leaderboard' && (
                        <div className="space-y-6 max-w-5xl mx-auto">
                            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">排行榜管理</h2>
                                    <p className="text-sm text-gray-500">共 {records.length} 条记录</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleClearLeaderboard} className="px-3 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50 flex items-center gap-1 transition-colors text-sm">
                                        <Trash2 size={16} /> <span className="hidden sm:inline">清空榜单</span><span className="sm:hidden">清空</span>
                                    </button>
                                    <button onClick={fetchLeaderboard} className="px-3 py-2 border border-gray-200 text-gray-600 rounded hover:bg-gray-50 flex items-center gap-1 transition-colors text-sm">
                                        <Trophy size={16} /> <span className="hidden sm:inline">刷新数据</span><span className="sm:hidden">刷新</span>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-700 uppercase border-b border-gray-100 hidden md:table-header-group">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold">排名</th>
                                                <th className="px-6 py-4 font-semibold">姓名</th>
                                                <th className="px-6 py-4 font-semibold">分数</th>
                                                <th className="px-6 py-4 font-semibold">用时</th>
                                                <th className="px-6 py-4 font-semibold">提交时间</th>
                                                <th className="px-6 py-4 font-semibold text-right">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 block md:table-row-group">
                                            {records.map((record, index) => (
                                                <tr key={record.id} className="block md:table-row hover:bg-gray-50 transition-colors border-b md:border-none p-3 md:p-0">
                                                    {/* Mobile Layout: Compact Row */}
                                                    <td className="md:hidden block w-full">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-3">
                                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${index < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                    {index + 1}
                                                                </span>
                                                                <span className="font-medium text-gray-900">{record.userName}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm text-gray-500">{record.timeTaken}秒</span>
                                                                <span className="font-bold text-red-600">{record.score} 分</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs text-gray-400 pl-9">
                                                            <span>{new Date(record.createdAt).toLocaleString()}</span>
                                                            <button
                                                                onClick={() => handleDeleteRecord(record.id)}
                                                                className="text-red-400 hover:text-red-600 p-1"
                                                            >
                                                                删除
                                                            </button>
                                                        </div>
                                                    </td>

                                                    {/* Desktop Layout: Table Cells */}
                                                    <td className="hidden md:table-cell px-6 py-4">
                                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                                            {index + 1}
                                                        </span>
                                                    </td>
                                                    <td className="hidden md:table-cell px-6 py-4 font-medium text-gray-900">{record.userName}</td>
                                                    <td className="hidden md:table-cell px-6 py-4 font-bold text-red-600">{record.score}</td>
                                                    <td className="hidden md:table-cell px-6 py-4 text-gray-500">{record.timeTaken} 秒</td>
                                                    <td className="hidden md:table-cell px-6 py-4 text-gray-500">{new Date(record.createdAt).toLocaleString()}</td>
                                                    <td className="hidden md:table-cell px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleDeleteRecord(record.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="删除记录"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {records.length === 0 && (
                                                <tr className="block md:table-row">
                                                    <td colSpan={5} className="block md:table-cell px-6 py-12 text-center text-gray-400">
                                                        <Trophy size={48} className="mx-auto mb-4 opacity-20" />
                                                        <p>暂无考试记录</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">答题设置</h2>
                                    <p className="text-sm text-gray-500">自定义竞赛应用的标题、副标题及倒计时设置</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Title & Subtitle Settings */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-3 mb-6">
                                        <div className="bg-blue-50 p-2 rounded-lg">
                                            <FileText size={20} className="text-blue-600" />
                                        </div>
                                        标题设置
                                    </h3>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">竞赛主标题</label>
                                            <input
                                                value={pageSettings.title}
                                                onChange={e => setPageSettings({ ...pageSettings, title: e.target.value })}
                                                className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                placeholder="默认为：知识竞赛"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">竞赛副标题</label>
                                            <input
                                                value={pageSettings.subtitle}
                                                onChange={e => setPageSettings({ ...pageSettings, subtitle: e.target.value })}
                                                className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                placeholder="默认为：承办机构"
                                            />
                                        </div>
                                        <button
                                            onClick={handleSaveSettings}
                                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-4"
                                        >
                                            <Save size={18} /> 保存标题设置
                                        </button>
                                        <button
                                            onClick={handleResetTitleSettings}
                                            className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl shadow-sm hover:shadow transition-all mt-2 flex items-center justify-center gap-2"
                                        >
                                            <History size={18} /> 恢复默认标题
                                        </button>
                                    </div>
                                </div>

                                {/* Basic Quiz Settings (Question Counts) */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-3 mb-6">
                                        <div className="bg-green-50 p-2 rounded-lg">
                                            <Settings size={20} className="text-green-600" />
                                        </div>
                                        答题基础设置
                                    </h3>
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">单选题数量</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={pageSettings.single_choice_count}
                                                    onChange={e => setPageSettings({ ...pageSettings, single_choice_count: e.target.value })}
                                                    className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                    placeholder="默认为 10"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">多选题数量</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={pageSettings.multiple_choice_count}
                                                    onChange={e => setPageSettings({ ...pageSettings, multiple_choice_count: e.target.value })}
                                                    className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                    placeholder="默认为 0"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">是否允许返回上一题</label>
                                                <select
                                                    value={pageSettings.allow_back_tracking}
                                                    onChange={e => setPageSettings({ ...pageSettings, allow_back_tracking: e.target.value })}
                                                    className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                >
                                                    <option value="true">允许</option>
                                                    <option value="false">不允许</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">是否题目选项随机</label>
                                                <select
                                                    value={pageSettings.random_options}
                                                    onChange={e => setPageSettings({ ...pageSettings, random_options: e.target.value })}
                                                    className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                >
                                                    <option value="true">随机</option>
                                                    <option value="false">不随机</option>
                                                </select>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            注：当题库题目总数小于设定数量时，每题分数为 100/题目总数；<br />
                                            当题库题目总数大于设定数量时，每题分数为 100/设定总数。
                                        </p>
                                        <button
                                            onClick={handleSaveSettings}
                                            className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-4"
                                        >
                                            <Save size={18} /> 保存基础设置
                                        </button>
                                        <button
                                            onClick={handleResetQuizSettings}
                                            className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl shadow-sm hover:shadow transition-all mt-2 flex items-center justify-center gap-2"
                                        >
                                            <History size={18} /> 恢复默认设置
                                        </button>
                                    </div>
                                </div>

                                {/* Quiz Settings */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-3 mb-6">
                                        <div className="bg-orange-50 p-2 rounded-lg">
                                            <Clock size={20} className="text-orange-600" />
                                        </div>
                                        倒计时设置
                                    </h3>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">每题倒计时（秒）</label>
                                            <input
                                                type="number"
                                                value={pageSettings.question_timer}
                                                onChange={e => setPageSettings({ ...pageSettings, question_timer: e.target.value })}
                                                className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                placeholder="默认为 20 秒"
                                            />
                                            <p className="text-xs text-gray-500 mt-2">设置为 0 表示不限制时间</p>
                                        </div>
                                        <button
                                            onClick={handleSaveSettings}
                                            className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-4"
                                        >
                                            <Save size={18} /> 保存倒计时设置
                                        </button>
                                        <button
                                            onClick={handleResetQuizSettings}
                                            className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl shadow-sm hover:shadow transition-all mt-2 flex items-center justify-center gap-2"
                                        >
                                            <History size={18} /> 恢复默认设置
                                        </button>
                                    </div>
                                </div>






                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-6 max-w-5xl mx-auto">
                            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">答题记录管理</h2>
                                    <p className="text-sm text-gray-500">共 {historyRecords.length} 条历史记录</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleClearHistory} className="px-3 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50 flex items-center gap-1 transition-colors text-sm">
                                        <Trash2 size={16} /> <span className="hidden sm:inline">清空记录</span><span className="sm:hidden">清空</span>
                                    </button>
                                    <button onClick={fetchHistoryRecords} className="px-3 py-2 border border-gray-200 text-gray-600 rounded hover:bg-gray-50 flex items-center gap-1 transition-colors text-sm">
                                        <History size={16} /> <span className="hidden sm:inline">刷新数据</span><span className="sm:hidden">刷新</span>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-700 uppercase border-b border-gray-100 hidden md:table-header-group">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold">ID</th>
                                                <th className="px-6 py-4 font-semibold">姓名</th>
                                                <th className="px-6 py-4 font-semibold">分数</th>
                                                <th className="px-6 py-4 font-semibold">用时</th>
                                                <th className="px-6 py-4 font-semibold">提交时间</th>
                                                <th className="px-6 py-4 font-semibold text-right">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 block md:table-row-group">
                                            {historyRecords.map((record) => (
                                                <tr key={record.id} className="block md:table-row hover:bg-gray-50 transition-colors border-b md:border-none p-3 md:p-0">
                                                    {/* Mobile Layout: Compact Row */}
                                                    <td className="md:hidden block w-full">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-400">#{record.id}</span>
                                                                <span className="font-medium text-gray-900">{record.userName}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm text-gray-500">{record.timeTaken}秒</span>
                                                                <span className="font-bold text-red-600">{record.score}分</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                                            <span>{new Date(record.createdAt).toLocaleString()}</span>
                                                            <button
                                                                onClick={() => handleDeleteHistoryRecord(record.id)}
                                                                className="text-red-400 hover:text-red-600 p-1"
                                                            >
                                                                删除
                                                            </button>
                                                        </div>
                                                    </td>

                                                    {/* Desktop Layout: Table Cells */}
                                                    <td className="hidden md:table-cell px-6 py-4 text-gray-500">#{record.id}</td>
                                                    <td className="hidden md:table-cell px-6 py-4 font-medium text-gray-900">{record.userName}</td>
                                                    <td className="hidden md:table-cell px-6 py-4 font-bold text-red-600">{record.score}</td>
                                                    <td className="hidden md:table-cell px-6 py-4 text-gray-500">{record.timeTaken} 秒</td>
                                                    <td className="hidden md:table-cell px-6 py-4 text-gray-500">{new Date(record.createdAt).toLocaleString()}</td>
                                                    <td className="hidden md:table-cell px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleDeleteHistoryRecord(record.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="删除记录"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {historyRecords.length === 0 && (
                                                <tr className="block md:table-row">
                                                    <td colSpan={6} className="block md:table-cell px-6 py-12 text-center text-gray-400">
                                                        <History size={48} className="mx-auto mb-4 opacity-20" />
                                                        <p>暂无答题记录</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'share' && (
                        <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
                            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">竞赛分享</h2>
                                    <p className="text-sm text-gray-500">生成竞赛分享海报，下载并分享给用户</p>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex justify-center">
                                <ShareCardCanvas
                                    title={pageSettings.title || '知识竞赛'}
                                    subtitle={pageSettings.subtitle || '承办机构'}
                                    bannerUrl={bannerFile ? URL.createObjectURL(bannerFile) : (pageSettings.banner || getAssetPath('/images/default_banner.jpg'))}
                                    quizUrl={`${window.location.origin}/quiz/${competitionId}`}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'certificate' && (
                        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">证书设置</h2>
                                    <p className="text-sm text-gray-500">配置荣誉证书的样式、内容和模板</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column: Settings */}
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-gray-800 mb-4">基本信息</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">活动名称</label>
                                                <input
                                                    value={certConfig.activityName}
                                                    onChange={e => setCertConfig({ ...certConfig, activityName: e.target.value })}
                                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">签发单位</label>
                                                <input
                                                    value={certConfig.issuer}
                                                    onChange={e => setCertConfig({ ...certConfig, issuer: e.target.value })}
                                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                />
                                            </div>
                                            <button
                                                onClick={handleResetCertBasicInfo}
                                                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
                                            >
                                                <History size={16} /> 恢复默认信息
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-gray-800 mb-4">模板图片</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="relative flex-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-red-400 transition-colors cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div className="text-sm text-gray-500">
                                                    {certFile ? certFile.name : '点击上传证书背景图 (800x600)'}
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleCertUpload}
                                                disabled={!certFile}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                            >
                                                上传
                                            </button>
                                            <button
                                                onClick={handleRestoreCertBg}
                                                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                                            >
                                                恢复默认
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-gray-800 mb-4">样式微调</h3>
                                        <div className="space-y-8">
                                            {/* Main Text Settings */}
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                    <span className="w-1 h-4 bg-red-600 rounded-full"></span>
                                                    主文字 (姓名/分数)
                                                </h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs text-gray-500 mb-1 block">字号 (px)</label>
                                                        <input
                                                            type="number"
                                                            value={certConfig.layout.mainText.fontSize}
                                                            onChange={e => setCertConfig({
                                                                ...certConfig,
                                                                layout: { ...certConfig.layout, mainText: { ...certConfig.layout.mainText, fontSize: Number(e.target.value) } }
                                                            })}
                                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 mb-1 block">宽度 (px)</label>
                                                        <input
                                                            type="number"
                                                            value={certConfig.layout.mainText.width}
                                                            onChange={e => setCertConfig({
                                                                ...certConfig,
                                                                layout: { ...certConfig.layout, mainText: { ...certConfig.layout.mainText, width: Number(e.target.value) } }
                                                            })}
                                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 mb-1 block">行高</label>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={certConfig.layout.mainText.lineHeight}
                                                            onChange={e => setCertConfig({
                                                                ...certConfig,
                                                                layout: { ...certConfig.layout, mainText: { ...certConfig.layout.mainText, lineHeight: Number(e.target.value) } }
                                                            })}
                                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 mb-1 block">颜色</label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="color"
                                                                value={certConfig.layout.mainText.color}
                                                                onChange={e => setCertConfig({
                                                                    ...certConfig,
                                                                    layout: { ...certConfig.layout, mainText: { ...certConfig.layout.mainText, color: e.target.value } }
                                                                })}
                                                                className="h-10 w-14 p-1 border border-gray-300 rounded cursor-pointer"
                                                            />
                                                            <span className="text-xs text-gray-400 font-mono">{certConfig.layout.mainText.color}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 mb-1 block">对齐方式</label>
                                                        <select
                                                            value={certConfig.layout.mainText.textAlign || 'center'}
                                                            onChange={e => setCertConfig({
                                                                ...certConfig,
                                                                layout: { ...certConfig.layout, mainText: { ...certConfig.layout.mainText, textAlign: e.target.value } }
                                                            })}
                                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white"
                                                        >
                                                            <option value="left">左对齐</option>
                                                            <option value="center">居中</option>
                                                            <option value="right">右对齐</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-2 pt-2 border-t border-gray-200 mt-2">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={certConfig.layout.mainText.bold}
                                                                onChange={e => setCertConfig({
                                                                    ...certConfig,
                                                                    layout: { ...certConfig.layout, mainText: { ...certConfig.layout.mainText, bold: e.target.checked } }
                                                                })}
                                                                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                                                            />
                                                            <span className="text-sm text-gray-700 font-medium">加粗显示</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Issuer Info Settings */}
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                    <span className="w-1 h-4 bg-red-600 rounded-full"></span>
                                                    签发信息
                                                </h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs text-gray-500 mb-1 block">字号 (px)</label>
                                                        <input
                                                            type="number"
                                                            value={certConfig.layout.issuerInfo.fontSize}
                                                            onChange={e => setCertConfig({
                                                                ...certConfig,
                                                                layout: { ...certConfig.layout, issuerInfo: { ...certConfig.layout.issuerInfo, fontSize: Number(e.target.value) } }
                                                            })}
                                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 mb-1 block">宽度 (px)</label>
                                                        <input
                                                            type="number"
                                                            value={certConfig.layout.issuerInfo.width}
                                                            onChange={e => setCertConfig({
                                                                ...certConfig,
                                                                layout: { ...certConfig.layout, issuerInfo: { ...certConfig.layout.issuerInfo, width: Number(e.target.value) } }
                                                            })}
                                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 mb-1 block">行高</label>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={certConfig.layout.issuerInfo.lineHeight || 1.5}
                                                            onChange={e => setCertConfig({
                                                                ...certConfig,
                                                                layout: { ...certConfig.layout, issuerInfo: { ...certConfig.layout.issuerInfo, lineHeight: Number(e.target.value) } }
                                                            })}
                                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 mb-1 block">颜色</label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="color"
                                                                value={certConfig.layout.issuerInfo.color}
                                                                onChange={e => setCertConfig({
                                                                    ...certConfig,
                                                                    layout: { ...certConfig.layout, issuerInfo: { ...certConfig.layout.issuerInfo, color: e.target.value } }
                                                                })}
                                                                className="h-10 w-14 p-1 border border-gray-300 rounded cursor-pointer"
                                                            />
                                                            <span className="text-xs text-gray-400 font-mono">{certConfig.layout.issuerInfo.color}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 mb-1 block">对齐方式</label>
                                                        <select
                                                            value={certConfig.layout.issuerInfo.textAlign || 'center'}
                                                            onChange={e => setCertConfig({
                                                                ...certConfig,
                                                                layout: { ...certConfig.layout, issuerInfo: { ...certConfig.layout.issuerInfo, textAlign: e.target.value } }
                                                            })}
                                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white"
                                                        >
                                                            <option value="left">左对齐</option>
                                                            <option value="center">居中</option>
                                                            <option value="right">右对齐</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-2 pt-2 border-t border-gray-200 mt-2">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={certConfig.layout.issuerInfo.bold}
                                                                onChange={e => setCertConfig({
                                                                    ...certConfig,
                                                                    layout: { ...certConfig.layout, issuerInfo: { ...certConfig.layout.issuerInfo, bold: e.target.checked } }
                                                                })}
                                                                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                                                            />
                                                            <span className="text-sm text-gray-700 font-medium">加粗显示</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSaveCertConfig}
                                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition-all"
                                    >
                                        保存所有配置
                                    </button>
                                </div>

                                {/* Right Column: Preview */}
                                <div className="space-y-4">
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                                        <h3 className="font-bold text-gray-800 mb-4 w-full">实时预览 (可拖拽文字调整位置)</h3>
                                        <div className="border border-gray-200 shadow-lg overflow-hidden rounded bg-gray-50">
                                            <CertificateCanvas
                                                config={certConfig}
                                                mode="preview"
                                                onConfigChange={setCertConfig}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2 text-center">
                                            提示：在预览图中按住鼠标拖拽文字块可调整位置
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
                {/* Notification Toast */}
                {notification && (
                    <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-medium animate-slide-in-right ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {notification.message}
                    </div>
                )}

                {/* Confirmation Modal */}
                {confirmState.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-scale-in">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">确认操作</h3>
                            <p className="text-gray-600 mb-6">{confirmState.message}</p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={closeConfirm}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={() => {
                                        confirmState.onConfirm();
                                        closeConfirm();
                                    }}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    确定
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div >
        </div >
    );
}
