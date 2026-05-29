const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Assignment = require('./Assignment');
const User = require('./User');

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'submission_id'
  },
  assignment_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'assignments',
      key: 'assignment_id'
    }
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  submitted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  marks_obtained: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'submissions',
  timestamps: true
});

// Associations
Submission.belongsTo(Assignment, { foreignKey: 'assignment_id', as: 'assignment' });
Assignment.hasMany(Submission, { foreignKey: 'assignment_id', as: 'submissions' });

Submission.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
User.hasMany(Submission, { foreignKey: 'student_id', as: 'submissions' });

module.exports = Submission;
