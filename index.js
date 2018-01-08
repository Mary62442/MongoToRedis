'use strict';

//https://app.redislabs.com/#/login
//https://redisdesktop.com/download

let http = require('http');
let express = require('express');
let config = require('./mongoconfig');
let mongoClient = require('mongodb');
let fs = require('fs');
let bodyParser = require('body-parser');
let auth = require('basic-auth');
let redis = require('redis');
let path = require('path');
let redisClient = redis.createClient({host : 'redis-14886.c8.us-east-1-3.ec2.cloud.redislabs.com', port : 14886});
redisClient.auth('eRh88pUtQZfwu2mp',(err,reply) => {
    console.log(err);
    console.log(reply);
});
redisClient.on('ready',() =>{ console.log("Redis is ready"); });
redisClient.on('error',() => { console.log("Error in Redis"); });

let port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
let ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

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

let authenticator = (req,res,next)=> {
    let credentials = auth(req);
    if (!credentials || credentials.name !== 'maria' || credentials.pass !== 'secret') {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm = "example"');
        res.end('Access denied');
    } else { next();}
}

let app = express();
app.use(allowCrossDomain);
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {    
    res.sendFile(path.join(__dirname + '/public/api.html'));   
});

app.get('/flowers', (req, res) => {
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

//app.use(authenticator);

// app.get('/redisstringsample', (req, res) => { 
//     redisClient.set("Agrimony","Agrimony is the first flower in the list",(err,reply)=> {
//         console.log(err);
//         console.log(reply);

//         redisClient.get("Agrimony",(err,reply) =>{
//          console.log(err);
//          console.log(reply);
//          res.send(reply);
//         });
//     });     
// });

// app.get('/redislistsample', (req, res) => {
//     redisClient.rpush(["Flowers","Agrimony","Chicory","Holly","Holly"],(err,reply) => {
//      console.log(err);
//      console.log(reply);
//      res.send('Number of elements = ' + reply);
//     });
// });

// app.get('/redissetsample', (req, res) => {     
//     redisClient.sadd(["Setflowers","Agrimony","Agrimony","Centaury"],(err,reply) => {
//      console.log(err);
//      console.log(reply);
//      res.send('Number of elements = ' + reply);
//     });   
// });
 
// app.get('/redishashsample', (req, res) => { 
//     redisClient.hmset("Chicory","Name", "Chicory","Color","White",(err,reply)=> {
//         console.log(err);
//         console.log(reply);
//         redisClient.hgetall("Chicory",(err,reply) =>{
//          console.log(err);
//          console.log(reply);
//          res.send(reply);
//         });
//     });
// });

// app.get('/rediszsetsample', (req, res) => {    
//     let args = [ 'myzset', 10, 'ten', 2, 'two', 3, 'three', 99, 'ninety-nine' ];
//     redisClient.zadd(args,  (err, reply) => {
//         if (err) throw err;
//         console.log('added '+reply+' items.');
//         redisClient.zrange('myzset', 0,3,'WITHSCORES', (err, reply) => {
//             if (err) throw err;
//             res.send(JSON.stringify(reply));
//         }); 
//     });
// });

app.post('/updateflowernotes', authenticator, (req, res) => {
    
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
});


app.put('/putstringtoredis', authenticator, (req, res) => {   
    let body = req.body;
    let key = body.Key;
    let value = body.Value; 
    redisClient.set(key,value,(err,reply)=> {
        console.log(err);
        console.log(reply);
        redisClient.get(key,(err,reply) =>{
        console.log(err);
        console.log(reply);
        res.send(reply);
        });
    });     
});

app.put('/putlisttoredis', authenticator, (req, res) => {   
    let body = req.body;
    let listName = body.ListName;
    let listValues = body.ListValues;    
    let counter = 0;
    for (let item of listValues) {
      redisClient.rpush([listName, item],(err,reply) => {        
        counter+=1;
        if (counter === listValues.length) { res.send('Number of elements = ' + reply); }
    });
    }       
});

app.put('/puthashtoredis', authenticator, (req, res) => {   
    let body = req.body;
    let hashName = body.HashName;
    let keyvalues = body.KeyValues;
    
    redisClient.hmset(hashName, keyvalues,(err,reply)=> {                    
        res.send(reply);  

    });
               
});    

app.put('/putzsettoredis', authenticator, (req, res) => { 

 let body = req.body;
 
    let zsetName = body.ZsetName;
    let keyValues = body.KeyValues; 
    keyValues.unshift(zsetName);
   
    console.log(keyValues);    
    redisClient.zadd(keyValues, (err,reply) => { 
    res.send("Number of items added = " + reply);
    });       
});  

app.put('/putsettoredis', authenticator, (req, res) => {   
    let body = req.body;
    let setName = body.SetName;
    let setValues = body.SetValues;    
    let counter = 0;
    let counterRight = 0;
    for (let item of setValues) {
        redisClient.sadd([setName, item], (err,reply) => { 
        if(reply!==0) { counterRight+=1};       
        counter+=1;
        if (counter === setValues.length) { res.send('Number of elements = ' + counterRight); }
        });
    }           
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);




