const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// const glob = require('glob');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
var multer = require('multer')
const config = require('./config/config');
const OneSignal = require('onesignal-node');


const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const discussed_product_socket = io.of('/discussed_product').on('connection', () => { });
const market_place_notification_socket = io.of('/market_place_notification').on('connection', () => { });


// eslint-disable-next-line no-var
const tokenList = {};
module.exports = tokenList;

// DB Config
const dbURI = config.db;

// Connect to MongoDB
const db = mongoose.connection;

db.on('connecting', () => {
  console.log('connecting to MongoDB...');
});
db.on('error', (error) => {
  console.error(`Error in MongoDb connection: ${error}`);
  mongoose.disconnect();
});
db.on('connected', () => {
  console.log('MongoDB connected!');
});
db.once('open', () => {
  console.log('MongoDB connection opened!');
});
db.on('reconnected', () => {
  console.log('MongoDB reconnected!');
});
db.on('disconnected', () => {
  console.log('MongoDB disconnected!');
  mongoose.connect(dbURI, {
    auto_reconnect: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
  });
});

const one_signal_client = new OneSignal.Client({
  userAuthKey: config.ONE_SIGNAL_USER_AUTH_KEY,
  // note that "app" must have "appAuthKey" and "appId" keys    
  app: { appAuthKey: config.ONE_SIGNAL_REST_KEY, appId: config.ONE_SIGNAL_APP_ID }
});

mongoose.connect(dbURI, {
  auto_reconnect: true,
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
});

// Global variables
global.appRoot = path.resolve(__dirname); // Set project root globally
global.api = '/api/v1';
global.models = `${global.appRoot}/models`;
global.controllers = `${global.appRoot}/controllers`;

// CORS
app.use(cors());

// HTTP Logger
app.use(logger('dev'));

// Express body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routers
const miscRouter = require('./routes/misc');
const userRouter = require('./routes/user');
const newsRouter = require('./routes/news');
const junkShopRouter = require('./routes/junkShop');
const item_router = require('./routes/item');
const contact_router = require('./routes/contact');
const dashboard_router = require('./routes/dashboard');
const market_place_router = require('./routes/marketPlace');
const rmv_router = require('./routes/rvm');
const wallet_router = require('./routes/wallet');

// routes
//put socket io to every response object
app.use((req, res, next) => {
  req.io = io;
  req.discussed_product_socket = discussed_product_socket;
  req.market_place_notification_socket = market_place_notification_socket;
  next();
});
app.use('/', miscRouter);
app.use('/users', userRouter);
app.use('/news', newsRouter);
app.use('/junkshops', junkShopRouter);
app.use('/item', item_router);
app.use('/contact', contact_router);
app.use('/market_place', market_place_router);
app.use('/dashboard', dashboard_router);
app.use('/rvm', rmv_router);
app.use('/wallets', wallet_router);

app.use((req, res, next) => {
  req.one_signal_client = one_signal_client
});

// 404
app.all('*', (req, res) => {
  res.sendStatus(404);
});

app.use((err, req, res) => {
  res.status(500).json({ message: 'Something went wrong!', error: err });
});

// Start Server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`serving on port ${port}`);
});
