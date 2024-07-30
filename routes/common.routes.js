
const router = require('express').Router();


const { PERMISSIONS } = require('../constants/permissions.constants');
// Location Routes

const locationController = require('../controllers/common.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { checkPermissions } = require('../middlewares/permission.middleware');

router.post(
    '/location',
    verifyToken,
    checkPermissions(PERMISSIONS.CREATE_LOCATION),
    locationController.createLocation
);

router.get(
    '/location',
    verifyToken,
    locationController.getLocations
);

router.delete(
    '/location/:id',
    verifyToken,
    checkPermissions(PERMISSIONS.DELETE_DEPARTMENT),
    locationController.deleteLocation
);


// Block Routes
router.get('/block', locationController.getBlocks);
router.post('/block', locationController.createBlock);
router.delete('/block/:id', locationController.deleteBlock);

module.exports = router;
