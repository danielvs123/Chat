var express = require('express'),
    app = express(),
    bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended:true
}));
var http = require('http').Server(app);
var io = require('socket.io')(http);

/*
* 这里是假设数据
* */
var friendList = {
    'userIdDemo':[
        {
            id:"123",
            name:"DanielVS",
            avatar:"http://larissayuan.com/home/img/prisma.png"
        },{
            id:"321",
            name:"larissa",
            avatar:"http://larissayuan.com/home/img/prisma.png"
        }
    ]
};
//假设数据的结束

var acceptData = {
    "getFriendList":[
        "id"
    ]
};



app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.post('/getFriendList',function (req,res) {
    if (checkParams(req,"getFriendList")){
        if (checkValidation(req.body.accessToken)){
            var id = req.body.id;
            var rtnData = (friendList[id] !== undefined)?friendList[id]:[],
                length = rtnData.length;
            res.send(JSON.stringify({
                status:0,
                msg:"okay",
                length:length,
                //TODO    这是模拟拘束可以对接数据库
                data:rtnData
            }))
        }else{
            res.send(inValid());
        }
    }else{
        res.send(needParams());
    }
});

function needParams() {
    return JSON.stringify({
        status:1,
        msg:"缺少参数"
    })
}
function inValid() {
    return JSON.stringify({
        status:-1,
        msg:"Token错误,访问拒绝"
    })
}

function checkValidation(token) {
    //检查token
    return true;
}

function checkParams(req,method) {
    var data = req.body;
    if (data.accessToken === undefined){
        return false;
    }
    for (var i = 0;i<acceptData[method].length;i++){
        if (data[acceptData[method][i]] === undefined)return false;
    }
    return true;
}

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
    socket.on('chat message', function(msg){
        io.emit('chat message', msg);
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});