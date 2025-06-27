const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const haversine = require('../utils/distance');


const registerUser = async (req, res) => {
  try {
    const { name, email, password, address, latitude, longitude } = req.body;

    if (!name || !email || !password || !address || !latitude || !longitude)
      return res.status(400).json({ message: 'All fields are required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already used' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      address,
      latitude,
      longitude,
      status: 'active',
      register_at: new Date()
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      status_code: "200",
      message: "User registered successfully",
      data: {
        name: user.name,
        email: user.email,
        address: user.address,
        latitude: user.latitude,
        longitude: user.longitude,
        status: user.status,
        register_at: user.register_at,
        token: token
      }
    });
  } catch (err) {
    res.status(500).json({ status_code: "500", message: "Server error", error: err.message });
  }
};

// Toggle All Users Status
const toggleStatus = async (req, res) => {
  try {
    await User.updateMany({}, [
      {
        $set: {
          status: {
            $cond: [{ $eq: ["$status", "active"] }, "inactive", "active"]
          }
        }
      }
    ]);

    res.status(200).json({ status_code: "200", message: "All users' status toggled" });
  } catch (err) {
    res.status(500).json({ status_code: "500", message: "Error toggling status", error: err.message });
  }
};

//  Distance API
const getDistance = async (req, res) => {
  try {
    const { destination_lat, destination_long } = req.query;
    const user = req.user;

    if (!destination_lat || !destination_long)
      return res.status(400).json({ message: "Destination coordinates required" });

    const distance = haversine(user.latitude, user.longitude, destination_lat, destination_long);

    res.status(200).json({
      status_code: "200",
      message: "Distance calculated",
      distance
    });
  } catch (err) {
    res.status(500).json({ status_code: "500", message: "Distance error", error: err.message });
  }
};

// User Listing by Weekday
const getUserListing = async (req, res) => {
  try {
    const weekParam = req.query.week_number; 
    if (!weekParam) return res.status(400).json({ message: "week_number required" });

    const weekNumbers = weekParam.split(',').map(n => parseInt(n));
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    const users = await User.aggregate([
      {
        $addFields: {
          week_day: { $dayOfWeek: "$register_at" } 
        }
      },
      {
        $match: {
          week_day: { $in: weekNumbers.map(num => (num + 1)) } 
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          week_day: 1
        }
      }
    ]);

    const grouped = {};
    for (const num of weekNumbers) {
      grouped[days[num]] = [];
    }

    users.forEach(user => {
      const dayIndex = user.week_day - 1; 
      const dayName = days[dayIndex];
      if (grouped[dayName]) {
        grouped[dayName].push({ name: user.name, email: user.email });
      }
    });

    res.status(200).json({
      status_code: "200",
      message: "Users grouped by day",
      data: grouped
    });

  } catch (err) {
    res.status(500).json({ status_code: "500", message: "Listing error", error: err.message });
  }
};

module.exports = {
  registerUser,
  toggleStatus,
  getDistance,
  getUserListing
};
