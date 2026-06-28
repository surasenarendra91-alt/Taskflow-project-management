import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectAPI } from '../services/api';
import Navbar from '../components/layout/Navbar';
import CreateProjectModal from '../components/board/CreateProjectModal';
import '../styles/dashboard.css';

const ProjectCard = ({ project }) => (
  <Link to={`/project/${project._id}`} className="project-card">
    <div className="project-card-header" style={{ background: project.color || '#6366f1' }}>
      <span className="project-icon">{project.icon || '📋'}</span>
    </div>
    <div className="project-card-body">
      <h3 className="project-name">{project.name}</h3>
      {project.description && (
        <p className="project-desc">{project.description}</p>
      )}
      <div className="project-meta">
        <div className="project-members">
          {project.members.slice(0, 4).map((m, i) => (
            <div key={i} className="avatar avatar-sm" style={{ marginLeft: i > 0 ? '-8px' : 0, border: '2px solid white' }}>
              {m.user?.name?.[0]?.toUpperCase()}
            </div>
          ))}
          {project.members.length > 4 && (
            <div className="avatar avatar-sm" style={{ marginLeft: '-8px', border: '2px solid white', background: '#94a3b8' }}>
              +{project.members.length - 4}
            </div>
          )}
        </div>
        <span className="project-date text-xs text-muted">
          {new Date(project.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  </Link>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await projectAPI.getAll();
      setProjects(res.data.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = (project) => {
    setProjects(prev => [project, ...prev]);
    setShowCreate(false);
  };

  return (
    <div className="dashboard-layout">
      <Navbar />
      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-title">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
              <p className="text-muted">Here are your projects</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              + New Project
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center" style={{ height: 200 }}>
              <div className="spinner"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No projects yet</h3>
              <p>Create your first project to get started!</p>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                Create Project
              </button>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map(p => <ProjectCard key={p._id} project={p} />)}
            </div>
          )}
        </div>
      </main>

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={handleProjectCreated}
        />
      )}
    </div>
  );
};

export default DashboardPage;
