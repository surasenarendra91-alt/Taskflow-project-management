import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { projectAPI, taskAPI } from '../services/api';
import { getSocket, joinProject, leaveProject } from '../services/socket';
import Navbar from '../components/layout/Navbar';
import TaskCard from '../components/task/TaskCard';
import TaskModal from '../components/task/TaskModal';
import CreateTaskModal from '../components/task/CreateTaskModal';
import InviteMemberModal from '../components/board/InviteMemberModal';
import '../styles/project.css';

const ProjectPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [createColumn, setCreateColumn] = useState(null);
  const [showInvite, setShowInvite] = useState(false);

  const groupTasksByColumn = (taskList) => {
    const grouped = {};
    taskList.forEach(task => {
      if (!grouped[task.columnId]) grouped[task.columnId] = [];
      grouped[task.columnId].push(task);
    });
    Object.keys(grouped).forEach(col => {
      grouped[col].sort((a, b) => a.order - b.order);
    });
    return grouped;
  };

  const loadProject = useCallback(async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        projectAPI.getOne(id),
        taskAPI.getByProject(id)
      ]);
      setProject(projRes.data.project);
      setTasks(groupTasksByColumn(taskRes.data.tasks));
    } catch (err) {
      if (err.response?.status === 403) navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadProject();
    joinProject(id);

    const socket = getSocket();
    if (socket) {
      socket.on('task:created', (task) => {
        setTasks(prev => {
          const col = task.columnId;
          return { ...prev, [col]: [...(prev[col] || []), task] };
        });
      });

      socket.on('task:updated', (task) => {
        setTasks(prev => {
          const newTasks = {};
          Object.keys(prev).forEach(col => {
            newTasks[col] = prev[col].filter(t => t._id !== task._id);
          });
          const col = task.columnId;
          newTasks[col] = [...(newTasks[col] || []), task].sort((a, b) => a.order - b.order);
          return newTasks;
        });
      });

      socket.on('task:deleted', ({ taskId }) => {
        setTasks(prev => {
          const newTasks = {};
          Object.keys(prev).forEach(col => {
            newTasks[col] = prev[col].filter(t => t._id !== taskId);
          });
          return newTasks;
        });
      });

      socket.on('task:moved', ({ taskId, columnId }) => {
        setTasks(prev => {
          let movedTask = null;
          const newTasks = {};
          Object.keys(prev).forEach(col => {
            newTasks[col] = prev[col].filter(t => {
              if (t._id === taskId) { movedTask = t; return false; }
              return true;
            });
          });
          if (movedTask) {
            newTasks[columnId] = [...(newTasks[columnId] || []), { ...movedTask, columnId }];
          }
          return newTasks;
        });
      });
    }

    return () => {
      leaveProject(id);
      if (socket) {
        socket.off('task:created');
        socket.off('task:updated');
        socket.off('task:deleted');
        socket.off('task:moved');
      }
    };
  }, [id, loadProject]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const srcCol = source.droppableId;
    const dstCol = destination.droppableId;

    setTasks(prev => {
      const newTasks = { ...prev };
      const srcItems = [...(newTasks[srcCol] || [])];
      const [moved] = srcItems.splice(source.index, 1);
      moved.columnId = dstCol;

      if (srcCol === dstCol) {
        srcItems.splice(destination.index, 0, moved);
        newTasks[srcCol] = srcItems;
      } else {
        newTasks[srcCol] = srcItems;
        const dstItems = [...(newTasks[dstCol] || [])];
        dstItems.splice(destination.index, 0, moved);
        newTasks[dstCol] = dstItems;
      }
      return newTasks;
    });

    try {
      await taskAPI.move(draggableId, { columnId: dstCol, order: destination.index });
    } catch (err) {
      loadProject();
    }
  };

  const handleTaskCreated = (task) => {
    setTasks(prev => ({
      ...prev,
      [task.columnId]: [...(prev[task.columnId] || []), task]
    }));
    setCreateColumn(null);
  };

  if (loading) return (
    <div className="loading-screen"><div className="spinner"></div></div>
  );

  return (
    <div className="project-layout">
      <Navbar />
      <div className="project-header">
        <div className="project-header-left">
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard')}>← Back</button>
          <div className="project-title-area">
            <span style={{ fontSize: 24 }}>{project?.icon}</span>
            <h1 className="project-title">{project?.name}</h1>
          </div>
          <div className="project-members-bar">
            {project?.members?.slice(0, 5).map((m, i) => (
              <div key={i} className="avatar avatar-sm" title={m.user?.name}
                style={{ marginLeft: i > 0 ? '-6px' : 0, border: '2px solid white' }}>
                {m.user?.name?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
        <div className="project-header-right">
          <button className="btn btn-outline btn-sm" onClick={() => setShowInvite(true)}>
            + Invite
          </button>
        </div>
      </div>

      <div className="board-container">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="board-columns">
            {project?.columns?.map(col => (
              <div key={col.id} className="board-column">
                <div className="column-header">
                  <div className="column-title-row">
                    <span className="column-dot" style={{ background: col.color }}></span>
                    <h3 className="column-title">{col.name}</h3>
                    <span className="column-count">{(tasks[col.id] || []).length}</span>
                  </div>
                  <button className="btn-add-task" onClick={() => setCreateColumn(col.id)}>+</button>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`column-tasks ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    >
                      {(tasks[col.id] || []).map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={snap.isDragging ? 'dragging' : ''}
                            >
                              <TaskCard task={task} onClick={() => setSelectedTask(task)} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <button className="add-task-btn" onClick={() => setCreateColumn(col.id)}>
                  + Add task
                </button>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {createColumn && (
        <CreateTaskModal
          projectId={id}
          columnId={createColumn}
          members={project?.members || []}
          onClose={() => setCreateColumn(null)}
          onCreated={handleTaskCreated}
        />
      )}

      {selectedTask && (
        <TaskModal
          taskId={selectedTask._id}
          projectMembers={project?.members || []}
          onClose={() => setSelectedTask(null)}
          onUpdated={(task) => {
            setTasks(prev => {
              const newTasks = {};
              Object.keys(prev).forEach(col => {
                newTasks[col] = prev[col].filter(t => t._id !== task._id);
              });
              newTasks[task.columnId] = [...(newTasks[task.columnId] || []), task];
              return newTasks;
            });
            setSelectedTask(null);
          }}
          onDeleted={(taskId) => {
            setTasks(prev => {
              const newTasks = {};
              Object.keys(prev).forEach(col => {
                newTasks[col] = prev[col].filter(t => t._id !== taskId);
              });
              return newTasks;
            });
            setSelectedTask(null);
          }}
        />
      )}

      {showInvite && (
        <InviteMemberModal
          projectId={id}
          onClose={() => setShowInvite(false)}
          onInvited={(updatedProject) => {
            setProject(updatedProject);
            setShowInvite(false);
          }}
        />
      )}
    </div>
  );
};

export default ProjectPage;
