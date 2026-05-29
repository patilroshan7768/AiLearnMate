const Course = require('../models/Course');
const User = require('../models/User');

const getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }

    // Mock recommendation logic - ready to extend with ML/embeddings
    // For now, return courses from different categories
    const allCourses = await Course.findAll({
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Simple recommendation: return courses not created by the user
    const recommendedCourses = allCourses.filter(course => course.createdBy !== parseInt(userId));

    // If no recommendations, return all courses
    const finalRecommendations = recommendedCourses.length > 0 
      ? recommendedCourses.slice(0, 5) 
      : allCourses.slice(0, 5);

    res.status(200).json({
      success: true,
      message: 'Recommendations fetched successfully.',
      data: {
        userId: parseInt(userId),
        recommendedCourses: finalRecommendations,
        count: finalRecommendations.length
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch recommendations.', 
      error: error.message 
    });
  }
};

module.exports = { getRecommendations };






