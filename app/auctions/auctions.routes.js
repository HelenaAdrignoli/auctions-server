module.exports = (function() {
    const router = require('express').Router();
    const AuthController = require('../auth/auth.controller');
    const AuctionsController = require('./auctions.controller');

    router.all('/*', function(req, res, next){
        let authHeader = req.headers['authorization'];
        if( !authHeader ) {
            res.status(401);
            return res.send({
                error: "Unauthorized"
            });
        }

        let authData = AuthController.verify(authHeader);

        console.log(authData);
        if( authData && authData != -1 ) {
            req.authData = authData;
            return next();
        } else {
            res.status(401);
            return res.send({
                error: "Unauthorized"
            });
        }
    });

    router.get('/', function(req, res, next) {
        let page = req.query.page;
        let pageSize = req.query.pageSize;
        let name = req.query.pageSize;
        let startCreatedAt = req.query.pageSize;
        let endCreatedAt = req.query.pageSize;
        let status = req.query.pageSize;
        let owner = req.query.pageSize;

        let filters = {
            page: page,
            pageSize: pageSize,
            name: name,
            startCreatedAt: startCreatedAt,
            endCreatedAt: endCreatedAt,
            status: status,
            owner: owner
        }


        return AuctionsController.getAuctions(filters).then( auctions => {
            return res.send(auctions);
        }).catch( err => {
            res.status(400);
            console.log(err);
            return res.send({
                error: err
            });
        });
    });

    router.post('/', function(req, res, next) {
        let payload = {
            name: req.body.name,
            photo_url: req.body.photo_url,
            base_price: req.body.base_price,
            bid_type : req.body.bid_type,
            bid_step : req.body.bid_step,
            owner: req.authData.email
        }

        return AuctionsController.createAuction(payload).then( auctions => {
            return res.send(auctions);
        }).catch( err => {
            res.status(400);
            console.log(err);
            return res.send({
                error: err
            });
        });
    });

    router.put('/:auctionId', function(req, res) {
        const auctionId = req.params.auctionId;
        const payload = {
            name: req.body.name,
            photo_url: req.body.photo_url,
            base_price: req.body.base_price,
            bid_type : req.body.bid_type,
            bid_step : req.body.bid_step,
            owner: req.authData.email
        }

        return AuctionsController.updateAuction(auctionId, payload).then( auction => {
            return res.send(auction);
        }).catch( err => {
            res.status(400);
            console.log(err);
            return res.send({
                error: err
            });
        });
    });

    return router;
})();
