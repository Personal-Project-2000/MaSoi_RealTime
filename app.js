// connect firebase
var FCM = require('fcm-node')
const { networkInterfaces } = require('os')
const { isBuffer } = require('util')
var serviceAccount = require("./firebase.json")
var fcm = new FCM(serviceAccount)

//user || device || status || id
var userList = []
//sender || receiver || body || title 
var messageList = []
//user || ready || func || roomId
var roomPlayer = []
//number || id || name
var funcList = [
    {number: 1, id: "61e675a18f96beab7215afee", name: "Sói"},
    {number: 2, id: "61ea0f7ec550781bbe59b363", name: "Tiên Tri"},
    {number: 3, id: "61ea0f8ec550781bbe59b364", name: "Bảo Vệ"},
    {number: 4, id: "61ea0f9dc550781bbe59b365", name: "Phù Thủy"},
    {number: 5, id: "61ea0fabc550781bbe59b366", name: "Thợ Săn"},
    {number: 6, id: "61ea0fbec550781bbe59b367", name: "Tình Yêu"},
    {number: 7, id: "61ea0fd0c550781bbe59b368", name: "Nửa Người Nửa Sói"},
    {number: 8, id: "61ea100ec550781bbe59b36a", name: "Thổi Sáo"},
    {number: 9, id: "61ea0fe1c550781bbe59b369", name: "Sói Trắng"},
    {number: 10, id: "61ea1029c550781bbe59b36b", name: "Dân Làng"}
]
//roomId || time || code
var timeList = []

//config socket.io
require('dotenv').config()
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const PORT = process.env.PORT || 3030

//delete message received
Array.prototype.unfilter = (callback) => {
    let s = []
    for(let i = 0 ; i < this.length ;  i++){
        if(!callback(this[i])){
            s.push(this[i])
        }
    }

    return s
}

setTimeout(myFunc, 1000)

function myFunc(){
    for(var item in timeList){
        var timeNow = Math.floor((Date.now()/1000)/60)

        if(item == timeNow){
            check("next", "time");
        }
    }
}

io.sockets.on("connection", (socket) => {
    console.log("user connect");

    //client login || data: user, device
    socket.on('login', (data) => {
        var info = JSON.parse(data)

        //check user exist
        if(userList.some((e) => {return e.user === info.user})){
            //find user of userList
            var user = userList.find((e) => e.user === info.user)
            //find index of user
            var index = userList.indexOf(user)
            //change status of user
            userList[index].status = true
            //change id of user
            userList[index].id = socket.id
        }else{
            //insert data new user
            userList.push({
                user: info.user,
                device: info.device,
                status: true,
                id: socket.id
            })
        }

        //check new notification 
        // if(messageList.some((e) =>  e.receiver === info.user)){
        //     var new_notification = messageList.filter((e) => e.receiver === info.user)
        //     new_notification = new_notification.map((e) => ({sender: e.sender, title: e.title, body: e.body}))
        //     socket.emit("new_notification", {list: new_notification})
        //     check1("new_notification", new_notification)
        //     messageList = messageList.unfilter((e) =>  e.receiver === info.user)
        // }

        check1("login", userList)

        //notification client succes
        socket.emit('noti_login', {
            message: "Thành công",
        })
    })

    //client disconnect
    socket.on("disconnect", ()=>{
        //check user login
        if(userList.some((e) => {return e.id === socket.id})){
            //find user of userList
            var user = userList.find((e) => e.id === socket.id)
            //find index of user
            var index = userList.indexOf(user)
            //change status of user
            userList[index].status = false
        }

        check("disconnect")
    })    

    //send notification || data: sender, receiver, title, body
    socket.on("notification", (data) => {
        send(data)
    })  

    //client signout
    socket.on("signout", () =>{
        let index = userList.indexOf(socket.id)
        userList.splice(index, 1);

        check1("signout", userList)
    })

    //send chat || data: sender, receiver, title, body
    socket.on("chat", (data) => {
        send(data)
    })

    //send message to user receiver
    function send(data){
        var info = JSON.parse(data)

        //check send message to user receiver
        var isSend = true
    
        //user receiver exist
        if(userList.some((element) => {return element.user === info.receiver})){
            //filter data user receiver
            var user_receiver = userList.filter((element) => element.user === info.receiver)
    
            check1("user_receiver", user_receiver)
            //user receiver status is active
            if(user_receiver.some((element) => { return element.status === true})){
                var user_receiver_true = user_receiver.filter((element) => element.status === true)
    
                check1("user_receiver_true", user_receiver_true)
                //send user receiver is active
                for(const item of user_receiver_true){
                    socket.to(item.id).emit("send_notication", {sender: info.sender, body: info.body, title: info.title})
                }
            }else{
                //send user receiver with all device
                for(const value of user_receiver){
                    //create message
                    var message = {
                        to: value.device,
                        notification: {
                            title: info.title,
                            body: info.body
                        }
                    }
    
                    //send firebase
                    fcm.send(message, function(err, response){
                        if (err) {
                            console.log("Something has gone wrong!")
                            
                            isSend = false
                        } else {
                            console.log("Successfully sent with response: ", response)
                            
                            if(response.failureCount >= 1){
                                isSend = false
                            }else{
                                isSend = true
                            }
                        } 
                    })
                }
            }
        }else{
            isSend = false
        }

        if(!isSend){
            //insert data new noti
            messageList.push({
                sender: info.sender,
                receiver: info.receiver,
                body: info.body,
                title: info.title
            })  
        }
    
        check_log_messageList()
    }

    //data: user || roomId || roomName
    socket.on("createRoom", (data) => {
        var info = JSON.parse(data)

        //user || ready || func || roomId
        roomPlayer.push({
            user: info.user,
            ready: true,
            func: "",
            roomId: info.roomId
        })

        check1("mảng người chơi trong đã vào phòng", roomPlayer)

        //Thông báo mọi người đang onl có 1 phòng vừa được tạo
        socket.broadcast.emit("S_createroom", {
            roomId: info.roomId,
            roomName: info.roomName
        })
    })

    //data: user || roomId || code -> 1: tự thoát & 2: bị đuổi & 3: chủ phòng thoát
    socket.on("exitRoom", (data) => {
        var info = JSON.parse(data)

        var player1 = roomPlayer.find((e) => e.roomId === info.roomId && e.user === info.user)
        let index = roomPlayer.indexOf(player1)
        roomPlayer.splice(index, 1);

        check1("exitroom", roomPlayer)
        check("code: "+info.code)

        if(info.code === 2){
            var player2 = userList.find((e) => e.user === info.user)
            //find index of user
            var index1 = userList.indexOf(player2)

            socket.to(userList[index1].id).emit("S_kickroom", {})
        }

        if(info.code === 3){
            var player = roomPlayer.find((e) => e.roomId == info.roomId)

            if(player !== undefined){
                var user = userList.find((e) => e.user === player.user)
                //find index of user
                var indexNext = userList.indexOf(user)

                socket.to(userList[indexNext].id).emit("S_bossout", {response: "ỷ quyền"})
            }
        }

        var playerOfRoom = roomPlayer.filter((e) => e.roomId == info.roomId)

        //Gửi các người chơi trong phòng
        for(const item of playerOfRoom){
            var user1 = userList.find((e) => e.user === item.user)
            //find index of user
            var index2 = userList.indexOf(user1)

            socket.to(userList[index2].id).emit("S_exitroom", {user: info.user})
        }

        //Gửi các người chơi ở ngoài
        socket.broadcast.emit("S_exitroom1", {
            roomId: info.roomId,
            quantity: playerOfRoom.length
        })
    })

    //data: roomId || pass || voteTime || advocateTime
    socket.on("setting", (data) => {
        var info = JSON.parse(data)

        check1("setting", info)

        var playerOfRoom = roomPlayer.filter((e) => e.roomId == info.roomId)
        //gửi tất cả những người chơi trong phòng
        for(const item of playerOfRoom){
            var player = userList.find((e) => e.user === item.user)
            //find index of user
            var index = userList.indexOf(player)

            socket.to(userList[index].id).emit("S_settingroom", {pass: info.pass, voteTime: info.voteTime, advocateTime: info.advocateTime})
        }

        //gửi cho những người đang đăng nhập
        socket.broadcast.emit("S_settingroom1", {
            roomId: info.roomId,
            pass: info.pass
        })
    
    })

    //data: user || roomId || ready
    socket.on("ready", (data) => {
        var info = JSON.parse(data)

        var mine = roomPlayer.find((e) => e.user === info.user)
        var index1 = roomPlayer.indexOf(mine)

        roomPlayer[index1].ready = info.ready;

        var playerOfRoom = roomPlayer.filter((e) => e.roomId == info.roomId)

        check1("ready", roomPlayer)

        for(const item of playerOfRoom){
            var user = userList.find((e) => e.user === item.user)
            //find index of user
            var index = userList.indexOf(user)

            socket.to(userList[index].id).emit("S_readyroom", {user: info.user, ready: playerOfRoom[index1].ready})
        }
    })

    //data: roomId
    socket.on("start", (data) => {
        var info = JSON.parse(data)

        socket.broadcast.emit("S_startRoom1", {roomId: info.roomId})

        var playerOfRoom = roomPlayer.filter((e) => e.roomId == info.roomId)

        bossBai(10)

        var quantity = playerOfRoom.length
        if(quantity >= 5){
            if(quantity < 7 ){
                for(var i = 0; i < 3; i++){
                    var random = Math.floor(Math.random() * playerOfRoom.length);
                    if(i == 0){
                        randomBai(random, playerOfRoom, 1)
                    }else if(i == 1){
                        randomBai(random, playerOfRoom, 2)
                    }else if(i == 2){
                        randomBai(random, playerOfRoom, 3)
                    }
                    playerOfRoom.splice(random, 1)
                }
            }else if(quantity < 10){
                for(var i = 0 ; i < 5; i ++){
                    var random = Math.floor(Math.random() * playerOfRoom.length);
                    if(i < 2){
                        randomBai(random, playerOfRoom, 1)
                    }else if(i == 2){
                        randomBai(random, playerOfRoom, 2)
                    }else if(i == 3){
                        randomBai(random, playerOfRoom,3)
                    }else if(i == 4){
                        randomBai(random, playerOfRoom, 4)
                    }
                    playerOfRoom.splice(random, 1)
                }
            }else if(quantity < 12){
                for(var i = 0 ; i < 8; i ++){
                    var random = Math.floor(Math.random() * playerOfRoom.length);
                    if(i < 3){
                        randomBai(random, playerOfRoom, 1)
                    }else if(i == 3){
                        randomBai(random, playerOfRoom, 2)
                    }else if(i == 4){
                        randomBai(random, playerOfRoom, 3)
                    }else if(i == 5){
                        randomBai(random, playerOfRoom, 4)
                    }else if(i == 6){
                        randomBai(random, playerOfRoom, 5)
                    }else if(i == 7){
                        randomBai(random, playerOfRoom, 6)
                    }
                    playerOfRoom.splice(random, 1)
                }
            }else if(quantity < 14){
                for(var i = 0 ; i < 9; i ++){
                    var random = Math.floor(Math.random() * playerOfRoom.length);
                    if(i < 3){
                        randomBai(random, playerOfRoom, 1)
                    }else if(i == 3){
                        randomBai(random, playerOfRoom, 2)
                    }else if(i == 4){
                        randomBai(random, playerOfRoom, 3)
                    }else if(i == 5){
                        randomBai(random, playerOfRoom, 4)
                    }else if(i == 6){
                        randomBai(random, playerOfRoom, 5)
                    }else if(i == 7){
                        randomBai(random, playerOfRoom, 6)
                    }else if(i == 8){
                        randomBai(random, playerOfRoom, 7)
                    }
                    playerOfRoom.splice(random, 1)
                }
            }else if(quantity < 17){
                for(var i = 0 ; i < 11; i ++){
                    var random = Math.floor(Math.random() * playerOfRoom.length);
                    if(i < 4){
                        randomBai(random, playerOfRoom, 1)
                    }else if(i == 4){
                        randomBai(random, playerOfRoom, 2)
                    }else if(i == 5){
                        randomBai(random, playerOfRoom, 3)
                    }else if(i == 6){
                        randomBai(random, playerOfRoom, 4)
                    }else if(i == 7){
                        randomBai(random, playerOfRoom, 5)
                    }else if(i == 8){
                        randomBai(random, playerOfRoom, 6)
                    }else if(i == 9){
                        randomBai(random, playerOfRoom, 7)
                    }else if(i == 10){
                        randomBai(random, playerOfRoom, 8)
                    }
                    playerOfRoom.splice(random, 1)
                }
            }else if(quantity >= 17){
                for(var i = 0 ; i < 12; i ++){
                    var random = Math.floor(Math.random() * playerOfRoom.length);
                    if(i < 4){
                        randomBai(random, playerOfRoom, 1)
                    }else if(i == 4){
                        randomBai(random, playerOfRoom, 2)
                    }else if(i == 5){
                        randomBai(random, playerOfRoom, 3)
                    }else if(i == 6){
                        randomBai(random, playerOfRoom, 4)
                    }else if(i == 7){
                        randomBai(random, playerOfRoom, 5)
                    }else if(i == 8){
                        randomBai(random, playerOfRoom, 6)
                    }else if(i == 9){
                        randomBai(random, playerOfRoom, 7)
                    }else if(i == 10){
                        randomBai(random, playerOfRoom, 8)
                    }else if(i == 11){
                        randomBai(random, playerOfRoom, 9)
                    }
                    playerOfRoom.splice(random, 1)
                }
            }
        }

        for(var i = 0; i < playerOfRoom.length; i ++){
            randomBai(i, playerOfRoom, 10)
        }

        timeList.push({roomId: info.roomId, time: Math.floor((Date.now()/1000)/60)+5, code: 0})
        check1("Start_Time", timeList);
    })

    //data: user || roomId || roomName || userName || userImg
    socket.on("joinRoom", (data) => {
        var info = JSON.parse(data)

        var playerOfRoom = roomPlayer.filter((e) => e.roomId === info.roomId)

        //trả về cho những player trong room
        for(const item of playerOfRoom){
            var user = userList.find((e) => e.user === item.user)
            //find index of user
            var position = userList.indexOf(user)
            
            socket.to(userList[position].id).emit("S_joinroom", {user: info.user, userName: info.userName, userImg: info.userImg})
        }

        //user || ready || func || roomId
        roomPlayer.push({
            user: info.user,
            ready: false,
            func: "",
            roomId: info.roomId
        })

        check2("joinroom")

        //trả về tất cả player đang online về MainActivity
        socket.broadcast.emit("S_joinroom1", {
            roomId: info.roomId,
            roomName: info.roomName,
            quantity: playerOfRoom.length
        })
    })

    //ramdom là vị trí thứ trự trong phòng
    function randomBai(random, playerOfRoom, func){
        var bai = funcList.find((e) => e.number == func)

        var player = playerOfRoom[random]
        //index là vị trí trong bảng roomPlayer
        var index = roomPlayer.indexOf(player)
        roomPlayer[index].func = func

        var user = userList.find((e) => e.user = player.user)
        //find index of user
        var indexUser = userList.indexOf(user)
        check1("user receiver", userList[index])
        if(userList[index] !== undefined){
            socket.to(userList[indexUser].id).emit("S_startRoom", {bai: bai.id})
        }
    }

    function bossBai(func){{
        var bai = funcList.find((e) => e.number == func)

        // var player = playerOfRoom[random]
        // //index là vị trí trong bảng roomPlayer
        // var index = roomPlayer.indexOf(player)
        // roomPlayer[index].func = func

        // socket.emit('S_startRoomBoss', {
        //     bai: bai.id
        // })
    }}
})

function check(value){
    console.log(value)
}

function check_log_messageList(){
    console.log("--------------------------------------"+"messageList"+"--------------------------------------")
    console.log(messageList)
}

function check1(tag, data){
    console.log("--------------------------------------"+tag+"--------------------------------------")
    console.log(data)
    console.log("----------------------------------------end----------------------------------------")
}

function check2(tag){
    console.log("--------------------------------------"+tag+"--------------------------------------")
    console.log("userList")
    console.log(userList)
    console.log("roomPlayer")
    console.log(roomPlayer)
    console.log("----------------------------------------end----------------------------------------")
}

server.listen(PORT, () => console.log(`Server listening on ${PORT}`));