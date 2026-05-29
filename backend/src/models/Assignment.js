const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Course = require('./Course');

const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'assignment_id'
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
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false
  },
  marks: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'assignments',
  timestamps: true
});

// Associations
Assignment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Course.hasMany(Assignment, { foreignKey: 'course_id', as: 'assignments' });

module.exports = Assignment;
