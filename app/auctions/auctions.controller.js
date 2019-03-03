var AuctionsController = AuctionsController || {};

AuctionsController.getAuctions = function (filters) {
    let Auctions = require('./auctions.model');

    return new Promise( (resolve, reject) => {
        if( !filters.page ) filters.page = 1;
        if( !filters.pageSize ) filters.pageSize = 10;

        if ( filters.page < 0 || filters.pageSize < 1 || filters.pageSize > 100 ) {
            return reject('Invalid page or pageSize');
        }

        let filterParsed = {};

        let query = Auctions.find(filterParsed);
        query.sort({'createdAt': -1});

        filters.page = filters.page - 1;
        
        query.skip(filters.page*filters.pageSize);
        query.limit(filters.pageSize + 1);

        if (filters.name != undefined && filters.name !== "") {
            query.where('name').equals(new RegExp(filters.name, 'i'));
        }

        if (filters.status != undefined && filters.status !== "") {
            query.where('status').equals(filters.status);
        }

        if (filters.owner != undefined && filters.owner !== "") {
            query.where('owner').equals(filters.owner);
        }

        return query.exec()
            .then( items => {
                let hasNext = false;
                if( items.length > filters.pageSize ) {
                    hasNext = true;
                    items.pop();
                }

                return resolve({
                    hasNext: hasNext,
                    auctions: items
                });
            }).catch( err => {
                reject(err);
            });
    });
}

AuctionsController.createAuction = function(payload) {
    let Auctions = require('./auctions.model');

    return new Promise((resolve, reject) => {
        if ( !payload.name ) return reject('Invalid name');
        if ( !payload.base_price ) return reject('Invalid base_price');
        if ( !payload.bid_type ) return reject('Invalid bid_type');

        if( payload.bid_type == 1 ) 
            payload.bid_step = 0;

            try {
            payload.bid_step = Math.round(payload.bid_step);
        } catch( e ) {
            return reject(" Bid step must be a integer");
        }

        if ( payload.bid_type == 2 && payload.bid_step <= 0 ) 
            return reject('Invalid bid_step');

        let auction = new Auctions({
            name : payload.name,
            photo : payload.photo,
            base_price : payload.base_price,
            bid_type : payload.bid_type,
            bid_step : payload.bid_step,
            status : 0,
            owner: payload.owner,
            bids: [],
        });

        return auction.save()
            .then(result => {

				return resolve({
					createdAuction: auction
				});
			})
			.catch( err => {
				reject(err);
			})
    })
}

AuctionsController.updateAuction = function(auctionId, payload) {
    let Auctions = require('./auctions.model');

    return new Promise((resolve, reject) => {
        if ( !payload.name ) return reject('Invalid name');
        if ( !payload.base_price ) return reject('Invalid base_price');
        if ( !payload.bid_type ) return reject('Invalid bid_type');
        if ( payload.bid_type == 2 && !payload.bid_step ) 
            return reject('Invalid bid_step');
        else 
            payload.bid_step = 0;

        let query = Auctions.findById(auctionId);

        return query.exec()
            .then(auction => {
                if (auction === null) {
                    return reject('Auction not found')
                } else {

                    if( payload.owner != auction.owner ) 
                        return reject('Bad bad person! This auction is not yours to update!');

                    if( auction.status != 0 ) 
                        return reject('Too late! Auction has already been activated!');

                    auction.name = payload.name;
                    auction.photo = payload.photo;
                    auction.base_price = payload.base_price;
                    auction.bid_type = payload.bid_type;
                    auction.bid_step = payload.bid_step;
                    
                    return auction.save()
                        .then(result => {
                            return resolve({
                                updatedAuction: auction
                            })
                        })
                        .catch(err => {
                            reject('err', err);
                        });
                }
            });
    })
}

AuctionsController.bid = function(auctionId, owner, bidValue) {
    let Auctions = require('./auctions.model');
    let moment = require('moment');

    return new Promise((resolve, reject) => {
        let query = Auctions.findById(auctionId);

        try {
            bidValue = parseInt(bidValue);
        } catch(e) {
            return reject("Only integer bids accepted");
        }

        return query.exec()
            .then(auction => {
                if (auction === null) {
                    return reject('Auction not found')
                } else {

                    if( auction.status != 1 ) 
                        return reject('This auction is not active!');

                    if( (new Date()) > auction.expiration_date )
                        return reject('This auction is already closed!');

                    if( owner == auction.owner ) 
                        return reject('Trying to bid on your own auction?! ¬¬');
                    
                    let newBid = {
                        "email": owner,
                        "value": bidValue,
                        "timestamp": (new Date())
                    }
                    let lastBid = null;
                    if( auction.bids && auction.bids.length > 0 ) {
                        for( let i = 0; i < auction.bids.length; i++ ) {
                            if( !lastBid ) {
                                lastBid = auction.bids[i];
                            } else {
                                if( auction.bids[i].timestamp > lastBid.timestamp ) {
                                    lastBid = auction.bids[i];
                                }
                            }
                        }
                    } 

                    // Lance pode ser livre ou fixado
                    // Se for livre, só precise ser maior que o anterior
                    let invalidBid = null;
                    if( auction.bid_type == 1 ) {
                        // Lance livre
                        if( lastBid != null && lastBid.value >= newBid.value ) {
                            invalidBid = 'New bid must be greater than last bid!';
                        }
                    } else {
                        // Lance fixado
                        if( lastBid != null && newBid.value != ( lastBid.value + auction.bid_step ) ) {
                            invalidBid = 'New bid must adhere to fixed auction rules!';
                        }

                        if( lastBid == null && newBid.value != auction.bid_step ) {
                            invalidBid = 'New bid must be at least the bid step value!';
                        }
                    }

                    if( invalidBid == null ) {
                        auction.bids.push(newBid);
                        return auction.save()
                        .then(result => {
                            return resolve({
                                updatedAuction: auction
                            })
                        })
                        .catch(err => {
                            reject('err', err);
                        });
                    } else {
                        reject(invalidBid);
                    }
                }
            });
    })
}

AuctionsController.activateAuction = function(auctionId, owner) {
    let Auctions = require('./auctions.model');
    let moment = require('moment');

    return new Promise((resolve, reject) => {
        let query = Auctions.findById(auctionId);

        return query.exec()
            .then(auction => {
                if (auction === null) {
                    return reject('Auction not found')
                } else {

                    if( owner != auction.owner ) 
                        return reject('Bad bad person! This auction is not yours to update!');

                    if( auction.status != 0 ) 
                        return reject('Too late! Auction has already been activated!');

                    auction.status = 1;
                    let expDate = moment().add(2, 'days');
                    auction.expiration_date = expDate;

                    return auction.save()
                        .then(result => {
                            return resolve({
                                updatedAuction: auction
                            })
                        })
                        .catch(err => {
                            reject('err', err);
                        });
                }
            });
    })
}

AuctionsController.deleteAuction = function(auctionId, owner) {
    let Auctions = require('./auctions.model');

    return new Promise((resolve, reject) => {
        let query = Auctions.findById(auctionId);

        return query.exec()
            .then(auction => {
                if (auction === null) {
                    return reject('Auction not found')
                } else {

                    if( owner != auction.owner ) 
                        return reject('Bad bad person! This auction is not yours to delete!');

                    if( auction.status != 0 ) 
                        return reject('Too late! Auction has already been activated!');
                    
                    return auction.delete()
                        .then(result => {
                            return resolve('Good while it lasted')
                        })
                        .catch(err => {
                            reject('err', err);
                        });
                }
            });
    })
}

module.exports = AuctionsController;

