const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Course = require('./Course');
const Lecture = require('./Lecture');
const MyLearning = require('./MyLearning');

const Quiz = sequelize.define('Quiz', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'quiz_id'
  },
  course_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'courses',
      key: 'course_id'
    }
  },
  lecture_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'lectures',
      key: 'lecture_id'
    }
  },
  my_learning_id: {
    type: DataTypes.INTEGER, // Keep my_learning_id as integer since my_learning table id remains integer
    allowNull: true,
    references: {
      model: 'my_learning',
      key: 'id'
    }
  },
  ai_generated: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  timer: {
    type: DataTypes.INTEGER, // in minutes
    defaultValue: 10
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    defaultValue: 'medium'
  },
  questions: {
    type: DataTypes.JSON, // Array of { question, options, answer }
    allowNull: false
  }
}, {
  tableName: 'quizzes',
  timestamps: true
});

// Associations
Quiz.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Course.hasMany(Quiz, { foreignKey: 'course_id', as: 'quizzes' });

Quiz.belongsTo(Lecture, { foreignKey: 'lecture_id', as: 'lecture' });
Lecture.hasOne(Quiz, { foreignKey: 'lecture_id', as: 'quiz' });

Quiz.belongsTo(MyLearning, { foreignKey: 'my_learning_id', as: 'myLearning' });
MyLearning.hasOne(Quiz, { foreignKey: 'my_learning_id', as: 'quiz' });

module.exports = Quiz;
