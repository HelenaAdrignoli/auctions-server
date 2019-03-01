const ldap = require('ldapjs');

var LDAP = LDAP || {};

LDAP.authenticate = function(email, password) {
    return new Promise( (resolve, reject) => {
        let client = ldap.createClient({
            url: process.env.LDAP_SERVER
        });

        client.bind(email, password, function(err) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}

module.exports = LDAP;