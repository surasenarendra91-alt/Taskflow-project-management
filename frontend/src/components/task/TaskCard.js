import React from 'react';
import { format, isPast } from 'date-fns';
import '../../styles/task.css';

const PRIORITY_COLORS = {
  low: '#dcfce7',
  medium: '#fef9c3',
  high: '#fee2e2',
  urgent: '#fce7f3'
};

const PRIORITY_TEXT = {
  low: '#16a34a',
  medium: '#ca8a04',
  high: '#dc2626',
  urgent: '#be185d'
};

const TaskCard = ({ task, onClick }) => {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.columnId !== 'done';
  const completedChecklist = task.checklist?.filter(c => c.completed).length || 0;
  const totalChecklist = task.checklist?.length || 0;

  return (
    <div className="task-card" onClick={onClick}>
      {task.labels && task.labels.length > 0 && (
        <div className="task-labels">
          {task.labels.slice(0, 3).map((label, i) => (
            <span key={i} className="task-label">{label}</span>
          ))}
        </div>
      )}

      <p className="task-title">{task.title}</p>

      {task.description && (
        <p className="task-desc">{task.description}</p>
      )}

      <div className="task-footer">
        <div className="task-meta">
          {task.priority && task.priority !== 'medium' && (
            <span className="task-priority" style={{
              background: PRIORITY_COLORS[task.priority],
              color: PRIORITY_TEXT[task.priority]
            }}>
              {task.priority}
            </span>
          )}
          {task.dueDate && (
            <span className={`task-due ${isOverdue ? 'overdue' : ''}`}>
              📅 {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
          {totalChecklist > 0 && (
            <span className="task-checklist">
              ☑ {completedChecklist}/{totalChecklist}
            </span>
          )}
        </div>

        {task.assignees && task.assignees.length > 0 && (
          <div className="task-assignees">
            {task.assignees.slice(0, 3).map((a, i) => (
              <div key={i} className="avatar avatar-sm" title={a.name}
                style={{ marginLeft: i > 0 ? '-6px' : 0, border: '2px solid white' }}>
                {a.name?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
