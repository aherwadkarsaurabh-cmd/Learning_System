# 🔐 Private Route Protection - Quick Reference

## What Is Private Route Protection?

A system that ensures **ONLY ADMIN USERS** can access the admin panel.

---

## How It Works

### Step 1: User Logs In
```
Admin User Logs In
  ↓
Backend returns: { role: "admin", token: "...", ... }
  ↓
Frontend stores: localStorage.userRole = "admin"
```

### Step 2: User Navigates to Admin Route
```
User visits: http://localhost:3000/admin/dashboard
  ↓
ProtectedRoute checks:
  - Has token? ✅
  - userRole === 'admin'? ✅
  ↓
✅ AdminDashboard rendered
```

### Step 3: Non-Admin Tries Same Route
```
Student User Logs In
  ↓
Backend returns: { role: "student", token: "...", ... }
  ↓
Frontend stores: localStorage.userRole = "student"

User visits: http://localhost:3000/admin/dashboard
  ↓
ProtectedRoute checks:
  - Has token? ✅
  - userRole === 'admin'? ❌
  ↓
❌ Redirected to /dashboard
```

---

## Key Components

### 1. ProtectedRoute Component
**Location:** `frontend/src/components/ProtectedRoute.jsx`

**Purpose:** Guard routes from unauthorized access

**Usage:**
```jsx
<Route 
  path="/admin/dashboard" 
  element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} 
/>
```

**Logic:**
- If no token → Redirect to login
- If `requireAdmin=true` AND role ≠ 'admin' → Redirect to dashboard
- Otherwise → Show component

### 2. ProtectedRoute Props
```jsx
<ProtectedRoute 
  requireAdmin={true}      // Enforce admin-only access
  children={<Component />}  // Component to protect
/>
```

### 3. Backend Protection
**Location:** `backend/routes/adminRoutes.js`

**Protection Layers:**
```javascript
router.get('/endpoint',
  protect,                          // 1. Check JWT token
  authorize('admin', 'sub-admin'), // 2. Check user role
  requirePermission('...'),        // 3. Check specific permission
  controllerFunction               // 4. Execute if all pass
);
```

---

## Admin Routes

| Route | Protection | Component |
|-------|-----------|-----------|
| `/admin/dashboard` | ✅ requireAdmin=true | AdminDashboard |
| `/admin/students` | ✅ requireAdmin=true | AdminStudents |
| `/admin/courses` | ✅ requireAdmin=true | AdminCourses |
| `/admin/enrollments` | ✅ requireAdmin=true | AdminEnrollments |
| `/admin/settings` | ✅ requireAdmin=true | AdminSettings |

---

## What Happens When...

### ✅ Admin User Accesses `/admin/students`
1. ProtectedRoute checks token → ✅ Found
2. ProtectedRoute checks role → ✅ "admin"
3. Component renders → ✅ Success
4. Sidebar shows admin links → ✅ Visible
5. API calls work → ✅ 200 OK

### ❌ Student User Accesses `/admin/students`
1. ProtectedRoute checks token → ✅ Found
2. ProtectedRoute checks role → ❌ "student" ≠ "admin"
3. Redirect to `/dashboard` → ❌ Blocked
4. Sidebar hides admin links → ❌ Hidden
5. API calls fail → ❌ 403 Forbidden

### ❌ Logged Out User Accesses `/admin/students`
1. ProtectedRoute checks token → ❌ Not found
2. Redirect to `/` (login) → ❌ Blocked
3. Cannot access any admin routes

---

## Testing

### Admin Access ✅
```
Login: admin@example.com / password
Expected: Can access /admin/* routes
Result: ✅ Works
```

### Student Access ❌
```
Login: student@example.com / password
Try: /admin/dashboard
Expected: Redirected to /dashboard
Result: ✅ Works
```

### API Test - Admin ✅
```
GET /api/admin/dashboard/summary
Headers: Authorization: Bearer <admin_token>
Expected: 200 OK + data
Result: ✅ Works
```

### API Test - Student ❌
```
GET /api/admin/dashboard/summary
Headers: Authorization: Bearer <student_token>
Expected: 403 Forbidden
Result: ✅ Works
```

---

## File Structure

```
Frontend Protection
├── App.jsx (Routes with ProtectedRoute)
├── ProtectedRoute.jsx (Core guard)
├── Sidebar.jsx (Conditional links)
├── Login.jsx (Role-based redirect)
└── admin/ (Protected pages)

Backend Protection
├── adminRoutes.js (Protected endpoints)
├── authMiddleware.js (protect & authorize)
└── permissionMiddleware.js (Sub-admin permissions)
```

---

## How to Use ProtectedRoute

### For Admin-Only Routes
```jsx
<Route 
  path="/admin/dashboard" 
  element={
    <ProtectedRoute requireAdmin={true}>
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>
```

### For Logged-In Users Only
```jsx
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

### For Public Routes (No Protection)
```jsx
<Route path="/" element={<Login />} />
<Route path="/register" element={<Register />} />
```

---

## Security Features

| Feature | Status |
|---------|:------:|
| Token validation | ✅ |
| Role checking | ✅ |
| Automatic redirect | ✅ |
| API protection | ✅ |
| Permission system | ✅ |
| Logout clearing | ✅ |
| Error handling | ✅ |
| Logging | ✅ |

---

## Common Errors & Fixes

### Issue: Admin can't access `/admin/dashboard`
**Check:**
1. Is token stored? `localStorage.getItem('token')`
2. Is role "admin"? `localStorage.getItem('userRole')`
3. Is backend returning correct role? Check login API response

### Issue: Non-admin can access admin routes
**Check:**
1. Is ProtectedRoute applied? Check App.jsx routes
2. Is requireAdmin={true}? Should be on all admin routes
3. Is backend protecting APIs? Check adminRoutes.js

### Issue: Sidebar shows admin links to everyone
**Check:**
1. Is Sidebar checking role? Look at conditional render
2. Is userRole stored correctly? Check localStorage
3. Is role case-sensitive? Should be lowercase "admin"

---

## FAQ

**Q: Can I bypass this protection?**
A: No - Frontend + Backend protection prevents all bypass methods

**Q: What if I change localStorage?**
A: Token validation on backend will fail (403 Forbidden)

**Q: Can a student become admin by changing userRole?**
A: No - Backend checks actual user role from database via JWT

**Q: What happens on logout?**
A: All localStorage cleared, no way to access admin routes

**Q: Can sub-admins access admin routes?**
A: Yes, ProtectedRoute checks for both 'admin' and 'sub-admin'

---

## Commands to Test

### Test in Browser Console
```javascript
// Check if admin
localStorage.getItem('userRole') === 'admin'

// Check token
localStorage.getItem('token')

// Manual logout
localStorage.clear()
```

### Test API
```bash
# As admin
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:5000/api/admin/dashboard/summary

# As student (should fail)
curl -H "Authorization: Bearer <student_token>" \
  http://localhost:5000/api/admin/dashboard/summary
  # Returns: 403 Forbidden
```

---

## Summary

✅ **Admin-Only Protection:** ProtectedRoute + Backend Authorization
✅ **Automatic Redirect:** Non-admins sent to /dashboard
✅ **API Security:** Backend validates all requests
✅ **Navigation Hiding:** Sidebar only shows admin links to admins
✅ **Multiple Layers:** No single point of failure
✅ **No Bypass:** Both frontend and backend enforce rules

**Only admin users with valid token can access admin panel.**
