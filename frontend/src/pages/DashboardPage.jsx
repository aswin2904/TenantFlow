import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { FolderKanban, Plus, BarChart3, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { activeOrgId, currentRole } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [analytics, setAnalytics] = useState({ byStatus: [], byPriority: [] });
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');

  const loadDashboardData = async () => {
    if (!activeOrgId) return;
    try {
      const [projRes, statsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/projects/analytics'),
      ]);
      setProjects(projRes.data);
      setAnalytics(statsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeOrgId]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', { name, key, description });
      setName('');
      setKey('');
      setDescription('');
      setShowModal(false);
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating project');
    }
  };

  const getStatusCount = (status) =>
    analytics.byStatus.find((s) => s._id === status)?.count || 0;

  if (!activeOrgId) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold mb-2">No Workspace Selected</h2>
        <p className="text-slate-400 text-sm">
          Click the <strong>+</strong> button next to WORKSPACE in the left sidebar to create your first organization.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workspace Overview</h1>
          <p className="text-sm text-slate-400">
            Real-time sprint metrics and isolated projects for your active organization.
          </p>
        </div>

        {(currentRole === 'ADMIN' || currentRole === 'MANAGER') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          <BarChart3 className="w-4 h-4 text-indigo-400" /> Tenant Task Analytics (Aggregation Pipeline)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'To Do', count: getStatusCount('TODO'), color: 'border-slate-700' },
            { label: 'In Progress', count: getStatusCount('IN_PROGRESS'), color: 'border-amber-500/40' },
            { label: 'In Review', count: getStatusCount('IN_REVIEW'), color: 'border-purple-500/40' },
            { label: 'Completed', count: getStatusCount('DONE'), color: 'border-emerald-500/40' },
          ].map((stat) => (
            <div key={stat.label} className={`bg-slate-900 border ${stat.color} rounded-xl p-5`}>
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className="text-3xl font-bold mt-1">{stat.count}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-indigo-400" /> Active Projects
        </h2>

        {projects.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-400 text-sm">
            No projects in this workspace yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <Link
                key={project._id}
                to={`/projects/${project._id}`}
                className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-indigo-500/15 text-indigo-400">
                      {project.key}
                    </span>
                    <span className="text-xs text-slate-500">Lead: {project.lead?.name}</span>
                  </div>
                  <h3 className="font-semibold text-base group-hover:text-indigo-400 transition">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-medium">
                  <span>Open Kanban Board</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mobile App Revamp"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Project Key (e.g., MOB)</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  placeholder="MOB"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm uppercase"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Sprint goals and scope..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium cursor-pointer"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
