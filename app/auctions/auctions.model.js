var mongoose = require("mongoose");

var AuctionsSchema = new mongoose.Schema({
    name : { type : String, required : [true, 'name is required'] },
    photo : { type : String },
    base_price : { type : Number, required : [true, 'base_price is required'] },
    bid_type : { type : Number, required : [true, 'bid_type is required'] },
    bid_step : { type : Number },
    status : { type : Number, required : [true, 'status is required'] },
    owner: { type : String, required : [true, 'owner is required'] },
    expiration_date: { type: Date },
    bids: [
        {
            email: { type : String },
            value: { type : Number },
            timestamp: { type: Date }
        }
    ]
}, {timestamps: true});

var Auctions = mongoose.model('Auctions', AuctionsSchema);

module.exports = Auctions;
