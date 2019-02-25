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
        query.skip(filters.page*filters.pageSize);
        query.skip(filters.pageSize + 1);

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

module.exports = AuctionsController;

