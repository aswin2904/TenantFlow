import { useEffect, useState } from 'react';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { ShieldCheck } from 'lucide-react';

export default function AuditLogsPage() {
  const { activeOrgId } = useAuthStore();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!activeOrgId) return;
    api
      .get('/orgs/audit-logs')
      .then((res) => setLogs(res.data))
      .catch((err) => console.error(err));
  }, [activeOrgId]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-indigo-400" /> Tenant Audit Logs
        </h1>
        <p className="text-sm text-slate-400">
          Immutable security trail of actions performed inside this organization.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-5 py-3.5">Timestamp</th>
              <th className="px-5 py-3.5">Actor</th>
              <th className="px-5 py-3.5">Action</th>
              <th className="px-5 py-3.5">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                  No audit events recorded yet. Move a task or create a project to generate logs.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log._id}>
                <td className="px-5 py-3.5 text-xs text-slate-400">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-5 py-3.5 font-medium">{log.actor?.name}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                    {log.action}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-400">
                  {JSON.stringify(log.metadata)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
