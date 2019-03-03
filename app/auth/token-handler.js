require('dotenv').config();
var tokenHandler = {};
var jwt = require('jsonwebtoken');

tokenHandler.generateTokens = function( payload ) {
    let tokens = [];

    tokens[0] = tokenHandler.generateAccess(payload);
    tokens[1] = tokenHandler.generateRefresh(payload);

    return tokens;
}

tokenHandler.generateAccess = function(payload) {
    payload.type = 'a';
    let lifetime = 750;
    return jwt.sign(payload, process.env.MASTER_KEY, tokenHandler.getOptions(lifetime) );
}

tokenHandler.generateRefresh = function(payload) {
    payload.type = 'r';
    let lifetime = '7 days';
    return jwt.sign(payload, process.env.MASTER_KEY, tokenHandler.getOptions(lifetime) );
}

tokenHandler.generateAccessWithRefresh = function( token ) {
    if( token == undefined || token == "" ) {
        return -1;
    } else {
        var options = {
            algorithms : ['HS256'],
            clockTolerance : 2,
            ignoreExpiration: true
        }
        var decoded = null;
        try {
            decoded = jwt.decode(token, {complete: true});
        } catch(err) {
            decoded = null;
        }

        if( !decoded || decoded.payload.type != 'r' ) {
            return -1;
        }

        let retorno = jwt.verify(token, process.env.MASTER_KEY, options);

        if( retorno.type != 'r' )
            return -1;
        
        return tokenHandler.generateAccess({ email: retorno.email});
    }
}

tokenHandler.validate = function(token) {
    if( token == undefined || token == "" ) {
        return -1;
    } else {
        var options = {
            algorithms : ['HS256'],
            clockTolerance : 2,
            ignoreExpiration: false
        }
        let retorno = jwt.verify(token, process.env.MASTER_KEY, options);

        if( retorno.type != 'a' )
            return -1;
        
        return retorno;
    }
}

tokenHandler.getOptions = function(lifetime) {
    return {
        algorithm : 'HS256',
        expiresIn : lifetime,
        audience : 'auctions',
        issuer : 'portal'
    }
}

module.exports = tokenHandler;