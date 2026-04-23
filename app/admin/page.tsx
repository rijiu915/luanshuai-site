// app/admin/page.tsx - 管理员用户管理后台
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, Users, Search, LogOut, ChevronLeft, ChevronRight,
  Edit3, X, Save, RefreshCw, Eye,
} from 'lucide-react';

interface User {
  id: number;
  email: string;
  name: string | null;
  balance: number;
  vipLevel: string;
  vipExpiry: string | null;
  createdAt: string;
  _count: { pointsHistory: number; generationTasks: number };
}

interface PointsRecord {
  id: number;
  userId: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

interface TaskRecord {
  id: number;
  taskId: string;
  cost: number;
  status: string;
  model: string;
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userRecords, setUserRecords] = useState<{ points: PointsRecord[]; tasks: TaskRecord[] } | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [editVipLevel, setEditVipLevel] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      showToast('error', '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, search, router]);

  useEffect(() => {
    // 检查管理员登录状态
    fetch('/api/admin/auth-check').then(res => {
      if (!res.ok || res.status === 401) {
        router.push('/admin/login');
      }
    });
  }, [router]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const handleViewRecords = async (user: User) => {
    setSelectedUser(user);
    setLoadingRecords(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/points`);
      const data = await res.json();
      setUserRecords(data);
    } catch {
      showToast('error', '获取记录失败');
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditBalance(user.balance.toString());
    setEditVipLevel(user.vipLevel);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    const balance = parseInt(editBalance);
    if (isNaN(balance) || balance < 0) {
      showToast('error', '余额必须为非负整数');
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          balance,
          vipLevel: editVipLevel,
        }),
      });

      if (res.ok) {
        showToast('success', '用户信息已更新');
        setEditingUser(null);
        fetchUsers();
      } else {
        const data = await res.json();
        showToast('error', data.error || '更新失败');
      }
    } catch {
      showToast('error', '更新失败');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getVipBadge = (level: string) => {
    const styles: Record<string, string> = {
      FREE: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      VIP: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      SVIP: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return styles[level] || styles.FREE;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部栏 */}
      <header className="bg-card-bg border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl font-bold text-foreground">管理后台</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition"
        >
          <LogOut size={16} />
          退出登录
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-card-bg border border-border rounded-lg p-4">
            <p className="text-sm text-gray-500">总用户数</p>
            <p className="text-2xl font-bold text-foreground mt-1">{total}</p>
          </div>
          <div className="bg-card-bg border border-border rounded-lg p-4">
            <p className="text-sm text-gray-500">VIP 用户</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
              {users.filter(u => u.vipLevel !== 'FREE').length}
            </p>
          </div>
          <div className="bg-card-bg border border-border rounded-lg p-4">
            <p className="text-sm text-gray-500">当前页用户</p>
            <p className="text-2xl font-bold text-foreground mt-1">{users.length}</p>
          </div>
        </div>

        {/* 搜索栏 */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜索邮箱或姓名..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-input-bg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            搜索
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
              className="px-4 py-2 border border-border rounded-lg text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              清除
            </button>
          )}
          <button
            type="button"
            onClick={fetchUsers}
            className="p-2 border border-border rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="刷新"
          >
            <RefreshCw size={18} />
          </button>
        </form>

        {/* 用户表格 */}
        <div className="bg-card-bg border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-medium">ID</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-medium">邮箱</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-medium">姓名</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-medium">余额</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-medium">VIP</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-medium">注册时间</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      <RefreshCw className="inline-block animate-spin mr-2" size={16} />
                      加载中...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      <Users className="inline-block mr-2 mb-1" size={24} />
                      <br />
                      暂无用户数据
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                      <td className="px-4 py-3 text-gray-500">{user.id}</td>
                      <td className="px-4 py-3 text-foreground font-medium">{user.email}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {user.name || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-foreground">{user.balance}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVipBadge(user.vipLevel)}`}>
                          {user.vipLevel}
                        </span>
                        {user.vipExpiry && user.vipLevel !== 'FREE' && (
                          <span className="ml-2 text-xs text-gray-400">
                            {new Date(user.vipExpiry).toLocaleDateString('zh-CN')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewRecords(user)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 transition"
                            title="查看记录"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-1.5 text-gray-400 hover:text-green-600 transition"
                            title="编辑用户"
                          >
                            <Edit3 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-gray-500">
                共 {total} 条，第 {page}/{totalPages} 页
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 border border-border rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-foreground">{page}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 border border-border rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 查看记录弹窗 */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-card-bg rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                用户记录 - {selectedUser.email}
              </h2>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[65vh] p-6 space-y-6">
              {loadingRecords ? (
                <div className="text-center py-8 text-gray-500">
                  <RefreshCw className="inline-block animate-spin" size={20} />
                  <p className="mt-2">加载中...</p>
                </div>
              ) : (
                <>
                  {/* 积分记录 */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                      积分变动 ({userRecords?.points.length || 0} 条)
                    </h3>
                    {userRecords?.points.length === 0 ? (
                      <p className="text-gray-400 text-sm">暂无记录</p>
                    ) : (
                      <div className="space-y-2">
                        {userRecords?.points.map(p => (
                          <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded text-sm">
                            <div>
                              <span className="text-foreground">{p.description}</span>
                              <span className="text-gray-400 ml-2 text-xs">{formatDate(p.createdAt)}</span>
                            </div>
                            <span className={p.amount > 0 ? 'text-green-600' : 'text-red-500'}>
                              {p.amount > 0 ? '+' : ''}{p.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 生成任务 */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                      生成任务 ({userRecords?.tasks.length || 0} 条)
                    </h3>
                    {userRecords?.tasks.length === 0 ? (
                      <p className="text-gray-400 text-sm">暂无记录</p>
                    ) : (
                      <div className="space-y-2">
                        {userRecords?.tasks.map(t => (
                          <div key={t.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded text-sm">
                            <div>
                              <span className="text-foreground">{t.model}</span>
                              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                                t.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                t.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                              }`}>
                                {t.status}
                              </span>
                              <span className="text-gray-400 ml-2 text-xs">{formatDate(t.createdAt)}</span>
                            </div>
                            <span className="text-gray-500">-{t.cost}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 编辑用户弹窗 */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingUser(null)}>
          <div className="bg-card-bg rounded-xl shadow-xl w-full max-w-sm p-6 space-y-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">编辑用户</h2>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-gray-500">邮箱: <span className="text-foreground">{editingUser.email}</span></p>
              <p className="text-gray-500">姓名: <span className="text-foreground">{editingUser.name || '-'}</span></p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">余额（积分）</label>
                <input
                  type="number"
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input-bg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">VIP 等级</label>
                <select
                  value={editVipLevel}
                  onChange={(e) => setEditVipLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input-bg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FREE">FREE - 免费用户</option>
                  <option value="VIP">VIP - 月会员</option>
                  <option value="SVIP">SVIP - 高级会员</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2 border border-border rounded-md text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Save size={16} />
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 通知 */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-white text-sm z-50 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
