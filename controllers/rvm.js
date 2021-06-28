/* eslint-disable consistent-return */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
const joi = require('joi');
const moment = require('moment');
const sharp = require('sharp');
const RVM = require('../models/rvm');

const GET_ALL_RVM = async (req, res) => {
  try {
    const { where } = req.query;
    let query = {};
    if (where) {
      query = JSON.parse(where);
    }
    const rvms = await RVM.find(query)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return res.status(200).send({
      data: rvms,
      message: 'Success',
    });
  } catch (error) {
    res.status(500).json(error);
  }
};


const GET_SPECIFIC_RVM = async (req, res) => {
  try {
    const { id } = req.params;
    const rvm = await RVM.findOne({ _id: id })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    if (reqs) {
      rvm.createdAt = moment(reqs.createdAt).format('DD-MM-YYYY');
      return res.status(200).send({
        data: rvm,
        message: 'Success',
      });
    }
    return res.sendStatus(404);
  } catch (error) {
    if (error.name && error.name === 'CastError') {
      return res.sendStatus(404);
    }
    res.status(500).json(error);
  }
};


const CREATE_RVM = async (req, res) => {

  const { body } = req;

  const schema = {
    machineNo: joi.string(),
    location: joi.object().keys({
      address: joi.string(),
      coordinate: joi.object().keys({
        lat: joi.number(),
        lng: joi.number(),
      }),
    }),
    qrCode: joi.string(),
    adsImage: joi.string(),
  };
  const { error } = joi.validate(body, schema);
  if (!error) {
    try {
      const newRvm = new RVM(req.body);
      await newRvm.save();
      return res.status(201).send({
        data: newRvm,
        message: 'Successfully created a new req',
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ err });
    }
  } else {
    console.log(error);
    res.status(400).json({ error });
  }
};

const OPEN_DOOR = async (req, res) => {

  const { body } = req;

  const schema = {
    machineNo: joi.string(),
    user: joi.string(),
  };
  const { error } = joi.validate(body, schema);
  if (!error) {
    try {
      RVM.findOneAndUpdate({machineNo: body.machineNo}, {isDoorOpen: true}, { upsert: false }, (err) => {
        if (err) return res.status(500).json({ error });
        return res.status(201).send({
          message: 'Successfully Updated!',
        });
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ err });
    }
  } else {
    console.log(error);
    res.status(400).json({ error });
  }
};

const CLOSE_DOOR = async (req, res) => {

  const { body } = req;

  const schema = {
    machineNo: joi.string(),
    user: joi.string(),
  };
  const { error } = joi.validate(body, schema);
  if (!error) {
    try {
      RVM.findOneAndUpdate({machineNo: body.machineNo}, {isDoorOpen: false}, { upsert: false }, (err) => {
        if (err) return res.status(500).json({ error });
        return res.status(201).send({
          message: 'Successfully Updated!',
        });
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ err });
    }
  } else {
    console.log(error);
    res.status(400).json({ error });
  }
};


const DELETE_RVM = async (req, res) => {
  const req_id = req.params.id;
  RVM.findByIdAndDelete(req_id, (err) => {
    if (err) return res.send(500, { error: err });
    return res.send('Successfully deleted');
  });
};


module.exports = {
  GET_ALL_RVM,
  GET_SPECIFIC_RVM,
  CREATE_RVM,
  OPEN_DOOR,
  CLOSE_DOOR,
  DELETE_RVM,
};

