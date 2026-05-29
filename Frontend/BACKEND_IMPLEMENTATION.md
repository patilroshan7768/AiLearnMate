# Backend Implementation Guide for "Add to My Learning"

To fully support the "Add to My Learning" feature, please update your backend with the following code.

## 1. Create/Update Course Controller (`controllers/courseController.js`)

Add this new function to handle course enrollment.

```javascript
// controllers/courseController.js
const Course = require('../models/Course'); // Or EnrolledCourse model
const User = require('../models/User');

exports.addToMyLearning = async (req, res) => {
  try {
    const { userId, playlistId, playlistTitle, thumbnail, channelName, type } = req.body;

    // Validate Status
    if (!userId || !playlistId) {
      return res.status(400).json({ message: "User ID and Playlist ID are required" });
    }

    // Check if checks user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if course already exists in user's enrolled list
    // Assuming 'enrolledCourses' is an array in User model, or a separate collection
    // OPTION A: If stored in User model
    const isEnrolled = user.enrolledCourses.some(c => c.playlistId === playlistId);
    if (isEnrolled) {
      return res.status(400).json({ message: "Course already added to My Learning" });
    }

    // Create new course object
    const newCourse = {
      playlistId,
      title: playlistTitle,
      thumbnail,
      instructor: channelName,
      type: type || 'youtube',
      enrolledAt: new Date()
    };

    // Add to user's list
    user.enrolledCourses.push(newCourse);
    await user.save();

    // OPTION B: If using a separate EnrolledCourse model
    /*
    const existing = await EnrolledCourse.findOne({ userId, playlistId });
    if (existing) return res.status(400).json({ message: "Already enrolled" });
    
    await EnrolledCourse.create({ userId, ...newCourse });
    */

    res.status(200).json({ message: "Course added successfully", course: newCourse });

  } catch (error) {
    console.error("Add to My Learning Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
```

## 2. Update Routes (`routes/courseRoutes.js`)

Add the POST endpoint.

```javascript
// routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware'); // Verify token

// Route: POST /api/my-learning/add
router.post('/my-learning/add', authMiddleware, courseController.addToMyLearning);

module.exports = router;
```

## 3. Update User Model (`models/User.js`)

Ensure your User schema can store these courses.

```javascript
// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // ... existing fields (name, email, password)
  
  enrolledCourses: [
    {
      playlistId: String,
      title: String,
      thumbnail: String,
      instructor: String,
      type: { type: String, default: 'youtube' },
      progress: { type: Number, default: 0 },
      enrolledAt: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
```

## 4. Server Entry Point (`server.js` or `app.js`)

Ensure the routes are mounted correctly.

```javascript
const courseRoutes = require('./routes/courseRoutes');

// ...
app.use('/api', courseRoutes); 
// This ensures /api/my-learning/add works
```
