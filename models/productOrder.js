/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const ProductOrderSchema = new mongoose.Schema(
    {
        ordered_by: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        ordered_date: {
            type: Date,
            default: new Date(),
            required: false,
        },
        ordered_status: {
            type: String,
            enum: ['ORDERED', 'ACCEPTED', 'REJECTED'],
            default: 'ORDERED',
        },
        note: [{
            message: String,
            message_date: {
                type: Date,
                default: new Date(),
                required: false,
            },
        }]
    },
    {
        timestamps: true,
    },
);

const ProductOrder = mongoose.model('ProductOrder', ProductOrderSchema);

module.exports = ProductOrder;
