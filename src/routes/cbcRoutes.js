const router = require('express').Router();
const ctrl = require('../controllers/cbcController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/template', ctrl.getTemplate);
router.get('/find-patient/:patientId', ctrl.findPatient);
router.post('/', ctrl.create);
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;