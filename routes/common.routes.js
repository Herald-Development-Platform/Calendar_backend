
const router = require('express').Router();


// Location Routes

const locationController = require('../controllers/common.controller');

router.post('/location', locationController.createLocation);
router.get('/location', locationController.getLocations);
router.delete('/location/:id', locationController.deleteLocation);

// Block Routes
router.get('/block', locationController.getBlocks);
router.post('/block', locationController.createBlock);
router.delete('/block/:id', locationController.deleteBlock);

module.exports = router;
