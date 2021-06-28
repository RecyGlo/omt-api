/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const RVMSchema = new mongoose.Schema(
  {
    // type: {
    //   type: String,
    // },
    // time: {
    //   type: Number,
    // },
    // data: {
    //   nickname: {
    //     type: String,
    //   },
    //   mobile: {
    //     type: String,
    //   },
    //   weight: {
    //     type: Number,
    //   },
    //   terminalno: {
    //     type: String,
    //   },
    //   material_detail: {
    //     type: String,
    //   },
    //   point: {
    //     type: Number,
    //   },
    //   goods: {
    //     type: String,
    //   },
    //   operator: {
    //     type: String,
    //   },
    //   opmobile: {
    //     type: String,
    //   },
    // },
    machineNo: {
      type: String,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INUSE', 'INACTIVE', 'DELETED'],
      default: 'ACTIVE',
    },
    location: {
      address: String,
      coordinate: {
        lat: Schema.Types.Number,
        lng: Schema.Types.Number,
      },
    },
    isFull: {
      type: Boolean,
      default: false,
    },
    isDoorOpen: {
      type: Boolean,
      default: false,
    },
    qrCode: {
      type: String,
    },
    adsImage: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const RVM = mongoose.model('RVM', RVMSchema);

module.exports = RVM;
