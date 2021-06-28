/* eslint-disable consistent-return */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
const User = require('../models/user');
const Item = require('../models/item');
const JunkShop = require('../models/junkShop');
const News = require('../models/news');
const MarketPlace = require('../models/marketPlace');

const GET_ALL_COUNT = async (req, res) => {
    try {
        const { where } = req.query;
        let query = {};
        if (where) {
            query = JSON.parse(where);
        }
        let count = {};
        const user_count = await User.countDocuments()
            .exec();
        count.user_count = user_count;

        const item_count = await Item.countDocuments()
            .exec();
        count.item_count = item_count;

        const junk_shop_count = await JunkShop.countDocuments({ 'approve_status': 'APPROVED' })
            .exec();
        count.junk_shop_count = junk_shop_count;

        const news_count = await News.countDocuments()
            .exec();
        count.news_count = news_count;

        const market_place_count = await MarketPlace.countDocuments()
            .exec();
        count.market_place_count = market_place_count;

        return res.status(200).send({
            count: count,
            message: 'Success',
        });
    } catch (error) {
        console.log(error)
        res.status(500).json(error);
    }
};



module.exports = {
    GET_ALL_COUNT,
};
