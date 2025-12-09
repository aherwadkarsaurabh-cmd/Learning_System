#!/usr/bin/env node

/**
 * COURSE CREATION FIX VERIFICATION SCRIPT
 * 
 * This script validates that:
 * 1. Admin can create courses via /api/courses
 * 2. Instructor can create courses via /api/courses
 * 3. Instructor can create courses via /api/instructor/courses
 * 4. Price field is properly saved and retrieved
 * 5. Authorization is correctly enforced
 */

const axios = require('axios');
const colors = require('colors');

const API_BASE = process.env.API_BASE || 'http://localhost:5000';
let testResults = { passed: 0, failed: 0, errors: [] };

async function registerUser(fullName, email, password, role) {
  try {
    const res = await axios.post(`${API_BASE}/api/auth/register`, {
      fullName,
      email,
      password,
      role
    });
    return { token: res.data.token, userId: res.data.user._id, user: res.data.user };
  } catch (error) {
    throw new Error(`Failed to register ${role}: ${error.response?.data?.message || error.message}`);
  }
}

async function createCourse(endpoint, token, courseData) {
  try {
    const res = await axios.post(`${API_BASE}${endpoint}`, courseData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    throw new Error(`Failed to create course: ${error.response?.data?.message || error.message}`);
  }
}

async function getCourse(courseId, token) {
  try {
    const res = await axios.get(`${API_BASE}/api/courses/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    throw new Error(`Failed to fetch course: ${error.response?.data?.message || error.message}`);
  }
}

function logTest(name, passed, message = '') {
  if (passed) {
    console.log(`✅ ${name}`.green);
    testResults.passed++;
  } else {
    console.log(`❌ ${name}`.red);
    if (message) console.log(`   ${message}`.yellow);
    testResults.failed++;
  }
}

function logSection(title) {
  console.log(`\n${'═'.repeat(70)}`.cyan);
  console.log(`  ${title}`.cyan);
  console.log(`${'═'.repeat(70)}`.cyan);
}

async function runTests() {
  console.log('\n🚀 COURSE CREATION FIX VERIFICATION'.blue.bold);
  console.log(`API Base: ${API_BASE}`.blue);

  let adminToken, instructorToken, adminUserId, instructorUserId;
  const courseData = {
    title: `Test Course ${Date.now()}`,
    description: 'A comprehensive test course with all required fields',
    category: 'Technology',
    level: 'Beginner',
    price: 1999,
    duration: '8 weeks',
    thumbnail: 'https://example.com/thumb.jpg'
  };

  try {
    // ==================== USER REGISTRATION ====================
    logSection('1. USER REGISTRATION');

    try {
      const adminRes = await registerUser(
        'Test Admin',
        `admin_${Date.now()}@test.com`,
        'password123',
        'admin'
      );
      adminToken = adminRes.token;
      adminUserId = adminRes.userId;
      logTest('Admin Registration', true);
    } catch (err) {
      logTest('Admin Registration', false, err.message);
      testResults.errors.push(err.message);
      return;
    }

    try {
      const instructorRes = await registerUser(
        'Test Instructor',
        `instructor_${Date.now()}@test.com`,
        'password123',
        'instructor'
      );
      instructorToken = instructorRes.token;
      instructorUserId = instructorRes.userId;
      logTest('Instructor Registration', true);
    } catch (err) {
      logTest('Instructor Registration', false, err.message);
      testResults.errors.push(err.message);
      return;
    }

    // ==================== ADMIN COURSE CREATION ====================
    logSection('2. ADMIN COURSE CREATION');

    let adminCourseId;
    try {
      const course = await createCourse('/api/courses', adminToken, courseData);
      adminCourseId = course.data._id || course._id;
      logTest('Admin can create course via /api/courses', true);
    } catch (err) {
      logTest('Admin can create course via /api/courses', false, err.message);
      testResults.errors.push(err.message);
    }

    // ==================== INSTRUCTOR COURSE CREATION ====================
    logSection('3. INSTRUCTOR COURSE CREATION');

    let instructorCourseId1;
    try {
      const course = await createCourse('/api/courses', instructorToken, courseData);
      instructorCourseId1 = course.data._id || course._id;
      logTest('Instructor can create course via /api/courses', true);
    } catch (err) {
      logTest('Instructor can create course via /api/courses', false, err.message);
      testResults.errors.push(err.message);
    }

    let instructorCourseId2;
    try {
      const course = await createCourse('/api/instructor/courses', instructorToken, courseData);
      instructorCourseId2 = course.data._id || course._id;
      logTest('Instructor can create course via /api/instructor/courses', true);
    } catch (err) {
      logTest('Instructor can create course via /api/instructor/courses', false, err.message);
      testResults.errors.push(err.message);
    }

    // ==================== PRICE FIELD VERIFICATION ====================
    logSection('4. PRICE FIELD VERIFICATION');

    if (adminCourseId) {
      try {
        const course = await getCourse(adminCourseId, adminToken);
        const priceMatches = course.price === courseData.price;
        logTest(
          `Price saved correctly (Expected: ${courseData.price}, Got: ${course.price})`,
          priceMatches,
          priceMatches ? '' : 'Price mismatch'
        );
      } catch (err) {
        logTest('Fetch admin course to verify price', false, err.message);
        testResults.errors.push(err.message);
      }
    }

    if (instructorCourseId1) {
      try {
        const course = await getCourse(instructorCourseId1, instructorToken);
        const priceMatches = course.price === courseData.price;
        const durationMatches = course.duration === courseData.duration;
        logTest(
          `Price and duration saved correctly`,
          priceMatches && durationMatches,
          `Price: ${course.price}, Duration: ${course.duration}`
        );
      } catch (err) {
        logTest('Fetch instructor course to verify price', false, err.message);
        testResults.errors.push(err.message);
      }
    }

    // ==================== AUTHORIZATION TESTS ====================
    logSection('5. AUTHORIZATION & PERMISSION TESTS');

    // Test unauthorized access
    try {
      await axios.post(`${API_BASE}/api/courses`, courseData);
      logTest('Unauthenticated user cannot create course', false, 'Should have been rejected');
    } catch (err) {
      const isUnauthorized = err.response?.status === 401;
      logTest('Unauthenticated user cannot create course', isUnauthorized, 
        isUnauthorized ? '' : `Got status ${err.response?.status}`);
    }

    // Test student cannot create course
    try {
      const studentRes = await registerUser(
        'Test Student',
        `student_${Date.now()}@test.com`,
        'password123',
        'student'
      );
      
      try {
        await createCourse('/api/courses', studentRes.token, courseData);
        logTest('Student cannot create course', false, 'Should have been rejected');
      } catch (err) {
        const isForbidden = err.response?.status === 403;
        logTest('Student cannot create course', isForbidden,
          isForbidden ? '' : `Got status ${err.response?.status}`);
      }
    } catch (err) {
      logTest('Student role rejection test', false, 'Could not test');
    }

    // ==================== FIELD VALIDATION ====================
    logSection('6. REQUIRED FIELDS VALIDATION');

    // Test missing title
    try {
      const invalidData = { ...courseData };
      delete invalidData.title;
      await createCourse('/api/courses', adminToken, invalidData);
      logTest('Missing title should be rejected', false, 'Should have failed validation');
    } catch (err) {
      const isValidationError = err.response?.status === 400;
      logTest('Missing title is properly validated', isValidationError);
    }

    // Test missing description
    try {
      const invalidData = { ...courseData };
      delete invalidData.description;
      await createCourse('/api/courses', instructorToken, invalidData);
      logTest('Missing description should be rejected', false, 'Should have failed validation');
    } catch (err) {
      const isValidationError = err.response?.status === 400;
      logTest('Missing description is properly validated', isValidationError);
    }

    // ==================== RESPONSE FORMAT ====================
    logSection('7. RESPONSE FORMAT VERIFICATION');

    if (adminCourseId) {
      try {
        const course = await createCourse('/api/courses', adminToken, courseData);
        const hasRequiredFields = course.data && 
          course.data._id && 
          course.data.title && 
          course.data.price !== undefined &&
          course.data.duration &&
          course.data.instructor;
        
        logTest('Response includes all required fields', hasRequiredFields,
          hasRequiredFields ? '' : 'Missing required fields in response');
      } catch (err) {
        logTest('Response format validation', false, err.message);
      }
    }

  } catch (error) {
    console.error('\n💥 Unexpected error during tests:'.red.bold, error.message);
    testResults.errors.push(error.message);
  }

  // ==================== SUMMARY ====================
  logSection('TEST SUMMARY');
  const total = testResults.passed + testResults.failed;
  const percentage = total > 0 ? Math.round((testResults.passed / total) * 100) : 0;
  
  console.log(`\n📊 Results: ${testResults.passed}/${total} tests passed (${percentage}%)`.bold);
  
  if (testResults.failed > 0) {
    console.log(`\n⚠️  ${testResults.failed} test(s) failed`.yellow.bold);
    if (testResults.errors.length > 0) {
      console.log('\nErrors:'.red.bold);
      testResults.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`.red);
      });
    }
  }

  if (testResults.failed === 0 && testResults.passed > 0) {
    console.log('\n✨ All tests passed! Course creation fixes are working correctly.'.green.bold);
  }

  console.log('\n' + '═'.repeat(70) + '\n');
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:'.red.bold, err);
  process.exit(2);
});
