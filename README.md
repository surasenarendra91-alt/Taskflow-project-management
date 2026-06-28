# 🚀 TaskFlow - Collaborative Project Management Tool

A full-stack Trello/Asana-like project management tool with real-time collaboration.

## ✨ Features

- **Authentication** — JWT-based register/login system
- **Projects** — Create group projects with colors and icons
- **Kanban Board** — Drag-and-drop task management (To Do → In Progress → Review → Done)
- **Tasks** — Full task cards with priority, due dates, assignees, labels, checklist
- **Comments** — Real-time commenting on tasks
- **Team** — Invite members with role-based access (owner/admin/member/viewer)
- **Notifications** — Real-time push notifications for assignments, comments, mentions
- **WebSockets** — Live updates across all connected users via Socket.IO

## 🏗️ Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Socket.IO (WebSockets)

### Frontend
- React 18
- React Router v6
- @hello-pangea/dnd (drag-and-drop)
- Socket.IO Client
- Axios

## 📁 Project Structure

```
project-management-tool/
├── backend/
│   ├── src/
│   │   ├── controllers/     # authController, projectController, taskController, commentController
│   │   ├── middleware/      # auth.js (JWT protect)
│   │   ├── models/          # User, Project, Task, Comment, Notification
│   │   ├── routes/          # auth, projects, tasks, comments, notifications, users
│   │   ├── socket/          # socketHandler.js (real-time events)
│   │   └── server.js        # Entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── board/       # CreateProjectModal, InviteMemberModal
    │   │   ├── layout/      # Navbar
    │   │   └── task/        # TaskCard, TaskModal, CreateTaskModal
    │   ├── context/         # AuthContext
    │   ├── pages/           # LoginPage, RegisterPage, DashboardPage, ProjectPage
    │   ├── services/        # api.js (Axios), socket.js (Socket.IO)
    │   ├── styles/          # global.css, auth.css, dashboard.css, project.css, etc.
    │   └── App.js
    ├── .env.example
    └── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB (local or Atlas)

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm start
```

### 3. Open in browser
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| GET | /api/projects | List projects |
| POST | /api/projects | Create project |
| POST | /api/projects/:id/invite | Invite member |
| GET | /api/tasks/project/:id | Get tasks |
| POST | /api/tasks/project/:id | Create task |
| PATCH | /api/tasks/:id/move | Move task (drag-drop) |
| GET | /api/comments/task/:id | Get comments |
| POST | /api/comments/task/:id | Post comment |
| GET | /api/notifications | Get notifications |

## 🔄 Socket Events

| Event | Description |
|-------|-------------|
| task:created | New task added to board |
| task:updated | Task details changed |
| task:moved | Task dragged to new column |
| task:deleted | Task removed |
| comment:created | New comment posted |
| comment:updated | Comment edited |
| notification:new | New notification pushed |

## 🐳 Docker (Optional)

```bash
docker-compose up
```

## 📝 Environment Variables

**Backend (.env)**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/projectmanagement
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

**Frontend (.env)**
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```
