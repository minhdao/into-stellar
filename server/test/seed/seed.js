const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');
const {Todo} = require('./../../models/todo.js');
const {User} = require('./../../models/user.js');

var userOneId = new ObjectID();
var userTwoId = new ObjectID();

// create some test data
var todos = [{
    text: 'do this',
    _creator: userOneId
}, {
    text: 'do that',
    _creator: userTwoId
}, {
    text: 'do something',
    _creator: userTwoId
}, {
    _id: '5a704933e0f67e15f2cee781',
    text: 'do something',
    _creator: userOneId
}];

var users = [{
    _id: userOneId,
    email: 'minh@email.com',
    password: '123456abc!',
    tokens: [
        {
            access:'auth',
            token: jwt.sign({_id: userOneId, access: 'auth'}, process.env.JWT_SECRET_AUTH).toString()
        }
    ]
}, {
    _id: userTwoId,
    email: 'tien@email.com',
    password: 'hello12345678',
    tokens: [
        {
            access:'auth',
            token: jwt.sign({_id: userTwoId, access: 'auth'}, process.env.JWT_SECRET_AUTH).toString()
        }
    ]
}];

// populate todos
var popTodos = (done) => {
    Todo.remove({}).then(() => {
        return Todo.insertMany(todos);
    }).then(() => {
        done();
    });
};

// populate users
var popUsers = (done) => {
    User.remove({}).then(() => {
        var userOne = new User(users[0]).save();
        var userTwo = new User(users[1]).save();
        return Promise.all([userOne, userTwo]);
    }).then(() => {
        done();
    });
};

module.exports = {
    todos,
    popTodos,
    users,
    popUsers
};
