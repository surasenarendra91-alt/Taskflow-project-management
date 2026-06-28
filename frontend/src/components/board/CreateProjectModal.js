import React, { useState } from 'react';
import { projectAPI } from '../../services/api';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];
const ICONS = ['📋', '🚀', '💡', '🎯', '🔥', '⚡', '🌟', '💼', '🎨', '🛠️', '📱', '🌍'];

const CreateProjectModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1', icon: '📋' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Project name is required'); return; }
    setLoading(true);
    try {
      const res = await projectAPI.create(form);
      onCreated(res.data.project);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Create New Project</h2>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
              <div style={{
                width: 80, height: 80, borderRadius: 12,
                background: form.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36
              }}>
                {form.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p className="form-label">Icon</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {ICONS.map(icon => (
                    <button key={icon} type="button"
                      onClick={() => setForm({ ...form, icon })}
                      style={{
                        padding: '4px 6px', borderRadius: 6, cursor: 'pointer',
                        border: form.icon === icon ? '2px solid var(--primary)' : '2px solid transparent',
                        background: 'var(--secondary)', fontSize: 20
                      }}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLORS.map(color => (
                  <button key={color} type="button"
                    onClick={() => setForm({ ...form, color })}
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: color, border: 'none', cursor: 'pointer',
                      outline: form.color === color ? '3px solid #000' : 'none',
                      outlineOffset: 2
                    }} />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input className="form-input" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="My Awesome Project" autoFocus />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input form-textarea" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="What is this project about?" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
