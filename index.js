'use strict';

console.log("Starts application");

console.log("Read env variables");
require('dotenv').config();
process.env.SERVER_PORT = process.env.SERVER_PORT || 8080;
process.env.MONGO_HOST = process.env.MONGO_HOST || "localhost";
process.env.MONGO_URL = process.env.MONGO_URL || "mongodb://" + process.env.MONGO_HOST + ":27017/base-services";

console.log("Configure server");
const express = require("express");
const bodyParser = require('body-parser');

let app = express();
app.use(require('helmet')());
app.use(require('cors')());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json({
    limit: '50mb'
}));

console.log("Connect to database");
const db = require('./app/utils/dbaccess');
db.startDatabase(process.env.MONGO_URL).then( m => {

    app.use('/api', require('./app/api'));
    
    app.listen(process.env.SERVER_PORT, () => {
        console.log("Up and running on " + process.env.SERVER_PORT);
    });
    return null;
}).catch( e => {
    console.error(e);
    process.exit(1);
});


