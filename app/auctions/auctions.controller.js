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
        // Provavelmente descomentar essa parte
        // query.skip(filters.pageSize + 1);

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
        if ( !payload.photo_url ) return reject('Invalid photo');
        if ( !payload.base_price ) return reject('Invalid base_price');
        if ( !payload.bid_type ) return reject('Invalid bid_type');
        if ( !payload.bid_step ) return reject('Invalid bid_step');

        let auction = new Auctions({
            name : payload.name,
            photo_url : payload.photo_url,
            base_price : payload.base_price,
            bid_type : payload.bid_type,
            bid_step : payload.bid_step,
            status : 0,
            owner: payload.owner,
            expiration_date: (new Date()).getDate() + 2,
            bids: [],
        });

        return auction.save()
            .then(result => {
				console.log('result', result)

				return resolve({
					createdAuction: auction
				});
			})
			.catch( err => {
				console.log(err)
				reject('err', err);
			})
    })
}

AuctionsController.updateAuction = function(auctionId, payload) {
    let Auctions = require('./auctions.model');

    return new Promise((resolve, reject) => {
        if ( !payload.name ) return reject('Invalid name');
        if ( !payload.photo_url ) return reject('Invalid photo');
        if ( !payload.base_price ) return reject('Invalid base_price');
        if ( !payload.bid_type ) return reject('Invalid bid_type');
        if ( !payload.bid_step ) return reject('Invalid bid_step');

        let query = Auctions.findById(auctionId);

        return query.exec()
            .then(auction => {
                if (auction === null) {
                    throw new Error('Auction not found')
                } else {
                    auction.name = payload.name;
                    auction.photo_url = payload.photo_url;
                    auction.base_price = payload.base_price;
                    auction.bid_type = payload.bid_type;
                    auction.bid_step = payload.bid_step;
                    auction.owner = payload.owner;

                    return auction.save()
                        .then(result => {
                            console.log('result', result);

                            return resolve({
                                updatedAuction: auction
                            })
                        })
                        .catch(err => {
                            console.log(err);
                            reject('err', err);
                        });
                }
            });
    })
}

module.exports = AuctionsController;

