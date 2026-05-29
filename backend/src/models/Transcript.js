const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Lecture = require('./Lecture');
const MyLearning = require('./MyLearning');

const Transcript = sequelize.define('Transcript', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'my_learning',
      key: 'id'
    }
  },
  transcript: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'transcripts',
  timestamps: true
});

// Define associations
Transcript.belongsTo(Lecture, { foreignKey: 'lecture_id', as: 'lecture' });
Lecture.hasOne(Transcript, { foreignKey: 'lecture_id', as: 'lectureTranscript' });

Transcript.belongsTo(MyLearning, { foreignKey: 'my_learning_id', as: 'myLearning' });
MyLearning.hasOne(Transcript, { foreignKey: 'my_learning_id', as: 'transcript' });

module.exports = Transcript;
