const router = require('express').Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/dashboardController');
router.use(protect);
router.get('/stats', ctrl.getStats);
module.exports = router;