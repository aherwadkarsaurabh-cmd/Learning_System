import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import AppLayout from '../../components/AppLayout';
import CreateCourseModal from '../../components/CreateCourseModal';

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const userRole = localStorage.getItem('userRole') || 'student';
  const [deletingIds, setDeletingIds] = useState(new Set());

  const handleDelete = async (courseId) => {
    try {
      setDeletingIds(prev => new Set(prev).add(courseId));
      const res = await axiosClient.delete(`/api/courses/${courseId}`);
      await loadCourses();
      alert(res?.data?.message || 'Course deleted');
    } catch (err) {
      console.error('Failed to delete course', err);
      alert('Failed to delete course: ' + (err.response?.data?.message || err.message));
    }
    finally {
      setDeletingIds(prev => {
        const s = new Set(prev);
        s.delete(courseId);
        return s;
      });
    }
  };

  const loadCourses = async () => {
    try {
      const res = await axiosClient.get('/api/admin/courses');
      setCourses(res.data.data || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  if (loading) return <AppLayout><div style={{ padding: '20px', textAlign: 'center' }}>Loading courses...</div></AppLayout>;

  return (
    <AppLayout showGreeting={false}>
      {/* FORM SECTION */}
      {showForm && (
        <div style={{
          background: '#fff',
          borderRadius: '15px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3>Add New Course</h3>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowForm(false)}
              style={{ padding: '8px 16px' }}
            >
              ✕ Close
            </button>
          </div>
          <CreateCourseModal
            isOpen={true}
            onClose={() => setShowForm(false)}
            onSuccess={() => {
              loadCourses();
              setShowForm(false);
            }}
          />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Courses</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Hide Form" : "Add Course"}
        </button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Level</th>
            <th>Status</th>
            <th>Duration (hrs)</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c._id}>
              <td>{c.title}</td>
              <td>{c.category}</td>
              <td>{c.level}</td>
              <td>{c.status}</td>
              <td>
                {c.durationHours}
                {(userRole === 'admin' || userRole === 'instructor') && (
                  <button
                    onClick={() => handleDelete(c._id)}
                    style={{ marginLeft: 12, padding: '6px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: 4, cursor: deletingIds.has(c._id) ? 'not-allowed' : 'pointer', opacity: deletingIds.has(c._id) ? 0.6 : 1 }}
                    disabled={deletingIds.has(c._id)}
                    title="Delete course"
                  >{deletingIds.has(c._id) ? 'Deleting…' : 'Delete'}</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AppLayout>
  );
};

export default AdminCourses;
