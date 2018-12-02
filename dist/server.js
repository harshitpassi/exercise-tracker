'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var cors = require('cors');

var mongoose = require('mongoose');
mongoose.connect('mongodb://admin:hhhthegame0207@ds123454.mlab.com:23454/fcc-challenge');
var userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    exercises: [{
        description: String,
        duration: Number,
        date: Date
    }]
});
var userModel = mongoose.model('User', userSchema);

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static('public'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/exercise/new-user', function (req, res) {
    var newUser = new userModel({
        username: req.body.username
    });
    newUser.save(function (err, result) {
        if (err) {
            throw new Error(err);
        }
        res.json({
            username: result.username,
            _id: result._id
        });
    });
});

app.get('/api/exercise/users', function (req, res) {
    userModel.find({}).select('_id username').exec(function (err, result) {
        if (err) {
            throw new Error(err);
        }
        res.json(result);
    });
});

app.post('/api/exercise/add', function (req, res) {
    userModel.findByIdAndUpdate(req.body.userId, {
        $addToSet: {
            exercises: {
                description: req.body.description,
                duration: req.body.duration,
                date: req.body.date || new Date()
            }
        }
    }, { new: true }, function (err, result) {
        if (err) {
            throw new Error(err);
        }
        res.json(result);
    });
});

app.get('/api/exercise/log', function (req, res) {
    if (!req.query.userId) {
        throw new Error('No user ID specified');
    }
    var findQuery = userModel.findById(req.query.userId);
    if (req.query.limit && !isNaN(req.query.limit)) {
        findQuery = findQuery.limit(req.query.limit);
    }
    if (req.query.from) {
        findQuery = findQuery.where('exercises.date').gt(new Date(req.query.from));
    }
    if (req.query.to) {
        findQuery = findQuery.where('exercises.date').lt(new Date(req.query.to));
    }

    findQuery.select({
        _id: 1,
        username: 1,
        'exercises.$': 1
    });

    findQuery.exec(function (err, data) {
        if (err) {
            throw new Error(err);
        }
        res.json(data);
    });
});

// Not found middleware
app.use(function (req, res, next) {
    return next({ status: 404, message: 'not found' });
});

// Error Handling middleware
app.use(function (err, req, res, next) {
    var errCode = void 0,
        errMessage = void 0;

    if (err.errors) {
        // mongoose validation error
        errCode = 400; // bad request
        var keys = Object.keys(err.errors);
        // report the first validation error
        errMessage = err.errors[keys[0]].message;
    } else {
        // generic or custom error
        errCode = err.status || 500;
        errMessage = err.message || 'Internal Server Error';
    }
    res.status(errCode).type('txt').send(errMessage);
});

var listener = app.listen(process.env.PORT || 3000, function () {
    console.log('Your app is listening on port ' + listener.address().port);
});