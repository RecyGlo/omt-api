/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const ItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        group: {
            type: String,
            enum: ['Plastic', 'Glass', 'E-Waste', 'Paper', 'Metal', 'Other'],
            default: 'Other'
        },
        image: [{
            type: String,
            required: true,
        }],
        description: {
            type: String,
        },
        price: [{
            _id: false,
            min_price: {
                type: String,
                required: true,
            },
            max_price: {
                type: String,
                required: true,
            },
            currency: {
                type: String,
                required: true,
            },
            unit: {
                type: String,
                required: true,
            },
            added_date: {
                type: Date,
                default: new Date(),
                required: false,
            },
            added_by: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: false,
            },
        }],
        approved: {
            type: Boolean,
            required: true,
        },

    },
    {
        timestamps: true,
    },
);

const Item = mongoose.model('Item', ItemSchema);

module.exports = Item;
