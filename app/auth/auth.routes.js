module.exports = (function() {
    const router = require('express').Router();
    const AuthController = require('./auth.controller');

    router.post('/new', function(req, res, next) {
        let email = req.body.email;
        let password = req.body.password;

        return AuthController.authenticate(email, password).then( result => {
            return res.send(result);
        }).catch( err => {
            res.status(401);
            res.send({
                "error": "Unauthorized",
                "errorMessage": "Invalid user or password"
            });
        })
    });

    router.post('/refresh', function( req, res, next) {
        let refresh_token = req.body.refresh_token;

        let newToken = AuthController.refresh(refresh_token)

        if( newToken == -1 ) {
            res.status(401);
            return res.send({
                "error": "Unauthorized",
                "errorMessage": "Invalid token"
            })
        }

        return res.send({
            access_token: newToken
        });
    });
    return router;
})();
