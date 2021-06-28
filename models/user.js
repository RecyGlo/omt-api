/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: true,
    },
    facebook_account_id: {
      type: String,
      required: false,
    },
    google_account_id: {
      type: String,
      required: false,
    },
    apple_account_id: {
      type: String,
      required: false,
    },
    location: {
      address: String,
      coordinate: {
        lat: Schema.Types.Number,
        lng: Schema.Types.Number,
      },
    },
    type: {
      type: String,
      enum: ['ADMIN', 'CUSTOMER', 'COLLECTOR', 'EDITOR'],
      default: 'CUSTOMER',
    },
    permission: {
      item: Boolean,
      junk_shop: Boolean,
      news: Boolean
    },
    phoneNumber: {
      type: String,
      required: false,
    },
    profileImage: {
      type: String,
    },
    isConfirm: {
      type: Boolean,
      default: false,
    },
    device_id: {
      type: String,
      required: false,
    }
  },
  {
    timestamps: true,
  },
);

UserSchema.pre('save', async function (next) {
  if (this._doc.password) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this._doc.password, salt);
    this._doc.password = hash;
  }
  next();
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
