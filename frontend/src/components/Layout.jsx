import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import api from '../api/axios';
import {
  Layers,
  LayoutDashboard,
  Users,
  ShieldCheck,
  LogOut,
  Plus,
  Building2,
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, organizations, activeOrgId, currentRole, switchOrganization, fetchProfile, logout } =
    useAuthStore();
  const [showNewOrg, setShowNewOrg] = useState(false);
  const [orgName, setOrgName] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    try {
      const { data } = await api.post('/orgs', { name: orgName });
      localStorage.setItem('activeOrgId', data._id);
      setOrgName('');
      setShowNewOrg(false);
      await fetchProfile();
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create workspace');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Projects & Analytics', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Team & RBAC', path: '/team', icon: Users },
    ...(currentRole === 'ADMIN' || currentRole === 'MANAGER'
      ? [{ label: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4">
        <div>
          <div className="flex items-center gap-2.5 px-2 mb-6">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">TenantFlow</span>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 mb-1.5">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> WORKSPACE (TENANT)
              </span>
              <button
                onClick={() => setShowNewOrg(!showNewOrg)}
                title="Create New Organization"
                className="text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <select
              value={activeOrgId || ''}
              onChange={(e) => switchOrganization(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500"
            >
              {organizations.length === 0 && <option value="">No Workspace</option>}
              {organizations.map((org) => (
                <option key={org._id} value={org._id}>
                  {org.name} ({org.plan})
                </option>
              ))}
            </select>

            {currentRole && (
              <div className="mt-2 px-1">
                <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  Role: {currentRole}
                </span>
              </div>
            )}

            {showNewOrg && (
              <form onSubmit={handleCreateOrg} className="mt-2 p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                <input
                  type="text"
                  placeholder="New Org Name..."
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs mb-2 focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-medium cursor-pointer"
                >
                  Create Tenant
                </button>
              </form>
            )}
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    active
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between px-2">
          <div className="truncate">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
