const Log = require('../models/Log');

const logAction = async (userId, action, result = 'success') => {
  try {
    await Log.create({
      userId,
      action,
      result,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to log action:', error);
    // Don't throw error - logging should not break the application
  }
};

module.exports = { logAction };






