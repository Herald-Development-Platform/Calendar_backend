
const router = require('express').Router();


// Location Routes

const locationController = require('../controllers/common.controller');

router.post('/location', locationController.createLocation);
router.get('/location', locationController.getLocations);
router.delete('/location/:id', locationController.deleteLocation);

module.exports = router;
