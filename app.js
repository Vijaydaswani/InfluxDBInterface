'use strict';

const express = require('express');
const config = require('./config');
const router = require('./routes/route');
const log4js = require('log4js');
const bodyParser = require('body-parser');

let server = express();

// support json encoded bodies
server.use(bodyParser.json({ limit: '50mb' }));

// support encoded bodies
server.use(bodyParser.urlencoded({ extended: true }));

// setup logging...

log4js.configure('./log4js.json');
let logger = log4js.getLogger('');

// use router middleware.
server.use('/api', router(config, log4js.getLogger()));

server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With,Content-Type,Accept'
  );
  next();
});
server.use('/', express.static('dist'));
//server.use(config.ROUTE_VIRTUAL_DIR + '/api', router(config));
// start the server
server.listen(config.SERVER_PORT, () => {
  logger.info(
    'Influx API running on port ' + config.SERVER_PORT
  );
});

