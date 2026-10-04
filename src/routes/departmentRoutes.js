const router = require('express').Router();
const ctrl = require('../controllers/departmentController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.post('/', ctrl.create);
router.get('/', ctrl.list);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
module.exports = router;