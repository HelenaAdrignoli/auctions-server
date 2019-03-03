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
        let page = req.query.page*1;
        let pageSize = req.query.pageSize*1;
        let name = req.query.name;
        let startCreatedAt = req.query.startCreatedAt;
        let endCreatedAt = req.query.endCreatedAt;
        let status = req.query.status;
        let owner = req.query.owner;

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
            return res.send({
                error: err
            });
        });
    });

    router.post('/', function(req, res, next) {
        let payload = {
            name: req.body.name,
            photo: req.body.photo,
            base_price: req.body.base_price,
            bid_type : req.body.bid_type,
            bid_step : req.body.bid_step,
            owner: req.authData.email
        }

        return AuctionsController.createAuction(payload).then( auctions => {
            return res.send(auctions);
        }).catch( err => {
            res.status(400);
            return res.send({
                error: err
            });
        });
    });

    router.post('/:auctionId/bids', function(req, res) {
        const auctionId = req.params.auctionId;
        
        if( !req.body || !req.body.bid_value ) {
            res.status(400);
            return res.send({
                error: 'Invalid bid'
            });
        }

        return AuctionsController.bid(auctionId, req.authData.email, req.body.bid_value).then( auction => {
            return res.send(auction);
        }).catch( err => {
            res.status(400);
            return res.send({
                error: err
            });
        });
    });

    router.put('/:auctionId/status', function(req, res) {
        const auctionId = req.params.auctionId;
        
        if( !req.body || !req.body.status || req.body.status != 1 ) {
            res.status(400);
            return res.send({
                error: 'Invalid status'
            });
        }

        return AuctionsController.activateAuction(auctionId, req.authData.email).then( auction => {
            return res.send(auction);
        }).catch( err => {
            res.status(400);
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
            return res.send({
                error: err
            });
        });
    });

    router.delete('/:auctionId', function(req, res) {
        const auctionId = req.params.auctionId;
        
        return AuctionsController.deleteAuction(auctionId, req.authData.email).then( auction => {
            return res.send(auction);
        }).catch( err => {
            res.status(400);
            return res.send({
                error: err
            });
        });
    });

    return router;
})();
