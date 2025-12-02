'use client';

import { useState, useEffect } from 'react';
import { Trash2, Shield, User, Key, Loader2, X, AlertTriangle, Check, Clock, Settings } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function UserManagement({ currentUser }: { currentUser: any }) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalType, setModalType] = useState<'delete' | 'role' | 'password' | null>(null);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Settings State
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [defaultRole, setDefaultRole] = useState<string>('pending');

    // Role Selection State
    const [selectedRole, setSelectedRole] = useState<string>('user');

    // Form States
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetPassword, setResetPassword] = useState('');

    useEffect(() => {
        fetchUsers();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetchApi('/api/settings');
            const data = await res.json();
            if (data.default_user_role) {
                setDefaultRole(data.default_user_role);
            }
        } catch (error) {
            console.error('Failed to fetch settings', error);
        }
    };

    const handleSaveSettings = async () => {
        try {
            const res = await fetchApi('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ default_user_role: defaultRole })
            });
            if (res.ok) {
                alert('设置已保存');
                setShowSettingsModal(false);
            } else {
                alert('保存失败');
            }
        } catch (error) {
            alert('保存出错');
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetchApi('/api/admin/users');
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    const openActionModal = (type: 'delete' | 'role' | 'password', user: any) => {
        if (user.username === 'admin' && (type === 'delete' || type === 'role')) {
            alert('无法对超级管理员执行此操作');
            return;
        }
        setSelectedUser(user);
        setModalType(type);
        if (type === 'password') setResetPassword('');
        if (type === 'role') setSelectedRole(user.role || 'user');
    };

    const closeModals = () => {
        setModalType(null);
        setSelectedUser(null);
        setShowAddModal(false);
        setShowSettingsModal(false);
        setNewUsername('');
        setNewPassword('');
        setResetPassword('');
    };

    const handleDelete = async () => {
        if (!selectedUser) return;
        try {
            const res = await fetchApi(`/api/admin/users?id=${selectedUser.id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchUsers();
                closeModals();
            } else {
                const data = await res.json();
                alert(data.error || '删除失败');
            }
        } catch (error) {
            alert('删除出错');
        }
    };

    const handleResetPassword = async () => {
        if (!selectedUser || !resetPassword) return;
        try {
            const res = await fetchApi('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedUser.id, password: resetPassword })
            });
            if (res.ok) {
                alert('密码重置成功');
                closeModals();
            } else {
                alert('重置失败');
            }
        } catch (error) {
            alert('操作出错');
        }
    };

    const handleUpdateRole = async () => {
        if (!selectedUser) return;
        try {
            const res = await fetchApi('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedUser.id, role: selectedRole })
            });
            if (res.ok) {
                fetchUsers();
                closeModals();
            } else {
                alert('操作失败');
            }
        } catch (error) {
            alert('操作出错');
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetchApi('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newUsername, password: newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                closeModals();
                fetchUsers();
                alert('用户添加成功');
            } else {
                alert(data.error || '添加失败');
            }
        } catch (error) {
            alert('添加出错');
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">管理员</span>;
            case 'pending':
                return <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">待确认</span>;
            default:
                return <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">普通用户</span>;
        }
    };

    const formatUserId = (id: string | number) => {
        const strId = String(id);
        if (strId.length > 8) {
            return '#' + strId.substring(0, 6) + '...';
        }
        return '#' + strId;
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">用户管理</h2>
                    <p className="text-sm text-gray-500">管理系统用户及权限</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm shadow-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
                    >
                        <Settings size={16} /> <span className="hidden sm:inline">设置</span>
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary flex items-center gap-2 px-4 py-2 text-sm shadow-md"
                    >
                        <User size={16} /> <span className="hidden sm:inline">添加用户</span><span className="sm:hidden">添加</span>
                    </button>
                </div>
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-sm">ID</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-sm">用户名</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-sm whitespace-nowrap">角色</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-sm">注册时间</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-sm text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-gray-500 text-sm" title={String(user.id)}>{formatUserId(user.id)}</td>
                                <td className="px-4 py-3 font-medium text-gray-900 text-sm flex items-center gap-2">
                                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                        <User size={14} />
                                    </div>
                                    {user.username}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {getRoleBadge(user.role)}
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-xs">
                                    {new Date(user.created_at).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right space-x-2">
                                    <button
                                        onClick={() => openActionModal('role', user)}
                                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                                        title="切换角色"
                                    >
                                        <Shield size={16} />
                                    </button>
                                    <button
                                        onClick={() => openActionModal('password', user)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                        title="重置密码"
                                    >
                                        <Key size={16} />
                                    </button>
                                    <button
                                        onClick={() => openActionModal('delete', user)}
                                        className={`p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors ${user.username === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title="删除用户"
                                        disabled={user.username === 'admin'}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden grid gap-4">
                {users.map((user) => (
                    <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{user.username}</h3>
                                    <div className="mt-1">{getRoleBadge(user.role)}</div>
                                </div>
                            </div>
                            <span className="text-xs text-gray-400" title={String(user.id)}>{formatUserId(user.id)}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <span>注册于:</span>
                            {new Date(user.created_at).toLocaleString()}
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50">
                            <button
                                onClick={() => openActionModal('role', user)}
                                className="flex flex-col items-center justify-center p-2 rounded-lg bg-purple-50 text-purple-600 active:bg-purple-100"
                            >
                                <Shield size={18} className="mb-1" />
                                <span className="text-xs">角色</span>
                            </button>
                            <button
                                onClick={() => openActionModal('password', user)}
                                className="flex flex-col items-center justify-center p-2 rounded-lg bg-blue-50 text-blue-600 active:bg-blue-100"
                            >
                                <Key size={18} className="mb-1" />
                                <span className="text-xs">密码</span>
                            </button>
                            <button
                                onClick={() => openActionModal('delete', user)}
                                disabled={user.username === 'admin'}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg bg-red-50 text-red-600 active:bg-red-100 ${user.username === 'admin' ? 'opacity-50' : ''}`}
                            >
                                <Trash2 size={18} className="mb-1" />
                                <span className="text-xs">删除</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">全局设置</h3>
                            <button onClick={closeModals} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <h4 className="font-bold text-gray-800 mb-2">新用户默认角色</h4>
                                <p className="text-xs text-gray-500 mb-4">设置新注册用户获得的初始权限。</p>
                                <div className="space-y-3">
                                    <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${defaultRole === 'user' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                                        <input
                                            type="radio"
                                            name="defaultRole"
                                            value="user"
                                            checked={defaultRole === 'user'}
                                            onChange={() => setDefaultRole('user')}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <div className="ml-3">
                                            <span className="block font-bold text-gray-800 text-sm">普通用户</span>
                                            <span className="block text-xs text-gray-500">注册后可直接使用</span>
                                        </div>
                                    </label>

                                    <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${defaultRole === 'pending' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-100 hover:border-gray-200'}`}>
                                        <input
                                            type="radio"
                                            name="defaultRole"
                                            value="pending"
                                            checked={defaultRole === 'pending'}
                                            onChange={() => setDefaultRole('pending')}
                                            className="w-4 h-4 text-yellow-600"
                                        />
                                        <div className="ml-3">
                                            <span className="block font-bold text-gray-800 text-sm">待确认</span>
                                            <span className="block text-xs text-gray-500">需管理员审核后才可使用</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveSettings}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                            >
                                保存设置
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">添加新用户</h3>
                            <button onClick={closeModals} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddUser} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
                                <input
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="请输入用户名"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="请输入密码"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={closeModals} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold">取消</button>
                                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold">添加</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {modalType === 'delete' && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">确认删除用户?</h3>
                            <p className="text-gray-500">
                                您确定要删除用户 <span className="font-bold text-gray-800">{selectedUser.username}</span> 吗？<br />
                                此操作无法撤销。
                            </p>
                        </div>
                        <div className="flex border-t border-gray-100">
                            <button onClick={closeModals} className="flex-1 py-4 text-gray-600 hover:bg-gray-50 font-medium border-r border-gray-100">取消</button>
                            <button onClick={handleDelete} className="flex-1 py-4 text-red-600 hover:bg-red-50 font-bold">确认删除</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Role Selection Modal */}
            {modalType === 'role' && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">更改用户角色</h3>
                            <button onClick={closeModals} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <p className="text-sm text-gray-500">
                                请选择用户 <span className="font-bold text-gray-800">{selectedUser.username}</span> 的新角色：
                            </p>

                            <div className="space-y-3">
                                <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedRole === 'user' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="user"
                                        checked={selectedRole === 'user'}
                                        onChange={() => setSelectedRole('user')}
                                        className="w-5 h-5 text-blue-600"
                                    />
                                    <div className="ml-3">
                                        <span className="block font-bold text-gray-800">普通用户</span>
                                        <span className="block text-xs text-gray-500">可以访问我的竞赛和参与答题</span>
                                    </div>
                                </label>

                                <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedRole === 'admin' ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:border-gray-200'}`}>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="admin"
                                        checked={selectedRole === 'admin'}
                                        onChange={() => setSelectedRole('admin')}
                                        className="w-5 h-5 text-purple-600"
                                    />
                                    <div className="ml-3">
                                        <span className="block font-bold text-gray-800">管理员</span>
                                        <span className="block text-xs text-gray-500">拥有所有权限，包括用户管理</span>
                                    </div>
                                </label>

                                <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedRole === 'pending' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-100 hover:border-gray-200'}`}>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="pending"
                                        checked={selectedRole === 'pending'}
                                        onChange={() => setSelectedRole('pending')}
                                        className="w-5 h-5 text-yellow-600"
                                    />
                                    <div className="ml-3">
                                        <span className="block font-bold text-gray-800">待确认</span>
                                        <span className="block text-xs text-gray-500">无法访问任何功能，需等待审核</span>
                                    </div>
                                </label>
                            </div>

                            <button
                                onClick={handleUpdateRole}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                            >
                                保存更改
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {modalType === 'password' && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">重置密码</h3>
                            <button onClick={closeModals} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-500">
                                正在为用户 <span className="font-bold text-gray-800">{selectedUser.username}</span> 重置密码。
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">新密码</label>
                                <input
                                    type="text"
                                    value={resetPassword}
                                    onChange={(e) => setResetPassword(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="请输入新密码"
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={handleResetPassword}
                                disabled={!resetPassword}
                                className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${resetPassword ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
                            >
                                确认重置
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
