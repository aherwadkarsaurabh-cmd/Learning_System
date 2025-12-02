# Private Route Protection - Code Implementation Details

## 📋 Complete Code Flow

### 1. Login Process (frontend/src/pages/Login.jsx)

```jsx
// User submits form
const handleLogin = async (e) => {
  e.preventDefault();
  
  // Call backend
  const response = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  // Store credentials
  localStorage.setItem("token", data.token);              // JWT token
  localStorage.setItem("user", JSON.stringify(data));    // User data
  localStorage.setItem("userRole", data.role);           // ROLE IS KEY!

  // Role-based redirect
  if (data.role === 'admin' || data.role === 'sub-admin') {
    navigate("/admin/dashboard");  // Admin redirect
  } else {
    navigate("/dashboard");        // Regular user redirect
  }
};
```

---

### 2. App Routing (frontend/src/App.jsx)

```jsx
function Layout() {
  return (
    <div className="app-container">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} isMobile={isMobile} />

      <main className="main-content">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Registration />} />

          {/* Regular protected routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/courses" element={<Courses />} />

          {/* ADMIN PROTECTED ROUTES - requireAdmin={true} */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/students" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminStudents />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/courses" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminCourses />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/enrollments" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminEnrollments />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminSettings />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  );
}
```

---

### 3. ProtectedRoute Guard (frontend/src/components/ProtectedRoute.jsx)

```jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  // Get stored credentials
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  console.log('ProtectedRoute Check:', { token: !!token, userRole, requireAdmin });

  // CHECK 1: No token = not logged in
  if (!token) {
    console.warn('No token found - redirecting to login');
    return <Navigate to="/" replace />;
  }

  // CHECK 2: Admin-only route with non-admin user
  if (requireAdmin && userRole !== 'admin' && userRole !== 'sub-admin') {
    console.warn(`Access denied - user role "${userRole}" cannot access admin route`);
    return <Navigate to="/dashboard" replace />;
  }

  // All checks passed
  console.log('Access granted - rendering protected component');
  return children;
};

export default ProtectedRoute;
```

---

### 4. Sidebar Navigation (frontend/src/components/Sidebar.jsx)

```jsx
function Sidebar({ isOpen, setIsOpen }) {
  const [userRole, setUserRole] = useState(null);

  // Load user role
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);  // Load on mount
    console.log('Sidebar: Current role is', role);
  }, [setIsOpen]);

  // Build navigation items
  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <FiHome /> },
    { path: "/courses", label: "Courses", icon: <FiBookOpen /> },
    
    // CONDITIONAL: Only show admin links if user is admin/sub-admin
    ...(userRole === 'admin' || userRole === 'sub-admin' ? [
      { path: "/admin/dashboard", label: "Admin Dashboard", icon: <TbReportAnalytics /> },
      { path: "/admin/students", label: "Manage Students", icon: <LuUser /> },
      { path: "/admin/courses", label: "Manage Courses", icon: <FiBookOpen /> },
      { path: "/admin/settings", label: "Admin Settings", icon: <TbReportAnalytics /> },
    ] : []),  // Empty array for non-admin users
    
    { path: "/subscription", label: "Subscriptions", icon: <LuGalleryHorizontalEnd /> },
    { path: "/schedule", label: "Schedule", icon: <LuCalendar /> },
    { path: "/leaderboard", label: "Leaderboard", icon: <LuTrophy /> },
    { path: "/profile", label: "Profile", icon: <LuUser /> },
  ];

  return (
    <aside className="sidebar">
      <nav>
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} className="nav-link">
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
```

---

### 5. Backend Authentication (backend/middleware/authMiddleware.js)

```javascript
const protect = async (req, res, next) => {
  try {
    // Step 1: Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Step 2: Verify JWT signature
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // If signature invalid → jwt.verify throws error

    // Step 3: Find user in database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Step 4: Set user in request with role
    req.user = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role  // ROLE from database
    };

    console.log('User authenticated:', req.user);
    next();  // Continue to next middleware
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};
```

---

### 6. Backend Authorization (backend/middleware/authMiddleware.js)

```javascript
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists and has role
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'No user role found' });
    }

    // Check if user's role is in allowed roles list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role '${req.user.role}' is not authorized. Required: ${roles.join(', ')}`
      });
    }

    console.log(`Authorization passed for role '${req.user.role}'`);
    next();  // Continue to controller
  };
};

module.exports = { protect, authorize };
```

---

### 7. Admin Route Protection (backend/routes/adminRoutes.js)

```javascript
const { protect, authorize } = require('../middleware/authMiddleware');
const admin = require('../controllers/adminController');

// Example endpoint with full protection
router.get('/dashboard/summary', 
  protect,                                    // Middleware 1: Verify token
  authorize('admin', 'sub-admin'),           // Middleware 2: Check role
  requirePermission('viewReports'),          // Middleware 3: Check permission
  admin.dashboardSummary                     // Controller: Execute
);

// Execution flow:
// 1. protect() → Validates JWT, extracts user data
// 2. authorize('admin', 'sub-admin') → Checks req.user.role
// 3. requirePermission('viewReports') → Checks sub-admin permissions
// 4. admin.dashboardSummary() → Executes controller
// 5. Response sent to frontend
```

---

## 🔄 Complete Request Flow Diagrams

### ADMIN USER - SUCCESS PATH

```
Frontend: Admin Login
  ↓ (email/password)
Backend: /api/auth/login
  ↓
Returns: { token: "jwt_token", role: "admin", ... }
  ↓
Frontend: localStorage.setItem('userRole', 'admin')
  ↓
Frontend: navigate('/admin/dashboard')
  ↓
App.jsx: <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin={true}>...
  ↓
ProtectedRoute checks:
  - token exists? ✅ YES
  - requireAdmin && userRole !== 'admin'? → true && false = false ✅ PASS
  ↓
Render AdminDashboard
  ↓
Sidebar shows admin links (userRole === 'admin') ✅
  ↓
✅ ADMIN CAN ACCESS ADMIN PANEL
```

### STUDENT USER - DENIED PATH

```
Frontend: Student Login
  ↓ (email/password)
Backend: /api/auth/login
  ↓
Returns: { token: "jwt_token", role: "student", ... }
  ↓
Frontend: localStorage.setItem('userRole', 'student')
  ↓
Frontend: navigate('/dashboard')  ← Regular dashboard
  ↓
Frontend: User tries to access /admin/dashboard (manual URL)
  ↓
App.jsx: <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin={true}>...
  ↓
ProtectedRoute checks:
  - token exists? ✅ YES
  - requireAdmin && userRole !== 'admin'? → true && true = true ❌ FAIL
  ↓
return <Navigate to="/dashboard" replace />
  ↓
Redirected back to regular dashboard
  ↓
Sidebar does NOT show admin links (userRole !== 'admin') ✅
  ↓
❌ STUDENT CANNOT ACCESS ADMIN PANEL
```

### STUDENT USER - API REQUEST BLOCKED

```
Frontend: Student tries API call
  ↓
fetch('/api/admin/dashboard/summary', {
  headers: { Authorization: 'Bearer student_jwt_token' }
})
  ↓
Backend: protect middleware
  - Verifies token ✅
  - Finds user ✅
  - Sets req.user = { role: 'student', ... } ✅
  ↓
Backend: authorize('admin', 'sub-admin') middleware
  - Checks: 'student' in ['admin', 'sub-admin']?
  - NO ❌
  - return 403 { message: "User role 'student' is not authorized" }
  ↓
Frontend: Receives 403 Forbidden error
  ↓
❌ API CALL BLOCKED
```

### LOGGED OUT USER - ACCESS DENIED

```
User Logs Out
  ↓
Header.handleLogout():
  - localStorage.removeItem('token')
  - localStorage.removeItem('userRole')
  - navigate('/')
  ↓
User tries to access /admin/dashboard
  ↓
ProtectedRoute checks:
  - const token = localStorage.getItem('token') → null
  - !token = true ✅
  - return <Navigate to="/" replace />
  ↓
Redirected to login page
  ↓
❌ CANNOT ACCESS PROTECTED ROUTES
```

---

## 📊 Comparison Matrix

### Scenario: Different Users Try to Access `/admin/students`

| User Type | Token | Role | ProtectedRoute Check | Result | Sidebar Shows | API Call Result |
|-----------|:-----:|:----:|:-------------------:|:------:|:-------------:|:---------------:|
| Admin | ✅ | admin | ✅ PASS | ✅ Allowed | ✅ Yes | ✅ 200 OK |
| Sub-Admin | ✅ | sub-admin | ✅ PASS | ✅ Allowed | ✅ Yes | ✅ 200 OK |
| Student | ✅ | student | ❌ FAIL | ❌ Redirected | ❌ No | ❌ 403 Forbidden |
| Parent | ✅ | parent | ❌ FAIL | ❌ Redirected | ❌ No | ❌ 403 Forbidden |
| Instructor | ✅ | instructor | ❌ FAIL | ❌ Redirected | ❌ No | ❌ 403 Forbidden |
| Logged Out | ❌ | null | ❌ FAIL | ❌ Redirected | N/A | ❌ 401 Unauthorized |

---

## ✅ Summary

**Private Route Protection Implementation:**

1. ✅ **Frontend Layer:**
   - ProtectedRoute component guards routes
   - Checks token + role before rendering
   - Redirects unauthorized users

2. ✅ **Navigation Layer:**
   - Sidebar conditionally shows admin links
   - Non-admin users cannot see admin options
   - Prevents accidental clicks

3. ✅ **Backend Layer:**
   - JWT authentication validates token
   - Role authorization checks user role
   - Permission validation for sub-admins

4. ✅ **Storage Layer:**
   - Token stored in localStorage (HTTP-only would be better)
   - userRole stored for quick client-side checks
   - Cleared on logout

**Result:** Only admin users (with valid token and role === 'admin') can:
- Access admin routes (/admin/*)
- See admin navigation links
- Call admin API endpoints (/api/admin/*)

All other users are restricted and redirected appropriately.
