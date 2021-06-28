/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const NotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      required: false,
    },
    category: {
      type: String,
      required: false,
    },
    all_user: {
      type: Boolean,
      default: false,
    },
    user: {                 // sent_to
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    content_id: {           // product_id or news_id 
      type: String,
      required: false,
    }
    
  },
  {
    timestamps: true,
  },
);

const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = Notification;
