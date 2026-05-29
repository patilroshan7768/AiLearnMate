const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const YoutubeCache = sequelize.define("YoutubeCache", {

  topic: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  category: {
    type: DataTypes.STRING,
  },

  playlistId: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  title: {
    type: DataTypes.STRING,
  },

  thumbnail: {
    type: DataTypes.TEXT,
  },

  channel: {
    type: DataTypes.STRING,
  },

  description: {
    type: DataTypes.TEXT,
  },

  youtubePlaylistUrl: {
    type: DataTypes.TEXT,
  }

});

module.exports = YoutubeCache;