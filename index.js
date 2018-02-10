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
* 这里是mysql连接
* */
//这里需要自己修改configDemo.js,改名为config.js;
var config = require('./config');
var mysql      = require('mysql');
var connection = mysql.createConnection(config.db);
connection.connect();


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


//这里用来统计现在重复登录的数量，主要用来判断是不是登陆了
var onlineUser = {};

//这里是io模块
io.on('connection', function(socket){
    var uid = "";
    socket.on('getPersonalInfo',function (data) {
        uid = data.id;
        var uidStatus = onlineUser[uid];
        if (uidStatus===undefined){
            //说明没有重复登录
            onlineUser[uid] = 1;
        }else{
            onlineUser[uid] = (uidStatus+1);
        }
        console.log(data.id + " 登陆成功");
    });
    socket.on('disconnect', function(){
        //防止重启服务器以后 没有uid以后会出现"":Nan的bug
        if (uid!==""){
            var uidStatus = onlineUser[uid];
            if (uidStatus!==1){
                onlineUser[uid] = (uidStatus-1);
            }else{
                delete onlineUser[uid];
            }
            console.log(uid + ' 退出了');
        }
    });
    socket.on('privateChat', function(toId,msg){
        io.emit("mailBox"+toId,msg);
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});