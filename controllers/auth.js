/* eslint-disable consistent-return */
const jwt = require('jsonwebtoken');
const moment = require('moment');
const bcrypt = require('bcryptjs');

const jwtDecode = require('jwt-decode');
const config = require('../config/config');
// const User = require('../models/user');
const tokenList = require('../index');

// const LOG_IN = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email })
//       .populate('organizationId')
//       .sort({ createdAt: -1 })
//       .lean()
//       .exec();
//     if (user) {
//       bcrypt.compare(password, user.password, (err, isMatch) => {
//         if (err) return res.status(500).json(err);
//         if (isMatch) {
//           delete user.password;
//           user.createdAt = moment(user.createdAt).format('DD-MM-YYYY');
//           const token = jwt.sign(
//             { email },
//             config.jwtSecret,
//             { expiresIn: config.jwtTokenLife },
//           );
//           const refreshToken = jwt.sign(
//             { email }, config.refershTokenSecret,
//             { expiresIn: config.refreshTokenSecretLife },
//           );
//           tokenList[refreshToken] = token;
//           return res.status(200).send({
//             data: user,
//             token,
//             refreshToken,
//             message: 'Success',
//           });
//         }
//         return res.sendStatus(401);
//       });
//     } else {
//       return res.sendStatus(401);
//     }
//   } catch (error) {
//     return res.status(500).json(error);
//   }
// };


// const LOG_IN = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) {
//       return res.sendStatus(400);
//     }
//     let user;
//     user = await User.findOne({ email })
//       .sort({ createdAt: -1 })
//       .lean()
//       .exec();
//     if (!user) {
//       let phone_number = email;
//       if (phone_number[0] == 0) {
//         phone_number = '+95' + phone_number.slice(1);
//       } else {
//         phone_number = '+959' + phone_number;
//       }
//       user = await User.findOne({ 'phoneNumber': phone_number })
//         .sort({ createdAt: -1 })
//         .lean()
//         .exec();
//     }

//     if (user) {
//       bcrypt.compare(password, user.password, (err, isMatch) => {
//         if (err) return res.status(500).json(err);
//         if (isMatch) {
//           delete user.password;
//           user.createdAt = moment(user.createdAt).format('DD-MM-YYYY');
//           const token = jwt.sign(
//             { email },
//             config.jwtSecret,
//             { expiresIn: config.jwtTokenLife },
//           );
//           const refreshToken = jwt.sign(
//             { email }, config.refershTokenSecret,
//             { expiresIn: config.refreshTokenSecretLife },
//           );
//           tokenList[refreshToken] = token;
//           return res.status(200).send({
//             data: user,
//             token,
//             refreshToken,
//             message: 'Success',
//           });
//         }
//         return res.sendStatus(401);
//       });
//     } else {
//       return res.sendStatus(401);
//     }
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json(error);
//   }
// };

const CHECK_AUTH = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, config.jwtSecret);
    req.userData = decodedToken;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      message: 'Auth Failed',
    });
  }
};

const CHECK_APIKEY = (req, res, next) => {
  try {
    const apikey = req.headers.apikey;
    if (apikey !== '37b36461-2312-49fb-a92c-50f34892e4a3') {
      return res.status(401).json({
        message: 'Auth Failed',
      });
    }
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      message: 'Auth Failed',
    });
  }
};

const REFRESH_TOKEN = (req, res) => {
  console.log('refresh_token')
  const postData = req.body;
  console.log(postData)
  if ((postData.refreshToken) && (postData.refreshToken in tokenList)) {
    console.log('refresh_token found');
    const decoded = jwtDecode(postData.refreshToken);
    const token = jwt.sign(
      { email: decoded.email },
      config.jwtSecret,
      { expiresIn: config.jwtTokenLife },
    );
    const response = {
      token,
    };
    // update the token in the list
    tokenList[postData.refreshToken].token = token;
    res.status(200).json(response);
  } else {
    console.log('refresh_token not found');
    res.status(404).send('Invalid request');
  }
};


module.exports = {
  CHECK_AUTH,
  REFRESH_TOKEN,
  CHECK_APIKEY,
  // LOG_IN,
};

