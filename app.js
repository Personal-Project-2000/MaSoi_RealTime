// connect firebase
const { info } = require('console')
const e = require('express')
var FCM = require('fcm-node')
const { networkInterfaces } = require('os')
const { Socket } = require('socket.io')
const { isBuffer } = require('util')
var serviceAccount = require("./firebase.json")
var fcm = new FCM(serviceAccount)

//user || device || status || id
var userList = []
//sender || receiver || body || title 
var messageList = []
//user || ready || func || roomId || patriarch || hypnosis || love || shot || protected || die || bitten || beBitten || potionHelp || potionDie || beVote || isVote || agreeAdvocate
//potionHelp, potionDie dành cho người có chức vụ phù thủy
//bitten là số con sói cắn
//beBitten để xác định người có bài là sói đã thực hiện chưa
//beVote là số người nghi ngờ user
//isVote là user đã nghi ngờ người khác
//patriarch là tưởng làng
//hypnosis bị thôi niêm
//love được cupid gán tình yêu
//shot bị thợ săn ngắm trúng
//protected được bảo vệ
//agreeAdvocate -> 0: chưa xác nhận || 1: là đồng ý || 2: không đồng ý
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
//roomId || time || voteTime || advocateTime || code || quantity
var timeList = []
//user || roomId
var playerDieNew = []

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

var rangeTime = 1

io.sockets.on("connection", (socket) => {
    console.log("user connect");

    setInterval(function(){
        timer() 
    },1000)

    //client login || data: user, device
    socket.on('login', (data) => {
        var info = JSON.parse(data)

        var user = userList.find((e) => e.user === info.user)

        //check user exist
        if(user !== undefined){
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
            message: 1,
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

        //user || ready || func || roomId || patriarch || hypnosis || love || shot || protected || die || bitten  || beBitten || potionHelp || potionDie || beVote || isVote || agreeAdvocate
        roomPlayer.push({
            user: info.user, ready: true, func: "", roomId: info.roomId, patriarch: false, hypnosis: false, love: false, shot: false, protected: false, die: false, bitten: 0 , beBitten: false, potionHelp: false, potionDie: false, beVote: 0, isVote: false, agreeAdvocate: 0
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

            socket.to(player2.id).emit("S_kickroom", {})
        }

        if(info.code === 3){
            var player = roomPlayer.find((e) => e.roomId == info.roomId)

            if(player !== undefined){
                var user = userList.find((e) => e.user === player.user)

                socket.to(user.id).emit("S_bossout", {response: "ỷ quyền"})
            }
        }

        var playerOfRoom = roomPlayer.filter((e) => e.roomId == info.roomId)

        //Gửi các người chơi trong phòng
        for(const item of playerOfRoom){
            var user1 = userList.find((e) => e.user === item.user)

            if(user1 !== undefined){
                socket.to(user1.id).emit("S_exitroom", {user: info.user})
            }
        }

        if(playerOfRoom.length == 0){
            var infoRoom = timeList.find((e) => e.roomId === info.roomId)
            if(infoRoom != null){
                let vitri = timeList.indexOf(info)
                timeList.splice(vitri, 1);
            }
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

            socket.to(player.id).emit("S_settingroom", {pass: info.pass, voteTime: info.voteTime, advocateTime: info.advocateTime})
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

            if(user !== undefined){
                socket.to(user.id).emit("S_readyroom", {user: info.user, ready: playerOfRoom[index1].ready})
            }
        }
    })

    //data: roomId || voteTime || advocateTime
    socket.on("start", (data) => {
        var info = JSON.parse(data)

        socket.broadcast.emit("S_startRoom1", {roomId: info.roomId})

        var playerOfRoom = roomPlayer.filter((e) => e.roomId == info.roomId)

        var quantity = playerOfRoom.length
        if(quantity >= 3){
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

        playerOfRoom.splice(0, 1)

        for(var i = 0; i < playerOfRoom.length; i ++){
            randomBai(i, playerOfRoom, 2)
        }
        var players = roomPlayer.filter((e) => e.roomId == info.roomId)
        var infomation = timeList.find((e) => e.roomId == info.roomId)
        if(infomation != null){
            var index = timeList.indexOf(infomation)
            timeList[index].time = countTimeNext(0)
            timeList[index].code = 0
            timeList[index].voteTime = info.voteTime
            timeList[index].advocateTime = info.advocateTime
            timeList[index].quantity = players.length
        }else{
            timeList.push(
                {
                    roomId: info.roomId, 
                    time: countTimeNext(0), 
                    voteTime: info.voteTime,
                    advocateTime: info.advocateTime,
                    code: 0,
                    quantity: players.length
                })
        }
        check1("Start_Time", timeList);
    })

    //data: user || roomId || roomName || userName || userImg
    socket.on("joinRoom", (data) => {
        var info = JSON.parse(data)

        var playerOfRoom = roomPlayer.filter((e) => e.roomId === info.roomId)

        //trả về cho những player trong room
        for(const item of playerOfRoom){
            var user = userList.find((e) => e.user === item.user)
            
            if(user !== undefined){
                socket.to(user.id).emit("S_joinroom", {user: info.user, userName: info.userName, userImg: info.userImg})
            }
        }

        //user || ready || func || roomId || patriarch || hypnosis || love || shot || protected || die || bitten  || beBitten || potionHelp || potionDie || beVote || isVote || agreeAdvocate
        roomPlayer.push({
            user: info.user, ready: false, func: "", roomId: info.roomId, patriarch: false, hypnosis: false, love: false, shot: false, protected: false, die: false, bitten: 0 , beBitten: false, potionHelp: false, potionDie: false, beVote: 0, isVote: false, agreeAdvocate: 0
        })

        check2("joinroom")

        //trả về tất cả player đang online về MainActivity
        socket.broadcast.emit("S_joinroom1", {
            roomId: info.roomId,
            roomName: info.roomName,
            quantity: playerOfRoom.length+1
        })
    })

    //data: user || roomId
    //roomPlayer: user || ready || func || roomId || patriarch || hypnosis || love || shot || protected || die || bitten || beBitten || potionHelp || potionDie || beVote || isVote || agreeAdvocate
    socket.on("cupid", (data) => {
        var info = JSON.parse(data)

        var player = roomPlayer.find((e) => e.user == info.user)
        var index = roomPlayer.indexOf(player)
        roomPlayer[index].love = true

        //Lấy tất cả user bị gắn tình yêu trong phòng
        var players = roomPlayer.filter((e) => e.roomId == info.roomId && e.love == true)
        //kiểm tra đã đủ số lượng
        if(players.length == 2){
            //gửi nhận biết đến người có tình yêu
            for(var item of players){
                var playerLove = userList.find((e) => e.user == item.user)
                if(playerLove !== undefined){
                    socket.to(playerLove.id).emit("S_cupid", {playerList: players})
                }
            }

            var infoRoom = timeList.find((e) => e.roomId == info.roomId)
            if(infoRoom.quantity < 15){
                callNext(info.roomId, 11, info.voteTime, 1)
            }else{
                callNext(info.roomId, 8, rangeTime, 1)
            }
        }
    })

    //data: user || roomId
    socket.on("protected", (data) => {
        var info = JSON.parse(data)

        if(info.user !== ""){
            var player = roomPlayer.find((e) => e.user == info.user)
            var index = roomPlayer.indexOf(player)
            roomPlayer[index].protected = true
        }

        callNext(info.roomId, 1, rangeTime, 1)
    })

    //data: user || userBitten || roomId
    socket.on("wolf", (data) => {
        var info = JSON.parse(data)

        if(info.userBitten != ""){
            //cập nhật người bị sói muốn giết
            var playerBitten = roomPlayer.find((e) => e.user == info.userBitten)
            var indexBitten = roomPlayer.indexOf(playerBitten)
            roomPlayer[indexBitten].bitten ++

            check1("checkRoomPlayer", roomPlayer)
        }

        //cập nhật sói đã cắn
        var player = roomPlayer.find((e) => e.user == info.user)
        var index = roomPlayer.indexOf(player)
        roomPlayer[index].beBitten = true

        //Lấy tất cả sói đã cắn trong phòng
        var players = roomPlayer.filter((e) => e.roomId == info.roomId && e.beBitten == true)
        //Lấy tất cả người bị cắn trong phòng
        var playerBittens = roomPlayer.filter((e) => e.bitten > 0 && e.roomId == info.roomId)
        var infoRoom = timeList.find((e) => e.roomId == info.roomId)
        if(infoRoom.quantity < 7){
            if(info.userBitten !== ""){
                //kiểm tra người bị cắn có được bảo vệ không
                if(!playerBitten.protected){
                    playerDieNew.push({
                        user: playerBitten.user,
                        roomId: playerBitten.roomId
                    })
                }
            }

            callNext(info.roomId, 2, rangeTime, 4)
        }else if(infoRoom.quantity < 10){
            if(players.length == 2){
                if(playerBittens.length == 1){
                    //kiểm tra người bị cắn có được bảo vệ không
                    if(!playerBittens[0].protected){
                        playerDieNew.push({
                            user: playerBittens[0].user,
                            roomId: playerBittens[0].roomId
                        })
                    }
                }else{
                    var random = Math.floor(Math.random() * playerBittens.length);
                    //kiểm tra người bị cắn có được bảo vệ không
                    if(!playerBittens[random].protected){
                        playerDieNew.push({
                            user: playerBittens[random].user,
                            roomId: playerBittens[random].roomId
                        })
                    }
                }

                callNext(info.roomId, 2, rangeTime, 1)
            }
        }else if(infoRoom.quantity < 14){
            if(players.length == 3){
                if(playerBittens.length == 1){
                    //kiểm tra người bị cắn có được bảo vệ không
                    if(!playerBittens[0].protected){
                        playerDieNew.push({
                            user: playerBittens[0].user,
                            roomId: playerBittens[0].roomId
                        })
                    }
                }else{
                    //kiểm tra ai bị cắn nhìu
                    var max = 0
                    for(item of playerBittens){
                        if(item.bitten > max)
                            max = item.bitten
                    }

                    //kiểm tra bị cắn đều không
                    if(max == 1){
                        var random = Math.floor(Math.random() * playerBittens.length);
                        //kiểm tra người bị cắn có được bảo vệ không
                        if(!playerBittens[random].protected){
                            playerDieNew.push({
                                user: playerBittens[random].user,
                                roomId: playerBittens[random].roomId
                            })
                        }
                    }else{
                        var playerBittenMax = playerBittens.find((e) => e.bitten == max)
                        //kiểm tra người bị cắn có được bảo vệ không
                        if(!playerBittenMax.protected){
                            playerDieNew.push({
                                user: playerBittenMax.user,
                                roomId: playerBittenMax.roomId
                            })
                        }
                    }
                }

                callNext(info.roomId, 2, rangeTime, 1)
            }
        }else if(infoRoom.quantity < 17){
            if(players.length == 4){
                if(playerBittens.length == 1){
                    //kiểm tra người bị cắn có được bảo vệ không
                    if(!playerBittens[0].protected){
                        playerDieNew.push({
                            user: playerBittens[0].user,
                            roomId: playerBittens[0].roomId
                        })
                    }
                }else{
                    //kiểm tra ai bị cắn nhìu
                    var max = 0
                    for(item of playerBittens){
                        if(item.bitten > max)
                            max = item.bitten
                    }

                    //kiểm tra bị cắn đều không
                    switch(max){
                        case 1:{
                            var random = Math.floor(Math.random() * playerBittens.length);
                            //kiểm tra người bị cắn có được bảo vệ không
                            if(!playerBittens[random].protected){
                                playerDieNew.push({
                                    user: playerBittens[random].user,
                                    roomId: playerBittens[random].roomId
                                })
                            }
                        }break
                        case 2:{
                            if(playerBittens.length == 2){
                                var random = Math.floor(Math.random() * playerBittens.length);
                                //kiểm tra người bị cắn có được bảo vệ không
                                if(!playerBittens[random].protected){
                                    playerDieNew.push({
                                        user: playerBittens[random].user,
                                        roomId: playerBittens[random].roomId
                                    })
                                }
                            }else{
                                var playerBittenMax = playerBittens.find((e) => e.bitten == max)
                                //kiểm tra người bị cắn có được bảo vệ không
                                if(!playerBittenMax.protected){
                                    playerDieNew.push({
                                        user: playerBittenMax.user,
                                        roomId: playerBittenMax.roomId
                                    })
                                }
                            }
                        }break
                        case 3:{
                            var playerBittenMax = playerBittens.find((e) => e.bitten == max)
                            //kiểm tra người bị cắn có được bảo vệ không
                            if(!playerBittenMax.protected){
                                playerDieNew.push({
                                    user: playerBittenMax.user,
                                    roomId: playerBittenMax.roomId
                                })
                            }
                        }break
                    }
                }

                callNext(info.roomId, 2, rangeTime, 1)
            }
        }else if(infoRoom.quantity >= 17){
            if(players.length == 5){
                if(playerBittens.length == 1){
                    //kiểm tra người bị cắn có được bảo vệ không
                    if(!playerBittens[0].protected){
                        playerDieNew.push({
                            user: playerBittens[0].user,
                            roomId: playerBittens[0].roomId
                        })
                    }
                }else{
                    //kiểm tra ai bị cắn nhìu
                    var max = 0
                    for(item of playerBittens){
                        if(item.bitten > max)
                            max = item.bitten
                    }

                    //kiểm tra bị cắn đều không
                    switch(max){
                        case 1:{
                            var random = Math.floor(Math.random() * playerBittens.length);
                            //kiểm tra người bị cắn có được bảo vệ không
                            if(!playerBittens[random].protected){
                                playerDieNew.push({
                                    user: playerBittens[random].user,
                                    roomId: playerBittens[random].roomId
                                })
                            }
                        }break
                        case 2:{
                            if(playerBittens.length == 3){
                                var playerBittenMaxs = playerBittens.filter((e) => e.bitten == max)
                                var random = Math.floor(Math.random() * playerBittenMaxs.length);
                                //kiểm tra người bị cắn có được bảo vệ không
                                if(!playerBittenMaxs[random].protected){
                                    playerDieNew.push({
                                        user: playerBittenMaxs[random].user,
                                        roomId: playerBittenMaxs[random].roomId
                                    })
                                }
                            }else{
                                var playerBittenMax = playerBittens.find((e) => e.bitten == max)
                                //kiểm tra người bị cắn có được bảo vệ không
                                if(!playerBittenMax.protected){
                                    playerDieNew.push({
                                        user: playerBittenMax.user,
                                        roomId: playerBittenMax.roomId
                                    })
                                }
                            }
                        }break
                        case 3: case 4:{
                            var playerBittenMax = playerBittens.find((e) => e.bitten == max)
                            //kiểm tra người bị cắn có được bảo vệ không
                            if(!playerBittenMax.protected){
                                playerDieNew.push({
                                    user: playerBittenMax.user,
                                    roomId: playerBittenMax.roomId
                                })
                            }
                        }break
                    }
                }

                callNext(info.roomId, 2, rangeTime, 1)
            }
        }

        //restart việc cắn
        for(var item of players){
            var vitri = roomPlayer.indexOf(item)
            roomPlayer[vitri].beBitten = false
        }
        for(var item of playerBittens){
            var vitri = roomPlayer.indexOf(item)
            roomPlayer[vitri].bitten = 0
        }
    })

    //data: user || roomId
    socket.on("prophesy", (data) => {
        var info = JSON.parse(data)

        if(info.user !== ""){
            var player = roomPlayer.find((e) => e.user == info.user)
            check1("kiểm tra sói", player)
            var answer = "Đó là dân làng"
            if(player.func === 1 || player.func === 9){
                answer = "Đúng là sói rồi đó"
            }

            socket.emit('S_prophesy', {
                answer: answer
            })
        }

        var infoRoom = timeList.find((e) => e.roomId == info.roomId)
        if(infoRoom.quantity < 7){
            callNext(info.roomId, 11, info.voteTime, 1)
        }else{
            if(infoRoom.quantity < 10)
                callNext(info.roomId, 4, rangeTime, 4)
            else
                callNext(info.roomId, 4, rangeTime, 1)
        }
    })

    //data: user || userPotion || code -> 1: help, 2: die || roomId
    socket.on("witch", (data) => {
        var info = JSON.parse(data)

        if(info.userPotion !== ""){
            if(info.code == 1){
                let playerPotion = playerDieNew.find((e) => e.user == info.userPotion)
                var indexPotion = playerDieNew.indexOf(playerPotion)
                playerDieNew.splice(indexPotion, 1);

                let player= roomPlayer.find((e) => e.user == info.user)
                var index = roomPlayer.indexOf(player)
                roomPlayer[index].positionHelp = false
            }else{
                playerDieNew.push({
                    user: info.userPotion,
                    roomId: info.roomId
                })

                let player= roomPlayer.find((e) => e.user == info.user)
                var index = roomPlayer.indexOf(player)
                roomPlayer[index].potionDie = false
            }
        }

        if(code == 1){
            socket.emit('S_witch', {
                message: "Bạn muốn giết ai không?"
            })
        }else{
            var infoRoom = timeList.find((e) => e.roomId == info.roomId)
            if(infoRoom.quantity < 10){
                callNext(info.roomId, 11, info.voteTime, 1)
            }else{
                callNext(info.roomId, 5, rangeTime, 1)
            }
        }
    })

    //data: user || roomId
    socket.on("flute", (data) => {
        var info = JSON.parse(data)

        if(info.user !== ""){
            var player = roomPlayer.find((e) => e.user == info.user)
            var index = roomPlayer.indexOf(player)
            roomPlayer[index].hypnosis == true

            var players = roomPlayer.filter((e) => e.hypnosis == true && e.roomId == info.roomId)
            if(players.length % 2 == 0){
                for(var item of players){
                    var user = userList.find((e) => e.user == item.user)
                    if(user !== undefined){
                        socket.to(user.id).emit("S_flute", {playerList: players})
                    }
                }
            }
        }

        callNext(info.roomId, 11, info.voteTime, 1)
    })

    //data: user || roomId
    socket.on("hunter", (data) => {
        var info = JSON.parse(data)

        var player = roomPlayer.find((e) => e.user == info.user)
        var index = roomPlayer.indexOf(player)
        roomPlayer[index].shot == true

        var infoRoom = timeList.find((e) => e.roomId == info.roomId)
        if(infoRoom.quantity < 15)
            callNext(info.roomId, 6, rangeTime, 4)
        else
            callNext(info.roomId, 6, rangeTime, 1)
    })

    //data: user || userVote || roomId
    socket.on("vote", (data) => {
        var info = JSON.parse(data)

        if(info.userVote !== ""){
            var playerVote = roomPlayer.find((e) => e.user == info.userVote)
            var indexVote = roomPlayer.indexOf(playerVote)
            roomPlayer[indexVote].beVote ++
        }

        var player = roomPlayer.find((e) => e.user == info.user)
        var index = roomPlayer.indexOf(player)
        roomPlayer[index].isVote = true

        var playerAlive = roomPlayer.filter((e) => e.die == false && e.roomId == info.roomId)
        check1("method: vote - check playerAlive", playerAlive)
        if(playerAlive.every((e) => e.isVote == true)){
            var infoRoom = timeList.find((e) => e.roomId == info.roomId)

            var max = 0
            for(var item of playerAlive){
                if(max < item.beVote)
                    max = item.beVote
            }

            var playerVoteHeader = playerAlive.find((e) => e.beVote == max)
            var indexPlayerHeader = roomPlayer.indexOf(playerVoteHeader)
            roomPlayer[indexPlayerHeader].agreeAdvocate = 1

            var playerNoVotes = playerAlive.filter((e) => e.beVote < max)
            for(var item of playerNoVotes){
                var indexNoVote = roomPlayer.indexOf(item)
                roomPlayer[indexNoVote].beVote = 0
            }

            var playerVotes = playerAlive.filter((e) => e.beVote == max)
            check1("method: vote - check playerVotes", playerVotes)
            for(var item of playerAlive){
                var indexPlayer = roomPlayer.indexOf(item)
                roomPlayer[indexPlayer].isVote = false
            }

            if(playerVotes.length > 1)
                callNext(infoRoom.roomId, 12, infoRoom.advocateTime, 3)
            else
                callNext(infoRoom.roomId, 12, infoRoom.advocateTime, 1)
        }
    })

    //data user || roomId || agreeAdvocate -> 1: đồng ý, 2: không đồng ý
    socket.on("advocate", (data) => {   
        var info = JSON.parse(data)

        var player = roomPlayer.find((e) => e.user == info.user)
        var index = roomPlayer.indexOf(player)
        roomPlayer[index].agreeAdvocate = info.agreeAdvocate

        var playerAlive = roomPlayer.filter((e) => e.roomId == info.roomId && e.die == false)

        check1("method: advocate - check playerAlive", playerAlive)
        if(playerAlive.every((e) => e.agreeAdvocate != 0)){
            var agree = playerAlive.filter((e) => e.agreeAdvocate == 1)
            var disAgree = playerAlive.filter((e) => e.agreeAdvocate == 2)
            var playerVoteHeader = playerAlive.find((e) => e.beVote > 0)
            var indexVoteHeader = roomPlayer.indexOf(playerVoteHeader)

            if(agree.length-1 > disAgree){
                roomPlayer[indexVoteHeader].die = true

                for(var item of playerAlive){
                    var user = userList.find((e) => e.user == item.user)
                    if(user !== undefined){
                        if(user.id === socket.id)
                            socket.emit("S_playerVote", {userDie: playerVoteHeader.user, message: "Đã chết rồi"})
                        else
                            socket.to(user.id).emit("S_playerVote", {userDie: playerVoteHeader.user, message: "Đã chết rồi"})
                    }
                }

                playerAlive = roomPlayer.filter((e) => e.roomId == info.roomId && e.die == false)
            }else{
                roomPlayer[indexVoteHeader].beVote = 0

                for(var item of playerAlive){
                    var user = userList.find((e) => e.user == item.user)
                    if(user !== undefined){
                        if(user.id === socket.id)
                            socket.emit("S_playerVote", {userDie: playerVoteHeader.user, message: "Đã thoát khỏi cái chết"})
                        else
                            socket.to(user.id).emit("S_playerVote", {userDie: playerVoteHeader.user, message: "Đã thoát khỏi cái chết"})
                    }
                } 
            }

            for(var item of playerAlive){
                var indexPlayer = roomPlayer.indexOf(item)
                roomPlayer[indexPlayer].agreeAdvocate = 0 
            }


            var playerVoteNext = playerAlive.find((e) => e.beVote > 0)
            check1("method: advocate - check playerVoteNext", playerVoteNext)
            if(playerVoteNext != null){
                var indexNext = roomPlayer.indexOf[playerVoteNext]
                roomPlayer[indexNext].agreeAdvocate = 1
            }

            var playerVotes = playerAlive.filter((e) => e.beVote > 0)
            if(playerVotes.length > 1)
                callNext(info.roomId, 13, infoRoom.advocateTime, 3)
            else
                callNext(info.roomId, 3, rangeTime, 1)
        }
    })

    //ramdom là vị trí thứ trự trong phòng
    function randomBai(random, playerOfRoom, func){
        var bai = funcList.find((e) => e.number == func)

        var player = playerOfRoom[random]
        //index là vị trí trong bảng roomPlayer
        var index = roomPlayer.indexOf(player)
        roomPlayer[index].func = func

        check1("kiểm tra userList", userList)
        var user = userList.find((e) => e.user == player.user)
        check1("user receiver", user)
        if(user != null){
            check("có tồn tại nha")
            if(user.id === socket.id)
                socket.emit("S_startRoom", {bai: bai.id})
            else
                socket.to(user.id).emit("S_startRoom", {bai: bai.id})
        }
    }

    function timer(){
        for(var item of timeList){
            if(Math.floor((Date.now()/1000/60)) === item.time){
                check1("Call", timeList)
                switch(item.code){
                    case 0:{
                        callNext(item.roomId, 3, rangeTime, 1)
                    }
                    break
                    case 1:{
                        callNext(item.roomId, 1, rangeTime, 1)
                    }
                    break
                    case 2:{
                        if(item.quantity < 7)
                            callNext(item.roomId, 2, rangeTime, 4)
                        else
                            callNext(item.roomId, 2, rangeTime, 1)
                    }
                    break
                    case 3:{
                        if(item.quantity < 10)
                            callNext(item.roomId, 4, item.voteTime, 4)
                        else
                            callNext(item.roomId, 4, rangeTime, 1)
                    }
                    break
                    case 4:{
                        callNext(item.roomId, 5, rangeTime, 1)
                    }
                    break
                    case 5:{
                        if(item.quantity < 15)
                            callNext(item.roomId, 6, item.voteTime, 4)
                        else
                            callNext(item.roomId, 6, rangeTime, 1)
                    }
                    break
                    case 6:{
                        callNext(item.roomId, 8, rangeTime, 1)
                    }
                    break
                    case 7:{
                        callNext(item.roomId, 11, item.voteTime, 1)
                    }
                    break
                    case 8:{
                        var playerAlive = roomPlayer.filter((e) => e.roomId == item.roomId && e.die == false)

                        if(playerAlive.every((e) => e.agreeAdvocate == 0)){
                            var max = 0
                            for(var item of playerAlive){
                                if(max < item.beVote)
                                    max = item.beVote
                            }

                            var playerVoteHeader = playerAlive.find((e) => e.beVote == max)
                            if(playerVoteHeader != null){
                                var indexPlayerHeader = roomPlayer.indexOf(playerVoteHeader)
                                roomPlayer[indexPlayerHeader].agreeAdvocate = 1
                            }

                            var playerNoVotes = playerAlive.filter((e) => e.beVote < max)
                            for(var item of playerNoVotes){
                                var indexNoVote = roomPlayer.indexOf(item)
                                roomPlayer[indexNoVote].beVote = 0
                            }

                            for(var item of playerAlive){
                                var indexPlayer = roomPlayer.indexOf(item)
                                roomPlayer[indexPlayer].isVote = false
                            }

                            var playerVotes = roomPlayer.filter((e) => e.roomId == item.roomId && e.beVote > 0 && e.die == false)
                            if(playerVotes.length > 1)
                                callNext(item.roomId, 12, item.advocateTime, 3)
                            else
                                callNext(item.roomId, 12, rangeTime, 1)
                        }else{
                            var agree = playerAlive.filter((e) => e.agreeAdvocate == 1)
                            var disAgree = playerAlive.filter((e) => e.agreeAdvocate == 2)
                            var playerVoteHeader = playerAlive.find((e) => e.beVote > 0)
                            var indexVoteHeader = roomPlayer.indexOf(playerVoteHeader)
                
                            if(agree.length-1 > disAgree){
                                roomPlayer[indexVoteHeader].die = true
                
                                for(var item of playerAlive){
                                    var user = userList.find((e) => e.user == item.user)
                                    if(user !== undefined){
                                        socket.to(user.id).emit("S_playerVote", {user: playerVoteHeader.user, message: "Đã chết rồi"})
                                    }
                                }
                            }else{
                                roomPlayer[indexVoteHeader].beVote = 0
                
                                for(var item of playerAlive){
                                    var user = userList.find((e) => e.user == item.user)
                                    if(user !== undefined){
                                        socket.to(user.id).emit("S_playerVote", {user: playerVoteHeader.user, message: "Đã thoát khỏi cái chết"})
                                    }
                                } 
                            }

                            for(var item of playerAlive){
                                var indexPlayer = roomPlayer.indexOf(item)
                                roomPlayer[indexPlayer].agreeAdvocate = 0 
                            }
                
                            var playerVoteNext = playerAlive.find((e) => e.beVote > 0)
                
                            if(playerVoteNext != null){
                                var indexNext = roomPlayer.indexOf[playerVoteNext]
                                roomPlayer[indexNext].agreeAdvocate = 1
                            }

                            var playerVotes = roomPlayer.filter((e) => e.roomId == item.roomId && e.beVote > 0 && e.die == false)
                            if(playerVotes.length > 1)
                                callNext(item.roomId, 13, item.advocateTime, 3)
                            else
                                callNext(item.roomId, 13, item.advocateTime, 1)
                        }
                    }
                    break
                }
            }
        }
    }

    //code -> 1: tăng tự nhiên || 2: tăng lên 8(vòng advocate) || 3: giữ nguyên || 4: tăng lên 7(vòng vote)
    //number: lá bài được gọi hiện tại
    //range: thời gian lá bài thực hiện
    //code: nhằm timer xác định sau lá bài kế lá bài hiện tại
    function callNext(roomId, number, range, code){
        var timeNext = countTimeNext(range)
        var infoRoom = timeList.find((e) => e.roomId == roomId) 
        var indexRoom = timeList.indexOf(infoRoom)
        if(code == 1)
            if(timeList[indexRoom].code == 8)
                timeList[indexRoom].code = 0
            else
                timeList[indexRoom].code ++
        else if(code == 2)
            timeList[indexRoom].code = 8
        else if(code == 4)
            timeList[indexRoom].code = 7

        check1("kiểm tra lá bài kế của phòng "+roomId, timeList[indexRoom])

        timeList[indexRoom].time = timeNext
        call(roomId, number)
    }

    //number -> 11: vòng vote || 12: vòng advocate
    function call(roomId, number){
        check1("checkcall",roomId+" || "+number)
        var playerOfRoom = roomPlayer.filter((e) => e.roomId == roomId)
        var infoBai = funcList.find((e) => e.number == number)

        if(number < 11){
            for(var item of playerOfRoom){
                var user = userList.find((e) => e.user == item.user)
                check1("checkuser",user)
                if(user != null)
                    if(user.id == socket.id)
                        socket.emit("S_call", {baiName: infoBai.name, baiId: infoBai.id, playerDie: null, playerAlive: null, playerVote: null})
                    else
                        socket.to(user.id).emit("S_call", {baiName: infoBai.name, baiId: infoBai.id, playerDie: null, playerAlive: null, playerVote: null})
            }
        }else if(number == 11){
            var playerDies = playerDieNew.filter((e) => e.roomId == roomId)
            var playerResult = []

            for(var item of playerDies){
                var playerDie = roomPlayer.find((e) => e.user == item.user)
                if(playerDie.func == 7){
                    var indexDie = roomPlayer.indexOf(playerDie)
                    roomPlayer[indexDie].func == 1

                    var infoUser = userList.find((e) => e.user == item.user)
                    socket.to(infoUser.id).emit("S_changeFunc", {})
                }else{
                    playerResult.push({
                        user: item.user,
                        roomId: item.roomId
                    })

                    var indexDie = playerDieNew.indexOf(item)
                    playerDieNew.splice(indexDie, 1)

                    var indexDie_roomPLayer = roomPlayer.indexOf(playerDie)
                    roomPlayer[indexDie_roomPLayer].die = true
                }
            }

            var playerAlive = roomPlayer.filter((e) => e.die == false && e.roomId == roomId)

            check1("function: call - check playerResult", playerResult)
            check1("function: call - check playerAlive", playerAlive)
            for(var item of playerOfRoom){
                var user = userList.find((e) => e.user == item.user)
                check1("checkuser",user)
                if(user != null)
                    if(user.id == socket.id)
                        socket.emit("S_call", {baiName: "Vote", baiId: "1", playerDie: playerResult, playerAlive: playerAlive, playerVote: null})
                    else
                        socket.to(user.id).emit("S_call", {baiName: "Vote", baiId: "1", playerDie: playerResult, playerAlive: playerAlive, playerVote: null})
            }
        }else if(number == 12){
            var players = roomPlayer.filter((e) => e.roomId == roomId)
            var playerAlive = players.filter((e) => e.die == false)

            var playerVotes = playerAlive.filter((e) => e.beVote > 0)
            check1("function: call - check playerVotes - number 12", playerVotes)
            for(var item of players){
                var user = userList.find((e) => e.user == item.user)
                if(user !== undefined){
                    if(user.id == socket.id)
                        socket.emit("S_call", {baiName: "Advocate", baiId: "2", playerDie: null, playerAlive: null, playerVote: playerVotes})
                    else
                        socket.to(user.id).emit("S_call", {baiName: "Advocate", baiId: "2", playerDie: null, playerAlive: null, playerVote: playerVotes})
                }
            }
        }
    }

    //Tính thời gian kế tiếp || hiện tại phép tính đc thực hiện theo phút
    function countTimeNext(range){
        return Math.floor((Date.now()/1000/60)) + range
    }
})

function check(value){
    console.log(value)
}

function check_log_messageList(){
    console.log("--------------------------------------"+"messageList"+"--------------------------------------")
    console.log(messageList)
}

function check1(tag, data){
    console.log("///////////---------------------------"+tag+"------------------------>>>>>>>>>>>>>>")
    console.log(data)
    console.log("<<<<<<<<<<<<<<------------------------------end--------------------------//////////")
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