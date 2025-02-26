const mongoose = require("mongoose");
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

const { Schema } = mongoose;
const { ObjectId } = mongoose.Types;


const AuthTokenSchema = new Schema({
    user: { type: ObjectId, required: true, ref: 'User' },
    type: { type: String, required: true, enum: ['sms', 'email'] },
    token: { type: String, required: true },
    validTill: Date,
    issuedAt: { type: Date, required: true },
}, {

    /**
     * Name of the collection
     * 
     * @var string
     */
    collection: "authentication:auth_tokens"
});

AuthTokenSchema.plugin(mongooseLeanVirtuals);

module.exports = AuthTokenSchema;