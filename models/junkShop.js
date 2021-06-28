/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2')

const { Schema } = mongoose;

const JunkShopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    location: {
      address: String,
      coordinate: {
        lat: Schema.Types.Number,
        lng: Schema.Types.Number,
      },
    },
    image: {
      type: String,
      required: false,
    },
    phoneNumber: {
      type: String,
      required: false,
    },
    added_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approve_status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    town: {
      type: String,
      required: false,
    },
    ward: {
      type: String,
      required: false,
    },
    approve_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

JunkShopSchema.plugin(mongoosePaginate);

const JunkShop = mongoose.model('JunkShop', JunkShopSchema);

JunkShop.paginate().then({});

module.exports = JunkShop;
