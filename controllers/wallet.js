/* eslint-disable consistent-return */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
const joi = require('joi');
const moment = require('moment');
const sharp = require('sharp');
const WALLET = require('../models/wallet');

const GET_ALL_WALLETS = async (req, res) => {
  try {
    const { where } = req.query;
    let query = {};
    if (where) {
      query = JSON.parse(where);
    }
    const wallets = await WALLET.find(query)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return res.status(200).send({
      data: wallets,
      message: 'Success',
    });
  } catch (error) {
    res.status(500).json(error);
  }
};


const GET_SPECIFIC_WALLET = async (req, res) => {
  try {
    const { id } = req.params;
    const wallet = await WALLET.findOne({ _id: id })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    if (reqs) {
      wallet.createdAt = moment(reqs.createdAt).format('DD-MM-YYYY');
      return res.status(200).send({
        data: wallet,
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

const GET_WALLET_BY_USERID = async (req, res) => {
  try {
    const { id } = req.params;
    const wallet = await WALLET.findOne({ user_id: id })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    if (wallet) {
      wallet.createdAt = moment(wallet.createdAt).format('DD-MM-YYYY');
      return res.status(200).send({
        data: wallet,
        message: 'Success',
      });
    }
    return res.sendStatus(404);
  } catch (error) {
    if (error.name && error.name === 'CastError') {
      return res.sendStatus(404);
    }
    console.log(error);
    res.status(500).json(error);
  }
};


const CREATE_WALLET = async (req, res) => {

  const { body } = req;

  const schema = {
    user_id: joi.string(),
    wallet_account_no: joi.string(),
    balance: joi.number(),
    status: joi.string(),
    transactions: joi.array().items(
      joi.object().keys({
        description: joi.string(),
        amount: joi.number(),
        time: joi.date(),
      }),
    ),
  };
  const { error } = joi.validate(body, schema);
  if (!error) {
    try {
      const newWallet = new WALLET(req.body);
      await newWallet.save();
      return res.status(201).send({
        data: newWallet,
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

const DELETE_WALLET = async (req, res) => {
  const req_id = req.params.id;
  WALLET.findByIdAndDelete(req_id, (err) => {
    if (err) return res.send(500, { error: err });
    return res.send('Successfully deleted');
  });
};


module.exports = {
  GET_ALL_WALLETS,
  GET_SPECIFIC_WALLET,
  GET_WALLET_BY_USERID,
  CREATE_WALLET,
  DELETE_WALLET,
};

