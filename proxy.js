const request = require('request');
const util = require('util');
const express = require('express');
const bodyParser = require('body-parser');
var cors = require('cors');

let url = "http://52.77.99.238:4000/jsonrpc"

function doRequest(payload) {
    return new Promise(function (resolve, reject) {
      request.post({url: url, body: JSON.stringify(payload),  headers: {
        'content-type': 'application/json'}}, function (error, res, body) {
        if (!error && res.statusCode == 200) {
          resolve(body);
        } else {
          reject(error);
        }
      });
    });
  }


const app = express()

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(bodyParser());

app.options('/jsonrpc', cors());

app.post('/jsonrpc', async (req, res) => {
    let response = await doRequest(req.body);    
    res.send((response));
})
app.options('*', async (req, res) => {
    res.send(200);
})

app.listen(8081, () => console.log('Example app listening on port 8081!'))