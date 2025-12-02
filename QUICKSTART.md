# Quick Start Guide - Admin Dashboard LMS

## 30-Second Setup

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env: set JWT_SECRET, optional MONGO_URI
npm run dev
```
Backend ready at `http://localhost:5000`

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend ready at `http://localhost:5173`

### 3. First Login
- Go to `http://localhost:5173`
- Register as admin:
  ```
  Full Name: Admin
  Email: admin@test.com
  Password: test123
  Role: admin
  ```
- Login with same credentials
- Navigate to `/admin/dashboard`

## What's Included

✅ **Complete Admin CRUD System**
- User management (students, parents, instructors)
- Course creation & management
- Enrollment tracking with progress
- Sub-admin role management with permissions

✅ **Admin Dashboard**
- Summary cards & charts
- Real-time stats
- Activity audit trail

✅ **AI Integration**
- Claude Haiku 4.5 support (optional)
- OpenAI fallback
- Feature toggle via Admin Settings
- No code changes needed to enable/disable

✅ **Security**
- JWT authentication
- Role-based access control
- Input validation
- Rate limiting
- Password hashing

✅ **Frontend Features**
- Protected routes
- Modals for create/edit
- Bootstrap UI
- Responsive design

## Key API Endpoints

**Dashboard Summary:**
```bash
GET /api/admin/dashboard/summary
```

**Create User:**
```bash
POST /api/admin/users
{
  "fullName": "Student Name",
  "email": "student@example.com",
  "password": "secure",
  "role": "student"
}
```

**Create Course:**
```bash
POST /api/admin/courses
{
  "title": "Course Name",
  "category": "General",
  "level": "Beginner",
  "status": "active"
}
```

**Enroll Student:**
```bash
POST /api/admin/enrollments
{
  "studentId": "...",
  "courseId": "..."
}
```

**Toggle Claude AI:**
```bash
PUT /api/flags/CLAUDE_HAIKU_ENABLED
{
  "value": true
}
```

## Admin Pages

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/admin/dashboard` | Overview & stats |
| Students | `/admin/students` | Manage students |
| Courses | `/admin/courses` | Manage courses |
| Enrollments | `/admin/enrollments` | Track enrollments |
| Settings | `/admin/settings` | Toggle AI & config |

## Testing

Run integration tests (backend must be running):
```bash
cd backend
node __tests__/admin.test.js
```

## Troubleshooting

**MongoDB connection:** Set `MONGO_URI` or leave empty for in-memory DB (dev only)

**JWT errors:** Set `JWT_SECRET` in `.env`

**Frontend can't reach backend:** Check `VITE_API_BASE_URL` in frontend `.env.local`

**AI not working:** Set `CLAUDE_API_KEY` in backend `.env` and enable toggle in Admin Settings

## Next Steps

- Add database seeding for demo data
- Implement WebSocket for real-time updates
- Add payment integration
- Create mobile app
- Deploy to production (Heroku, AWS, etc.)

---

For detailed documentation, see `README-ADMIN-DASHBOARD.md`
