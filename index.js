'use strict';

//https://app.redislabs.com/#/login

let http = require('http');
let express = require('express');
let config = require('./mongoconfig');
let mongoClient = require('mongodb');
let fs = require('fs');
let bodyParser = require('body-parser');
let auth = require('basic-auth');
let redis = require('redis');




let allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    // intercept OPTIONS method

    if ('OPTIONS' == req.method) {
        res.sendStatus(200);
    }
    else {
        next();
    }
}

let app = express();
app.use(allowCrossDomain);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res, next) => {    
   
    res.sendFile(path.join(__dirname + '/api.html'));   
});

app.get('/redisstringsample', (req, res, next) => { 

    let redisClient = redis.createClient({host : 'redis-14886.c8.us-east-1-3.ec2.cloud.redislabs.com', port : 14886});

    redisClient.auth('password',(err,reply) => {
        console.log(err);
        console.log(reply);
    });

    redisClient.on('ready',() =>{
        console.log("Redis is ready");
        redisClient.set("Agrimony","Agrimony is the first flower in the list",(err,reply)=> {
            console.log(err);
            console.log(reply);

            redisClient.get("Agrimony",(err,reply) =>{
             console.log(err);
             console.log(reply);
             res.send(reply);
            });
        });     
    });

    redisClient.on('error',() => {
     console.log("Error in Redis");
    });       
});

app.get('/redislistsample', (req, res, next) => { 

    let redisClient = redis.createClient({host : 'redis-14886.c8.us-east-1-3.ec2.cloud.redislabs.com', port : 14886});

    redisClient.auth('password',(err,reply) => {
        console.log(err);
        console.log(reply);
    });

    redisClient.on('ready',() =>{
        console.log("Redis is ready");
        redisClient.rpush(["Flowers","Agrimony","Chicory","Holly","Holly"],(err,reply) => {
         console.log(err);
         console.log(reply);
         res.send('Number of elements = ' + reply);
        });
        });     
    

    redisClient.on('error',() => {
     console.log("Error in Redis");
    });       
});


app.get('/redissetsample', (req, res, next) => { 

    let redisClient = redis.createClient({host : 'redis-14886.c8.us-east-1-3.ec2.cloud.redislabs.com', port : 14886});

    redisClient.auth('password',(err,reply) => {
        console.log(err);
        console.log(reply);
    });

    redisClient.sadd(["Setflowers","Agrimony","Agrimony","Centaury"],function(err,reply) {
     console.log(err);
     console.log(reply);
     res.send('Number of elements = ' + reply);
    });    

    redisClient.on('error',() => {
     console.log("Error in Redis");
    });     
});

 
app.get('/redishashsample', (req, res, next) => { 

    let redisClient = redis.createClient({host : 'redis-14886.c8.us-east-1-3.ec2.cloud.redislabs.com', port : 14886});

    redisClient.auth('password',(err,reply) => {
        console.log(err);
        console.log(reply);
    });

    redisClient.on('ready',() =>{
        console.log("Redis is ready");
        redisClient.hmset("Chicory","Name", "Chicory","Color","White",(err,reply)=> {
            console.log(err);
            console.log(reply);

            redisClient.hgetall("Chicory",(err,reply) =>{
             console.log(err);
             console.log(reply);
             res.send(reply);
            });
        });     
    });

    redisClient.on('error',() => {
     console.log("Error in Redis");
    });       
});




app.get('/rediszsetsample', (req, res, next) => {
let redisClient = redis.createClient({host : 'redis-14886.c8.us-east-1-3.ec2.cloud.redislabs.com', port : 14886});

    redisClient.auth('password',(err,reply) => {
        console.log(err);
        console.log(reply);
    });



 redisClient.on('ready',() =>{
        console.log("Redis is ready");
        let args = [ 'myzset', 10, 'ten', 2, 'two', 3, 'three', 99, 'ninety-nine' ];
        redisClient.zadd(args,  (err, reply) => {
            if (err) throw err;
            console.log('added '+reply+' items.');
           

            redisClient.zrange('myzset', 0,3,'WITHSCORES', (err, reply) => {
            if (err) throw err;
            res.send(JSON.stringify(reply));
            });
        });



    redisClient.on('error',() => {
     console.log("Error in Redis");
    });       


});

});




app.post('/', (req, res, next) => {

    let credentials = auth(req);
    if (!credentials || credentials.name !== 'diego' || credentials.pass !== 'secret') {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="example"');
        res.end('Access denied');
    } else {
        // do the things an authorized user can do
        res.end('Access granted');
    }
    
});

app.get('/flowers', (req, res, next) => {
    mongoClient.connect(config.mongoConnectionString, (err, client) => {
        if (err) res.send('error');

        const db = client.db('marymongodb');
        //assert.equal(null, err);
        db.collection('BachFlowers').find({}).toArray((err, flowers) => {
            client.close();
            res.send(flowers);
        });
    });
});




app.post('/updateflowernotes', (req, res, next) => {
    let credentials = auth(req);
    if (!credentials || credentials.name !== 'diego' || credentials.pass !== 'secret') {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm = "example"');
        res.end('Access denied');
    } else {
        // user is authenticated
        res.statusCode = 200;
        mongoClient.connect(config.mongoConnectionString, (err, client) => {
            let body = req.body;
            if (err) console.log(err);
            const db = client.db('marymongodb');
            let flowers = db.collection('BachFlowers');
            flowers.update({ Name: req.body.Name },
                {
                    $set: { Notes: req.body.Notes }
                }, { multi: false }, (err, result) => {
                    if (err) {
                        console.log(err);
                        res.send(JSON.stringify(err));
                    }
                    client.close();
                    console.log('Successfuly updated: ' + result + ' records.');
                    res.send(JSON.stringify(result));
                });
        });    
    }
});



let serverUnsecure = http.createServer(app).listen(process.env.PORT || 3000, function () {
    console.log('Server express running at. ' + serverUnsecure.address().address + ':' + serverUnsecure.address().port + ' ');
});



