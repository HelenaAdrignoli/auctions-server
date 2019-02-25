var AuthController = AuthController || {};

const ldap = require('../utils/ldap');
const tokenHandler = require('./token-handler');


AuthController.authenticate = function(email, password) {
    return new Promise( (resolve, reject) => {
        return ldap.authenticate(email, password).then( () => {
            var options = {
                email: email
            }

            let tokens = tokenHandler.generateTokens(options);
            return resolve({
                access_token: tokens[0],
                refresh_token: tokens[1]
            }); 
        }).catch(reject)
    });
}

AuthController.refresh = function(refresh_token) {
    return tokenHandler.generateAccessWithRefresh( refresh_token );
}

AuthController.verify = function( authorization ) {
    try {
        let authParts = authorization.split(' ');
        if( authParts[0] != 'Bearer' ) return false;
        if( !authParts[1] ) return false;

        return tokenHandler.validate(authParts[1]);
    } catch( e ) {
        console.log(e);
        return false;
    }
}
module.exports = AuthController;

