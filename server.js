

express = require('express');
http = require('http');
app = express();
server = http.createServer(app);
io = require('socket.io').listen(server);
fs = require('fs');
path = require('path');
ejs = require('ejs');
sha1 = require('sha1');
'use strict';
const util = require('util');

bodyParser = require('body-parser');

//app.engine('ejs', require('ejs').renderFile);
//app.set('view engine', 'ejs');




app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());



function pdj(f){
    return path.join(__dirname, f);
}


mongoUtil = require('./DBConnection');
mongoUtil.connectToServer( function( err ) { 
     console.log("connected to DB!");    
     dbm = require('./DBManager');
     
});

function getUserById(id,cb){
    dbm.getOne({userid:id},"users",function(result,error){
        if(result){
            cb(result,error)
        }else{
            //idk lol
            cb(result,"Invalid UserId")
        }
    });
}


app.post('/startBroadcast', function (req, res) {
    getUserById(req.body.id,function(user,error){
        id=sha1(Math.random()+"very very salty ;)");
        dbm.insert({
            username:user.username,
            location:JSON.parse(req.body.location),
            radius:req.body.radius,
            title:req.body.title,
            id:id
        },"broadcasts",function(result,error){
            if(error)res.send({status:"error",msg:"An error occoured! "+error});
            //console.log({status:"ok",msg:id});
            res.send({status:"ok",msg:id});
        });
    });
    
});

app.post('/getBroadcasts', function (req, res) {
    getUserById(req.body.id,function(user,error){
        //do something with longitude and latitude to limit results to people w/in radius 
        dbm.get({},"broadcasts",function(results,error){
            res.send(results);
        });
    });
});
    


app.post('/stopBroadcast', function (req, res) {
    
    getUserById(req.body.id,function(user,error){
        dbm.deleteOne({username:user.username},"broadcasts",function(result,error){
            res.send({status:"ok"});
        });
    });
    
});

app.post('/login', function (req, res) {
    query={username:req.body.username,password:req.body.password};
    dbm.getOne(query,"users",function(result,error){
        if(result){
            key=sha1(Math.random());
            dbm.updateSet(query,{userid:key},"users",function(result,error2){
                if(error2){
                    res.send({status:"error",msg:"An error occoured!"});
                }else{
                    res.send({status:"ok",msg:key});
                }
            });
        }else{       
            res.send({status:"error",msg:"Invalid username or password!"});
        }
    });
    
});

io.on('connection', function(socket){
    console.log("connection");


    socket.on("data",function(msg){
        //console.log(msg.bytes[1]);
        io.to(msg.id).emit("audio",msg.bytes);
    });

    socket.on("join",function(msg){
        socket.join(msg);

        //io.to(msg).emit('toast', 'JOINED');
    });

});

/*
app.get('/test', function (req, res) {
   res.send("works!");
});*/

server.listen(8090,function(){
    console.log('Castr listening on port 8090!')
});

