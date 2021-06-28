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

const MarketPlace = require('../models/marketPlace');
const Notification = require('../models/notification');
const config = require('../config/config');


const GET_ALL_MARKET_PLACE = async (req, res) => {
    try {
        const { where } = req.query;
        let query = {};
        if (where) {
            query = JSON.parse(where);
        }
        const market_place = await MarketPlace.find({ product_status: 'AVAILABLE' })
            .populate('uploaded_by')
            .populate('ordered_list.ordered_by')
            .sort({ uploaded_date: -1 })
            .lean()
            .exec();
        // eslint-disable-next-line array-callback-return
        market_place.map((product) => {
            product.uploaded_date = moment(product.uploaded_date).format('DD-MM-YYYY');
        });
        return res.status(200).send({
            data: market_place,
            message: 'Success',
        });
    } catch (error) {
        res.status(500).json(error);
    }
};

const GET_DASHBOARD_ALL_MARKET_PLACE = async (req, res) => {
    try {
        const { where } = req.query;
        let query = {};
        if (where) {
            query = JSON.parse(where);
        }
        const market_place = await MarketPlace.find()
            .populate('uploaded_by')
            .populate('ordered_list.ordered_by')
            .sort({ uploaded_date: -1 })
            .lean()
            .exec();
        // eslint-disable-next-line array-callback-return
        market_place.map((product) => {
            product.uploaded_date = moment(product.uploaded_date).format('DD-MM-YYYY');
        });
        return res.status(200).send({
            data: market_place,
            message: 'Success',
        });
    } catch (error) {
        res.status(500).json(error);
    }
};


// const GET_PENDING_NEWS = async (req, res) => {
//     try {
//         const { where } = req.query;
//         let query = {};
//         if (where) {
//             query = JSON.parse(where);
//         }
//         const market_place = await MarketPlace.find({ approved: false })
//             .sort({ publishedDate: -1 })
//             .lean()
//             .exec();
//         // eslint-disable-next-line array-callback-return
//         market_place.map((product) => {
//             product.publishedDate = moment(product.publishedDate).format('DD-MM-YYYY');
//         });
//         return res.status(200).send({
//             data: market_place,
//             message: 'Success',
//         });
//     } catch (error) {
//         res.status(500).json(error);
//     }
// };



const GET_MARKET_PLACE_INFO = async (req, res) => {
    try {
        const { id } = req.params;
        const market_place = await MarketPlace.findOne({ _id: id })
            .populate('uploaded_by')
            .populate('ordered_list.ordered_by')
            // .sort({ publishedDate: -1 })
            .sort({ 'ordered_list.ordered_by.note.message_date': -1 })
            .lean()
            .exec();
        if (market_place) {
            market_place.uploaded_date = moment(market_place.uploaded_date).format('DD-MM-YYYY');
            return res.status(200).send({
                data: market_place,
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


const CREATE_MARKET_PLACE = async (req, res) => {

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
    const s3bucket = new AWS.S3({ params: { Bucket: 'oh-my-trash/market_place' } });
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
                            image: joi.array().items(joi.string()),
                            description: joi.string(),
                            price: joi.string(),
                            category: joi.string(),
                            uploaded_by: joi.string().required(),
                            uploaded_date: joi.string()
                        };

                        const { error } = joi.validate(body, schema);
                        if (!error) {
                            try {
                                const market_place = new MarketPlace(req.body);
                                await market_place.save();

                                return res.status(201).send({
                                    message: 'Successfully uploaded your item.',
                                    data: market_place,
                                });
                            } catch (err) {
                                console.log(err)
                                res.status(500).json({ err });
                            }
                        } else {
                            console.log(error)
                            res.status(500).json({ error });
                        }
                    }
                }

            });

        })

    });

};


const UPDATE_MARKET_PLACE = async (req, res) => {
    const query = { _id: req.params.id };
    const { body, files } = req;

    let { old_news_image } = body;
    body.image = JSON.parse(old_news_image);
    delete body.old_news_image;

    if (files.length == 0) {

        const schema = {
            name: joi.string().required(),
            description: joi.string(),
            price: joi.string(),
            category: joi.string(),
            image: joi.array().items(joi.string()),
            product_status: joi.string()
        };

        const { error } = joi.validate(body, schema);

        if (!error) {

            MarketPlace.findOneAndUpdate(query, body, { upsert: false }, (err) => {
                if (err) return res.status(500).json({ error });
                return res.status(201).send({
                    message: 'Successfully Updated!',
                });
            });
        } else {
            console.log(error)
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

        const s3bucket = new AWS.S3({ params: { Bucket: 'oh-my-trash/market_place' } });

        s3bucket.createBucket(() => {

            resized_upload_files.map(params => {
                s3bucket.upload(params, async (err, data) => {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    body.image.push(data.Location);
                    const schema = {
                        name: joi.string().required(),
                        description: joi.string(),
                        price: joi.string(),
                        category: joi.string(),
                        image: joi.array().items(joi.string()),
                        product_status: joi.string()
                    };
                    const { error, value } = joi.validate(body, schema);
                    // console.log(value);
                    if (!error) {
                        try {
                            MarketPlace.findOneAndUpdate(query, body, { upsert: false }, (err) => {
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


const SAVE_MARKET_PRODUCT = async (req, res) => {
    const query = { _id: req.params.id };
    const { body, files } = req;

    let { saved_by } = body;
    body.saved_by = JSON.parse(saved_by);

    const schema = {
        saved_by: joi.array().items(joi.string()),
    };

    const { error } = joi.validate(body, schema);

    if (!error) {

        MarketPlace.findOneAndUpdate(query, body, { upsert: false }, (err) => {
            if (err) return res.status(500).json({ error });
            return res.status(201).send({
                message: 'Successfully Saved!',
            });
        });
    } else {
        console.log(error)
        res.status(500).json({ error });
    }

};


const ORDER_MARKET_PRODUCT = async (req, res) => {
    const query = { _id: req.params.id };
    const { id } = req.params;

    let { body } = req;

    const market_place_notification_socket = req.market_place_notification_socket;

    let { note, product_name, device_id, product_image, ordered_by_name, uploaded_by } = body;
    if (note) {
        body.note = JSON.parse(note);
    }
    body.ordered_status = 'ORDERED';
    delete body.product_name;
    delete body.device_id;
    delete body.product_image;
    delete body.ordered_by_name;
    delete body.uploaded_by;

    const schema = {
        ordered_by: joi.string(),
        ordered_status: joi.string(),
        note: joi.array().items(joi.string()),
    };

    let { error } = joi.validate(body, schema);

    if (!error) {

        let background_playerIds = [device_id];

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
            headings: { en: '' + 'Market Place Order Request' },
            contents: { en: '\" ' + ordered_by_name + ' \" has ordered your product \" ' + product_name + ' \".' },
            // included_segments: ['All']
            big_picture: product_image,
            include_player_ids: background_playerIds
        };
        sendNotification(message1)

        const notification_message = {
            title: 'Market Place Order Request',
            message: '\" ' + ordered_by_name + ' \" has ordered your product \" ' + product_name + ' \".',
            image: product_image,
            user: uploaded_by,
            category: 'MarketPlace_ORDER',
            content_id: id
        }

        const notification_schema = {
            title: joi.string().required(),
            message: joi.string(),
            image: joi.string(),
            user: joi.string(),
            category: joi.string(),
            content_id: joi.string(),
        };

        const { error } = joi.validate(notification_message, notification_schema);
        if (!error) {
            const notification = new Notification(notification_message);
            await notification.save();

            //all socket ids who subscribe to market place notification
            const all_clients = Object.keys(market_place_notification_socket.connected);
            for (let each_socket_id of all_clients) {
                //get socket obj from socket id
                const each_socket = market_place_notification_socket.connected[each_socket_id];
                //get user_id from socket.io query
                const user_id = each_socket.handshake.query.user_id;
                if (user_id == uploaded_by) {
                    each_socket.emit('notification', notification);
                }
            }
        }

        MarketPlace.findOneAndUpdate(query, {
            $push: {
                ordered_list: body
            }
        }, { safe: true, upsert: false }, (err) => {
            if (err) return res.status(500).json({ error });

            return res.status(201).send({
                message: 'Successfully Ordered!',
            });
        });


    } else {
        console.log(error)
        res.status(500).json({ error });
    }

};


const DISCUSS_MARKET_PRODUCT = async (req, res) => {
    let { body } = req;
    const { id } = req.params;

    const discussed_product_socket = req.discussed_product_socket;
    const market_place_notification_socket = req.market_place_notification_socket;

    let { product_name, device_id, product_image, sender_name, ordered_by, sent_to } = body;

    body.note = JSON.parse(body.note);

    const add_order_list = {
        ordered_by: body.ordered_by,
        ordered_status: 'ORDERED',
        note: [body.note]
    }

    let market_place = await MarketPlace.find({ '_id': id, 'ordered_list.ordered_by': ordered_by })
        .sort({ publishedDate: -1 })
        .lean()
        .exec();
    if (market_place && market_place.length) {

        const index = market_place[0].ordered_list.findIndex((each_order) => each_order.ordered_by == ordered_by);
        let push_query = {};
        push_query['ordered_list.' + index + '.note'] = body.note;

        let background_playerIds = [device_id];

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
            headings: { en: '' + 'Market Place Message' },
            contents: { en: '\" ' + sender_name + ' \" has messaged for product \" ' + product_name + ' \".' },
            // included_segments: ['All']
            big_picture: product_image,
            include_player_ids: background_playerIds
        };

        const notification_message = {
            title: 'Market Place Message',
            message: '\" ' + sender_name + ' \" has messaged for product \" ' + product_name + ' \".',
            image: product_image,
            user: sent_to,
            category: 'MarketPlace_MESSAGE',
            content_id: id
        }

        const notification_schema = {
            title: joi.string().required(),
            message: joi.string(),
            image: joi.string(),
            user: joi.string(),
            category: joi.string(),
            content_id: joi.string(),

        };

        const { error } = joi.validate(notification_message, notification_schema);

        MarketPlace.findOneAndUpdate({ '_id': id, 'ordered_list.ordered_by': ordered_by }, {
            $push: push_query
        }, { safe: true, upsert: false }, async (err) => {
            if (err) return res.status(500).json({ error });

            let message_is_open = false;

            const all_clients = Object.keys(discussed_product_socket.connected);
            for (let each_socket_id of all_clients) {
                //get socket obj from socket id
                const each_socket = discussed_product_socket.connected[each_socket_id];
                //get user_id from socket.io query
                const user_id = each_socket.handshake.query.user_id;
                if (user_id == sent_to) {
                    message_is_open = true;
                }
            }

            discussed_product_socket.emit('message', body.note);

            if (!message_is_open) {

                sendNotification(message1);

                const notification = new Notification(notification_message);
                await notification.save();

                //all socket ids who subscribe to market place notification
                const all_clients = Object.keys(market_place_notification_socket.connected);
                for (let each_socket_id of all_clients) {
                    //get socket obj from socket id
                    const each_socket = market_place_notification_socket.connected[each_socket_id];
                    //get user_id from socket.io query
                    const user_id = each_socket.handshake.query.user_id;
                    if (user_id == sent_to) {
                        each_socket.emit('notification', notification);
                    }
                }
            }



            return res.status(201).send({
                message: 'Successfully Messaged!',
            });
        });
    } else {
        MarketPlace.findOneAndUpdate({ _id: id, }, {
            $push: {
                ordered_list: add_order_list
            }
        }, { safe: true, upsert: false }, (err) => {
            console.log(err)
            if (err) return res.status(500).json({ error });
            discussed_product_socket.emit('message', body.note);
            return res.status(201).send({
                message: 'Successfully Messaged!',
            });
        });
    }



    // const schema = {
    //     ordered_by: joi.string(),
    //     ordered_status: joi.string(),
    //     // note: joi.array().items(joi.object().keys({
    //     //     message: joi.string(),
    //     //     message_by: joi.string(),
    //     // })),
    // };

    // let { error } = joi.validate(body, schema);

    // if (!error) {

    //     MarketPlace.findOneAndUpdate({ _id: id, }, {
    //         $push: {
    //             ordered_list: body
    //         }
    //     }, { safe: true, upsert: false }, (err) => {
    //         if (err) return res.status(500).json({ error });
    //         return res.status(201).send({
    //             message: 'Successfully Messaged!',
    //         });
    //     });
    // } else {
    //     console.log(error)
    //     res.status(500).json({ error });
    // }

};

const ACCEPT_MY_MARKET_PRODUCT_ORDERED = async (req, res) => {
    const query = { _id: req.params.id };
    const { id } = req.params;

    let { body } = req;

    const market_place_notification_socket = req.market_place_notification_socket;

    let { accepted_user_id, product_name, device_id, product_image, uploaded_by_name } = body;
    delete body.product_name;
    delete body.device_id;
    delete body.product_image;
    delete body.uploaded_by_name;

    // let accepted_user_id = accepted_user_id;
    // body.ordered_list = JSON.parse(ordered_list);

    // const schema = {
    //     ordered_by: joi.array().items(joi.string()),
    // };
    // body.ordered_list.map(each_order => {
    //     let ordered_by_id = each_order.ordered_by._id;
    //     delete each_order.ordered_by;
    //     each_order.ordered_by = ordered_by_id;
    //     delete each_order.ordered_date;
    //     delete each_order.note;
    // })

    let market_place = await MarketPlace.find(query)
        .sort({ publishedDate: -1 })
        .lean()
        .exec();
    // const index = market_place[0].ordered_list.findIndex((each_order) => each_order.ordered_by == accepted_user_id);
    // let push_query = {};


    let note = {
        'message': 'Your order has been accepted.',
        'message_by': market_place[0].uploaded_by
    }

    let ordered_list = market_place[0].ordered_list;
    ordered_list.map(each_order => {
        if (each_order.ordered_by == accepted_user_id) {
            each_order.ordered_status = 'ACCEPTED'
            each_order.note.push(note)
        }
        else {
            each_order.ordered_status = 'REJECTED'
        }
    })

    let data = {
        product_status: 'ACCEPTED',
        ordered_list: ordered_list
    }
    // data['ordered_list.' + index + '.ordered_status'] = 'ACCEPTED';

    // const schema = {
    //     product_status: joi.string(),
    //     ordered_list: joi.array().items(joi.object().keys({
    //         ordered_by: joi.string(),
    //         ordered_status: joi.string(),
    //     })),
    // };

    // const { error } = joi.validate(body, schema);



    // if (!error) {

    let background_playerIds = [device_id];

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
        headings: { en: '' + 'Market Place Product Accepted' },
        contents: { en: '\" ' + uploaded_by_name + ' \" has accepted your order product \" ' + product_name + ' \".' },
        // included_segments: ['All']
        big_picture: product_image,
        include_player_ids: background_playerIds
    };
    sendNotification(message1)

    const notification_message = {
        title: 'Market Place Product Accepted',
        message: '\" ' + uploaded_by_name + ' \" has accepted your order product \" ' + product_name + ' \".',
        image: product_image,
        user: accepted_user_id,
        category: 'MarketPlace_SELL',
        content_id: id
    }

    const notification_schema = {
        title: joi.string().required(),
        message: joi.string(),
        image: joi.string(),
        user: joi.string(),
        category: joi.string(),
        content_id: joi.string(),
    };

    const { error } = joi.validate(notification_message, notification_schema);
    if (!error) {
        const notification = new Notification(notification_message);
        await notification.save();

        //all socket ids who subscribe to market place notification
        const all_clients = Object.keys(market_place_notification_socket.connected);
        for (let each_socket_id of all_clients) {
            //get socket obj from socket id
            const each_socket = market_place_notification_socket.connected[each_socket_id];
            //get user_id from socket.io query
            const user_id = each_socket.handshake.query.user_id;
            if (user_id == accepted_user_id) {
                each_socket.emit('notification', notification);
            }
        }
    }

    MarketPlace.findOneAndUpdate(query, data, { upsert: false }, (err) => {
        if (err) return res.status(500).json({ error });
        return res.status(201).send({
            message: 'Successfully Updated!',
        });
    });
    // } else {
    //     console.log(error)
    //     return res.status(500).json({ error });
    // }

};

const REJECT_MY_MARKET_PRODUCT_0RDERED = async (req, res) => {
    const query = { _id: req.params.id };
    let { body, files } = req;

    // body.product_status = 'REJECTED';

    // body.ordered_by = JSON.parse(ordered_by);

    // const schema = {
    //     ordered_by: joi.array().items(joi.string()),
    // };

    const schema = {
        product_status: joi.string()
    };

    const { error } = joi.validate(body, schema);

    if (!error) {

        MarketPlace.findOneAndUpdate(query, body, { upsert: false }, (err) => {
            console.log(err);
            if (err) return res.status(500).json({ error });
            return res.status(201).send({
                message: 'Successfully Updated!',
            });
        });
    } else {
        console.log(error)
        res.status(500).json({ error });
    }

};


const GET_SAVED_MARKET_PRODUCT = async (req, res) => {
    try {
        // const query = { _id: req.params.id };
        const { where } = req.query;
        let query = {};
        if (where) {
            query = JSON.parse(where);
        }
        // const { body, files } = req;
        // let saved_by = body.saved_by;

        const { id } = req.params;

        const market_place = await MarketPlace.find({ saved_by: id })
            .populate('uploaded_by')
            .populate('ordered_list.ordered_by')
            .sort({ uploaded_date: -1 })
            .lean()
            .exec();
        // eslint-disable-next-line array-callback-return
        market_place.map((product) => {
            product.uploaded_date = moment(product.uploaded_date).format('DD-MM-YYYY');
        });
        return res.status(200).send({
            data: market_place,
            message: 'Success',
        });
    } catch (error) {
        res.status(500).json(error);
    }
};

const GET_ORDERED_MARKET_PRODUCT = async (req, res) => {
    try {
        // const query = { _id: req.params.id };
        const { where } = req.query;
        let query = {};
        if (where) {
            query = JSON.parse(where);
        }

        const { id } = req.params;
        const market_place = await MarketPlace.find({ 'ordered_list.ordered_by': id })
            .populate('uploaded_by')
            .populate('ordered_list.ordered_by')
            .sort({ uploaded_date: -1 })
            .lean()
            .exec();
        // eslint-disable-next-line array-callback-return
        market_place.map((product) => {
            product.uploaded_date = moment(product.uploaded_date).format('DD-MM-YYYY');
        });
        return res.status(200).send({
            data: market_place,
            message: 'Success',
        });
    } catch (error) {
        res.status(500).json(error);
    }
};

const GET_ORDERED_ACCEPTED_MARKET_PRODUCT = async (req, res) => {
    try {
        // const query = { _id: req.params.id };
        const { where } = req.query;
        let query = {};
        if (where) {
            query = JSON.parse(where);
        }

        const { id } = req.params;
        // const market_place = await MarketPlace.find({ 'ordered_list.ordered_by': id, 'ordered_list.ordered_status': 'REJECTED' })
        //     .populate('uploaded_by')
        //     .sort({ uploaded_date: -1 })
        //     .lean()
        //     .exec();
        const market_place = await MarketPlace.find({ 'ordered_list': { $elemMatch: { ordered_by: id, ordered_status: 'ACCEPTED' } } })
            .populate('uploaded_by')
            .sort({ uploaded_date: -1 })
            .lean()
            .exec();
        // eslint-disable-next-line array-callback-return
        market_place.map((product) => {
            product.uploaded_date = moment(product.uploaded_date).format('DD-MM-YYYY');
        });
        return res.status(200).send({
            data: market_place,
            message: 'Success',
        });
    } catch (error) {
        res.status(500).json(error);
    }
};


const GET_UPLOADED_MARKET_PRODUCT = async (req, res) => {
    try {
        // const query = { _id: req.params.id };
        const { where } = req.query;
        let query = {};
        if (where) {
            query = JSON.parse(where);
        }
        // const { body, files } = req;
        // let saved_by = body.saved_by;

        const { id } = req.params;

        const market_place = await MarketPlace.find({ uploaded_by: id })
            .populate('uploaded_by')
            .sort({ uploaded_date: -1 })
            .lean()
            .exec();
        // eslint-disable-next-line array-callback-return
        market_place.map((product) => {
            product.uploaded_date = moment(product.uploaded_date).format('DD-MM-YYYY');
        });
        return res.status(200).send({
            data: market_place,
            message: 'Success',
        });
    } catch (error) {
        res.status(500).json(error);
    }
};

const GET_MY_MARKET_PRODUCT_ORDERED = async (req, res) => {
    try {
        // const query = { _id: req.params.id };
        const { where } = req.query;
        let query = {};
        if (where) {
            query = JSON.parse(where);
        }
        // const { body, files } = req;

        const { id } = req.params;

        const market_place = await MarketPlace.find({ uploaded_by: id, 'ordered_list.0': { $exists: true } })
            .populate('ordered_list.ordered_by')
            .populate('uploaded_by')
            .sort({ uploaded_date: -1 })
            .lean()
            .exec();
        // eslint-disable-next-line array-callback-return
        market_place.map((product) => {
            product.uploaded_date = moment(product.uploaded_date).format('DD-MM-YYYY');
        });
        return res.status(200).send({
            data: market_place,
            message: 'Success',
        });
    } catch (error) {
        console.log(error)
        res.status(500).json(error);
    }
};


const GET_MY_MARKET_PRODUCT_ORDERED_ACCEPTED = async (req, res) => {
    try {
        // const query = { _id: req.params.id };
        const { where } = req.query;
        let query = {};
        if (where) {
            query = JSON.parse(where);
        }
        // const { body, files } = req;

        const { id } = req.params;

        const market_place = await MarketPlace.find({ uploaded_by: id, product_status: 'ACCEPTED' })
            .populate('ordered_list.ordered_by')
            .populate('uploaded_by')
            .sort({ uploaded_date: -1 })
            .lean()
            .exec();
        // eslint-disable-next-line array-callback-return
        market_place.map((product) => {
            product.uploaded_date = moment(product.uploaded_date).format('DD-MM-YYYY');
        });
        return res.status(200).send({
            data: market_place,
            message: 'Success',
        });
    } catch (error) {
        console.log(error)
        res.status(500).json(error);
    }
};


const GET_MARKET_PLACE_NOTIFICATION = async (req, res) => {
    try {
        // const query = { _id: req.params.id };
        const { where } = req.query;
        let query = {};
        if (where) {
            query = JSON.parse(where);
        }
        // const { body, files } = req;
        // let saved_by = body.saved_by;

        const { id } = req.params;

        const notification = await Notification.find({ $or: [{ 'user': id }, { 'all_user': true }] })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        // eslint-disable-next-line array-callback-return
        notification.map((each_notification) => {
            each_notification.createdAt = moment(each_notification.createdAt).format('DD-MM-YYYY');
        });
        return res.status(200).send({
            data: notification,
            message: 'Success',
        });
    } catch (error) {
        res.status(500).json(error);
    }
};


const DELETE_NEWS = async (req, res) => {
    const news_id = req.params.id;
    MarketPlace.findByIdAndDelete(news_id, (err) => {
        if (err) return res.send(500, { error: err });
        return res.send('Successfully deleted');
    });
};


module.exports = {
    GET_ALL_MARKET_PLACE,
    GET_DASHBOARD_ALL_MARKET_PLACE,
    SAVE_MARKET_PRODUCT,
    GET_SAVED_MARKET_PRODUCT,
    GET_UPLOADED_MARKET_PRODUCT,
    GET_ORDERED_MARKET_PRODUCT,
    GET_ORDERED_ACCEPTED_MARKET_PRODUCT,
    GET_MY_MARKET_PRODUCT_ORDERED,
    GET_MY_MARKET_PRODUCT_ORDERED_ACCEPTED,
    ORDER_MARKET_PRODUCT,
    DISCUSS_MARKET_PRODUCT,
    ACCEPT_MY_MARKET_PRODUCT_ORDERED,
    REJECT_MY_MARKET_PRODUCT_0RDERED,
    GET_MARKET_PLACE_INFO,
    CREATE_MARKET_PLACE,
    UPDATE_MARKET_PLACE,
    GET_MARKET_PLACE_NOTIFICATION,
    DELETE_NEWS,
};

