/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const ContactSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        phone_number: [{
            type: String,
            required: false,
        }],
        category: {
            type: String,
            required: false,
        },
        added_by: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        added_date: {
            type: Date,
            default: new Date(),
            required: false,
        },
    },
    {
        timestamps: true,
    },
);

const Contact = mongoose.model('Contact', ContactSchema);

module.exports = Contact;
