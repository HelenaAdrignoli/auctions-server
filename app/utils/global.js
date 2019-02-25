var Global = Global || {};

Global.httpStatus       = require('http-status-codes');

var mongoose            = require('mongoose');


Global.checkStatus = function() {
    if( mongoose.connection.readyState != 1 ) {
        return false;
    }
    return true;
}

Global.getStatus = function() {
    var statusLbl = "NOK";
    var msg = "";

    switch(mongoose.connection.readyState) {
        case 0:
            msg = "Database disconnected";
            break;
        case 1: 
            statusLbl = "OK"; //connected
            break;
        case 2:
            msg = "Database connecting";
            break;
        case 3: 
            msg = "Database disconnecting";
            break;
        default:
            msg = "Unknown Error";
            break;
    }

    return {
        status : statusLbl,
        message : msg
    };
}
Global.validateId =  function( id ) {
    if( id == undefined || id == "" ) {
        return false;
    } else {
        if( mongoose.Types.ObjectId.isValid(id)  ) {
            return true
        } else {
            return false;
        }
    }
}

Global.validateBounds = function(query) {
    try {
        var start = query.start == undefined ? 0 : query.start ;
        var limit = query.limit == undefined ? null : query.limit ;
        var searchkey = query.searchkey == undefined ? "" : query.searchkey ;

        start = parseInt(start);

        if( isNaN(start) )
            return {error : true};

        if( start < 0 )
            return {error : true};

        if( limit != null ) {
            limit = parseInt(limit);
            if( isNaN(limit) )
                return {error : true};

            if( limit < 0 )
                return {error : true};

            if( limit > configurationFile.query.max_limit ) {
                limit = configurationFile.query.max_limit;
            }
        } else {
            limit = configurationFile.query.default_limit;
        }
        return {start : start, limit : limit, searchkey : searchkey, error : false};

    } catch(e) {
        return {error : true};
    }
}

Global.fields = function( params, restricted ) {
    var fields = null;
    if( params && params.fields ) {
        fields = params.fields.replace(/,/g, ' ');
    }

    if( restricted ) {
        restrictedArr = restricted.replace(/ /g, '').split(',');
        for( var i = 0; i < restrictedArr.length; i++ ) {
            if( fields ) {
                var regex = new RegExp(restrictedArr[i], 'g');
                fields = fields.replace(regex, '');
            } else {
                fields = '-' + restrictedArr[i];
            }
        }
    }


    return fields;
}

Global.validateRole = function( model, userRole ) {
    var roleMap = model.split('.');

    var resource = null;
    var operation = null;

    resource = roleMap[0];
    if( roleMap.length == 2 ) {
        resource = roleMap[0];
        operation = roleMap[1];
    } else if( roleMap.length != 1 && roleMap.length != 2 ) return false; //Unnexpected role

    // Se não existe arquivo de configuração, provavelmente desenvolvedor esqueceu.
    //  Por garantia, não libera o acesso ao recurso
    if( authorizationFile[resource] == undefined )
        return false;
    
    if( operation ) {
        if( authorizationFile[resource][operation].indexOf(userRole) == -1 ) return false;
        else return true;
    } else {
        if( authorizationFile[resource].indexOf(userRole) == -1 ) return false;
        else return true;
    }
}

Global.getAuthorStamp = function( user, userRole ) {
    var userModelType = "";
    if( userRole == "tadmin" || userRole == "tuser" ) {
        userModelType = 'TUser';
    } else {
        userModelType = 'PUser';
    }

    return ( { userType : userModelType, user: user } );
}

Global.acceptByRole = function( model, userRole ) {
    if( Global.validateRole( model, userRole ) ) {
        return true;
    } else {
        return false;
    }
}

Global.hasRole = function(req, res, next) {
    console.info("Entitties Routes: Needs Authorization");
    var model = req.routerModel + ".";

    var operation = 'w';
    if( req.method.toUpperCase() == 'GET' )
        operation = 'r';
    
    model = model + operation;

    if( Global.acceptByRole(model, req.authData.userRole) ) {
        console.info("Entitties Routes: User is authorized");
        return next();
    } else {
        console.warn("Entitties Routes: Forbidden access");
        return  Global.sendError(new Error('authorization'), res);
    }
}

Global.authorize = function(req, res, next) {
    if( req.authorized ) {
        return next();
    } else {
        res.status(Global.httpStatus.UNAUTHORIZED);
        console.warn("Unauthorized");
        console.error(req.authError);
        return res.send({
            error: Global.httpStatus.getStatusText(Global.httpStatus.UNAUTHORIZED),
            msg : req.authError
        });
    }
}

Global.sendError = function(e, res) {
    var data = errorHandler(e);
    res.status(data.code);
    res.send(data);
}

Global.asyncSend = function( res, promise ) {
    promise.then( result => {
        if( res.req.method == "POST" ) {
            res.status(201);
        }
        return res.send(result);
    })
    .catch( e => {
        console.info("Global.asyncSend: Promise fulfilled with error");
        console.error(e);

        var data = errorHandler(e);
        res.status(data.code);

        console.info("Global.asyncSend: Error response");
        console.info(data);

        return res.send(data);
    });
}

Global.defaultPortByProtocol = function(protocol) {
    return protocol.toLowerCase().indexOf("https") == 0 ? 443 : 80;
}

Global.base64Encode = function(str) {
    return Buffer.from(str).toString('base64');
}

Global.concatUrl = function(url, path) {
    if(url.endsWith('/')) {
        url = url.substr(0, url.length - 1);
    }
    return path.startsWith('/') ? `${url}${path}` : `${url}/${path}`;
}

Global.base64Decode = function(encoded) {
    return Buffer.from(encoded, 'base64').toString('ascii');
}

Global.sha1AsString = function(str) {
    return sha1(str, { asString: true});
}

Global.sha1AsBytes = function(str) {
    return sha1(str, { asBytes: true});
}

Global.sha1AsHex = function(str) {
    return sha1(str);
}

module.exports = Global;
