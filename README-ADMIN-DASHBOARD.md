# KavyaLearn Admin Dashboard LMS Platform

A complete full-stack Learning Management System (LMS) with Admin Dashboard, role-based access, user management, course management, enrollment tracking, and AI integration.

## Features

### Admin Capabilities
- **User Management**: Create, read, update, delete students, parents, and instructors
- **Course Management**: Full CRUD on courses with categories, levels, and status tracking
- **Enrollment Management**: Assign students to courses, track progress, mark completion
- **Dashboard**: Real-time summary cards (total students, courses, enrollments) and charts
- **Activity Logs**: Audit trail of all admin actions
- **Sub-Admin Management**: Create and manage sub-admins with granular permissions
- **Feature Flags**: Toggle AI models and other features without code changes
- **Announcements**: Create and broadcast announcements to users

### Role-Based Access Control
- **Admin**: Full system access, can create/delete users and sub-admins
- **Sub-Admin**: Limited access based on assigned permissions (manageStudents, manageCourses, viewReports)
- **Student/Parent/Instructor**: Access only to their own data

### AI Integration
- **Claude Haiku 4.5**: Optional AI support with server-side proxying
- **Feature Toggle**: Enable/disable Claude via Admin Settings without restarting server
- **Fallback Support**: OpenAI as default with graceful fallback

### Technical Stack
- **Frontend**: React 19, React Router 7, Recharts, Axios, Bootstrap 5
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Auth**: JWT (access token)
- **Validation**: express-validator
- **Rate Limiting**: express-rate-limit

## Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# MONGO_URI=mongodb://localhost:27017/kavyalearn
# JWT_SECRET=your_secret_key
# CLAUDE_HAIKU_ENABLED=false (optional)
# CLAUDE_API_KEY=... (optional)

# Start server (development)
npm run dev

# Start server (production)
npm start
```

Server will run on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local (optional)
# VITE_API_BASE_URL=http://localhost:5000

# Start development server
npm run dev

# Build for production
npm build
```

Frontend will run on `http://localhost:5173`

## Usage

### 1. Register & Login

**Register Admin:**
```bash
POST /api/auth/register
{
  "fullName": "Admin User",
  "email": "admin@example.com",
  "password": "password123",
  "role": "admin"
}
```

**Login:**
```bash
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "password123"
}
```

Returns `token` - store in localStorage for authenticated requests.

### 2. Admin Dashboard

Navigate to `http://localhost:5173/admin/dashboard` after login. Shows:
- Summary cards (students, courses, enrollments, completion rate)
- Bar chart of user and course stats

### 3. Manage Students

`http://localhost:5173/admin/students` - view all students, search, and add new students.

### 4. Manage Courses

`http://localhost:5173/admin/courses` - create and manage courses, set levels and status.

### 5. Manage Enrollments

`http://localhost:5173/admin/enrollments` - assign students to courses and track progress.

### 6. Admin Settings

`http://localhost:5173/admin/settings` - toggle Claude Haiku 4.5 AI model availability.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - Login and get token
- `GET /api/auth/profile` - Get user profile

### Admin Users
- `GET /api/admin/users` - List all users (with filters: ?role=student)
- `POST /api/admin/users` - Create user
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user (admin only)

### Admin Courses
- `GET /api/admin/courses` - List courses
- `POST /api/admin/courses` - Create course
- `GET /api/admin/courses/:id` - Get course details
- `PUT /api/admin/courses/:id` - Update course
- `DELETE /api/admin/courses/:id` - Delete course

### Admin Enrollments
- `GET /api/admin/enrollments` - List all enrollments
- `POST /api/admin/enrollments` - Create enrollment
- `GET /api/admin/enrollments/:id` - Get enrollment details
- `PUT /api/admin/enrollments/:id` - Update enrollment (progress, hours, etc.)
- `DELETE /api/admin/enrollments/:id` - Delete enrollment

### Admin Dashboard
- `GET /api/admin/dashboard/summary` - Get dashboard summary stats

### Activity Logs
- `GET /api/admin/logs` - View activity logs

### Feature Flags
- `GET /api/flags/:key` - Get feature flag value
- `PUT /api/flags/:key` - Set feature flag (admin only)
- `GET /api/flags` - List all flags (admin only)

### AI Chat (Public)
- `POST /api/ai/chat` - Send message to AI
  - Body: `{ message, model }` (model optional, defaults to OpenAI)
  - Returns: `{ reply, ... }`

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/kavyalearn
JWT_SECRET=your_secret_key_here
NODE_ENV=development

# AI Configuration
OPENAI_API_KEY=sk-... (optional)
CLAUDE_HAIKU_ENABLED=false
CLAUDE_API_KEY=sk-anthropic-... (optional)
CLAUDE_API_URL=https://api.anthropic.com/v1/complete

# Email (optional)
SENDGRID_API_KEY=...
FROM_EMAIL=noreply@kavyalearn.com
```

### Frontend (.env.local)
```
VITE_API_BASE_URL=http://localhost:5000
```

## Project Structure

```
backend/
├── config/
│   └── db.js
├── controllers/
│   ├── adminController.js
│   ├── authController.js
│   ├── featureFlagController.js
│   └── ...
├── models/
│   ├── userModel.js
│   ├── courseModel.js
│   ├── enrollmentModel.js
│   ├── announcementModel.js
│   ├── activityLogModel.js
│   ├── featureFlagModel.js
│   └── ...
├── middleware/
│   ├── authMiddleware.js
│   ├── permissionMiddleware.js
│   ├── validationMiddleware.js
│   └── rateLimitMiddleware.js
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── featureFlagRoutes.js
│   ├── aiTutorRoutes.js
│   └── ...
├── server.js
├── package.json
└── .env.example

frontend/
├── src/
│   ├── api/
│   │   └── axiosClient.js
│   ├── components/
│   │   ├── ProtectedRoute.jsx
│   │   ├── CreateUserModal.jsx
│   │   ├── CreateCourseModal.jsx
│   │   └── Sidebar.jsx
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminStudents.jsx
│   │   │   ├── AdminCourses.jsx
│   │   │   ├── AdminEnrollments.jsx
│   │   │   └── AdminSettings.jsx
│   │   └── ...
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── vite.config.js
```

## Running Tests

```bash
cd backend

# Run integration tests
node __tests__/admin.test.js

# Ensure backend is running on :5000 before tests
```

## Security Considerations

- ✓ Passwords hashed with bcryptjs
- ✓ JWT token-based auth
- ✓ Role and permission middleware
- ✓ Rate limiting on auth and AI endpoints
- ✓ Server-side validation with express-validator
- ✓ Feature flags for safe rollout
- ✓ Activity audit logging

## Troubleshooting

**Backend connection errors:**
- Ensure MongoDB is running or `MONGO_URI` is set
- Backend falls back to in-memory DB for development

**Frontend auth errors:**
- Check token is stored in localStorage
- Clear localStorage and re-login if token expired
- Check backend is running and accessible

**API 403 errors:**
- Verify token is attached (Bearer header)
- Check user role has required permissions
- For sub-admin, verify permissions are set

**AI model not responding:**
- Check `CLAUDE_API_KEY` is set on backend
- Verify feature flag is enabled in Admin Settings
- Check backend logs for API errors

## Future Enhancements

- WebSocket support for real-time updates
- Email notifications for enrollments
- Payment integration for premium courses
- Advanced analytics and reporting
- Mobile app
- Multi-language support

## Support

For issues or questions, please open an issue on the repository.

---

**Version**: 1.0.0  
**License**: ISC  
**Last Updated**: December 2025
