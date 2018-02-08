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
    'userIdDemo1':[
        {
            id:"userIdDemo2",
            name:"DanielVS",
            avatar:"http://larissayuan.com/home/img/gorogoa.png"
        },{
            id:"userIdDemo3",
            name:"larissa",
            avatar:"http://larissayuan.com/home/img/prisma.png"
        }
    ],
    'userIdDemo2':[
        {
            id:"userIdDemo1",
            name:"userIdDemo1",
            avatar:"http://larissayuan.com/home/img/quartz.png"
        },{
            id:"userIdDemo3",
            name:"larissa",
            avatar:"http://larissayuan.com/home/img/prisma.png"
        }
    ],
    'userIdDemo3':[
        {
            id:"userIdDemo1",
            name:"userIdDemo1",
            avatar:"http://larissayuan.com/home/img/quartz.png"
        },{
            id:"userIdDemo2",
            name:"DanielVS",
            avatar:"http://larissayuan.com/home/img/gorogoa.png"
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
    var uid = "";
    socket.on('getPersonalInfo',function (data) {
        uid = data.id;
        console.log(data.id + " 登陆成功");
    });
    socket.on('disconnect', function(){
        console.log(uid + ' 退出了');
    });
    socket.on('privateChat', function(toId,msg){
        io.emit("connection"+toId,msg);
        // io.emit('chat message', msg);
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});