require('./config/config.js'); // load in config file

const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const _ = require('lodash');
const hbs = require('hbs');

// load in/import the mongoose
var {mongoose} = require('./db/mongoose.js');
// load in models
var {Todo} = require('./models/todo.js');
var {User} = require('./models/user.js');
var {authenticate} = require('./middleware/authenticate.js');

var app = express();

// register partials
hbs.registerPartials(__dirname + '/views/partials');

// express setings
app.set('views', __dirname + '/views'); // change default location of views dir
app.set('view engine', 'hbs'); // use handle bars as view engine

// express middleware
app.use(bodyParser.json()); // take json -> object
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/register', (req, res) => {
    res.render('home.hbs', {
        pageName: 'welcome home',
        content: 'home sweet home',
    });
});

app.post('/register', (req, res) => {
    console.log(req.body);
    res.send(req.body);
});

// routes config
app.post('/todos',authenticate, (req, res) => {
    // create todo model object
    var todo = new Todo({
        text: req.body.text,
        _creator: req.user._id
    });

    // save todo into database
    todo.save().then((doc) => {
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    });
});

app.get('/todos', authenticate, (req, res) => {
    Todo.find({_creator: req.user._id}).then((todos) => {
        res.send({todos});
    }, (err) => {
        res.status(400).send(err);
    });
});

// get todo by todo's id
app.get('/todos/:id', authenticate, (req, res) => {
    var id = req.params.id;
    var userId = req.user._id;
    if (!ObjectID.isValid(id)){
        return res.status(404).send();
    }
    Todo.findOne({
        _id: id,
        _creator: userId
    }).then((todo) => {
        if (!todo) {
            return res.status(404).send();
        }
        res.send({todo});
    }).catch((err) => {
        res.status(400).send();
    });
});

// delete todo by todo's id
app.delete('/todos/:id', authenticate, (req, res) => {
    var id = req.params.id;
    var userId = req.user._id;
    if (!ObjectID.isValid(id)){
        return res.status(404).send();
    }
    Todo.findOneAndRemove({
        _id: id,
        _creator: userId
    }).then((todo) => {
        if (!todo) {
            return res.status(404).send();
        }
        res.send({todo});
    }).catch((err) => {
        res.status(400).send();
    });
});

// edit todos by todo's id
app.patch('/todos/:id',authenticate, (req, res) => {
    var id = req.params.id;
    var userId = req.user._id;
    if (!ObjectID.isValid(id)){
        return res.status(404).send();
    }
    var body = _.pick(req.body, ['text', 'completed']);

    if (_.isBoolean(body.completed) && body.completed){
        body.completedAt = new Date().getTime();
    } else {
        body.completed = false;
        body.completedAt = null;
    }

    Todo.findOneAndUpdate({
        _id: id,
        _creator: userId
    }, {$set: body}, {new: true}).then((todo) => {
        if (!todo) {
            return res.status(404).send();
        }
        res.send({todo});
    }).catch((err) => {
        res.status(400).send();
    });
});

// take inputs and create user
app.post('/users', (req, res) => {
    // create user model object
    var body = _.pick(req.body, ['phone', 'fam_name', 'giv_name', 'email', 'password']);
    var user = new User(body);

    // save todo into database
    // user.save().then(() => { // this code run save 2 times - can be improved
    //     return user.genAuthToken();
    // }).then((token) => {
    //     res.header('x-auth', token).send(user);
    // }).catch((error) => {
    //     res.status(400).send(error);
    // });

    user.genAuthToken().then((token) => {
        res.header('x-auth', token).send(user.tailorData());
    }).catch((error) => {
        res.status(400).send(error);
    });
});

// private route with token to authenticate user
app.get('/users/me',authenticate , (req, res) => {
    res.send(req.user.tailorData());
});

// login {email, password}
app.post('/users/login', (req, res) => {

    // pick out email and password from the body object
    var body = _.pick(req.body, ['email', 'password']);
    // create user models with provided body data
    var email = body.email;
    var password = body.password;

    // find user by provided email and validate the provided password
    // User.findByEmail(email).then((user) => {
    //     if(!user){
    //         return Promise.reject();
    //     }
    //     user.validatePassword(password).then((result) => {
    //         if(!result){
    //             return Promise.reject();
    //         }
    //         console.log(result);
    //         user.genAuthToken();
    //         res.status(200).send(user.tailorData());
    //     });
    // }).catch((error) => {
    //     res.status(401).send({});
    // });

    // login with provided email and password from user
    User.login(email, password).then((user) => {
        user.genAuthToken().then((token) => {
            res.header('x-auth', token).status(200).send(user.tailorData());
        });
    }).catch((error) => {
        res.status(401).send({});
    });
});

// DELETE token/logout user
app.delete('/users/logout',authenticate, (req, res) => {
    req.user.logout(req.token).then(() => {
       res.status(200).send({});
    }, () => {
       res.status(401).send({});
    });
});

// start server
var port = process.env.PORT;
app.listen(port, () => {
    console.log(`Server started port ${port}`);
});

// export
module.exports = {
    app
};
