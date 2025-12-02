'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LogOut, Trophy, Calendar, ArrowRight, Loader2, Image as ImageIcon, Trash2, User, Menu, X, LayoutGrid, FileText, Upload, Clock } from 'lucide-react';
import { fetchApi, getAssetPath } from '@/lib/api';
import UserManagement from './components/UserManagement';
import CompetitionManagement from './components/CompetitionManagement';
import AISettings from './components/AISettings';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'competitions' | 'users' | 'all_competitions' | 'ai_settings'>('competitions');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Create Form State
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/');
            return;
        }
        try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            fetchCompetitions(userData.id);
        } catch (e) {
            console.error('Failed to parse user data', e);
            localStorage.removeItem('user');
            router.push('/');
        }
    }, []);

    const fetchCompetitions = async (userId: string) => {
        try {
            const res = await fetchApi(`/api/competitions?userId=${userId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setCompetitions(data);
            }
        } catch (error) {
            console.error('Failed to fetch competitions', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/');
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setCreating(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('subtitle', subtitle);
        formData.append('userId', user.id);
        if (bannerFile) {
            formData.append('banner', bannerFile);
        }

        try {
            const res = await fetchApi('/api/competitions', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                setShowCreateModal(false);
                setTitle('');
                setSubtitle('');
                setBannerFile(null);
                fetchCompetitions(user.id);
            } else {
                alert('创建失败');
            }
        } catch (error) {
            console.error('Create failed', error);
            alert('创建出错');
        } finally {
            setCreating(false);
        }
    };

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

    const handleDelete = async (id: string) => {
        openConfirm('确定要删除这个竞赛吗？此操作不可恢复，将删除所有相关题目和记录！', async () => {
            try {
                const res = await fetchApi(`/api/competitions?id=${id}`, {
                    method: 'DELETE'
                });
                const data = await res.json();
                if (data.success) {
                    fetchCompetitions(user.id);
                } else {
                    alert('删除失败');
                }
            } catch (error) {
                console.error('Delete failed', error);
                alert('删除出错');
            }
        });
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (user.role === 'pending') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock size={40} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">账号待审核</h1>
                        <p className="text-gray-500">
                            您的账号 <span className="font-bold text-gray-800">{user.username}</span> 正在等待管理员审核。
                        </p>
                        <p className="text-gray-500 mt-2 text-sm">
                            审核通过后，您将获得访问权限。请耐心等待或联系管理员。
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} /> 退出登录
                    </button>
                </div>
            </div>
        );
    }

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
                            <div className="bg-blue-600 p-2 rounded-lg text-white hidden sm:block">
                                <Trophy size={20} />
                            </div>
                            <h1 className="font-bold text-xl text-gray-800 tracking-tight">竞赛管理平台</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">
                                    {user.username[0].toUpperCase()}
                                </div>
                                <div className="hidden sm:block text-sm">
                                    <p className="font-bold text-gray-800">{user.username}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="退出登录"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl p-6 space-y-2 animate-slide-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 px-2">
                            <span className="font-bold text-lg text-gray-800">功能菜单</span>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 hover:text-red-600">
                                <X size={24} />
                            </button>
                        </div>
                        <button
                            onClick={() => { setActiveTab('competitions'); setIsMobileMenuOpen(false); }}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'competitions' ? 'bg-blue-50 text-blue-600 shadow-sm font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <Trophy size={20} /> 我的竞赛
                        </button>
                        <button
                            onClick={() => { setActiveTab('ai_settings'); setIsMobileMenuOpen(false); }}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'ai_settings' ? 'bg-blue-50 text-blue-600 shadow-sm font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <FileText size={20} /> 大模型设置
                        </button>
                        {user.role === 'admin' && (
                            <>
                                <button
                                    onClick={() => { setActiveTab('all_competitions'); setIsMobileMenuOpen(false); }}
                                    className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'all_competitions' ? 'bg-blue-50 text-blue-600 shadow-sm font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                                >
                                    <LayoutGrid size={20} /> 竞赛管理
                                </button>
                                <button
                                    onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
                                    className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'users' ? 'bg-blue-50 text-blue-600 shadow-sm font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                                >
                                    <User size={20} /> 用户管理
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full">
                {/* Sidebar (Desktop) */}
                <aside className="w-64 bg-white border-r border-gray-100 p-6 space-y-2 flex-shrink-0 hidden md:block">
                    <div className="mb-6 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider">功能菜单</div>
                    <button
                        onClick={() => setActiveTab('competitions')}
                        className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all font-medium ${activeTab === 'competitions' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                        <Trophy size={20} /> 我的竞赛
                    </button>
                    <button
                        onClick={() => setActiveTab('ai_settings')}
                        className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all font-medium ${activeTab === 'ai_settings' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                        <FileText size={20} /> 大模型设置
                    </button>
                    {user.role === 'admin' && (
                        <>
                            <button
                                onClick={() => setActiveTab('all_competitions')}
                                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all font-medium ${activeTab === 'all_competitions' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                            >
                                <LayoutGrid size={20} /> 竞赛管理
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all font-medium ${activeTab === 'users' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                            >
                                <User size={20} /> 用户管理
                            </button>
                        </>
                    )}
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 sm:p-8 overflow-y-auto scrollbar-hide">
                    {activeTab === 'competitions' ? (
                        <div className="max-w-6xl mx-auto">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold text-gray-800">我的竞赛</h2>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="btn-primary flex items-center gap-2 px-6 py-3"
                                >
                                    <Plus size={20} /> <span className="hidden sm:inline">创建新竞赛</span>
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center py-12 text-gray-500">加载中...</div>
                            ) : competitions.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                    <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">暂无竞赛</h3>
                                    <p className="text-gray-500 mb-6">创建一个新的竞赛开始吧</p>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                                    >
                                        立即创建
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {competitions.map((comp) => (
                                        <div key={comp.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                                            <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
                                                <img
                                                    src={comp.banner ? getAssetPath(comp.banner) : getAssetPath('/images/default_banner.jpg')}
                                                    alt={comp.title}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    onError={(e) => {
                                                        e.currentTarget.src = getAssetPath('/images/default_banner.jpg');
                                                    }}
                                                />
                                            </div>

                                            {/* Content */}
                                            <div className="p-5 flex-1 flex flex-col">
                                                <div className="mb-4 flex-1">
                                                    <h3 className="text-lg font-bold text-gray-800 line-clamp-2 mb-1" title={comp.title}>{comp.title}</h3>
                                                    {comp.subtitle && (
                                                        <p className="text-sm text-gray-500 line-clamp-1" title={comp.subtitle}>{comp.subtitle}</p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                                                    <Calendar size={14} />
                                                    <span>创建于 {new Date(comp.created_at).toLocaleDateString()}</span>
                                                </div>

                                                <div className="flex gap-2 mt-auto">
                                                    <button
                                                        onClick={() => router.push(`/${comp.id}/admin`)}
                                                        className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                                                    >
                                                        后台管理
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(`/${comp.id}`)}
                                                        className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 text-sm"
                                                    >
                                                        开始答题 <ArrowRight size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(comp.id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="删除竞赛"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div >
                    ) : activeTab === 'all_competitions' ? (
                        <CompetitionManagement currentUser={user} />
                    ) : activeTab === 'ai_settings' ? (
                        <AISettings currentUser={user} />
                    ) : (
                        <UserManagement currentUser={user} />
                    )}
                </main >
            </div >

            {/* Create Modal */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-xl font-bold text-gray-800">创建新竞赛</h3>
                            </div>
                            <form onSubmit={handleCreate} className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">竞赛名称</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="例如：2025年度知识竞赛"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">副标题 (可选)</label>
                                    <input
                                        type="text"
                                        value={subtitle}
                                        onChange={(e) => setSubtitle(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="例如：XXX机构"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Banner 图片 (可选)</label>
                                    <div className="flex flex-col gap-3">
                                        <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center group cursor-pointer">
                                            {bannerFile ? (
                                                <div className="space-y-3 w-full">
                                                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
                                                        <img
                                                            src={URL.createObjectURL(bannerFile)}
                                                            alt="Banner Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setBannerFile(null);
                                                            }}
                                                            className="absolute top-2 right-2 p-1 bg-white/80 rounded-full text-red-500 hover:bg-white transition-colors"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                    <p className="text-sm text-green-600 font-medium flex items-center justify-center gap-1">
                                                        <ImageIcon size={14} /> {bannerFile.name}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2 text-gray-400 group-hover:text-blue-500 transition-colors">
                                                    <Upload size={32} className="mx-auto mb-1" />
                                                    <p className="font-medium text-sm">点击上传或拖拽图片到此处</p>
                                                    <p className="text-xs opacity-70">支持 JPG, PNG (建议尺寸 1920x1080)</p>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) setBannerFile(file);
                                                }}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {creating ? <Loader2 className="animate-spin" /> : '立即创建'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Confirmation Modal */}
            {
                confirmState.isOpen && (
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
                )
            }
        </div >
    );
}
