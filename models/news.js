/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const NewsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    image: [{
      type: String,
      required: true,
    }],
    uploaded_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    edited_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    publishedDate: {
      type: Date,
      default: new Date(),
      required: false,
    },
    approved: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const News = mongoose.model('News', NewsSchema);

module.exports = News;
