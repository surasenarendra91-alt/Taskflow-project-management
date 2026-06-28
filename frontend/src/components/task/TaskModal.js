import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { taskAPI, commentAPI } from '../../services/api';
import { getSocket, joinTask, leaveTask } from '../../services/socket';
import '../../styles/task.css';

const TaskModal = ({ taskId, projectMembers, onClose, onUpdated, onDeleted }) => {
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    loadTask();
    joinTask(taskId);

    const socket = getSocket();
    if (socket) {
      socket.on('comment:created', (comment) => {
        setComments(prev => [...prev, comment]);
      });
      socket.on('comment:updated', (comment) => {
        setComments(prev => prev.map(c => c._id === comment._id ? comment : c));
      });
      socket.on('comment:deleted', ({ commentId }) => {
        setComments(prev => prev.filter(c => c._id !== commentId));
      });
    }

    return () => {
      leaveTask(taskId);
      if (socket) {
        socket.off('comment:created');
        socket.off('comment:updated');
        socket.off('comment:deleted');
      }
    };
  }, [taskId]);

  const loadTask = async () => {
    try {
      const [taskRes, commentRes] = await Promise.all([
        taskAPI.getOne(taskId),
        commentAPI.getByTask(taskId)
      ]);
      setTask(taskRes.data.task);
      setEditForm(taskRes.data.task);
      setComments(commentRes.data.comments);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await taskAPI.update(taskId, editForm);
      setTask(res.data.task);
      onUpdated(res.data.task);
    } catch (err) {
      alert('Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    await taskAPI.delete(taskId);
    onDeleted(taskId);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await commentAPI.create(taskId, { content: newComment });
      setNewComment('');
    } catch (err) {
      alert('Failed to post comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    await commentAPI.delete(commentId);
  };

  const toggleChecklist = (itemId) => {
    setEditForm(prev => ({
      ...prev,
      checklist: prev.checklist.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    }));
  };

  const toggleAssignee = (userId) => {
    setEditForm(prev => {
      const assignees = prev.assignees?.map(a => typeof a === 'object' ? a._id : a) || [];
      return {
        ...prev,
        assignees: assignees.includes(userId)
          ? assignees.filter(id => id !== userId)
          : [...assignees, userId]
      };
    });
  };

  if (loading) return (
    <div className="modal-overlay">
      <div className="modal" style={{ padding: 40, textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
      </div>
    </div>
  );

  const assigneeIds = editForm.assignees?.map(a => typeof a === 'object' ? a._id : a) || [];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal task-modal" style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <input
            className="editable-title"
            value={editForm.title || ''}
            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? '...' : 'Save'}
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
            <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
          </div>
        </div>

        <div style={{ borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {['details', 'comments', 'checklist'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 16px', background: 'none', border: 'none',
                  cursor: 'pointer', fontWeight: activeTab === tab ? 600 : 400,
                  borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                  textTransform: 'capitalize', fontSize: 14
                }}>
                {tab} {tab === 'comments' && `(${comments.length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-body">
          {activeTab === 'details' && (
            <div className="task-modal-grid">
              <div className="task-modal-main">
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input form-textarea"
                    value={editForm.description || ''}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Add a description..." rows={4} />
                </div>
              </div>
              <div className="task-modal-sidebar">
                <div className="task-modal-section">
                  <h4>Priority</h4>
                  <select className="form-input" value={editForm.priority || 'medium'}
                    onChange={e => setEditForm({ ...editForm, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="task-modal-section">
                  <h4>Due Date</h4>
                  <input className="form-input" type="date"
                    value={editForm.dueDate ? format(new Date(editForm.dueDate), 'yyyy-MM-dd') : ''}
                    onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })} />
                </div>
                <div className="task-modal-section">
                  <h4>Assignees</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {projectMembers.map(m => (
                      <label key={m.user._id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                        <input type="checkbox"
                          checked={assigneeIds.includes(m.user._id)}
                          onChange={() => toggleAssignee(m.user._id)} />
                        <div className="avatar avatar-sm">{m.user.name?.[0]?.toUpperCase()}</div>
                        {m.user.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div>
              <div style={{ marginBottom: 20, maxHeight: 350, overflowY: 'auto' }}>
                {comments.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map(c => (
                    <div key={c._id} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                      <div className="avatar avatar-sm">{c.author?.name?.[0]?.toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
                          <strong style={{ fontSize: 14 }}>{c.author?.name}</strong>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {format(new Date(c.createdAt), 'MMM d, h:mm a')}
                          </span>
                          {c.isEdited && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(edited)</span>}
                        </div>
                        <div style={{ background: 'var(--secondary)', padding: '8px 12px', borderRadius: 8, fontSize: 14 }}>
                          {c.content}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteComment(c._id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14 }}>
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleComment} style={{ display: 'flex', gap: 8 }}>
                <input className="form-input" value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  style={{ flex: 1 }} />
                <button type="submit" className="btn btn-primary">Send</button>
              </form>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div>
              {(editForm.checklist || []).map(item => (
                <div key={item.id} className="checklist-item">
                  <input type="checkbox" checked={item.completed}
                    onChange={() => toggleChecklist(item.id)} />
                  <span className={item.completed ? 'done' : ''}>{item.text}</span>
                  <button onClick={() => setEditForm(prev => ({
                    ...prev,
                    checklist: prev.checklist.filter(c => c.id !== item.id)
                  }))}>✕</button>
                </div>
              ))}
              <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }}
                onClick={() => {
                  const text = prompt('Checklist item:');
                  if (!text) return;
                  setEditForm(prev => ({
                    ...prev,
                    checklist: [...(prev.checklist || []), { id: Date.now().toString(), text, completed: false }]
                  }));
                }}>
                + Add Item
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
