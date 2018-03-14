var {User} = require('./../models/user.js');

// middleware to authenticate user
// make the code reusable
var authenticate = (req, res, next) => {
    var token = req.header('x-auth');
    User.findByToken(token).then((user) => {
        if (!user) {
            // catch phrase will catch this reject and set status to 401
            return Promise.reject();
        }
        req.user = user;
        req.token = token;
        next();
    }).catch((error) => {
        res.status(401).send();
    });
};

// export middleware to be used elsewhere
module.exports = {
    authenticate
};
