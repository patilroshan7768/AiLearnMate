const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Course = require('./Course');

const Lecture = sequelize.define('Lecture', {
  lecture_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  course_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'course_id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  video_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  transcript: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ai_summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  lecture_type: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'lectures',
  timestamps: true
});

// Define associations
Lecture.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Course.hasMany(Lecture, { foreignKey: 'course_id', as: 'lectures' });

module.exports = Lecture;
