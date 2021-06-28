/* eslint-disable consistent-return */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
const joi = require('joi');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sharp = require('sharp');
const AWS = require('aws-sdk');
const OneSignal = require('onesignal-node');

const credentials = new AWS.SharedIniFileCredentials({ profile: 'recyglo' });
AWS.config.credentials = credentials;

const config = require('../config/config');
const User = require('../models/user');
const Notification = require('../models/notification');
const JunkShop = require('../models/junkShop');


const tokenList = require('../index');

const GET_ALL_USERS = async (req, res) => {
  try {
    const { where } = req.query;
    let query = {};
    if (where) {
      query = JSON.parse(where);
    }
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    // eslint-disable-next-line array-callback-return
    users.map((user) => {
      delete user.password;
      user.createdAt = moment(user.createdAt).format('DD-MM-YYYY');
    });
    return res.status(200).send({
      data: users,
      message: 'Success',
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

const GET_SPECIFIC_USER = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    if (user) {
      delete user.password;
      user.createdAt = moment(user.createdAt).format('DD-MM-YYYY');
      return res.status(200).send({
        data: user,
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

const LOG_IN = async (req, res) => {
  try {
    const { email, password, device_id } = req.body;
    if (!email || !password) {
      return res.sendStatus(400);
    }
    let user;
    user = await User.findOne({ email })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    if (!user) {
      let phone_number = email;
      if (phone_number[0] == 0) {
        phone_number = '+95' + phone_number.slice(1);
      } else {
        phone_number = '+959' + phone_number;
      }
      user = await User.findOne({ 'phoneNumber': phone_number })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
    }

    if (user) {
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return res.status(500).json(err);
        if (isMatch) {
          delete user.password;
          user.createdAt = moment(user.createdAt).format('DD-MM-YYYY');
          const token = jwt.sign(
            { email },
            config.jwtSecret,
            { expiresIn: config.jwtTokenLife },
          );
          const refreshToken = jwt.sign(
            { email }, config.refershTokenSecret,
            { expiresIn: config.refreshTokenSecretLife },
          );
          tokenList[refreshToken] = token;

          let data = {};
          const query = { _id: user._id };
          data.device_id = device_id
          User.findOneAndUpdate(query, data, { upsert: false }, (err) => {
            if (err) return res.status(500).json({ error });
          });

          return res.status(200).send({
            data: user,
            token,
            refreshToken,
            message: 'Success',
          });
        }
        return res.sendStatus(401);
      });
    } else {
      return res.sendStatus(401);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};


const LOG_IN_BY_SOCIAL = async (req, res) => {
  try {
    let { account_type, account_id, name, email, device_id } = req.body;
    let user;
    if (account_type == 'facebook') {
      user = await User.findOne({ 'facebook_account_id': account_id })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
    } else if (account_type == 'google') {
      user = await User.findOne({ 'google_account_id': account_id })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
    } else if (account_type == 'apple') {
      user = await User.findOne({ 'apple_account_id': account_id })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
    }
    if (!user) {
      if (email != undefined) {
        user = await User.findOne({ email })
          .sort({ createdAt: -1 })
          .lean()
          .exec();
      }
    }
    if (user) {
      delete user.password;
      user.createdAt = moment(user.createdAt).format('DD-MM-YYYY');
      let data = {};
      const query = { _id: user._id };
      if (account_type == 'facebook') {
        data.facebook_account_id = account_id;
        data.device_id = device_id;
      } else if (account_type == 'google') {
        data.google_account_id = account_id;
        data.device_id = device_id;
      } else if (account_type == 'apple') {
        data.apple_account_id = account_id;
        data.device_id = device_id;
      }
      User.findOneAndUpdate(query, data, { upsert: false }, (err) => {
        if (err) return res.status(500).json({ error });
      });
      const token = jwt.sign(
        { account_id },
        config.jwtSecret,
        { expiresIn: config.jwtTokenLife },
      );
      const refreshToken = jwt.sign(
        { account_id }, config.refershTokenSecret,
        { expiresIn: config.refreshTokenSecretLife },
      );
      tokenList[refreshToken] = token;
      return res.status(200).send({
        data: user,
        token,
        refreshToken,
        message: 'Success',
      });
    } else {
      const schema = {
        name: joi.string().required(),
        email: joi.string().email(),
        facebook_account_id: joi.string(),
        google_account_id: joi.string(),
        apple_account_id: joi.string(),
        phoneNumber: joi.string(),
        profileImage: joi.string(),
        type: joi.string().required(),
        password: joi.string().required(),
        location: joi.object().keys({
          address: joi.string(),
          coordinate: joi.object().keys({
            lat: joi.number(),
            lng: joi.number()
          })
        }),
        device_id: joi.string(),
      };
      let data = {};
      if (account_type == 'facebook') {
        data.facebook_account_id = account_id;
      } else if (account_type == 'google') {
        data.google_account_id = account_id;
      } else if (account_type == 'apple') {
        data.apple_account_id = account_id;
      }
      data.name = name;
      data.device_id = device_id;
      data.type = 'CUSTOMER';
      data.password = 'ohmytrash';
      if (email != undefined) {
        data.email = email;
      }
      const { error } = joi.validate(data, schema);
      if (!error) {
        try {

          const newUser = new User(data);
          await newUser.save();

          const token = jwt.sign(
            { account_id },
            config.jwtSecret,
            { expiresIn: config.jwtTokenLife },
          );
          const refreshToken = jwt.sign(
            { account_id }, config.refershTokenSecret,
            { expiresIn: config.refreshTokenSecretLife },
          );
          tokenList[refreshToken] = token;
          return res.status(201).send({
            data: newUser,
            token,
            refreshToken,
            message: 'Successfully created a new user.',
          });
        } catch (err) {
          console.log(err);
          res.status(500).json({ err });
        }
      } else {
        console.log(error);
        res.status(500).json({ error });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};


const LOG_IN_BY_PHONE_VERIFICATION = async (req, res) => {
  try {
    const { input_phone_number, device_id } = req.body;
    let user = await User.findOne({ 'phoneNumber': input_phone_number })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    if (user) {
      delete user.password;
      user.createdAt = moment(user.createdAt).format('DD-MM-YYYY');
      let data = {};
      const query = { _id: user._id };
      data.device_id = device_id
      User.findOneAndUpdate(query, data, { upsert: false }, (err) => {
        if (err) return res.status(500).json({ error });
      });
      const token = jwt.sign(
        { input_phone_number },
        config.jwtSecret,
        { expiresIn: config.jwtTokenLife },
      );
      const refreshToken = jwt.sign(
        { input_phone_number }, config.refershTokenSecret,
        { expiresIn: config.refreshTokenSecretLife },
      );
      tokenList[refreshToken] = token;
      return res.status(200).send({
        data: user,
        token,
        refreshToken,
        message: 'Success',
      });
    } else {
      return res.sendStatus(401);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};




// const CREATE_USER = async (req, res) => {

//   const { body, file } = req;

//   let { location } = body;
//   body.location = JSON.parse(location);

//   const s3bucket = new AWS.S3({ params: { Bucket: 'oh-my-trash/user' } });
//   let ext = file.originalname.split('.');
//   ext = ext[ext.length - 1];
//   const filename = `${Number(new Date())}.${ext}`;
//   // const filename = file.originalname;

//   let resized_image_buffer = await sharp(file.buffer)
//     .resize(700)
//     .rotate()
//     .jpeg(20)
//     .toBuffer();

//   s3bucket.createBucket(() => {
//     var params = {
//       Key: filename,
//       Body: resized_image_buffer,
//       ContentType: file.mimetype,
//       ACL: "public-read",
//     };
//     s3bucket.upload(params, async (err, data) => {
//       if (err) {
//         return res.status(500).send(err);

//       }

//       body.profileImage = data.Location;


//       const schema = {
//         name: joi.string().required(),
//         email: joi.string().email(),
//         facebook_account_id: joi.string(),
//         google_account_id: joi.string(),
//         phoneNumber: joi.string(),
//         profileImage: joi.string(),
//         type: joi.string().required(),
//         password: joi.string().required(),
//         location: joi.object().keys({
//           address: joi.string(),
//           coordinate: joi.object().keys({
//             lat: joi.number(),
//             lng: joi.number()
//           })
//         })
//       };

//       const { error } = joi.validate(body, schema);
//       if (!error) {
//         try {
//           const { email, phoneNumber } = body;
//           const emailExist = await User.find({ email });
//           const phoneNumberExist = await User.find({ phoneNumber });

//           if (emailExist && emailExist.length) {
//             return res.status(409).json('Email address already exist');
//           }

//           if (phoneNumberExist && phoneNumberExist.length) {
//             return res.status(409).json('Phone Number already exist');
//           }

//           const newUser = new User(req.body);
//           await newUser.save();

//           const token = jwt.sign(
//             { phoneNumber },
//             config.jwtSecret,
//             { expiresIn: config.jwtTokenLife },
//           );
//           const refreshToken = jwt.sign(
//             { email }, config.refershTokenSecret,
//             { expiresIn: config.refreshTokenSecretLife },
//           );
//           tokenList[refreshToken] = token;
//           return res.status(201).send({
//             data: newUser,
//             token,
//             refreshToken,
//             message: 'Successfully created a new user',
//           });
//         } catch (err) {
//           res.status(500).json({ err });
//         }
//       } else {
//         console.log(error);
//         res.status(500).json({ error });
//       }
//     });
//   });
// };


const CREATE_USER = async (req, res) => {

  const { body, file } = req;

  const schema = {
    name: joi.string().required(),
    email: joi.string().email(),
    facebook_account_id: joi.string(),
    google_account_id: joi.string(),
    apple_account_id: joi.string(),
    phoneNumber: joi.string(),
    profileImage: joi.string(),
    type: joi.string().required(),
    password: joi.string().required(),
    location: joi.object().keys({
      address: joi.string(),
      coordinate: joi.object().keys({
        lat: joi.number(),
        lng: joi.number()
      })
    }),
    device_id: joi.string(),
  };


  if (body.location) {
    let { location } = body;
    body.location = JSON.parse(location);
  }

  if (file == undefined) {
    const { error } = joi.validate(body, schema);
    if (!error) {
      try {
        const { email, phoneNumber } = body;
        let emailExist;
        if (email)
          emailExist = await User.find({ email });
        const phoneNumberExist = await User.find({ phoneNumber });

        if (emailExist && emailExist.length) {
          return res.status(409).json('Email address already exist');
        }

        if (phoneNumberExist && phoneNumberExist.length) {
          return res.status(409).json('Phone Number already exist');
        }

        const newUser = new User(req.body);
        await newUser.save();

        const token = jwt.sign(
          { phoneNumber },
          config.jwtSecret,
          { expiresIn: config.jwtTokenLife },
        );
        const refreshToken = jwt.sign(
          { phoneNumber }, config.refershTokenSecret,
          { expiresIn: config.refreshTokenSecretLife },
        );
        tokenList[refreshToken] = token;
        return res.status(201).send({
          data: newUser,
          token,
          refreshToken,
          message: 'Successfully created a new user',
        });
      } catch (err) {
        console.log(err);
        res.status(500).json({ err });
      }
    } else {
      console.log(error);
      res.status(500).json({ error });
    }


  } else {

    const s3bucket = new AWS.S3({ params: { Bucket: 'oh-my-trash/user' } });
    let ext = file.originalname.split('.');
    ext = ext[ext.length - 1];
    const filename = `${Number(new Date())}.${ext}`;
    // const filename = file.originalname;

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

        body.profileImage = data.Location;

        const { error } = joi.validate(body, schema);
        if (!error) {
          try {
            const { email, phoneNumber } = body;
            const emailExist = await User.find({ email });
            const phoneNumberExist = await User.find({ phoneNumber });

            if (emailExist && emailExist.length) {
              return res.status(409).json('Email address already exist');
            }

            if (phoneNumberExist && phoneNumberExist.length) {
              return res.status(409).json('Phone Number already exist');
            }

            const newUser = new User(req.body);
            await newUser.save();

            const token = jwt.sign(
              { phoneNumber },
              config.jwtSecret,
              { expiresIn: config.jwtTokenLife },
            );
            const refreshToken = jwt.sign(
              { phoneNumber }, config.refershTokenSecret,
              { expiresIn: config.refreshTokenSecretLife },
            );
            tokenList[refreshToken] = token;
            return res.status(201).send({
              data: newUser,
              token,
              refreshToken,
              message: 'Successfully created a new user',
            });
          } catch (err) {
            res.status(500).json({ err });
          }
        } else {
          console.log(error);
          res.status(500).json({ error });
        }
      });
    });
  }

};


// const UPDATE_USER = async (req, res) => {
//   const query = { _id: req.params.id };
//   const { body, file } = req;
//   let { location } = body;
//   body.location = JSON.parse(location);

//   if (file == undefined) {

//     delete body.profileImage;

//     let schema = {
//       name: joi.string().required(),
//       email: joi.string().email(),
//       facebook_account_id: joi.string(),
//       google_account_id: joi.string(),
//       location: joi.object().keys({
//         address: joi.string(),
//         coordinate: joi.object().keys({
//           lat: joi.number(),
//           lng: joi.number()
//         })
//       })
//     };

//     if (body.password != undefined) {
//       schema.password = joi.string().required()
//     }

//     if (body.phoneNumber != undefined) {
//       schema.phoneNumber = joi.string().required()
//     }




//     const { error } = joi.validate(body, schema);

//     if (!error) {

//       try {

//         // const { email } = body;
//         // const emailExist = await User.find({ email });

//         // if (emailExist && emailExist.length) {
//         //   return res.status(409).json('Email address already exist');
//         // }

//         if (body.phoneNumber != undefined) {
//           const { phoneNumber } = body;
//           const phoneNumberExist = await User.find({ phoneNumber });
//           if (phoneNumberExist && phoneNumberExist.length) {
//             return res.status(409).json('Phone Number already exist');
//           }
//         }


//         if (body.password != undefined) {
//           const { password } = body;
//           const salt = await bcrypt.genSalt(10);
//           const hash = await bcrypt.hash(password, salt);
//           body.password = hash;
//         }

//         User.findOneAndUpdate(query, body, { upsert: false }, (err) => {
//           if (err) return res.status(500).json({ error });
//           return res.status(201).send({
//             message: 'Successfully Updated!',
//           });
//         });


//       } catch (e) {
//         console.log(e);
//         res.status(500).json({ e });
//       }



//     } else {
//       res.status(500).json({ error });
//     }

//   } else {

//     const s3bucket = new AWS.S3({ params: { Bucket: 'oh-my-trash/user' } });
//     let ext = file.originalname.split('.');
//     ext = ext[ext.length - 1];
//     const filename = `${Number(new Date())}.${ext}`;
//     // const filename = file.originalname;

//     let resized_image_buffer = await sharp(file.buffer)
//       .resize(700)
//       .rotate()
//       .jpeg(20)
//       .toBuffer();

//     s3bucket.createBucket(() => {
//       var params = {
//         Key: filename,
//         Body: resized_image_buffer,
//         ContentType: file.mimetype,
//         ACL: "public-read",
//       };
//       s3bucket.upload(params, async (err, data) => {
//         if (err) {
//           return res.status(500).send(err);
//         }
//         body.profileImage = data.Location;
//         const schema = {
//           name: joi.string().required(),
//           email: joi.string().email(),
//           facebook_account_id: joi.string(),
//           google_account_id: joi.string(),
//           profileImage: joi.string(),
//           location: joi.object().keys({
//             address: joi.string(),
//             coordinate: joi.object().keys({
//               lat: joi.number(),
//               lng: joi.number()
//             })
//           })
//         };

//         if (body.password != undefined) {
//           schema.password = joi.string().required()
//         }

//         if (body.phoneNumber != undefined) {
//           schema.phoneNumber = joi.string().required()
//         }

//         const { error } = joi.validate(body, schema);

//         if (!error) {

//           try {

//             // const { email } = body;
//             // const emailExist = await User.find({ email });

//             // if (emailExist && emailExist.length) {
//             //   return res.status(409).json('Email address already exist');
//             // }

//             if (body.phoneNumber != undefined) {
//               const { phoneNumber } = body;
//               const phoneNumberExist = await User.find({ phoneNumber });
//               if (phoneNumberExist && phoneNumberExist.length) {
//                 return res.status(409).json('Phone Number already exist');
//               }
//             }

//             if (body.password != undefined) {
//               const { password } = body;
//               const salt = await bcrypt.genSalt(10);
//               const hash = await bcrypt.hash(password, salt);
//               body.password = hash;
//             }

//             User.findOneAndUpdate(query, body, { upsert: false }, (err) => {
//               if (err) return res.status(500).json({ error });
//               return res.status(201).send({
//                 message: 'Successfully Updated!',
//               });
//             });

//           } catch (e) {
//             console.log(e);
//             res.status(500).json({ e });
//           }

//         } else {
//           res.status(500).json({ error });
//         }
//       });
//     });
//   }

// };



const UPDATE_USER = async (req, res) => {
  const query = { _id: req.params.id };
  const { body, file } = req;
  if (file == undefined) {

    delete body.profileImage;

    let schema = {
      name: joi.string().required(),
      email: joi.string().email(),
      facebook_account_id: joi.string(),
      google_account_id: joi.string(),
      apple_account_id: joi.string(),
      location: joi.object().keys({
        address: joi.string(),
        coordinate: joi.object().keys({
          lat: joi.number(),
          lng: joi.number()
        })
      }),
      type: joi.string(),
      permission: joi.object().keys({
        item: joi.boolean(),
        junk_shop: joi.boolean(),
        news: joi.boolean(),
      }),
    };

    // comment for dashboard
    if (body.location) {
      let { location } = body;
      body.location = JSON.parse(location);
    }

    if (body.password != undefined) {
      schema.password = joi.string().required()
    }

    if (body.phoneNumber != undefined) {
      schema.phoneNumber = joi.string().required()
    }

    const { error, value } = joi.validate(body, schema);

    if (!error) {

      try {

        // const { email } = body;
        // const emailExist = await User.find({ email });

        // if (emailExist && emailExist.length) {
        //   return res.status(409).json('Email address already exist');
        // }

        if (body.phoneNumber != undefined) {
          const { phoneNumber } = body;
          const phoneNumberExist = await User.find({ phoneNumber });
          if (phoneNumberExist && phoneNumberExist.length) {
            return res.status(409).json('Phone Number already exist');
          }
        }


        if (body.password != undefined) {
          const { password } = body;
          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash(password, salt);
          body.password = hash;
        }

        User.findOneAndUpdate(query, body, { upsert: false }, (err) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ error });
          }
          return res.status(201).send({
            message: 'Successfully Updated!',
          });
        });


      } catch (e) {
        console.log(e);
        res.status(500).json({ e });
      }



    } else {
      console.log(error)
      res.status(500).json({ error });
    }

  } else {

    const s3bucket = new AWS.S3({ params: { Bucket: 'oh-my-trash/user' } });
    let ext = file.originalname.split('.');
    ext = ext[ext.length - 1];
    const filename = `${Number(new Date())}.${ext}`;
    // const filename = file.originalname;

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
        body.profileImage = data.Location;
        let schema = {
          name: joi.string().required(),
          email: joi.string().email(),
          profileImage: joi.string(),
          facebook_account_id: joi.string(),
          google_account_id: joi.string(),
          apple_account_id: joi.string(),
          location: joi.object().keys({
            address: joi.string(),
            coordinate: joi.object().keys({
              lat: joi.number(),
              lng: joi.number()
            })
          }),
          type: joi.string(),
          permission: joi.object().keys({
            item: joi.boolean(),
            junk_shop: joi.boolean(),
            news: joi.boolean(),
          }),
        };

        if (body.location) {
          let { location } = body;
          body.location = JSON.parse(location);
        }

        if (body.password != undefined) {
          schema.password = joi.string().required()
        }

        if (body.phoneNumber != undefined) {
          schema.phoneNumber = joi.string().required()
        }

        const { error } = joi.validate(body, schema);

        if (!error) {

          try {

            // const { email } = body;
            // const emailExist = await User.find({ email });

            // if (emailExist && emailExist.length) {
            //   return res.status(409).json('Email address already exist');
            // }

            if (body.phoneNumber != undefined) {
              const { phoneNumber } = body;
              const phoneNumberExist = await User.find({ phoneNumber });
              if (phoneNumberExist && phoneNumberExist.length) {
                return res.status(409).json('Phone Number already exist');
              }
            }

            if (body.password != undefined) {
              const { password } = body;
              const salt = await bcrypt.genSalt(10);
              const hash = await bcrypt.hash(password, salt);
              body.password = hash;
            }

            User.findOneAndUpdate(query, body, { upsert: false }, (err) => {
              if (err) return res.status(500).json({ error });
              return res.status(201).send({
                message: 'Successfully Updated!',
              });
            });

          } catch (e) {
            console.log(e);
            res.status(500).json({ e });
          }

        } else {
          res.status(500).json({ error });
        }
      });
    });
  }

};

const DELETE_USER = async (req, res) => {
  const userId = req.params.id;
  User.findByIdAndDelete(userId, (err) => {
    if (err) return res.send(500, { error: err });
    return res.send('Successfully deleted');
  });
};


const PUSH_NOTIFICATION = async (req, res) => {
  const { title, message } = req.body;
  // const { one_signal_client } = req;
  console.log(req.body);
  try {
    const { where } = req.query;
    let query = {};
    if (where) {
      query = JSON.parse(where);
    }

    const users = await User.find(query)
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

    // let fn = new OneSignal.Notification({
    //   headings: {
    //     en: 'Oh My Trash'
    //   },
    //   contents: {
    //     en: message
    //   },
    //   priority: 10,
    //   // large_icon: SERVER_URL + 'users/' + rnNoti.createdBy._id + '/profile_pic',
    //   // big_picture: pic_path,
    //   include_player_ids: background_playerIds
    // });

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
          console.log("Response:");
          console.log(JSON.parse(data));

          // let noti_obj = JSON.parse(data);
          // console.log('hi', noti_obj)



          // try {



          // } catch (e) {
          //   console.log(e);
          //   res.status(500).json({ e });
          // }

          // } else {
          //   res.status(500).json({ error });
          // }

        });
      });

      req.on('error', function (e) {
        console.log("ERROR:");
        console.log(e);
        res.status(500).json(error);
      });

      req.write(JSON.stringify(data));
      req.end();
    };

    var message1 = {
      app_id: config.ONE_SIGNAL_APP_ID,
      headings: { en: '' + title },
      contents: { en: '' + message },
      // included_segments: ['All']
      include_player_ids: background_playerIds
    };
    sendNotification(message1)
    // try {
    //   const push_response = await one_signal_client.sendNotification(fn);
    //   console.log(push_response.data);
    // } catch (error) {
    //   console.log(error);
    // }

    const notification_message = {
      title: title,
      message: message,
      category: 'Announcement',
      all_user: true
    }

    const notification_schema = {
      title: joi.string().required(),
      message: joi.string(),
      all_user: joi.boolean(),
      category: joi.string(),
    };

    const { error } = joi.validate(notification_message, notification_schema);
    if (!error) {
      const notification = new Notification(notification_message);
      await notification.save();
    }
    return res.status(200).send({
      data: background_playerIds,
      message: 'Success',
    });
  } catch (error) {
    console.log(error)
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
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    // eslint-disable-next-line array-callback-return
    users.map((user) => {
      delete user.password;
      user.createdAt = moment(user.createdAt).format('DD-MM-YYYY');
    });
    return res.status(200).send({
      data: users,
      message: 'Success',
    });
  } catch (error) {
    res.status(500).json(error);
  }
};


module.exports = {
  GET_ALL_USERS,
  GET_SPECIFIC_USER,
  LOG_IN,
  LOG_IN_BY_SOCIAL,
  LOG_IN_BY_PHONE_VERIFICATION,
  CREATE_USER,
  UPDATE_USER,
  DELETE_USER,
  PUSH_NOTIFICATION,
  GET_NOTIFICATION
};
