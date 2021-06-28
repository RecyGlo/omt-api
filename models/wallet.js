/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const WalletSchema = new mongoose.Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    wallet_account_no: {
      type: String,
    },
    balance: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INUSE', 'INACTIVE', 'DELETED'],
      default: 'ACTIVE',
    },
    transactions: [{
      description: String,
      amount: Number,
      time: {
        type: Date,
        default: new Date(),
      }
    }],
  },
  {
    timestamps: true,
  },
);

const Wallet = mongoose.model('Wallet', WalletSchema);

module.exports = Wallet;
