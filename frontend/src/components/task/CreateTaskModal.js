import React, { useState } from 'react';
import { taskAPI } from '../../services/api';

const CreateTaskModal = ({ projectId, columnId, members, onClose, onCreated }) => {
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium',
    dueDate: '', assignees: [], labels: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    try {
      const data = {
        ...form,
        columnId,
        labels: form.labels ? form.labels.split(',').map(l => l.trim()).filter(Boolean) : [],
        dueDate: form.dueDate || undefined
      };
      const res = await taskAPI.create(projectId, data);
      onCreated(res.data.task);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const toggleAssignee = (userId) => {
    setForm(prev => ({
      ...prev,
      assignees: prev.assignees.includes(userId)
        ? prev.assignees.filter(id => id !== userId)
        : [...prev.assignees, userId]
    }));
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Create Task</h2>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Task title" autoFocus />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input form-textarea" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Add a description..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-input" value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-input" type="date" value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Labels (comma separated)</label>
              <input className="form-input" value={form.labels}
                onChange={e => setForm({ ...form, labels: e.target.value })}
                placeholder="bug, feature, design" />
            </div>

            {members.length > 0 && (
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {members.map(m => (
                    <button key={m.user._id} type="button"
                      className={`btn btn-sm ${form.assignees.includes(m.user._id) ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => toggleAssignee(m.user._id)}>
                      {m.user.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
