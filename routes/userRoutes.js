const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
  console.log("Test route hit");
  res.send("Test route is working");
});

const {
  registerUser,
  toggleStatus,
  getDistance,
  getUserListing
} = require('../controllers/userController');

const auth = require('../middlewares/auth');



router.post('/register', registerUser);
router.patch('/toggle-status', auth, toggleStatus);
router.get('/distance', auth, getDistance);
router.get('/listing', auth, getUserListing);

module.exports = router;
