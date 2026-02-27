import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Target, 
  Briefcase, 
  FileText, 
  Megaphone, 
  Trash2, 
  Settings, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Bell,
  User,
  MessageSquare,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type Module = 'leads' | 'customers' | 'opportunities' | 'contracts' | 'activities' | 'recycle' | 'dashboard';

interface UserData {
  id: number;
  username: string;
  role_name: string;
  role_level: number;
  permissions: any;
  department: string;
}

// --- Components ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
              <XCircle size={24} />
            </button>
          </div>
          <div className="p-8 overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const Navbar = ({ user }: { user: UserData | null }) => (
  <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">N</div>
      <h1 className="text-xl font-bold text-slate-900 tracking-tight">Nexus CRM 系统</h1>
    </div>
    <div className="flex items-center gap-6">
      <div className="relative">
        <Bell size={20} className="text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">3</span>
      </div>
      <div className="h-8 w-[1px] bg-slate-200" />
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-slate-900">{user?.username || '加载中...'}</p>
          <p className="text-xs text-slate-500">{user?.role_name || '...'}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 overflow-hidden">
          <User size={24} />
        </div>
      </div>
    </div>
  </header>
);

const StatCard = ({ label, value, trend, icon: Icon, color }: { label: string, value: string, trend: string, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} text-white`}>
        <Icon size={24} />
      </div>
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        {trend}
      </span>
    </div>
    <p className="text-slate-500 text-sm font-medium">{label}</p>
    <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
  </div>
);

const ModuleHeader = ({ title, onAdd }: { title: string, onAdd?: () => void }) => (
  <div className="flex items-center justify-between mb-8">
    <div>
      <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h2>
      <p className="text-slate-500 mt-1">高效管理和追踪您的{title}数据。</p>
    </div>
    {onAdd && (
      <button 
        onClick={onAdd}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-100"
      >
        <Plus size={20} />
        新增记录
      </button>
    )}
  </div>
);

// --- Main App ---

export default function App() {
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [user, setUser] = useState<UserData | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then(setUser);
  }, []);

  useEffect(() => {
    if (activeModule !== 'dashboard') {
      fetchData();
    }
  }, [activeModule]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const isRecycle = activeModule === 'recycle';
      const moduleToFetch = isRecycle ? 'leads' : activeModule; // Simplified for demo
      const res = await fetch(`/api/${moduleToFetch}?q=${searchQuery}&is_deleted=${isRecycle ? 1 : 0}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `/api/${activeModule}/${editingItem.id}` : `/api/${activeModule}`;
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, owner_id: user?.id })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({});
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('您确定要删除这条记录吗？')) return;
    try {
      await fetch(`/api/${activeModule}/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await fetch(`/api/leads/${id}/restore`, { method: 'POST' }); // Simplified for demo
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const renderForm = () => {
    const fields: Record<string, { name: string, label: string, type: string, options?: string[] }[]> = {
      leads: [
        { name: 'name', label: '线索名称', type: 'text' },
        { name: 'contact_person', label: '联系人', type: 'text' },
        { name: 'phone', label: '电话', type: 'text' },
        { name: 'source', label: '线索来源', type: 'select', options: ['官网', '表单', '推荐', '其他'] },
        { name: 'level', label: '线索等级', type: 'select', options: ['A', 'B', 'C', 'D'] },
      ],
      customers: [
        { name: 'name', label: '客户名称', type: 'text' },
        { name: 'type', label: '客户类型', type: 'select', options: ['个人', '企业'] },
        { name: 'industry', label: '行业类型', type: 'text' },
        { name: 'contact_person', label: '联系人', type: 'text' },
        { name: 'level', label: '客户等级', type: 'select', options: ['VIP', '普通', '潜在'] },
      ],
      opportunities: [
        { name: 'name', label: '商机名称', type: 'text' },
        { name: 'amount', label: '预计金额', type: 'number' },
        { name: 'stage', label: '商机阶段', type: 'select', options: ['初步沟通', '需求确认', '方案报价', '谈判签约', '赢单', '输单'] },
        { name: 'probability', label: '赢率 (%)', type: 'number' },
        { name: 'expected_date', label: '预计成交日期', type: 'date' },
      ],
      contracts: [
        { name: 'contract_no', label: '合同编号', type: 'text' },
        { name: 'name', label: '合同名称', type: 'text' },
        { name: 'amount', label: '合同金额', type: 'number' },
        { name: 'sign_date', label: '签订日期', type: 'date' },
        { name: 'expiry_date', label: '到期日期', type: 'date' },
      ],
      activities: [
        { name: 'name', label: '活动名称', type: 'text' },
        { name: 'type', label: '活动类型', type: 'select', options: ['线上', '线下'] },
        { name: 'channel', label: '活动渠道', type: 'select', options: ['微信', '抖音', '官网', '其他'] },
        { name: 'budget', label: '活动预算', type: 'number' },
      ]
    };

    const currentFields = fields[activeModule as keyof typeof fields] || [];

    return (
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {currentFields.map(field => (
            <div key={field.name} className="space-y-2">
              <label className="text-sm font-bold text-slate-700">{field.label}</label>
              {field.type === 'select' ? (
                <select
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  value={formData[field.name] || ''}
                  onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                  required
                >
                  <option value="">请选择...</option>
                  {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  type={field.type}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  value={formData[field.name] || ''}
                  onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                  required
                />
              )}
            </div>
          ))}
        </div>
        <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
          <button 
            type="button" 
            onClick={() => setIsModalOpen(false)}
            className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
          >
            取消
          </button>
          <button 
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            {editingItem ? '更新' : '创建'}
          </button>
        </div>
      </form>
    );
  };

  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <ModuleHeader title="仪表盘" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="线索总数" value="1,284" trend="+12.5%" icon={Target} color="bg-blue-500" />
              <StatCard label="活跃客户" value="452" trend="+3.2%" icon={Users} color="bg-emerald-500" />
              <StatCard label="进行中商机" value="$2.4M" trend="+18.7%" icon={Briefcase} color="bg-amber-500" />
              <StatCard label="已签合同" value="128" trend="-2.4%" icon={FileText} color="bg-indigo-500" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Clock size={20} className="text-indigo-500" />
                  最近动态
                </h3>
                <div className="space-y-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <History size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">与 TechCorp 进行跟进电话</p>
                        <p className="text-xs text-slate-500 mt-1">2 小时前 • 操作人: John Doe</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <ArrowRightLeft size={20} className="text-emerald-500" />
                  商机漏斗
                </h3>
                <div className="space-y-4">
                  {['初步沟通', '需求确认', '方案报价', '谈判签约', '赢单'].map((stage, idx) => (
                    <div key={stage} className="space-y-2">
                      <div className="flex justify-between text-xs font-medium text-slate-500">
                        <span>{stage}</span>
                        <span>{Math.floor(Math.random() * 20) + 5} 个项目</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${100 - (idx * 15)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'leads':
      case 'customers':
      case 'opportunities':
      case 'contracts':
      case 'activities':
        const moduleTitles: Record<string, string> = {
          leads: '线索管理',
          customers: '客户管理',
          opportunities: '商机管理',
          contracts: '合同管理',
          activities: '市场活动'
        };
        return (
          <div className="space-y-6">
            <ModuleHeader title={moduleTitles[activeModule]} onAdd={openAddModal} />
            
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="搜索..."
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                    />
                  </div>
                  <button className="p-2 text-slate-500 hover:bg-white hover:text-indigo-600 rounded-lg border border-transparent hover:border-slate-200 transition-all">
                    <Filter size={20} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">显示范围:</span>
                  <select className="text-xs font-medium bg-transparent border-none focus:ring-0 cursor-pointer text-slate-700">
                    <option>我的数据</option>
                    <option>本部门</option>
                    <option>全公司</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">名称</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">状态</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">负责人</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">创建时间</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-medium">正在加载数据...</span>
                          </div>
                        </td>
                      </tr>
                    ) : data.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <Search size={40} className="opacity-20" />
                            <span className="text-sm font-medium">暂无记录</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      data.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                {item.name?.charAt(0) || 'N'}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{item.name}</p>
                                <p className="text-xs text-slate-500">{item.contact_person || item.contract_no || '暂无详情'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.status === '已转化' || item.status === '赢单' || item.status === '已审批'
                                ? 'bg-emerald-50 text-emerald-700'
                                : item.status === '已丢弃' || item.status === '输单' || item.status === '已终止'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">管理员</td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => openEditModal(item)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              >
                                <Settings size={18} />
                              </button>
                              <button 
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">共 {data.length} 条记录</p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-900 disabled:opacity-50" disabled>上一页</button>
                  <div className="flex items-center gap-1">
                    <button className="w-8 h-8 rounded-lg bg-indigo-600 text-white text-xs font-bold">1</button>
                  </div>
                  <button className="px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-900 disabled:opacity-50" disabled>下一页</button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'recycle':
        return (
          <div className="space-y-6">
            <ModuleHeader title="回收站" />
            
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">名称</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">删除时间</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                          <Trash2 size={40} className="mx-auto opacity-20 mb-2" />
                          <span className="text-sm font-medium">回收站为空</span>
                        </td>
                      </tr>
                    ) : (
                      data.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs">
                                {item.name?.charAt(0) || 'N'}
                              </div>
                              <p className="text-sm font-bold text-slate-900">{item.name}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {new Date(item.deleted_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleRestore(item.id)}
                              className="px-4 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all"
                            >
                              恢复
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Navbar user={user} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-200 bg-white p-6 flex flex-col gap-8 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto z-20">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">主菜单</p>
            <SidebarItem icon={LayoutDashboard} label="仪表盘" active={activeModule === 'dashboard'} onClick={() => setActiveModule('dashboard')} />
            <SidebarItem icon={Target} label="线索管理" active={activeModule === 'leads'} onClick={() => setActiveModule('leads')} />
            <SidebarItem icon={Users} label="客户管理" active={activeModule === 'customers'} onClick={() => setActiveModule('customers')} />
            <SidebarItem icon={Briefcase} label="商机管理" active={activeModule === 'opportunities'} onClick={() => setActiveModule('opportunities')} />
            <SidebarItem icon={FileText} label="合同管理" active={activeModule === 'contracts'} onClick={() => setActiveModule('contracts')} />
            <SidebarItem icon={Megaphone} label="市场活动" active={activeModule === 'activities'} onClick={() => setActiveModule('activities')} />
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">系统设置</p>
            <SidebarItem icon={Trash2} label="回收站" active={activeModule === 'recycle'} onClick={() => setActiveModule('recycle')} />
            <SidebarItem icon={Settings} label="设置" active={false} onClick={() => {}} />
          </div>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-all font-medium">
              <LogOut size={20} />
              退出登录
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? `编辑${activeModule === 'leads' ? '线索' : activeModule === 'customers' ? '客户' : activeModule === 'opportunities' ? '商机' : activeModule === 'contracts' ? '合同' : '活动'}` : `新增${activeModule === 'leads' ? '线索' : activeModule === 'customers' ? '客户' : activeModule === 'opportunities' ? '商机' : activeModule === 'contracts' ? '合同' : '活动'}`}
      >
        {renderForm()}
      </Modal>
    </div>
  );
}
