/* eslint-disable consistent-return */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
const joi = require('joi');
const moment = require('moment');
const sharp = require('sharp');
const fs = require('fs');
const AWS = require('aws-sdk');
const credentials = new AWS.SharedIniFileCredentials({ profile: 'recyglo' });
AWS.config.credentials = credentials;
// AWS.config.update({
//  region: 'ap-southeast-1',
// });
// AWS.config.apiVersions = {
//  s3: '2006-03-01',
// };
const Item = require('../models/item');
const User = require('../models/user');
const config = require('../config/config');

const GET_ALL_ITEM = async (req, res) => {
  try {
    const { where } = req.query;
    let query = {};
    if (where) {
      query = JSON.parse(where);
    }
    const item = await Item.find(query)
      .sort({ publishedDate: -1 })
      .lean()
      .exec();
    // eslint-disable-next-line array-callback-return
    item.map((eachItem) => {
      eachItem.price.reverse();
      eachItem.price = eachItem.price.slice(0, 5);
      eachItem.price.map((each_price) => {
        each_price.date = moment(each_price.added_date).format('DD-MM-YYYY');
      })
      // eachItem.publishedDate = moment(eachItem.publishedDate).format('DD-MM-YYYY');
    });
    return res.status(200).send({
      data: item,
      message: 'Success',
    });
  } catch (error) {
    console.log(error)
    res.status(500).json(error);
  }
};

const GET_PENDING_ITEM = async (req, res) => {
  try {
    const { where } = req.query;
    let query = {};
    if (where) {
      query = JSON.parse(where);
    }
    const item = await Item.find({ approved: false })
      .sort({ publishedDate: -1 })
      .lean()
      .exec();
    // eslint-disable-next-line array-callback-return
    item.map((eachItem) => {
      eachItem.price.reverse();
      eachItem.price = eachItem.price.slice(0, 5);
      eachItem.price.map((each_price) => {
        each_price.date = moment(each_price.added_date).format('DD-MM-YYYY');
      })
      // eachItem.publishedDate = moment(eachItem.publishedDate).format('DD-MM-YYYY');
    });
    return res.status(200).send({
      data: item,
      message: 'Success',
    });
  } catch (error) {
    console.log(error)
    res.status(500).json(error);
  }
};



// const GET_SPECIFIC_NEWS = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const items = await News.findOne({ _id: id })
//       .sort({ publishedDate: -1 })
//       .lean()
//       .exec();
//     if (items) {
//     //   items.publishedDate = moment(items.publishedDate).format('DD-MM-YYYY');
//       return res.status(200).send({
//         data: items,
//         message: 'Success',
//       });
//     }
//     return res.sendStatus(404);
//   } catch (error) {
//     if (error.name && error.name === 'CastError') {
//       return res.sendStatus(404);
//     }
//     res.status(500).json(error);
//   }
// };

// const CREATE_ITEM = async (req, res) => {
//   const { body } = req;

//   const schema = {
//     name: joi.string().required(),
//     image: joi.string().required(),
//     description: joi.string().required(),
//     min_price: joi.string().required(),
//     max_price: joi.string().required(),
//     // publishedDate: joi.string(),
//   };

//   const { error } = joi.validate(body, schema);
//   if (!error) {
//     try {
//       const item = new Item(req.body);
//       await item.save();

//       return res.status(201).send({
//         message: 'Successfully created the item!',
//         data: item,
//       });
//     } catch (err) {
//       res.status(500).json({ err });
//     }
//   } else {
//     res.status(500).json({ error });
//   }
// };


// const CREATE_ITEM = async (req, res) => {

//   const { body, file } = req;

//   let { price } = body;
//   body.price = JSON.parse(price);

//   const s3bucket = new AWS.S3({ params: { Bucket: 'oh-my-trash/item' } });
//   let ext = file.originalname.split('.');
//   ext = ext[ext.length - 1];
//   const filename = `${Number(new Date())}.${ext}`;
//   // const filename = file.originalname;
//   s3bucket.createBucket(() => {
//     var params = {
//       Key: filename,
//       Body: file.buffer,
//       ContentType: file.mimetype,
//       ACL: "public-read",
//     };
//     s3bucket.upload(params, async (err, data) => {
//       if (err) {
//         return res.status(500).send(err);
//       }
//       body.image = data.Location;
//       const schema = {
//         name: joi.string().required(),
//         image: joi.string().required(),
//         description: joi.string().required(),
//         price: joi.array().items(joi.object().keys({
//           min_price: joi.string(),
//           max_price: joi.string(),
//           currency: joi.string(),
//           unit: joi.string(),
//         }))
//       };
//       const { error, value } = joi.validate(body, schema);
//       // console.log(value);
//       if (!error) {
//         try {
//           const item = new Item(body);
//           await item.save();
//           return res.status(201).send({
//             message: 'Successfully created the item!',
//             data: item,
//           });
//         }
//         catch (err) {
//           // console.log(err);
//           res.status(500).json({ err });
//         }
//       }
//       else {
//         // console.log(error);
//         res.status(500).json({ error });
//       }
//     });
//   });

// };

const CREATE_ITEM = async (req, res) => {

  const { body, files } = req;

  let { price } = body;
  body.price = JSON.parse(price);

  let resized_upload_files = [];

  for (let item of files) {
    let ext = item.originalname.split('.');
    ext = ext[ext.length - 1];
    let filename = `${Number(new Date())}.${ext}`;

    let resized_image_buffer = await sharp(item.buffer)
      .resize(700)
      .rotate()
      .jpeg(20)
      .toBuffer();

    let params = {
      Key: filename,
      Body: resized_image_buffer,
      ContentType: item.mimetype,
      ACL: "public-read",
    };

    resized_upload_files.push(params);

  }

  const s3bucket = new AWS.S3({ params: { Bucket: 'oh-my-trash/item' } });

  s3bucket.createBucket(() => {

    let uploaded_files = [];
    resized_upload_files.map(params => {

      s3bucket.upload(params, async (err, data) => {
        if (err) {
          return res.status(500).send(err);
        } else {
          uploaded_files.push(data.Location);
          if (uploaded_files.length == files.length) {
            body.image = uploaded_files;
            const schema = {
              name: joi.string().required(),
              image: joi.array().items(joi.string().required()),
              group: joi.string().required(),
              description: joi.string(),
              price: joi.array().items(joi.object().keys({
                min_price: joi.string(),
                max_price: joi.string(),
                currency: joi.string(),
                unit: joi.string(),
                added_by: joi.string()
              })),
              approved: joi.boolean(),
            };

            const { error } = joi.validate(body, schema);
            if (!error) {
              try {
                const item = new Item(req.body);
                await item.save();

                const users = await User.find({})
                  .sort({ createdAt: -1 })
                  .lean()
                  .exec();
                // eslint-disable-next-line array-callback-return
                let background_playerIds = [];
                users.map(async (user) => {
                  if (user.device_id) {
                    background_playerIds.push(user.device_id);
                  }
                });

                var sendNotification = function (data) {
                  var headers = {
                    "Content-Type": "application/json; charset=utf-8",
                    "Authorization": `Basic ${config.ONE_SIGNAL_REST_KEY}`
                  };

                  var options = {
                    host: "onesignal.com",
                    port: 443,
                    path: "/api/v1/notifications",
                    method: "POST",
                    headers: headers
                  };

                  var https = require('https');
                  var req = https.request(options, function (res) {
                    res.on('data', async function (data) {
                      console.log(data)
                    });
                  });

                  req.on('error', function (e) {
                    console.log("ERROR:");
                    console.log(e);
                    // res.status(500).json(error);
                  });

                  req.write(JSON.stringify(data));
                  req.end();
                };

                var message1 = {
                  app_id: config.ONE_SIGNAL_APP_ID,
                  headings: { en: '' + 'Check out the new item.' },
                  contents: { en: '' + body.name },
                  // included_segments: ['All']
                  big_picture: body.image[0],
                  include_player_ids: background_playerIds
                };
                sendNotification(message1)

                return res.status(201).send({
                  message: 'Successfully created an item.',
                  data: item,
                });
              } catch (err) {
                res.status(500).json({ err });
              }
            } else {
              res.status(500).json({ error });
            }
          }
        }

      });
    })
  });

};


const UPDATE_ITEM = async (req, res) => {
  const query = { _id: req.params.id };
  const { body, files } = req;
  let { price } = body;
  body.price = JSON.parse(price);

  body.price.map((each_price) => {
    delete each_price.date;
  })

  let { old_item_image } = body;
  body.image = JSON.parse(old_item_image);
  delete body.old_item_image;

  if (files.length == 0) {

    const schema = {
      name: joi.string().required(),
      image: joi.array().items(joi.string().required()),
      group: joi.string().required(),
      description: joi.string(),
      price: joi.array().items(joi.object().keys({
        min_price: joi.string(),
        max_price: joi.string(),
        currency: joi.string(),
        unit: joi.string(),
        added_date: joi.date(),
        added_by: joi.string()
      })),
      approved: joi.boolean(),
    };

    const { error, value } = joi.validate(body, schema);

    if (!error) {

      Item.findOneAndUpdate(query, body, { upsert: false }, (err) => {
        if (err) return res.status(500).json({ error });
        return res.status(201).send({
          message: 'Successfully Updated!',
        });
      });
    } else {
      res.status(500).json({ error });
    }

  } else {

    let resized_upload_files = [];

    for (let item of files) {
      let ext = item.originalname.split('.');
      ext = ext[ext.length - 1];
      let filename = `${Number(new Date())}.${ext}`;

      let resized_image_buffer = await sharp(item.buffer)
        .resize(700)
        .rotate()
        .jpeg(20)
        .toBuffer();

      let params = {
        Key: filename,
        Body: resized_image_buffer,
        ContentType: item.mimetype,
        ACL: "public-read",
      };

      resized_upload_files.push(params);

    }

    const s3bucket = new AWS.S3({ params: { Bucket: 'oh-my-trash/item' } });

    s3bucket.createBucket(() => {

      resized_upload_files.map(params => {
        s3bucket.upload(params, async (err, data) => {
          if (err) {
            return res.status(500).send(err);
          }
          body.image.push(data.Location);
          const schema = {
            name: joi.string().required(),
            image: joi.array().items(joi.string().required()),
            group: joi.string().required(),
            description: joi.string(),
            price: joi.array().items(joi.object().keys({
              min_price: joi.string(),
              max_price: joi.string(),
              currency: joi.string(),
              unit: joi.string(),
              added_date: joi.date(),
              added_by: joi.string()
            })),
            approved: joi.boolean(),
          };
          const { error, value } = joi.validate(body, schema);
          // console.log(value);
          if (!error) {
            try {
              Item.findOneAndUpdate(query, body, { upsert: false }, (err) => {
                if (err) return res.status(500).json({ error });
                return res.status(201).send({
                  message: 'Successfully Updated!',
                });
              });
            }
            catch (err) {
              // console.log(err);
              res.status(500).json({ err });
            }
          }
          else {
            // console.log(error);
            res.status(500).json({ error });
          }
        });
      });
    });
  }

};

const DELETE_ITEM = async (req, res) => {
  const item_id = req.params.id;
  Item.findByIdAndDelete(item_id, (err) => {
    if (err) return res.send(500, { error: err });
    return res.send('Successfully deleted');
  });
};

module.exports = {
  GET_ALL_ITEM,
  GET_PENDING_ITEM,
  // GET_SPECIFIC_ITEM,
  CREATE_ITEM,
  UPDATE_ITEM,
  DELETE_ITEM,
};
