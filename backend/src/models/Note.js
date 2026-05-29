const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Lecture = require('./Lecture');
const MyLearning = require('./MyLearning');

const Note = sequelize.define('Note', {
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
  generated_notes: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'notes',
  timestamps: true
});

// Define associations
Note.belongsTo(Lecture, { foreignKey: 'lecture_id', as: 'lecture' });
Lecture.hasOne(Note, { foreignKey: 'lecture_id', as: 'note' });

Note.belongsTo(MyLearning, { foreignKey: 'my_learning_id', as: 'myLearning' });
MyLearning.hasOne(Note, { foreignKey: 'my_learning_id', as: 'note' });

module.exports = Note;
