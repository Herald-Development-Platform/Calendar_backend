const mongoose = require('mongoose');
const BaseMongooseSchema = require('./base.schema');

const blockSchema = new BaseMongooseSchema({
    name: { type: String, required: true, unique: true },
});

const blockModel = mongoose.model('Block', blockSchema);
module.exports = blockModel;
