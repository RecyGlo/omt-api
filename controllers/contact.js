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
const Contact = require('../models/contact');

const GET_ALL_CONTACT = async (req, res) => {
    try {
        const { where } = req.query;
        let query = {};
        if (where) {
            query = JSON.parse(where);
        }
        const contact = await Contact.find(query)
            .sort({ publishedDate: -1 })
            .lean()
            .exec();

        // eslint-disable-next-line array-callback-return


        let category = [];
        let data = [];
        contact.map((each_contact, index) => {

            if (each_contact.category == 'null') {
                let a = {
                    'id': index + '',
                    'category': '',
                    'list': [each_contact]
                }
                data.push(a);
            } else {

                if (category.includes(each_contact.category)) {
                    data.map((each_data) => {
                        if (each_data.category == each_contact.category) {
                            each_data.list.push(each_contact);
                        }
                    })
                } else {
                    category.push(each_contact.category);
                    let a = {
                        'id': index + '',
                        'category': each_contact.category,
                        'list': [each_contact]
                    }
                    data.push(a);
                }
            }
        });
        return res.status(200).send({
            data: data,
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
        const contact = await Contact.find({ approved: false })
            .sort({ publishedDate: -1 })
            .lean()
            .exec();
        // eslint-disable-next-line array-callback-return
        contact.map((eachItem) => {
            eachItem.price.reverse();
            eachItem.price = eachItem.price.slice(0, 5);
            eachItem.price.map((each_price) => {
                each_price.date = moment(each_price.added_date).format('DD-MM-YYYY');
            })
            // eachItem.publishedDate = moment(eachItem.publishedDate).format('DD-MM-YYYY');
        });
        return res.status(200).send({
            data: contact,
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

// const CREATE_CONTACT = async (req, res) => {
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
//       const contact = new Contact(req.body);
//       await contact.save();

//       return res.status(201).send({
//         message: 'Successfully created the contact!',
//         data: contact,
//       });
//     } catch (err) {
//       res.status(500).json({ err });
//     }
//   } else {
//     res.status(500).json({ error });
//   }
// };


// const CREATE_CONTACT = async (req, res) => {

//   const { body, file } = req;

//   let { price } = body;
//   body.price = JSON.parse(price);

//   const s3bucket = new AWS.S3({ params: { Bucket: 'oh-my-trash/contact' } });
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
//           const contact = new Contact(body);
//           await contact.save();
//           return res.status(201).send({
//             message: 'Successfully created the contact!',
//             data: contact,
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

const CREATE_CONTACT = async (req, res) => {

    const { body, file } = req;
    let { phone_number } = body;
    body.phone_number = JSON.parse(phone_number);

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
                    added_by: joi.string().required(),
                    approve_status: joi.string(),
                    approve_by: joi.string(),
                };

                const { error, value } = joi.validate(body, schema);
                if (!error) {
                    try {
                        const contact = new Contact(req.body);
                        await contact.save();

                        return res.status(201).send({
                            message: 'Successfully added the junk shop.',
                            data: contact,
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
            phone_number: joi.array().items(joi.string()),
            category: joi.string(),
            added_by: joi.string().required(),
        };

        const { error, value } = joi.validate(body, schema);
        if (!error) {
            try {
                const contact = new Contact(req.body);
                await contact.save();

                return res.status(201).send({
                    message: 'Successfully added the contact.',
                    data: contact,
                });
            } catch (err) {
                res.status(500).json({ err });
            }
        } else {
            res.status(500).json({ error });
        }
    }

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

            Contact.findOneAndUpdate(query, body, { upsert: false }, (err) => {
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

        for (let contact of files) {
            let ext = contact.originalname.split('.');
            ext = ext[ext.length - 1];
            let filename = `${Number(new Date())}.${ext}`;

            let resized_image_buffer = await sharp(contact.buffer)
                .resize(700)
                .rotate()
                .jpeg(20)
                .toBuffer();

            let params = {
                Key: filename,
                Body: resized_image_buffer,
                ContentType: contact.mimetype,
                ACL: "public-read",
            };

            resized_upload_files.push(params);

        }

        const s3bucket = new AWS.S3({ params: { Bucket: 'oh-my-trash/contact' } });

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
                            Contact.findOneAndUpdate(query, body, { upsert: false }, (err) => {
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
    Contact.findByIdAndDelete(item_id, (err) => {
        if (err) return res.send(500, { error: err });
        return res.send('Successfully deleted');
    });
};

module.exports = {
    GET_ALL_CONTACT,
    GET_PENDING_ITEM,
    // GET_SPECIFIC_ITEM,
    CREATE_CONTACT,
    UPDATE_ITEM,
    DELETE_ITEM,
};
