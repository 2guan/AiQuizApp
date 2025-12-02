'use client';

import { useState, useEffect } from 'react';
import { Save, FileText, Loader2, Image as ImageIcon } from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface AISettingsProps {
    currentUser: any;
}

export default function AISettings({ currentUser }: AISettingsProps) {
    const [settings, setSettings] = useState({
        ai_api_key: '',
        ai_base_url: '',
        ai_model: 'gpt-3.5-turbo',
        img_gen_api_key: '',
        img_gen_base_url: '',
        img_gen_model: 'jimeng-4.0'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testingImgGen, setTestingImgGen] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const [showConfirmModal, setShowConfirmModal] = useState<{ show: boolean; type: 'ai' | 'img' | null }>({ show: false, type: null });

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetchApi(`/api/user/ai-settings?userId=${currentUser.id}`);
            const data = await res.json();
            if (res.ok) {
                setSettings(data);
            }
        } catch (error) {
            console.error('Failed to fetch AI settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetchApi('/api/user/ai-settings', {
                method: 'POST',
                body: JSON.stringify({
                    userId: currentUser.id,
                    ...settings
                })
            });
            if (res.ok) {
                showToast('设置保存成功', 'success');
            } else {
                showToast('保存失败', 'error');
            }
        } catch (error) {
            console.error('Save failed', error);
            showToast('保存出错', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUseDefaultSettings = async () => {
        if (!showConfirmModal.type) return;

        try {
            // Fetch admin user settings
            const res = await fetchApi('/api/settings/admin-ai');
            const data = await res.json();

            if (res.ok) {
                if (showConfirmModal.type === 'ai') {
                    setSettings(prev => ({
                        ...prev,
                        ai_api_key: data.ai_api_key || '',
                        ai_base_url: data.ai_base_url || '',
                        ai_model: data.ai_model || 'gpt-3.5-turbo'
                    }));
                    showToast('已应用系统默认大模型参数', 'success');
                } else if (showConfirmModal.type === 'img') {
                    setSettings(prev => ({
                        ...prev,
                        img_gen_api_key: data.img_gen_api_key || '',
                        img_gen_base_url: data.img_gen_base_url || '',
                        img_gen_model: data.img_gen_model || 'jimeng-4.0'
                    }));
                    showToast('已应用系统默认生图模型参数', 'success');
                }
            } else {
                showToast('获取默认配置失败', 'error');
            }
        } catch (error) {
            console.error('Failed to fetch default settings', error);
            showToast('获取默认配置出错', 'error');
        } finally {
            setShowConfirmModal({ show: false, type: null });
        }
    };

    const handleTestImgGenConnection = async () => {
        if (!settings.img_gen_api_key) {
            showToast('请先填写 API Key / Session ID', 'error');
            return;
        }
        setTestingImgGen(true);
        try {
            // We'll use a simple generation request to test
            const res = await fetchApi('/api/ai/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey: settings.img_gen_api_key,
                    baseUrl: settings.img_gen_base_url,
                    model: settings.img_gen_model,
                    prompt: 'Test connection',
                    test: true // Flag to indicate a test run (maybe just check auth)
                })
            });
            const data = await res.json();
            if (res.ok) {
                showToast('测试成功！API Key 有效', 'success');
            } else {
                showToast(`测试失败：${data.error}`, 'error');
            }
        } catch (e: any) {
            showToast(`测试出错：${e.message}`, 'error');
        } finally {
            setTestingImgGen(false);
        }
    };

    const handleTestConnection = async () => {
        if (!settings.ai_api_key) {
            showToast('请先填写 API Key', 'error');
            return;
        }
        setTesting(true);
        try {
            const res = await fetchApi('/api/ai/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey: settings.ai_api_key,
                    baseUrl: settings.ai_base_url,
                    model: settings.ai_model
                })
            });
            const data = await res.json();
            if (res.ok) {
                showToast(`测试成功！${data.message}`, 'success');
            } else {
                showToast(`测试失败：${data.error}`, 'error');
            }
        } catch (e: any) {
            showToast(`测试出错：${e.message}`, 'error');
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in relative">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg transform transition-all duration-300 animate-slide-in flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                    ) : (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                    <span className="font-medium">{toast.message}</span>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all scale-100 animate-scale-in">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">确认使用默认模型？</h3>
                        <p className="text-gray-600 mb-6">
                            是否要使用系统默认模型？系统默认模型有使用限制，多人使用时响应较慢。
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirmModal({ show: false, type: null })}
                                className="px-5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleUseDefaultSettings}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                            >
                                确认使用
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">大模型设置</h2>
                    <p className="text-sm text-gray-500">配置全局 AI 模型参数，用于所有竞赛的智能出题功能、头图生成功能</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-3">
                        <div className="bg-green-50 p-2 rounded-lg">
                            <FileText size={20} className="text-green-600" />
                        </div>
                        文字大模型参数
                    </h3>
                    <button
                        onClick={() => setShowConfirmModal({ show: true, type: 'ai' })}
                        className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                    >
                        使用默认模型
                    </button>
                </div>
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">API Key</label>
                        <input
                            type="password"
                            value={settings.ai_api_key}
                            onChange={e => setSettings({ ...settings, ai_api_key: e.target.value })}
                            className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-gray-50 focus:bg-white"
                            placeholder="sk-..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Base URL (可选)</label>
                        <input
                            value={settings.ai_base_url}
                            onChange={e => setSettings({ ...settings, ai_base_url: e.target.value })}
                            className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-gray-50 focus:bg-white"
                            placeholder="例如: https://api.openai.com/v1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">模型名称</label>
                        <input
                            value={settings.ai_model}
                            onChange={e => setSettings({ ...settings, ai_model: e.target.value })}
                            className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-gray-50 focus:bg-white"
                            placeholder="例如: gpt-3.5-turbo"
                        />
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={handleTestConnection}
                            disabled={testing}
                            className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {testing ? <Loader2 className="animate-spin" size={18} /> : <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                            测试连接
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            保存设置
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-3">
                        <div className="bg-purple-50 p-2 rounded-lg">
                            <ImageIcon size={20} className="text-purple-600" />
                        </div>
                        图片大模型参数
                    </h3>
                    <button
                        onClick={() => setShowConfirmModal({ show: true, type: 'img' })}
                        className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                    >
                        使用默认模型
                    </button>
                </div>
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">API Key / Session ID</label>
                        <input
                            type="password"
                            value={settings.img_gen_api_key}
                            onChange={e => setSettings({ ...settings, img_gen_api_key: e.target.value })}
                            className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-gray-50 focus:bg-white"
                            placeholder="输入您的 Session ID"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            用于生成竞赛 Banner 图片。请填入有效的 Session ID。
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Base URL (可选)</label>
                        <input
                            value={settings.img_gen_base_url}
                            onChange={e => setSettings({ ...settings, img_gen_base_url: e.target.value })}
                            className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-gray-50 focus:bg-white"
                            placeholder="例如: http://3.guantools.top:3007/v1/images/generations"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">模型名称</label>
                        <input
                            value={settings.img_gen_model}
                            onChange={e => setSettings({ ...settings, img_gen_model: e.target.value })}
                            className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-gray-50 focus:bg-white"
                            placeholder="例如: jimeng-4.0"
                        />
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={handleTestImgGenConnection}
                            disabled={testingImgGen}
                            className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {testingImgGen ? <Loader2 className="animate-spin" size={18} /> : <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                            测试生图连接
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            保存设置
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
