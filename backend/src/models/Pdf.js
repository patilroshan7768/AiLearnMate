const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Course = require('./Course');

const Pdf = sequelize.define('Pdf', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'pdf_id'
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
    allowNull: true
  },
  pdf_url: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'pdfs',
  timestamps: true
});

// Define associations
Pdf.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Course.hasMany(Pdf, { foreignKey: 'course_id', as: 'pdfs' });

module.exports = Pdf;
