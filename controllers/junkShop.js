/* eslint-disable consistent-return */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */

const joi = require('joi');
const moment = require('moment');
const sharp = require('sharp');
const AWS = require('aws-sdk');
const credentials = new AWS.SharedIniFileCredentials({ profile: 'recyglo' });
AWS.config.credentials = credentials;

const JunkShop = require('../models/junkShop');
const Notification = require('../models/notification');


const GET_ALL_JUNKSHOP = async (req, res) => {
  try {
    const { where } = req.query;
    let query = {};
    if (where) {
      query = JSON.parse(where);
    }

    const junkShops = await JunkShop.find({ 'approve_status': 'APPROVED' })
      // .populate('approve_by')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    // eslint-disable-next-line array-callback-return

    junkShops.map((junkShop) => {
      junkShop.createdAt = moment(junkShop.createdAt).format('DD-MM-YYYY');
    });

    let town = [];
    let data = [];
    junkShops.map((each_junk_shop, index) => {
      if (town.includes(each_junk_shop.town)) {
        data.map((each_town) => {
          if (each_town.town == each_junk_shop.town) {
            if (!each_town.ward.includes(each_junk_shop.ward)) {
              each_town.ward.push(each_junk_shop.ward);
            }
            each_town.list.push(each_junk_shop);
          }
        })
      } else {
        town.push(each_junk_shop.town);
        let a = {
          'id': index + '',
          'town': each_junk_shop.town,
          'ward': [each_junk_shop.ward],
          'list': [each_junk_shop]
        }
        data.push(a);
      }
    });
    return res.status(200).send({
      data: data,
      message: 'Success',
    });
  } catch (error) {
    res.status(500).json(error);
  }
};


const GET_NOTIFICATION = async (req, res) => {
  try {
    const { where } = req.query;
    let query = {};
    if (where) {
      query = JSON.parse(where);
    }

    const notification = await Notification.find({ all_user: true })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return res.status(200).send({
      data: notification,
      message: 'Success',
    });
  } catch (error) {
    res.status(500).json(error);
  }
};


const GET_PENDING_JUNK_SHOP = async (req, res) => {
  try {
    const { where } = req.query;
    let query = {};
    if (where) {
      query = JSON.parse(where);
    }
    const page = req.query.page || 1;
    const options = {
      sort: { createdAt: -1 },
      // populate: [
      //   'added_by', 'approve_by'
      // ],
      page: page
    };

    const junkShops = await JunkShop.paginate({ 'approve_status': 'PENDING' }, options);

    junkShops.docs.map((junkShop) => {
      junkShop.createdAt = moment(junkShop.createdAt).format('DD-MM-YYYY');
    });

    let junk_shop_count = {};

    const pending_junk_shop_count = await JunkShop.countDocuments({ 'approve_status': 'PENDING' })
      .exec();
    junk_shop_count.pending_junk_shop_count = pending_junk_shop_count;

    const approved_junk_shop_count = await JunkShop.countDocuments({ 'approve_status': 'APPROVED' })
      .exec();
    junk_shop_count.approved_junk_shop_count = approved_junk_shop_count;

    const rejected_junk_shop_count = await JunkShop.countDocuments({ 'approve_status': 'REJECTED' })
      .exec();
    junk_shop_count.rejected_junk_shop_count = rejected_junk_shop_count;

    return res.status(200).send({
      data: junkShops.docs,
      count: junk_shop_count,
      message: 'Success',
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

const GET_APPROVED_JUNK_SHOP = async (req, res) => {
  try {
    const { where } = req.query;
    let query = {};
    if (where) {
      query = JSON.parse(where);
    }

    const page = req.query.page || 1;
    const options = {
      sort: { createdAt: -1 },
      // populate: [
      //   'added_by', 'approve_by'
      // ],
      page: page
    };

    const junkShops = await JunkShop.paginate({ 'approve_status': 'APPROVED' }, options);

    junkShops.docs.map((junkShop) => {
      junkShop.createdAt = moment(junkShop.createdAt).format('DD-MM-YYYY');
    });

    let junk_shop_count = {};

    const pending_junk_shop_count = await JunkShop.countDocuments({ 'approve_status': 'PENDING' })
      .exec();
    junk_shop_count.pending_junk_shop_count = pending_junk_shop_count;

    const approved_junk_shop_count = await JunkShop.countDocuments({ 'approve_status': 'APPROVED' })
      .exec();
    junk_shop_count.approved_junk_shop_count = approved_junk_shop_count;

    const rejected_junk_shop_count = await JunkShop.countDocuments({ 'approve_status': 'REJECTED' })
      .exec();
    junk_shop_count.rejected_junk_shop_count = rejected_junk_shop_count;

    return res.status(200).send({
      data: junkShops.docs,
      count: junk_shop_count,
      message: 'Success',
    });
  } catch (error) {
    res.status(500).json(error);
  }
};


const GET_REJECTED_JUNK_SHOP = async (req, res) => {
  try {
    const { where } = req.query;
    let query = {};
    if (where) {
      query = JSON.parse(where);
    }
    const page = req.query.page || 1;
    const options = {
      sort: { createdAt: -1 },
      // populate: [
      //   'added_by', 'approve_by'
      // ],
      page: page
    };

    const junkShops = await JunkShop.paginate({ 'approve_status': 'REJECTED' }, options);

    junkShops.docs.map((junkShop) => {
      junkShop.createdAt = moment(junkShop.createdAt).format('DD-MM-YYYY');
    });

    let junk_shop_count = {};

    const pending_junk_shop_count = await JunkShop.countDocuments({ 'approve_status': 'PENDING' })
      .exec();
    junk_shop_count.pending_junk_shop_count = pending_junk_shop_count;

    const approved_junk_shop_count = await JunkShop.countDocuments({ 'approve_status': 'APPROVED' })
      .exec();
    junk_shop_count.approved_junk_shop_count = approved_junk_shop_count;

    const rejected_junk_shop_count = await JunkShop.countDocuments({ 'approve_status': 'REJECTED' })
      .exec();
    junk_shop_count.rejected_junk_shop_count = rejected_junk_shop_count;

    return res.status(200).send({
      data: junkShops.docs,
      count: junk_shop_count,
      message: 'Success',
    });
  } catch (error) {
    res.status(500).json(error);
  }
};


const GET_ADDED_JUNK_SHOP = async (req, res) => {
  try {
    const { where } = req.query;
    let query = {};
    if (where) {
      query = JSON.parse(where);
    }

    const { id } = req.params;

    const page = req.query.page || 1;
    const options = {
      sort: { createdAt: -1 },
      // populate: [
      //   'added_by', 'approve_by'
      // ],
      page: page,
    };

    const junkShops = await JunkShop.paginate({ 'added_by': id }, options);

    junkShops.docs.map((junkShop) => {
      junkShop.createdAt = moment(junkShop.createdAt).format('DD-MM-YYYY');
    });

    const added_junk_shop_count = await JunkShop.countDocuments({ 'added_by': id })
      .exec();
    return res.status(200).send({
      data: junkShops.docs,
      count: added_junk_shop_count,
      message: 'Success',
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

const GET_SPECIFIC_JUNKSHOP = async (req, res) => {
  try {
    const { id } = req.params;
    const junkShop = await JunkShop.findOne({ _id: id })
      .populate('approve_by')
      .populate('added_by')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    if (junkShop) {
      junkShop.createdAt = moment(junkShop.createdAt).format('DD-MM-YYYY');
      return res.status(200).send({
        data: junkShop,
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

const UPDATE_JUNK_SHOP = async (req, res) => {
  const query = { _id: req.params.id };
  let { body, file } = req;

  let { data } = body;
  let temp_body = JSON.parse(data);

  delete temp_body._id;
  delete temp_body.createdAt;
  delete temp_body.updatedAt;
  delete temp_body.__v;

  body = [];
  body = temp_body;

  if (file) {

    const s3bucket = new AWS.S3({ params: { Bucket: 'oh-my-trash/junk_shop' } });
    let ext = file.originalname.split('.');
    ext = ext[ext.length - 1];
    const filename = `${Number(new Date())}.${ext}`;

    let resized_image_buffer = await sharp(file.buffer)
      .resize(700)
      .rotate()
      .jpeg(20)
      .toBuffer();

    s3bucket.createBucket(() => {

      var params = {
        Key: filename,
        Body: resized_image_buffer,
        ContentType: file.mimetype,
        ACL: "public-read",
      };
      s3bucket.upload(params, async (err, data) => {
        if (err) {
          return res.status(500).send(err);
        }
        body.image = data.Location;
        const schema = {
          name: joi.string(),
          image: joi.string(),
          phoneNumber: joi.string(),
          location: joi.object({
            address: joi.string(),
            coordinate: joi.object({
              lat: joi.number(),
              lng: joi.number(),
            }),
          }),
          town: joi.string(),
          ward: joi.string(),
          added_by: joi.string().required(),
          approve_status: joi.string(),
          approve_by: joi.string(),
        };

        const { error, value } = joi.validate(body, schema);
        if (!error) {

          JunkShop.findOneAndUpdate(query, body, { upsert: false }, (err) => {
            if (err) return res.status(500).json({ err });
            return res.status(201).send({
              message: 'Successfully changed status.',
            });
          });
        } else {
          res.status(500).json({ error });
        }
      });
    });

  } else {
    const schema = {
      name: joi.string().required(),
      image: joi.string(),
      phoneNumber: joi.string(),
      location: joi.object({
        address: joi.string(),
        coordinate: joi.object({
          lat: joi.number(),
          lng: joi.number(),
        }),
      }),
      town: joi.string(),
      ward: joi.string(),
      added_by: joi.string().required(),
      approve_status: joi.string(),
      approve_by: joi.string(),
    };

    const { error, value } = joi.validate(body, schema);
    if (!error) {
      JunkShop.findOneAndUpdate(query, body, { upsert: false }, (err) => {
        if (err) return res.status(500).json({ err });
        return res.status(201).send({
          message: 'Successfully changed status.',
        });
      });
    } else {
      // console.log(error)
      res.status(500).json({ error });
    }
  }
};

const CREATE_JUNKSHOP = async (req, res) => {

  const { body, file } = req;
  let { location } = body;
  body.location = JSON.parse(location);

  if (file) {

    const s3bucket = new AWS.S3({ params: { Bucket: 'oh-my-trash/junk_shop' } });
    let ext = file.originalname.split('.');
    ext = ext[ext.length - 1];
    const filename = `${Number(new Date())}.${ext}`;

    let resized_image_buffer = await sharp(file.buffer)
      .resize(700)
      .rotate()
      .jpeg(20)
      .toBuffer();

    s3bucket.createBucket(() => {

      var params = {
        Key: filename,
        Body: resized_image_buffer,
        ContentType: file.mimetype,
        ACL: "public-read",
      };
      s3bucket.upload(params, async (err, data) => {
        if (err) {
          return res.status(500).send(err);
        }
        body.image = data.Location;
        const schema = {
          name: joi.string(),
          image: joi.string(),
          phoneNumber: joi.string(),
          location: joi.object({
            address: joi.string(),
            coordinate: joi.object({
              lat: joi.number(),
              lng: joi.number(),
            }),
          }),
          town: joi.string(),
          ward: joi.string(),
          added_by: joi.string().required(),
          approve_status: joi.string(),
          approve_by: joi.string(),
        };

        const { error, value } = joi.validate(body, schema);
        if (!error) {
          try {
            const junkShop = new JunkShop(req.body);
            await junkShop.save();

            return res.status(201).send({
              message: 'Successfully added the junk shop.',
              data: junkShop,
            });
          } catch (err) {
            res.status(500).json({ err });
          }
        } else {
          res.status(500).json({ error });
        }
      });
    });

  } else {

    const schema = {
      name: joi.string(),
      phoneNumber: joi.string(),
      location: joi.object({
        address: joi.string(),
        coordinate: joi.object({
          lat: joi.number(),
          lng: joi.number(),
        }),
      }),
      town: joi.string(),
      ward: joi.string(),
      added_by: joi.string().required(),
      approve_status: joi.string(),
      approve_by: joi.string(),
    };

    const { error, value } = joi.validate(body, schema);
    if (!error) {
      try {
        const junkShop = new JunkShop(req.body);
        await junkShop.save();

        return res.status(201).send({
          message: 'Successfully added the junk shop.',
          data: junkShop,
        });
      } catch (err) {
        res.status(500).json({ err });
      }
    } else {
      res.status(500).json({ error });
    }
  }

};

const DELETE_JUNKSHOP = async (req, res) => {
  const junkShopId = req.params.id;
  JunkShop.findByIdAndDelete(junkShopId, (err) => {
    if (err) return res.send(500, { error: err });
    return res.send('Successfully deleted');
  });
};

module.exports = {
  GET_ALL_JUNKSHOP,
  GET_NOTIFICATION,
  GET_PENDING_JUNK_SHOP,
  GET_APPROVED_JUNK_SHOP,
  GET_REJECTED_JUNK_SHOP,
  GET_ADDED_JUNK_SHOP,
  UPDATE_JUNK_SHOP,
  GET_SPECIFIC_JUNKSHOP,
  CREATE_JUNKSHOP,
  DELETE_JUNKSHOP,
};
