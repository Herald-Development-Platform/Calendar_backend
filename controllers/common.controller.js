const { StatusCodes } = require("http-status-codes");

const models = require('../models/index.model');

const createLocation = async (req, res, next) => {
    try {
        const location = await new models.locationModel(req.body).save();
        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Location created successfully',
            data: location
        });
    } catch (error) {
        next(error);
    }
} 

const getLocations = async (req, res, next) => {
    try {
        const locations = await models.locationModel.find({});
        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Locations retrieved successfully',
            data: locations
        });
    } catch (error) {
        next(error);
    }
}

const deleteLocation = async (req, res, next) => {
    try {
        const exists = await models.locationModel.findById(req.params.id);
        if (!exists) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Location not found'
            });
        }
        const deleted = await models.locationModel.findByIdAndDelete(req.params.id);
        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Location deleted successfully',
            data: deleted
        });
    } catch (error) {
        next(error);
    }
}




module.exports = {
    createLocation,
    getLocations,
    deleteLocation
}
