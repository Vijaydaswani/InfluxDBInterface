'use strict';

const express = require('express');
const log4js = require('log4js');
const promise = require('bluebird');
const router = express.Router();
const xlsx = require('xlsx')
const fs = require("fs");
const multer = require('multer');
const Influx = require('influxdb-nodejs');
var xlData;

module.exports = () => {

  //Connection to InfluxDB
  const client = new Influx('http://localhost:8086/statsdemo');
  //Logger Function
  log4js.configure('./log4js.json');
  let log = log4js.getLogger('');
  //Read Excel File
  var readExcelFile = () => {
    var workbook = xlsx.readFile('./docs/download.xlsx');
    var sheet_name_list = workbook.SheetNames;
    xlData = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

  }
  //Download Excel FIle to local
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      var name = file.originalname;
      var dir = "docs"
      log.info(name);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        cb(null, dir)
      }
      cb(null, dir)
    },
    filename: function (req, file, cb) {
      cb(null, "download.xlsx")
    }
  })

  var upload = multer({ storage: storage })


  // important in order to send request to next middleware...
  router.use((req, res, next) => {
    log.info('Request Recieved by client ' + req.connection.remoteAddress);
    next();
  });

  router.post("/import", upload.single('file'), function (req, res) {

    const file = req.file.originalname
    const tableName = req.query.tableName;
    log.info("file name " + file);

    //Function Call for reading file from UI
    readExcelFile();
    if (!file) {
      res.send({ error: "please upload excel file." }).status(400)
    }
    else {
      client.schema(tableName, {
        stripUnknown: true,
      });
      return new promise((resolve) => {
        xlData.forEach(data => {
          client.write(tableName).field(data)
            .then(() => {

              resolve({ result: "data inserted in " + tableName })
            })
        })
      })
        .then((data) => {
          log.info(data);
          res.send(data).status(200);
        })
        .catch((error) => res.send(error)).catch(log.error);
    }
  });
  return router;
};
