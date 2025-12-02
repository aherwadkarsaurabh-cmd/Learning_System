const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  enrolledAt: { type: Date, default: Date.now },
  progressPercentage: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  watchHours: { type: Number, default: 0 },
  lastAccessed: { type: Date },
  grade: { type: String },
  feedback: { type: String }
}, { timestamps: true });

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
module.exports = Enrollment;
