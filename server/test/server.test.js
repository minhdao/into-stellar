const expect = require('expect');
const request = require('supertest');

const {app} = require('./../server.js');
const {Todo} = require('./../models/todo.js');
const {todos, popTodos, users, popUsers} = require('./seed/seed.js');
const {User} = require('./../models/user.js');

// wipe out and populate new data inside User and Todo collections before testing
beforeEach(popUsers);
beforeEach(popTodos);

// POST /todos
describe('POST /todos', () => {
    it('should create new todo', (done) => {
        var text = 'todo test';
        var _creator_token = users[0].tokens[0].token;
        request(app)
            .post('/todos')
            .set('x-auth', _creator_token)
            .send({text})
            .expect(200)
            .expect((res) => {
                expect(res.body.text).toBe(text);
            })
            .end((err, res) => {
                if (err){
                    return done(err);
                }
                Todo.find({text}).then((todos) => {
                    expect(todos.length).toBe(1);
                    done();
                }).catch((err) => {
                	done(err);
                });
            });
    });

    it ('should not create new todo for invalid request', (done) => {
        var _creator_token = users[0].tokens[0].token;
        var text = '';
        request(app)
            .post('/todos')
            .set('x-auth', _creator_token)
            .send({text})
            .expect(400)
            .end(done);
    });
});

// GET /todos
describe('GET /todos', () => {
    it ('should get all todos created by specific creator in database', (done) => {
        var _creator_token = users[0].tokens[0].token;
        var filtered_todos = todos.filter((todo) => {
            return todo._creator == users[0]._id;
        });
        console.log(filtered_todos);
        request(app)
            .get('/todos')
            .set('x-auth', _creator_token)
            .expect((res) => {
            	expect(res.body.todos.length).toBe(filtered_todos.length);
            })
            .end(done);
    });
});

// GET /todos/:id
describe('GET /todos/:id', () => {
    it ('should get todo with specific id in database', (done) => {
        var id = '5a704933e0f67e15f2cee781';
        request(app)
            .get(`/todos/${id}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
            	expect(res.body.todo._id).toBe(id);
            })
            .end(done);
    });
    it ('should return status 404 for INVALID id', (done) => {
        var invalidID = '5a704933e0f67e15f2cee781xxxxxxxx';
        request(app)
            .get(`/todos/${invalidID}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });
    it ('should return status 404 for WRONG id', (done) => {
        var wrongID = '5a704933e0f67e15f2cee123';
        request(app)
            .get(`/todos/${wrongID}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });
    it ('should NOT return todo if user did not create it', (done) => {
        var id = '5a704933e0f67e15f2cee781';
        request(app)
            .get(`/todos/${id}`)
            .set('x-auth', users[1].tokens[0].token)
            .expect(404)
            .end(done);
    });
});

// DELETE /todos/:id
describe('DELETE /todos/:id', () => {
    it ('should delete todo with this user created in database', (done) => {
        var id = '5a704933e0f67e15f2cee781';
        request(app)
            .delete(`/todos/${id}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
            	expect(res.body.todo._id).toBe(id);
            })
            .end((err, res) => {
                if(err) {
                    return done(err);
                }
                Todo.findById(id).then((todo) => {
                    expect(todo).toBeFalsy();
                    done();
                }).catch((err) => {
                    done(err);
                });
            });
    });
    it ('should not delete todo this user did not create in database', (done) => {
        var id = '5a704933e0f67e15f2cee781';
        request(app)
            .delete(`/todos/${id}`)
            .set('x-auth', users[1].tokens[0].token)
            .expect(404)
            .end((err, res) => {
                if(err) {
                    return done(err);
                }
                Todo.findById(id).then((todo) => {
                    expect(todo).toBeTruthy();
                    done();
                }).catch((err) => {
                    done(err);
                });
            });
    });
    it ('should return status 404 for INVALID id', (done) => {
        var invalidID = '5a704933e0f67e15f2cee781xxxxxxxx';
        request(app)
            .delete(`/todos/${invalidID}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });
    it ('should return status 404 for WRONG id', (done) => {
        var wrongID = '5a704933e0f67e15f2cee123';
        request(app)
            .delete(`/todos/${wrongID}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });
});

// PATCH /todos/:id
describe('PATCH /todos/:id', () => {
    it ('should update todo created by this user id in database', (done) => {
        var id = '5a704933e0f67e15f2cee781';
        var text = 'this should be updated';
        request(app)
            .patch(`/todos/${id}`)
            .set('x-auth', users[0].tokens[0].token)
            .send({
                completed: true,
                text
            })
            .expect(200)
            .expect((res) => {
            	expect(res.body.todo.text).toBe(text);
                expect(res.body.todo.completed).toBe(true);
                expect(typeof res.body.todo.completedAt).toBe('number');
            })
            .end(done);
    });
    it ('should not update todo created by this user id in database', (done) => {
        var id = '5a704933e0f67e15f2cee781';
        var text = 'this should be updated';
        request(app)
            .patch(`/todos/${id}`)
            .set('x-auth', users[1].tokens[0].token)
            .send({
                completed: true,
                text
            })
            .expect(404)
            .end(done);
    });
    it ('should clear completed at when todo is not completed', (done) => {
        var id = '5a704933e0f67e15f2cee781';
        var text = 'this should be updated';
        request(app)
            .patch(`/todos/${id}`)
            .set('x-auth', users[0].tokens[0].token)
            .send({
                completed: false,
                text
            })
            .expect(200)
            .expect((res) => {
            	expect(res.body.todo.text).toBe(text);
                expect(res.body.todo.completed).toBe(false);
                expect(typeof res.body.todo.completedAt).not.toBe('number');
            })
            .end(done);
    });
});

// GET /users/me
describe('GET /users/me', () => {
    it('should return user if authenticated', (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body._id).toBe(users[0]._id.toHexString());
            })
            .end(done);
    });
    it('should return 401 if NOT authenticated', (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth', 'some wrong token')
            .expect(401)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });
});

// POST /users
describe('POST /users', () => {
    it('should create new user provided with valid inputs', (done) => {
        var email = 'unique@email.com';
        var password = 'password!!@343';
        request(app)
            .post('/users')
            .send({email, password})
            .expect(200)
            .expect((res) => {
                // expect token generated
                expect(res.headers['x-auth']).toBeTruthy();
                // expect res body contain same email sent in
                expect(res.body.email).toBe(email);
            })
            .end((err) => {
                if (err) {
                    return done(err);
                }
                // check inside the database itself
                User.findOne({email}).then((user) => {
                    // expect user exist and has values
                    expect(user).toBeTruthy();
                    // expect password hashed inside db
                    expect(user.password).not.toBe(password);
                    done();
                });
            });
    });
    it('should fail if invalid username and password provided', (done) => {
        request(app)
            .post('/users')
            .send({
                email: 'blah',
                password: 'bloh'
            })
            .expect(400)
            .end(done);
    });

    it('should fail if existing username and password provided', (done) => {
        request(app)
            .post('/users')
            .send({
                email: 'minh@email.com',
                password: 'jaldsjflasdfl'
            })
            .expect(400)
            .end(done);
    });
});

describe('POST /users/login', () => {
    it('should gen and return auth token when provided correct username and password', (done) => {
        request(app)
            .post('/users/login')
            .send({
                email: users[1].email,
                password: users[1].password
            })
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeTruthy();
            })
            .end(done);
    });

    it('should NOT gen and return token when provided incorrect email and password', (done) => {
        request(app)
            .post('/users/login')
            .send({
                email: 'blah@email.com',
                password: 'jalsdjflasjdfl'
            })
            .expect(401)
            .end(done);
    });
});

describe('DELETE /users/logout', () => {
    it('should delete x-auth token provided', (done) => {
        request(app)
            .delete('/users/logout')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .end((err) => {
                if (err) {
                    return done(err);
                }
                User.findById(users[0]._id).then((user) => {
                    expect(user.tokens.length).toBe(0);
                });
                done();
            });
    });
});
