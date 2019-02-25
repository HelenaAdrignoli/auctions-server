module.exports = (function() {
    const router = require('express').Router();
    const global = require('./utils/global');

    router.all('*', function(req, res, next) {
        console.info(req.method + ' ' + req.originalUrl);

        if( !global.checkStatus() ) {
            res.status(global.httpStatus.SERVICE_UNAVAILABLE);
            return res.send(global.httpStatus.getStatusText(global.httpStatus.SERVICE_UNAVAILABLE));
        } else {
            next();
        }
    });

    router.use('/v1/auth', require('./auth/auth.routes'));
    router.use('/v1/auctions', require('./auctions/auctions.routes'));
    
    return router;
})();
