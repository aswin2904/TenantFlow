import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { io } from 'socket.io-client';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { ArrowLeft, Plus, MessageSquare, Trash2, Radio } from 'lucide-react';

const COLUMNS = [
  { id: 'TODO', title: 'To Do', accent: 'border-slate-600' },
  { id: 'IN_PROGRESS', title: 'In Progress', accent: 'border-amber-500' },
  { id: 'IN_REVIEW', title: 'In Review', accent: 'border-purple-500' },
  { id: 'DONE', title: 'Done', accent: 'border-emerald-500' },
];

const PRIORITY_BADGE = {
  LOW: 'bg-slate-800 text-slate-300',
  MEDIUM: 'bg-blue-500/15 text-blue-400',
  HIGH: 'bg-amber-500/15 text-amber-400',
  CRITICAL: 'bg-red-500/15 text-red-400',
};

export default function BoardPage() {
  const { projectId } = useParams();
  const { currentRole } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentText, setCommentText] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [assignee, setAssignee] = useState('');

  const canEdit = ['ADMIN', 'MANAGER', 'DEVELOPER'].includes(currentRole);
  const canDelete = ['ADMIN', 'MANAGER'].includes(currentRole);

  useEffect(() => {
    const fetchBoardData = async () => {
      try {
        const [taskRes, orgRes] = await Promise.all([
          api.get(`/tasks/project/${projectId}`),
          api.get('/orgs/current'),
        ]);
        setTasks(taskRes.data);
        setMembers(orgRes.data.organization.members || []);
      } catch (err) {
        console.error('Failed to load board:', err);
      }
    };
    fetchBoardData();

    const socket = io('http://localhost:5000', { withCredentials: true });
    socket.emit('join_project', projectId);

    socket.on('task_created', (newTask) => {
      setTasks((prev) => (prev.some((t) => t._id === newTask._id) ? prev : [...prev, newTask]));
    });

    socket.on('task_updated', (updatedTask) => {
      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
      setSelectedTask((prev) => (prev?._id === updatedTask._id ? updatedTask : prev));
    });

    socket.on('task_deleted', (deletedId) => {
      setTasks((prev) => prev.filter((t) => t._id !== deletedId));
      setSelectedTask((prev) => (prev?._id === deletedId ? null : prev));
    });

    return () => {
      socket.emit('leave_project', projectId);
      socket.disconnect();
    };
  }, [projectId]);

  const handleDragEnd = async (result) => {
    if (!result.destination || !canEdit) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;

    setTasks((prev) =>
      prev.map((t) => (t._id === draggableId ? { ...t, status: newStatus, order: destination.index } : t))
    );

    try {
      await api.patch(`/tasks/${draggableId}`, {
        status: newStatus,
        order: destination.index,
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to move task');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', {
        projectId,
        title,
        description,
        priority,
        assignee: assignee || null,
      });
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setAssignee('');
      setShowCreate(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTask) return;
    try {
      await api.post(`/tasks/${selectedTask._id}/comments`, { text: commentText });
      setCommentText('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task permanently?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold">Sprint Kanban Board</h1>
              <span className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Radio className="w-3 h-3 animate-pulse" /> Live Socket Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {canEdit
                ? 'Drag and drop cards across columns to update sprint status in real time.'
                : 'Read-only Viewer mode: You can inspect tasks and view live updates.'}
            </p>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 items-start">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className={`bg-slate-900/90 border border-slate-800 border-t-2 ${col.accent} rounded-xl p-3.5 min-h-[460px] flex flex-col`}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {col.title}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2.5 flex-1 min-h-[380px]"
                    >
                      {colTasks.map((task, index) => (
                        <Draggable
                          key={task._id}
                          draggableId={task._id}
                          index={index}
                          isDragDisabled={!canEdit}
                        >
                          {(dragProvided, snapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              onClick={() => setSelectedTask(task)}
                              className={`bg-slate-950 border ${
                                snapshot.isDragging ? 'border-indigo-500 shadow-lg' : 'border-slate-800'
                              } hover:border-slate-700 rounded-lg p-3.5 cursor-pointer transition`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    PRIORITY_BADGE[task.priority]
                                  }`}
                                >
                                  {task.priority}
                                </span>
                                {canDelete && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTask(task._id);
                                    }}
                                    className="text-slate-500 hover:text-red-400 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              <p className="text-sm font-medium text-slate-100 leading-snug">
                                {task.title}
                              </p>

                              <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                                <span>{task.assignee?.name || 'Unassigned'}</span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" /> {task.comments?.length || 0}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Create Sprint Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Implement role verification middleware"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Assignee</label>
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.user._id} value={m.user._id}>
                        {m.user.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${PRIORITY_BADGE[selectedTask.priority]}`}>
                  {selectedTask.priority} • {selectedTask.status}
                </span>
                <h3 className="text-lg font-bold mt-2">{selectedTask.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                Close
              </button>
            </div>

            <p className="text-sm text-slate-300 mb-4">
              {selectedTask.description || 'No description provided.'}
            </p>

            <div className="border-t border-slate-800 pt-4 flex-1 overflow-y-auto space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Real-Time Discussion ({selectedTask.comments?.length || 0})
              </h4>
              {selectedTask.comments?.length === 0 && (
                <p className="text-xs text-slate-500">No comments yet.</p>
              )}
              {selectedTask.comments?.map((c, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-semibold text-indigo-400">{c.author?.name || 'Member'}</span>
                    <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-slate-200">{c.text}</p>
                </div>
              ))}
            </div>

            {canEdit && (
              <form onSubmit={handleAddComment} className="mt-4 pt-3 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium cursor-pointer"
                >
                  Send
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
