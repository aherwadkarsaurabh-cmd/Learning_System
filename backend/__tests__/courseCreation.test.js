const request = require('supertest');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('../server');
const User = require('../models/userModel');
const Course = require('../models/courseModel');

// Test data
const adminUser = {
  fullName: 'Test Admin',
  email: `admin_${Date.now()}@test.com`,
  password: 'password123',
  role: 'admin'
};

const instructorUser = {
  fullName: 'Test Instructor',
  email: `instructor_${Date.now()}@test.com`,
  password: 'password123',
  role: 'instructor'
};

const courseData = {
  title: 'Test Course',
  description: 'A test course description',
  category: 'Technology',
  level: 'Beginner',
  price: 999,
  duration: '4 weeks',
  thumbnail: 'https://example.com/thumbnail.jpg'
};

describe('Course Creation Tests', () => {
  let adminToken;
  let instructorToken;
  let adminId;
  let instructorId;

  // Setup - Create test users
  beforeAll(async () => {
    try {
      // Create admin user
      const adminRes = await request(app)
        .post('/api/auth/register')
        .send(adminUser);
      adminToken = adminRes.body.token;
      adminId = adminRes.body.user._id;

      // Create instructor user
      const instructorRes = await request(app)
        .post('/api/auth/register')
        .send(instructorUser);
      instructorToken = instructorRes.body.token;
      instructorId = instructorRes.body.user._id;

      // Update roles in database
      await User.findByIdAndUpdate(adminId, { role: 'admin' });
      await User.findByIdAndUpdate(instructorId, { role: 'instructor' });
    } catch (error) {
      console.error('Setup error:', error);
    }
  });

  // Cleanup
  afterAll(async () => {
    try {
      await User.deleteMany({ email: { $in: [adminUser.email, instructorUser.email] } });
      await Course.deleteMany({ 'instructor': { $in: [adminId, instructorId] } });
      await mongoose.connection.close();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  // Test 1: Admin can create course via /api/courses
  test('Admin should be able to create a course via /api/courses', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(courseData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(courseData.title);
    expect(res.body.data.price).toBe(courseData.price);
    expect(res.body.data.duration).toBe(courseData.duration);
  });

  // Test 2: Instructor can create course via /api/courses
  test('Instructor should be able to create a course via /api/courses', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send(courseData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(courseData.title);
    expect(res.body.data.price).toBe(courseData.price);
  });

  // Test 3: Instructor can create course via /api/instructor/courses
  test('Instructor should be able to create a course via /api/instructor/courses', async () => {
    const res = await request(app)
      .post('/api/instructor/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send(courseData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(courseData.title);
    expect(res.body.data.price).toBe(courseData.price);
  });

  // Test 4: Price field is saved correctly
  test('Course price should be saved and retrieved correctly', async () => {
    const createRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send(courseData);

    const courseId = createRes.body.data._id;

    const getRes = await request(app)
      .get(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${instructorToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.price).toBe(courseData.price);
  });

  // Test 5: Admin can update course with new price
  test('Admin should be able to update course price', async () => {
    const createRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(courseData);

    const courseId = createRes.body.data._id;
    const newPrice = 1999;

    const updateRes = await request(app)
      .put(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: newPrice });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.price).toBe(newPrice);
  });

  // Test 6: Unauthenticated user cannot create course
  test('Unauthenticated user should not be able to create a course', async () => {
    const res = await request(app)
      .post('/api/courses')
      .send(courseData);

    expect(res.status).toBe(401);
  });

  // Test 7: Student role should not be able to create course
  test('Student role should not be able to create a course', async () => {
    const studentUser = {
      fullName: 'Test Student',
      email: `student_${Date.now()}@test.com`,
      password: 'password123',
      role: 'student'
    };

    const studentRes = await request(app)
      .post('/api/auth/register')
      .send(studentUser);

    const studentToken = studentRes.body.token;

    const courseRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(courseData);

    expect(courseRes.status).toBe(403);

    // Cleanup
    const studentId = studentRes.body.user._id;
    await User.deleteOne({ _id: studentId });
  });
});
