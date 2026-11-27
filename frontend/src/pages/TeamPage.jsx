import { useEffect, useState } from 'react';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { UserPlus, Shield } from 'lucide-react';

export default function TeamPage() {
  const { activeOrgId, currentRole } = useAuthStore();
  const [org, setOrg] = useState(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('DEVELOPER');

  const fetchOrg = async () => {
    if (!activeOrgId) return;
    try {
      const { data } = await api.get('/orgs/current');
      setOrg(data.organization);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrg();
  }, [activeOrgId]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/orgs/members', { email, role });
      setOrg(data);
      setEmail('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member');
    }
  };

  if (!org) return <div className="text-slate-400">Loading workspace members...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{org.name} — Team & RBAC</h1>
        <p className="text-sm text-slate-400">
          Manage tenant-scoped access control roles for members in this organization.
        </p>
      </div>

      {currentRole === 'ADMIN' && (
        <form
          onSubmit={handleAddMember}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row gap-3 items-end"
        >
          <div className="flex-1 w-full">
            <label className="block text-xs text-slate-400 mb-1">Registered User Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@tenantflow.com"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
            />
          </div>
          <div className="w-full sm:w-44">
            <label className="block text-xs text-slate-400 mb-1">Tenant Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="DEVELOPER">DEVELOPER</option>
              <option value="VIEWER">VIEWER</option>
            </select>
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Add Member
          </button>
        </form>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-5 py-3.5">Member</th>
              <th className="px-5 py-3.5">Email</th>
              <th className="px-5 py-3.5">Assigned Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {org.members.map((m) => (
              <tr key={m.user._id}>
                <td className="px-5 py-4 font-medium">{m.user.name}</td>
                <td className="px-5 py-4 text-slate-400">{m.user.email}</td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-indigo-500/15 text-indigo-400">
                    <Shield className="w-3 h-3" /> {m.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
