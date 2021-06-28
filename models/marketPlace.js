/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const MarketPlaceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        image: [{
            type: String,
            required: false,
        }],
        description: {
            type: String,
            required: false,
        },
        price: {
            type: String,
            required: false,
        },
        category: {
            type: String,
            required: false,
        },
        product_status: {
            type: String,
            enum: ['AVAILABLE', 'ACCEPTED', 'HIDE', 'DELETE'],
            default: 'AVAILABLE',
        },
        uploaded_by: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        uploaded_date: {
            type: Date,
            default: new Date(),
            required: false,
        },
        saved_by: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        }],
        ordered_list: [{
            _id: false,
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
                _id: false,
                message: String,
                message_by: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                message_date: {
                    type: Date,
                    default: new Date(),
                    required: false,
                },

            }]
        }],
        purchased_by: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        purchased_date: {
            type: Date,
            default: new Date(),
            required: false,
        },
    },
    {
        timestamps: true,
    },
);

const MarketPlace = mongoose.model('MarketPlace', MarketPlaceSchema);

module.exports = MarketPlace;
