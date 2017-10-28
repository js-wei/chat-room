var app = require('http').createServer(),
	io = require('socket.io')(app);

app.listen(8083);

var onlineUsers = {},   //在线用户
    client = {},        //客户端
    onlineCount = 0;    //在线人数

//设置日志级别
//io.set('log level', 3);

io.on('connection', function (socket) {
  
  //通知客户端已连接
  socket.emit('open');

  // 打印握手信息
  // console.log(socket.handshake);

  var person={
	  _id:'',
	  nickname:'',
	  _session:new Date().getTime()
  };

  //监听新用户加入
  //数据类型:{user_id:1,nickname:'jswei30'}
  socket.on('login', function(recives){
      //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
      socket.key = recives.user_id;
      //检查在线列表，如果不在里面就加入
      if(!onlineUsers.hasOwnProperty(recives.user_id)) {
          onlineUsers[recives.user_id] = recives.nickname;
          //在线人数+1
          onlineCount++;
          client[recives.user_id]={
            socket:socket,
            _id: recives.user_id,
            nickname: recives.nickname
          }
          person._id = recives.user_id;
          person.nickname = recives.nickname;
      }
      //向所有客户端广播用户加入
      io.emit('login', {onlineUsers:onlineUsers, onlineCount:onlineCount,user:person});
      console.log(onlineUsers[recives.user_id].nickname +' 加入了聊天室');
  });

  // 对message事件的监听
  socket.on('message', function(content){
    var obj = {time:getTime(),color:client.color};
    //如果不是第一次的连接，正常的聊天消息
    obj['text']=content;
    obj['_id']=client._id;
    // 返回消息（可以省略）
    console.log(client.nickname + ' say: ' + content);
    socket.emit('message',obj);
    //广播向其他用户发消息
    socket.broadcast.emit('message',obj);
  });

  //在线
  socket.emit('online',{users:onlineUsers,member:onlineCount});

  //发送私信
  //数据类型 {form:1,to:2,content:''}
  socket.on('send.private', (data,msg) => {
    var to = data.to,
        from = data.from,
        _socket = client[to].socket;
       console.log(onlineUsers[from] + " say to " + onlineUsers[to] + " " + data.content);
       _socket.emit('my message',data);
  });
    
  //监听出退事件
  socket.on('disconnect', function () {
    if(onlineUsers.hasOwnProperty(socket.key)) {
        //退出用户的信息
        var obj = {userid:socket.key, username:onlineUsers[socket.key]};
        //删除
        delete onlineUsers[socket.key];
        //在线人数-1
        onlineCount--;
        //向所有客户端广播用户退出
        socket.broadcast.emit('logout', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
        console.log(obj.username + 'Disconnect');
    }
  });

});


console.log('service is start, point is 8083');