const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  address: String,
  latitude: Number,
  longitude: Number,
  status: { type: String, default: 'active' },
  register_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
