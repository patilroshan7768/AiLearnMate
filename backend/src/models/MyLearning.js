const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const MyLearning = sequelize.define('MyLearning', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    playlistId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    playlistTitle: {
        type: DataTypes.STRING,
        allowNull: false
    },
    thumbnail: {
        type: DataTypes.STRING,
        allowNull: true
    },
    channelName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    videoPath: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mimeType: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isLocal: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'my_learning',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['userId', 'playlistId']
        }
    ]
});

// Define associations
MyLearning.belongsTo(User, { foreignKey: 'userId', as: 'student' });
User.hasMany(MyLearning, { foreignKey: 'userId', as: 'savedCourses' });

module.exports = MyLearning;
