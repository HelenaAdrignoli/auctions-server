var dbaccess = {};

dbaccess.mongoose = "";

dbaccess.startDatabase = function(url) {
    var _self = this;
    
    return new Promise(function(resolve, reject) {
        try {
            console.info("Require mongoose");
            
            _self.mongoose = require("mongoose");


            console.info("Connect");
            _self.mongoose.connect(url, { reconnectTries: Number.MAX_VALUE, useNewUrlParser: true });

            _self.mongoose.connection.on("open", () => {
                resolve("MongoDB connection openned");
            });

            _self.mongoose.connection.on("error", (e) => {
                console.error(e);
                reject(e);
            });
            
            _self.mongoose.connection.on("disconnected", () => console.info("MongoDB connection disconnected"));
            _self.mongoose.connection.on("reconnected", () => console.info("MongoDB connection reconnected"));
        } catch(e) {
            console.error(e);
            reject(e);
        }
    });
}

module.exports = dbaccess;
