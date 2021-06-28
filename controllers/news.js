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

const News = require('../models/news');
const User = require('../models/user');
const config = require('../config/config');


const GET_ALL_NEWS = async (req, res) => {
  try {
    const { where } = req.query;
    let query = {};
    if (where) {
      query = JSON.parse(where);
    }
    const news = await News.find(query)
      .sort({ publishedDate: -1 })
      .lean()
      .exec();
    // eslint-disable-next-line array-callback-return
    news.map((eachNews) => {
      eachNews.publishedDate = moment(eachNews.publishedDate).format('DD-MM-YYYY');
    });
    return res.status(200).send({
      data: news,
      message: 'Success',
    });
  } catch (error) {
    res.status(500).json(error);
  }
};


const GET_PENDING_NEWS = async (req, res) => {
  try {
    const { where } = req.query;
    let query = {};
    if (where) {
      query = JSON.parse(where);
    }
    const news = await News.find({ approved: false })
      .sort({ publishedDate: -1 })
      .lean()
      .exec();
    // eslint-disable-next-line array-callback-return
    news.map((eachNews) => {
      eachNews.publishedDate = moment(eachNews.publishedDate).format('DD-MM-YYYY');
    });
    return res.status(200).send({
      data: news,
      message: 'Success',
    });
  } catch (error) {
    res.status(500).json(error);
  }
};



const GET_SPECIFIC_NEWS = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findOne({ _id: id })
      .sort({ publishedDate: -1 })
      .lean()
      .exec();
    if (news) {
      news.publishedDate = moment(news.publishedDate).format('DD-MM-YYYY');
      return res.status(200).send({
        data: news,
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

// const CREATE_NEWS = async (req, res) => {
//   const { body } = req;

//   const schema = {
//     title: joi.string().required(),
//     content: joi.string().required(),
//     image: joi.string().required(),
//     publishedDate: joi.string(),
//   };

//   const { error } = joi.validate(body, schema);
//   if (!error) {
//     try {
//       const news = new News(req.body);
//       await news.save();

//       return res.status(201).send({
//         message: 'Successfully created a news',
//         data: news,
//       });
//     } catch (err) {
//       res.status(500).json({ err });
//     }
//   } else {
//     res.status(500).json({ error });
//   }
// };


const CREATE_NEWS = async (req, res) => {

  const { body, files } = req;

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
  const s3bucket = new AWS.S3({ params: { Bucket: 'oh-my-trash/news' } });
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
              title: joi.string().required(),
              content: joi.string().required(),
              image: joi.array().items(joi.string().required()),
              uploaded_by: joi.string().required(),
              edited_by: joi.string().required(),
              publishedDate: joi.string(),
              approved: joi.boolean(),
            };

            const { error } = joi.validate(body, schema);
            if (!error) {
              // try {
                const news = new News(req.body);
                await news.save();

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
                  headings: { en: '' + 'Check out the news.' },
                  contents: { en: '' + body.title },
                  // included_segments: ['All']
                  big_picture: body.image[0],
                  include_player_ids: background_playerIds
                };
                sendNotification(message1)

                return res.status(201).send({
                  message: 'Successfully created a news',
                  data: news,
                });
              // } catch (err) {
              //   console.log(err)
              //   res.status(500).json({ err });
              // }
            } else {
              res.status(500).json({ error });
            }
          }
        }

      });

    })

  });

};


const UPDATE_NEWS = async (req, res) => {
  const query = { _id: req.params.id };
  const { body, files } = req;

  let { old_news_image } = body;
  body.image = JSON.parse(old_news_image);
  delete body.old_news_image;

  if (files.length == 0) {

    const schema = {
      title: joi.string().required(),
      content: joi.string().required(),
      image: joi.array().items(joi.string().required()),
      uploaded_by: joi.string().required(),
      edited_by: joi.string().required(),
      publishedDate: joi.string(),
      approved: joi.boolean(),
    };

    const { error } = joi.validate(body, schema);

    if (!error) {

      News.findOneAndUpdate(query, body, { upsert: false }, (err) => {
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

    const s3bucket = new AWS.S3({ params: { Bucket: 'oh-my-trash/news' } });

    s3bucket.createBucket(() => {

      resized_upload_files.map(params => {
        s3bucket.upload(params, async (err, data) => {
          if (err) {
            return res.status(500).send(err);
          }
          body.image.push(data.Location);
          const schema = {
            title: joi.string().required(),
            content: joi.string().required(),
            image: joi.array().items(joi.string().required()),
            uploaded_by: joi.string().required(),
            edited_by: joi.string().required(),
            publishedDate: joi.string(),
            approved: joi.boolean(),
          };
          const { error, value } = joi.validate(body, schema);
          // console.log(value);
          if (!error) {
            try {
              News.findOneAndUpdate(query, body, { upsert: false }, (err) => {
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

const DELETE_NEWS = async (req, res) => {
  const news_id = req.params.id;
  News.findByIdAndDelete(news_id, (err) => {
    if (err) return res.send(500, { error: err });
    return res.send('Successfully deleted');
  });
};


module.exports = {
  GET_ALL_NEWS,
  GET_PENDING_NEWS,
  GET_SPECIFIC_NEWS,
  CREATE_NEWS,
  UPDATE_NEWS,
  DELETE_NEWS,
};

