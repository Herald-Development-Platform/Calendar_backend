const { StatusCodes } = require("http-status-codes");

const errorHandler = (err, req, res, next) => {
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = {};
        for (let field in err.errors) {
            errors[field] = err.errors[field].message;
        }
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            validationErrors: errors
        });
    }

    if (err.name === "MongoServerError") {
        console.log({ ...err })
        if (err.code === 11000) {
            let errorObject = {
                success: false,
                validationErrors: {}
            };
            errorObject.validationErrors[Object.keys(err.keyValue)[0]] = `The value '${Object.values(err.keyValue)[0]}' is duplicate.`;
            return res.status(StatusCodes.BAD_REQUEST).json(errorObject);
        }
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Some Internal Server Error!", message: err.message });
    }

    if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid JSON!", message: err.message });
    }

    // Other errors
    console.error(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Some Internal Server Error!", message: err.message });
};


module.exports = errorHandler;