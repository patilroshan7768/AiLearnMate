const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Lecture = require('./Lecture');
const MyLearning = require('./MyLearning');

const Flashcard = sequelize.define('Flashcard', {
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
  content: {
    type: DataTypes.JSON, // Storing array of { question, answer }
    allowNull: false
  }
}, {
  tableName: 'flashcards',
  timestamps: true
});

// Define associations
Flashcard.belongsTo(Lecture, { foreignKey: 'lecture_id', as: 'lecture' });
Lecture.hasOne(Flashcard, { foreignKey: 'lecture_id', as: 'flashcard' });

Flashcard.belongsTo(MyLearning, { foreignKey: 'my_learning_id', as: 'myLearning' });
MyLearning.hasOne(Flashcard, { foreignKey: 'my_learning_id', as: 'flashcard' });

module.exports = Flashcard;
