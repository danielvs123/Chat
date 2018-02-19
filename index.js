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

var privateInfo = {
    'userIdDemo1':{
        name:"userIdDemo1",
        avatar:"http://larissayuan.com/home/img/quartz.png"
    },
    'userIdDemo2':{
        name:"DanielVS",
        avatar:"http://larissayuan.com/home/img/gorogoa.png"
    },
    'userIdDemo3':{
        name:"larissa",
        avatar:"http://larissayuan.com/home/img/prisma.png"
    }
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

app.post('/getPrivateInfo',function (req,res) {
    console.log("hhh");
    if (checkParams(req,"getFriendList")){
        if (checkValidation(req.body.accessToken)){
            var id = req.body.id;
            res.send(JSON.stringify({
                status:0,
                msg:"okay",
                //TODO    这是模拟拘束可以对接数据库
                data:privateInfo[id]
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

//status = 1未读
//       = 0已读
var privateChatSql = 'INSERT INTO privateChat(fromId,toId,msg,status) VALUES(?,?,?,?)';

function insertSql(sqlStr,addSqlParams) {
    connection.query(sqlStr,addSqlParams,function (err, result) {
        if(err){
            console.log('[INSERT ERROR] - ',err.message);
            return;
        }
    });
}

//这里是io模块
io.on('connection', function(socket){
    var uid = "";
    /*
    * 设置自己获取的消息的格式
    * {
    *   type = 1;//代表未读消息
    *   type = 0;//代表及时消失
    *   type = -1;//代表系统消息
    *   data:{}
    * }
    * */
    socket.on('getPersonalInfo',function (data) {
        uid = data.id;
        var uidStatus = onlineUser[uid];
        if (uidStatus===undefined){
            //说明没有重复登录
            onlineUser[uid] = 1;
        }else{
            onlineUser[uid] = (uidStatus+1);
        }
        console.log(data.id + " 登陆成功。开始获取未读邮件");
        connection.query("SELECT * FROM privateChat WHERE status = 1 and toId = '"+uid+"' order by id desc", function (err, result, fields) {
            if (result!==0){
                io.emit("mailBox"+uid,JSON.stringify({
                    type:1,
                    data:result
                }))
            }
        });
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
        if (onlineUser[toId] === undefined){
            insertSql(privateChatSql,[uid,toId,msg,1]);
        }else{
            insertSql(privateChatSql,[uid,toId,msg,0]);
            io.emit("mailBox"+toId,JSON.stringify({
                type:0,
                data:{
                    id:uid,
                    msg:msg
                }
            }));
        }
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});