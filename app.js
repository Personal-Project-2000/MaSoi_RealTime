// connect firebase
var FCM = require('fcm-node')
var serviceAccount = require("./firebase.json")
var fcm = new FCM(serviceAccount)

//user || device || status || id || name
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

//roomId || time || voteTime || advocateTime || code || quantity || historyId
var timeList = []

//user || roomId
var playerDieNew = []

//beBitten có giết người hay không => true là có || false là không
//sau phrase1 là những người có thẻ bài sói
//sau phrase2 là nạn nhận sói giết khi beBitten == true
//có 3 phrase
var storyWoft = [
    {beBitten: true, number: 1, phrase1: "Khi màn đêm vừa buôn xuống bầy sói (", phrase2: ") cảm thấy", phrase3: "khó ưa quá vì thế đêm nay chúng đã quyết xơi"},
    {beBitten: true, number: 2, phrase1: "Bọn sói (", phrase2: ") thật xảo nguyệt cảm thấy", phrase3: "quá là chước mắt với khả năng nói nhiều của hắn nên bọn sói đã quyết định xơi"},
    {beBitten: true, number: 3, phrase1: "Bọn sói (", phrase2: ") đã biết như vậy nên hôm qua sói đã không đưa ra quyết định nhanh chóng mà lượn lờ từng người xem ai thú vị, sau một lúc lượn lờ thì bọn chúng đã chọn", phrase3: "lên thớt, với sự bất phản kháng thì người ấy đã đi xa"},
    {beBitten: true, number: 4, phrase1: "Mặt trời vừa xuống núi bầy sói trong làng đã hiện nguyên hình(", phrase2: ") lúc sáng bọn chúng đã xác định mục tiêu là", phrase3: "nên mặt trời vừa biến mất bọn chúng đã tấn công"},
    {beBitten: true, number: 5, phrase1: "Hoàng hồn vừa bắt đầu bầy sói (", phrase2: ") đã tập hợp lại để rình mò xem đêm nay ai sẽ là mục tiêu thì đúng lúc đó", phrase3: "đi ngang nên bầy sói đã xơi người xấu số này"},
    {beBitten: false, number: 1, phrase1: "Buổi sáng bọn sói (", phrase2: ") đã cùng mọi người trong làng làm việc rã người nên đêm nay bọn chúng quyết nghỉ ngơi mà không tấn công ai.", phrase3: ""},
    {beBitten: false, number: 2, phrase2: "Bầy (", phrase2: ") sói hôm nay nghe một câu chuyện bi thương và bọn chúng đã có một lòng thương cảm nên đêm nay bọn chúng quyết định không tấn công.", phrase3: ""}
]

//người bị tấn công sẽ được bảo vệ 
//có 1 phrase
var storyWoftProtected = [
    {number: 1, phrase1: ", nhưng xui sao bọn sói lại không biết người Bảo Vệ làng hôm nay chọn nơi này nên lũ sói đã bị anh Bảo Vệ làm cho một trận nên thân."},
    {number: 2, phrase1: ", bọn sói đã không biết cái quyết định của người Bảo vệ đêm nay lại là người bọn chúng muốn tấn công và thế là bọn chúng đã không toàn mạng trở về"}
]

//die thể hiện người giữ lá bài bảo vệ còn sống hay chết => false: sống || true: chết
//sau phrase1 là tên người giữ thẻ bài bảo vệ khi die == false
//sau phrase2 là người đc bảo vệ khi die == false
//có 3 phrase
var storyGuard = [
    {die: false, number: 1, phrase1: ". Đêm nay người Bảo Vệ(", phrase2: ") của làng cảm thấy khá là bất bình nên đã bảo vệ", phrase3: ""},
    {die: false, number: 2, phrase1: ". Quá là hoang mang nên người Bảo Vệ(", phrase2: ") của làng cảm thấy khá là bất bình nên đã bảo vệ", phrase3: ""},
    {die: false, number: 3, phrase1: ". Bắt đầu hoàng hôn buôn xuống người Bảo Vệ(", phrase2: ") hôm nay bỗng dưng cảm thấy 1 điều bất an nên đã sang nhà", phrase3: "để bảo vệ"},
    {die: true, number: 1, phrase1: ". Sự ra đi thầm lặng của người Bảo Vệ sẽ khiến đêm nay làng có một kết cục bi thảm", phrase2: "", phrase3: ""},
    {die: true, number: 2, phrase1: ". Đêm nay làng sẽ có một án thảm khóc bởi vì người giúp an toàn cho làng đã ra đi thầm lặng", phrase2: "", phrase3: ""},
    {die: true, number: 3, phrase1: ". Sẽ là một đêm tàn khóc và đầy đau thương khi không còn ai trấn giữ ngôi làng", phrase2: "", phrase3: ""}
]

//câu chuyện của người thợ săn 
//sau phrase1 là tên người giữ thẻ bài thợ săn
//sau phrase2 là người bị bắn
//có 3 phrase
var storyHunter = [
    {number: 1, phrase1: ". Trong làng có tồn tại một người có quyền năng kéo một người sẽ chết theo hắn đó là Thợ Săn(", phrase2: ") khi hay tin làng bị sói giả dạng thì hắn đã nghỉ đến", phrase3: ", người Thợ Săn đã nguyền rủa vào mũi tên của hắn và đã bắn kia tình nghi kia"},
    {number: 2, phrase1: ". Từ khi hay tin làng có bọn sói giả dạng nên người Thợ Săn(", phrase2: ") đã nguyền rủa vào tên và bắn vào", phrase3: "là kẻ làm người săn bắn cảm thấy bất an nhất"},
    {number: 3, phrase1: ". Khi làng có thôn báo về việc trong làng có bọn sói giả dạng dân, thì người Thợ Săn(",  phrase2: ") cảm thấy", phrase3: "là một người đáng là nghi ngờ thì hắn ta vừa chuyển đến làng và ngay lập tức người Thợ Săn dùng mũi tên có lời nguyền \"Khi Thợ Săn chết thì người bị dính mũi tên cũng sẽ chết theo\" bắn vào người đó"}
]

//câu chuyện của người ban tình yêu
//có 3 phrase
//sau phrase1 là tên người giữ thẻ bài Cupid
//sau phrase2 là 2 người được ban tình yêu 
var storyCupid = [
    {number: 1, phrase1: "Với quyền năng và trách nhiệm của người ban tình yêu cho ngôi làng thì thần Cupid(", phrase2: ") đã cảm thấy tình yêu mãnh liệt giữa", phrase3: ", nên thần đã quyết định trao sự gắn kết vĩnh cửu cho họ"},
    {number: 2, phrase1: "Với tinh thần và trách nhiệm ban tình yêu đến lứa đối thì thần Cupid(", phrase2: ") đã trao 1 tình yêu vĩnh cửu cho", phrase3: ", thì tình yêu này sẽ giúp họ cùng sống cùng chết để bên nhau"},
    {number: 3, phrase1: "Thần Cupid(", phrase2: ") có một thiên chức rằng hãy mang đến nhân gian với 1 tình yêu đẹp thì thần đã cảm thấy", phrase3: "đáng có tình yêu vĩnh hằng, thì thần đã quyết định ban tặng cho họ với phúc hậu này"}
]

//câu chuyện của người thổi sáo
//die thể hiện người giữ bài còn sống hay chết => false: sống || true: chết
//có 3 phrase
//sau phrase1 là tên người giữ thẻ bài thổi sáo
//sau phrase2 là tên những người bị thôi niêm khi die == false
var storyFlute = [
    {die: false, number: 1, phrase1: "Là một người thích thổi sáo(", phrase2: ") mà bị dính 1 lời nguyền mỗi đêm sẽ đi thôi niêm người khác, tuy người này đã biết nhưng cũng bắt lực trước lời nguyện thì bỗng dưng có", phrase3: "đi ngang nơi thổi sáo nên đã vô tình bị thôi niêm"},
    {die: false, number: 2, phrase1: "Đêm lại xuống thì ", phrase2: " lại bắt đầu đi thôi niêm người khác,", phrase3: "hình như mất ngủ nên đi dạo ngang nơi ấy và thế đã vô tình bị thôi niêm"},
    {die: true, number: 1, phrase1: "Với sự ra đi mãi mãi của", phrase2: "thì đêm nay làng không còn phải nhận thêm 1 tình trạng bị thôi niêm nào nữa", phrase3: ""},
    {die: true, number: 2, phrase1: "Cái sự từ giả làng của", phrase2: "đã giúp làng không còn phải khốn khổ về việc cứ chơi đêm là bị thôi niêm", phrase3: ""}
]

//câu chuyên về người có khả năng tiên đoán
//die thể hiện người giữ lá bài tiên tri còn sống hay chết => false: sống || true: chết
//có 3 phrase
//sau phrase1 là người giữ lá bài tiên tri
//sau phrase2 là người bị soi khi die == false
var storyProphesy = [
    {die: false, number: 1, phrase1: "Cùng lúc đó người tiên tri bí ẩn của làng(", phrase2: ") đã dùng khả năng tiên đoán của bản thân xem", phrase3: "có phải là sói không"},
    {die: false, number: 2, phrase1: "Đồng thời lúc đó bà tiên tri(", phrase2: ") cũng đã dùng khả năng tiên tri để soi", phrase3: ""},
    {die: false, number: 3, phrase1: "Bầy sói hung tợn thật xảo nguyệt đã giả dạng dân làng, nên", phrase2: "dùng khả khả dùng thấu nội tâm và đã soi", phrase3: "có phải là một con sói hung tợn không"},
    {die: false, number: 4, phrase1: "Với khả năng bẩm sinh có thể nhìn thấu nội tâm nên", phrase2: "đã dùng khả năng này để soi", phrase3: "có là một 1 chú sói giả dạng dân làng không"},
    {die: true, number: 1, phrase1: "Do người tiên tri(", phrase2: ") đã ra đi nên không còn ai có thể soi được bầy sói là ai nữa", phrase3: ""},
    {die: true, number: 2, phrase1: "Sự ra đi của", phrase2: "làm cho làng không một ai nhận thấy đâu là sói nữa, làng thì lại không ai biết người có khả năng nhìn thấu đã không còn", phrase3: ""},
    {die: true, number: 3, phrase1: "Kể từ đêm nay có lẻ bọn sói không sợ một ai nhìn thấy thân phận của chúng vì,", phrase2: "là người duy nhất có khả năng nhìn thấy lòng người, có lẻ ngay cả người dân và bọn sói không một ai biết điều này", phrase3: ""}
]

//câu chuyện về kết quả sói của người giữ lá bài tiên tri
//userWoft là kiểm tra người mà tiên tri soi có phải là sói không => false: không phải sói || true: là sói
//có 2 phrase
//sau phrase1 là người bị soi
var storyProphesyResult = [
    {userWoft: false, number: 1, phrase1: ", nhưng", phrase2: "không phải là sói và điều đó đã giúp", phrase3: "tin tưởng hơn vào"},
    {userWoft: true, number: 1, phrase1: "thì thật bất ngờ", phrase2: "là sói và người tiên tri đã quyết định mai sẽ thông báo cho làng biết tin."},
    {userWoft: false, number: 2, phrase1: ", khi biết kết quả làm cho tiên tri vừa vui cũng như vừa không vui, vì", phrase2: "không phải là sói nên vui là đã tìm được người đáng tin cậy, không vui là đã mất đi 1 lần truy tìm sói."},
    {userWoft: false, number: 3, phrase1: "kết quả của lần soi này làm cho nhà tiên tri cảm thấy thất vọng, vì", phrase2: "không phải là sói nên đã làm 1 cơ hội tìm ra con thú hoang ác độc ấy"},
    {userWoft: true, number: 2, phrase1: "kết quả làm cho nhà tiên tri phải hết hồn vì", phrase2: "là một người thường xuyên giúp đỡ mọi người và cũng là người thân nhất với tiên tri, nhưng không ngờ đó là một con sói"},
    {userWoft: true, number: 3, phrase1: "với kết quả này thì làm cho tiên tri không có gì là cảm thấy là bất ngờ, vì tiên tri đã cảm thấy những hành vi của", phrase2: "chả khác gì một con thú hoang giả khao khát máu"}
]

//câu chuyện về người phù thủy đã chết
//có 2 phrase
//sau phrase1 là tên người giữ bài phù thủy
var storyWitchIsDie = [
    {number: 1, phrase1: "Với sự ra đi của", phrase2: "nên làng đã mất đi người đều chế ra những lọ thuốc"},
    {number: 2, phrase1: "Từ đêm nay trở đi dù có người chết thì cũng không còn ai có thể cứu được nữa, vì", phrase2: "đã ra đi mãi mãi"},
]

//used là để bình cứ đã dùng chưa => false: chưa dùng || true: đã dùng
//userDie
var storyWitchHelp = [
    {used: false, number: 1, phrase1: "đang ngủ ngon thì", phrase2: "bừng tỉnh dậy do cảm nhận được 1 người trong làng bị chết, và sau một hồi đấng đo thì "},
    {use}
]

//used là để biết bình giết đã còn hay không
var storyWitchDie = [
    {used: true, number: 1, phrase1: "nhưng người phù thủy vĩ đại lại nghi ngờ", phrase2: "là sói nên ông đã cho 1 bình thuốc độc vào người ấy."}
]

//storyMorning là lúc bắt đầu trời vừa sáng
//die là xem tối qua có người chết hay không => true: có người chết || false: không có người chết
//có 2 phrase
//sau phrase1 là tên những người đêm vừa qua đã chết khi die == true
var storyMorning = [
    {die: true, number: 1, phrase1: "Mọi người đã nghe 1 tin dữ đó là cái chết của", phrase2: ""},
    {die: true, number: 2, phrase1: "Mọi người trong làng lại nghe đc 1 hung tin đó là", phrase2: "đã từ giả khỏi cuộc đời"},
    {die: false, number: 1, phrase1: "Mọi người hôm nay thật vui vẻ vì đêm qua không một ai chết cả, nhưng mọi người hầu như chỉ vui vẻ bên ngoài còn bên trong ai ai cũng lo lắng liệu bọn sói đêm qua chỉ là ngủ quên.", phrase2: ""},
    {die: false, number: 2, phrase1: "VỪa sáng sớm là mọi người đã bắt đầu sang nhà người thân thiết với họ hỏi thăm, thì đêm qua bọn sói có vẻ chịu ngoan hiền mà không giết ai", phrase2: ""}
] 

//storyVote là lúc mọi người đã nghi ngờ xong
//userVote là kiểm tra xem mọi người có ai bị nghi ngờ không => false là không || true là có
//có 2 phrase
//sau phrase1 là những người bị vote
var storyVote = [
    {userVote: false, number: 1, phrase1: ". Với tin hung như vậy mọi người bắt đầu bàn tán với nhau hăng say đến đêm", phrase2: ""},
    {userVote: true, number: 1, phrase1: ". Mọi người bắt đầu lo sợ và mỗi người có một suy nghĩ độc đoán và họ đã bàn tán đến cuối cùng đã đưa", phrase2: ""},
    {userVote: true, number: 2, phrase1: ". Vì thế mọi người lại bàn tán và đưa ra quyết định đưa", phrase2: "lên sàn"}
]

//storyAdvocate là lúc mọi người bầu quyết nên giết hay tha
//die thể hiện việc tha hay không => true là ra đi || false là tha
//có 2 phrase
//sau phrase1 là tên người đang bị vote
var storyAdvocate = [
    {die: true, number: 1, phrase1: "Mọi người đã cho", phrase2: "biện hộ nhưng anh ta không thuyết phục được ai nên đã ra đi"},
    {die: true, number: 2, phrase1: "Sau một hồi biện hộ thì", phrase2: "cũng không thể thoát khỏi cái chết"},
    {die: false, number: 1, phrase1: "Với đầy chứng cứ thì", phrase2: "đã chứng minh được bản thân trong sạch nên được thả ra"},
    {die: false, number: 2, phrase1: "Với kinh nghiệm và lối sống lươn lẹo của", phrase2: "thì đã tự giúp chính bản thân vượt qua án tử"}
]

//storyAdvocateLove là người đang sống có tình yêu vs người đã chết
//có 4 phrase
//sau phrase1 là tên người chết theo
//sau phrase2 là tên người chết kéo theo
//sau phrase3 là tên người giữ thẻ bài tình yêu
var storyDieLove = [
    {number: 1, phrase1: ", và với tình yêu mãnh liệt thì", phrase2: "đã gieo mình xuống vược sâu để được theo", phrase3: "để lại mọi sự thắc mắc với lí do gì mà tự nhiên người đó lại tự vẫn nhưng", phrase4: "là người đã hiểu rõ lí do tại sao lại xảy ra chuyện như vậy"}
]

//story là người bị thợ săn ngắm trúng
//có 3 phrase
//sau phrase1 là người thợ săn vừa chết
//sau phrase2 là người bị thợ săn bắn
var storyDieShot = [
    {number: 1, phrase1: ", với lời nguyện của mũi tên thợ săn thì sự ra đi của", phrase2: "đã kéo thêm", phrase3: "rời khỏi cuộc sống đầy chông chênh"}
]

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
        var user = userList.find((e) => e.id == socket.id)
        let index = userList.indexOf(user)
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

        //kiểm tra tài khoản đã trong mảng roomPlayer
        var user = roomPlayer.find((e) => e.user == info.user)
        if(user == null){
            //user || ready || func || roomId || patriarch || hypnosis || love || shot || protected || die || bitten  || beBitten || potionHelp || potionDie || beVote || isVote || agreeAdvocate
            roomPlayer.push({
                user: info.user, ready: true, func: "", roomId: info.roomId, patriarch: false, hypnosis: false, love: false, 
                shot: false, protected: false, die: false, bitten: 0 , beBitten: false, potionHelp: false, potionDie: false, 
                beVote: 0, isVote: false, agreeAdvocate: 0
            })
        }else{
            var index = roomPlayer.indexOf(user)
            roomPlayer[index].ready = true
            roomPlayer[index].func = ""
            roomPlayer[index].patriarch = false
            roomPlayer[index].hypnosis = false
            roomPlayer[index].love = false
            roomPlayer[index].shot = false
            roomPlayer[index].protected = false
            roomPlayer[index].die = false
            roomPlayer[index].bitten = 0
            roomPlayer[index].beBitten = false
            roomPlayer[index].positionHelp = false
            roomPlayer[index].potionDie = false
            roomPlayer[index].beVote = 0
            roomPlayer[index].isVote = false
            roomPlayer[index].agreeAdvocate = 0
        }

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

    //data: roomId || voteTime || advocateTime || historyId
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
                        randomBai(random, playerOfRoom, 1, info.historyId)
                    }else if(i == 1){
                        randomBai(random, playerOfRoom, 2, info.historyId)
                    }else if(i == 2){
                        randomBai(random, playerOfRoom, 3, info.historyId)
                    }
                    playerOfRoom.splice(random, 1)
                }
            }else if(quantity < 10){
                for(var i = 0 ; i < 5; i ++){
                    var random = Math.floor(Math.random() * playerOfRoom.length);
                    if(i < 2){
                        randomBai(random, playerOfRoom, 1, info.historyId)
                    }else if(i == 2){
                        randomBai(random, playerOfRoom, 2, info.historyId)
                    }else if(i == 3){
                        randomBai(random, playerOfRoom,3, info.historyId)
                    }else if(i == 4){
                        randomBai(random, playerOfRoom, 4, info.historyId)
                    }
                    playerOfRoom.splice(random, 1)
                }
            }else if(quantity < 12){
                for(var i = 0 ; i < 8; i ++){
                    var random = Math.floor(Math.random() * playerOfRoom.length);
                    if(i < 3){
                        randomBai(random, playerOfRoom, 1, info.historyId)
                    }else if(i == 3){
                        randomBai(random, playerOfRoom, 2, info.historyId)
                    }else if(i == 4){
                        randomBai(random, playerOfRoom, 3, info.historyId)
                    }else if(i == 5){
                        randomBai(random, playerOfRoom, 4, info.historyId)
                    }else if(i == 6){
                        randomBai(random, playerOfRoom, 5, info.historyId)
                    }else if(i == 7){
                        randomBai(random, playerOfRoom, 6, info.historyId)
                    }
                    playerOfRoom.splice(random, 1)
                }
            }else if(quantity < 14){
                for(var i = 0 ; i < 9; i ++){
                    var random = Math.floor(Math.random() * playerOfRoom.length);
                    if(i < 3){
                        randomBai(random, playerOfRoom, 1, info.historyId)
                    }else if(i == 3){
                        randomBai(random, playerOfRoom, 2, info.historyId)
                    }else if(i == 4){
                        randomBai(random, playerOfRoom, 3, info.historyId)
                    }else if(i == 5){
                        randomBai(random, playerOfRoom, 4, info.historyId)
                    }else if(i == 6){
                        randomBai(random, playerOfRoom, 5, info.historyId)
                    }else if(i == 7){
                        randomBai(random, playerOfRoom, 6, info.historyId)
                    }else if(i == 8){
                        randomBai(random, playerOfRoom, 7, info.historyId)
                    }
                    playerOfRoom.splice(random, 1)
                }
            }else if(quantity < 17){
                for(var i = 0 ; i < 11; i ++){
                    var random = Math.floor(Math.random() * playerOfRoom.length);
                    if(i < 4){
                        randomBai(random, playerOfRoom, 1, info.historyId)
                    }else if(i == 4){
                        randomBai(random, playerOfRoom, 2, info.historyId)
                    }else if(i == 5){
                        randomBai(random, playerOfRoom, 3, info.historyId)
                    }else if(i == 6){
                        randomBai(random, playerOfRoom, 4, info.historyId)
                    }else if(i == 7){
                        randomBai(random, playerOfRoom, 5, info.historyId)
                    }else if(i == 8){
                        randomBai(random, playerOfRoom, 6, info.historyId)
                    }else if(i == 9){
                        randomBai(random, playerOfRoom, 7, info.historyId)
                    }else if(i == 10){
                        randomBai(random, playerOfRoom, 8, info.historyId)
                    }
                    playerOfRoom.splice(random, 1)
                }
            }else if(quantity >= 17){
                for(var i = 0 ; i < 12; i ++){
                    var random = Math.floor(Math.random() * playerOfRoom.length);
                    if(i < 4){
                        randomBai(random, playerOfRoom, 1, info.historyId)
                    }else if(i == 4){
                        randomBai(random, playerOfRoom, 2, info.historyId)
                    }else if(i == 5){
                        randomBai(random, playerOfRoom, 3, info.historyId)
                    }else if(i == 6){
                        randomBai(random, playerOfRoom, 4, info.historyId)
                    }else if(i == 7){
                        randomBai(random, playerOfRoom, 5, info.historyId)
                    }else if(i == 8){
                        randomBai(random, playerOfRoom, 6, info.historyId)
                    }else if(i == 9){
                        randomBai(random, playerOfRoom, 7, info.historyId)
                    }else if(i == 10){
                        randomBai(random, playerOfRoom, 8, info.historyId)
                    }else if(i == 11){
                        randomBai(random, playerOfRoom, 9, info.historyId)
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
            timeList[index].time = countTimeNext(1)
            timeList[index].code = 0
            timeList[index].voteTime = info.voteTime
            timeList[index].advocateTime = info.advocateTime
            timeList[index].quantity = players.length
            timeList[index].historyId = info.historyId
        }else{
            timeList.push(
                {
                    roomId: info.roomId, 
                    time: countTimeNext(1), 
                    voteTime: info.voteTime,
                    advocateTime: info.advocateTime,
                    code: 0,
                    quantity: players.length,
                    historyId: info.historyId
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

        //kiểm tra tài khoản đã trong mảng roomPlayer
        var user = roomPlayer.find((e) => e.user == info.user)
        if(user == null){
            //user || ready || func || roomId || patriarch || hypnosis || love || shot || protected || die || bitten  || beBitten || potionHelp || potionDie || beVote || isVote || agreeAdvocate
            roomPlayer.push({
                user: info.user, ready: false, func: "", roomId: info.roomId, patriarch: false, hypnosis: false, love: false, 
                shot: false, protected: false, die: false, bitten: 0 , beBitten: false, potionHelp: false, potionDie: false, 
                beVote: 0, isVote: false, agreeAdvocate: 0
            })
        }else{
            var index = roomPlayer.indexOf(user)
            roomPlayer[index].ready = false
            roomPlayer[index].func = ""
            roomPlayer[index].patriarch = false
            roomPlayer[index].hypnosis = false
            roomPlayer[index].love = false
            roomPlayer[index].shot = false
            roomPlayer[index].protected = false
            roomPlayer[index].die = false
            roomPlayer[index].bitten = 0
            roomPlayer[index].beBitten = false
            roomPlayer[index].positionHelp = false
            roomPlayer[index].potionDie = false
            roomPlayer[index].beVote = 0
            roomPlayer[index].isVote = false
            roomPlayer[index].agreeAdvocate = 0
        }

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
                    if(playerLove.id == socket.id)
                        socket.emit("S_cupid", {playerList: players})
                    else
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
            //kiểm tra tình yêu
            //callNext(info.roomId, 8, rangeTime, 4)
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

        if(info.code == 1){
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
            roomPlayer[index].hypnosis = true

            var players = roomPlayer.filter((e) => e.hypnosis == true && e.roomId == info.roomId)
            if(players.length % 2 == 0){
                for(var item of players){
                    var user = userList.find((e) => e.user == item.user)
                    if(user !== undefined){
                        if(user.id == socket.id)
                            socket.emit("S_flute", {playerList: players})
                        else
                            socket.to(user.id).emit("S_flute", {playerList: players})
                    }
                }
                callNext(info.roomId, 11, info.voteTime, 1)
            }
        }
    })

    //data: user || roomId
    socket.on("hunter", (data) => {
        var info = JSON.parse(data)

        var player = roomPlayer.find((e) => e.user == info.user)
        var index = roomPlayer.indexOf(player)
        roomPlayer[index].shot = true

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

        var playerOfRoom = roomPlayer.filter((e) => e.roomId == info.roomId)
        var playerAlive = playerOfRoom.filter((e) => e.die == false)

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
                            socket.emit("S_playerVote", {userDie: playerVoteHeader.user, message: "Đã chết rồi", isDie: true})
                        else
                            socket.to(user.id).emit("S_playerVote", {userDie: playerVoteHeader.user, message: "Đã chết rồi", isDie: true})
                    }
                }

                playerAlive = roomPlayer.filter((e) => e.roomId == info.roomId && e.die == false)
            }else{
                roomPlayer[indexVoteHeader].beVote = 0

                for(var item of playerAlive){
                    var user = userList.find((e) => e.user == item.user)
                    if(user !== undefined){
                        if(user.id === socket.id)
                            socket.emit("S_playerVote", {userDie: playerVoteHeader.user, message: "Đã thoát khỏi cái chết", isDie: false})
                        else
                            socket.to(user.id).emit("S_playerVote", {userDie: playerVoteHeader.user, message: "Đã thoát khỏi cái chết", isDie: false})
                    }
                } 
            }

            var switchR = switchResult(playerOfRoom, playerAlive)
            if(switchR == 1){
                return
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
    function randomBai(random, playerOfRoom, func, historyId){
        var bai = funcList.find((e) => e.number == func)

        var player = playerOfRoom[random]
        //index là vị trí trong bảng roomPlayer
        var index = roomPlayer.indexOf(player)
        roomPlayer[index].func = func
        
        var user = userList.find((e) => e.user == player.user)
        check1("user receiver", user)
        if(user != null){
            if(user.id === socket.id)
                socket.emit("S_startRoom", {bai: bai.id, historyId: historyId})
            else
                socket.to(user.id).emit("S_startRoom", {bai: bai.id, historyId: historyId})
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
            var playerDies = playerDieNew.filter((e) => e.roomId == roomId)

            for(var item of playerOfRoom){
                var user = userList.find((e) => e.user == item.user)
                check1("checkuser",user)
                if(user != null)
                    if(user.id == socket.id)
                        socket.emit("S_call", {baiName: infoBai.name, baiId: infoBai.id, playerDie: playerDies, playerAlive: null, playerVote: null})
                    else
                        socket.to(user.id).emit("S_call", {baiName: infoBai.name, baiId: infoBai.id, playerDie: playerDies, playerAlive: null, playerVote: null})
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
                    if(playerDie.func == 5){
                        var playerAliveShot = roomPlayer.find((e) => e.roomId == roomId && e.die == false && e.shot == true)
                        check1("method: call - check playerAliveShot", playerAliveShot)
                        if(playerAliveShot != null){
                            var indexShot = roomPlayer.indexOf(playerAliveShot)
                            roomPlayer[indexShot].die = true

                            playerResult.push({
                                user: playerAliveShot.user,
                                roomId: playerAliveShot.roomId
                            })
                        } 
                    }

                    if(playerDie.love == true){
                        var playerAliveLove = roomPlayer.find((e) => e.roomId == roomId && e.die == false && e.love == true && e.user != playerDie.user)
                        check1("method: call - check playerAliveLove", playerAliveLove)
                        if(playerAliveLove != null){
                            var indexLove = roomPlayer.indexOf(playerAliveLove)
                            roomPlayer[indexLove].die = true

                            playerResult.push({
                                user: playerAliveLove.user,
                                roomId: playerAliveLove.roomId
                            })
                        }
                    }

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

            var switchR = switchResult(playerOfRoom, playerAlive)
            if(switchR == 1){
                return
            }

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

    function switchResult(playerOfRoom, playerAlive){
        var playerAliveHypnosis = playerAlive.filter((e) => e.hypnosis == true)
        if(playerAliveHypnosis.length == playerAlive.length-1){
            sendResult(playerOfRoom, "Người thổi sáo chiến thắng")

            return 1
        }

        if(playerAlive.length == 2){
            if(playerAlive.every((e) => e.love == true)){
                sendResult(playerOfRoom, "Phe tình yêu chiến thắng")
                return 1
            }
        }

        var playerWoft = playerAlive.filter((e) => e.func == 1 || e.func == 9)
        var playerPerson = playerAlive.filter((e) => e.func != 1 && e.func == 9)
        if(playerWoft.length == 0){
            sendResult(playerOfRoom, "Phe dân làng chiến thắng")
            return 1
        }

        if(playerWoft.length >= playerPerson.length){
            sendResult(playerOfRoom, "Pheo sói chiến thắng")
            return 1
        }
        return 0
    }

    function sendResult(players, notification){
        for(var item of players){
            var user = userList.find((e) => e.user == item.user)
            check1("checkuser",user)
            if(user != null)
                if(user.id == socket.id)
                    socket.emit("S_call", {baiName: "Result", baiId: "3", notification: notification, playerDie: null, playerAlive: null, playerVote: null})
                else
                    socket.to(user.id).emit("S_call", {baiName: "Result", baiId: "3", notification: notification, playerDie: null, playerAlive: null, playerVote: null})
        }
    }

    //woftList là tên những người giữ thẻ bài sói
    //tên của nạn nhân
    function randomStoryWort(beBitten, woftList, victim){
        var storyTemp = storyWoft.filter((e) => e.beBitten == beBitten)

        var lengthList = storyTemp.length
        var random = Math.floor(Math.random() * lengthList);
        var strWoft = ""
        for(var item of woftList){
            if(item === woftList[woftList.length])
                strWoft += item 
            else
                strWoft += item + ", "
        }
        var storySelection = storyTemp[random]
        if(beBitten)
            return storySelection.phrase1 + strWoft + storySelection.phrase2 + " " + victim + " " + phrase3
        else
            return storySelection.phrase1 + strWoft + storySelection.phrase2
    }

    //sử dụng hàm khi nạn nhân được bảo vệ
    function randomStoryWortProtected(){
        var lengthList = storyWoftProtected.length

        var random = Math.floor(Math.random() * lengthList);

        return storyWoftProtected[random].phrase1
    }

    //die là tình trạng của người bảo vệ
    //guard là người giữ thẻ bài bảo vệ
    //userProtected là người được bảo vệ
    function randomStoryGuard(die, guard, userProtected){
        var storyTemp = storyGuard.filter((e) => e.die == die)

        var lengthList = storyTemp.length
        var random = Math.floor(Math.random() * lengthList);
        
        var storySelection = storyTemp[random]
        if(!die)
            return storySelection.phrase1 + guard + storySelection.phrase2 + " " + userProtected + " " + phrase3
        else
            return storySelection.phrase1
    }

    //hunter là người giữ thẻ bài thợ săn
    //userShot là người bị thợ săn ngắm
    function randomStoryHunter(hunter, userShot){
        var lengthList = storyHunter.length
        var random = Math.floor(Math.random() * lengthList);
        
        var storySelection = storyTemp[random]

        return storySelection.phrase1 + hunter + storySelection.phrase2 + " " + userShot + " " + phrase3
    }

    //cupid là người giữ thẻ tình yêu
    //userLoveList là 2 người đc ban tình yêu
    function randomStoryCupid(cupid, userLoveList){
        var lengthList = storyCupid.length
        var random = Math.floor(Math.random() * lengthList);
        
        var storySelection = storyTemp[random]

        var userLove = userLoveList[0] + ", " + userLoveList[1] 

        return storySelection.phrase1 + cupid + storySelection.phrase2 + " " + userLove + " " + phrase3
    }

    //die là tình trạng của người thổi sáo
    //flute là người thổi sáo
    //2 người bị thôi niên
    function randomStoryFlute(die, flute, userList){
        var storyTemp = storyFlute.filter((e) => e.die == die)

        var lengthList = storyTemp.length
        var random = Math.floor(Math.random() * lengthList);
        
        var storySelection = storyTemp[random]

        var userHypnosis = ""
        for(var item of userList){
            if(item == userList[userList.length])
                userHypnosis += item
            else
                userHypnosis += item + ", "
        }

        if(!die)
            return storySelection.phrase1 + flute + storySelection.phrase2 + " " + userHypnosis + " " + phrase3
        else
            return storySelection.phrase1 + flute + storySelection.phrase2
    }

    //die là tình trạng của tiên tri
    //prophesy là người giữ thẻ bài tiên tri
    //user là người bị tiên tri soi
    function randomStoryProphesy(die, prophesy, user){
        var storyTemp = storyProphesy.filter((e) => e.die == die)

        var lengthList = storyTemp.length
        var random = Math.floor(Math.random() * lengthList);
        
        var storySelection = storyTemp[random]

        if(!die)
            return storySelection.phrase1 + prophesy + storySelection.phrase2 + " " + user + " " + phrase3
        else
            return storySelection.phrase1 + prophesy + storySelection.phrase2
    }

    //userWoft là thể hiện người bị soi là sói hay không => userWoft: false là kh phải || true là sói
    //user là người bị tiên tri soi
    function randomStoryProphesyResult(userWoft, user){
        var storyTemp = storyProphesyResult.filter((e) => e.userWoft == userWoft)

        var lengthList = storyTemp.length
        var random = Math.floor(Math.random() * lengthList);
        
        var storySelection = storyTemp[random]
        return storySelection.phrase1 + " " + user + " " + storySelection.phrase2
    }

    //dành cho việc người phù thủy đã chết
    //witch là người giữ thẻ bài phù thủy
    function randomStoryWitchIsDie(witch){
        var lengthList = storyWitchIsDie.length
        var random = Math.floor(Math.random() * lengthList);
        
        var storySelection = storyTemp[random]
        return storySelection.phrase1 + " " + witch + " " + storySelection.phrase2
    }

    //Kiểm tra đêm qua có người chết không
    //userDie là những người đã chết đêm qua
    function randomStoryMorning(die, userDie){
        var storyTemp = storyMorning.filter((e) => e.die == die)

        var lengthList = storyTemp.length
        var random = Math.floor(Math.random() * lengthList);
        
        var storySelection = storyTemp[random]

        var user = ""
        for(var item of userList){
            if(item == userList[userList.length])
                user += item
            else
                user += item + ", "
        }
        if(die)
            return storySelection.phrase1 + " " + user + " " + storySelection.phrase2
        else
            return storySelection.phrase1
    }

    //userVote là thể hiện việc có người bị nghi ngờ không => false là không || true là có
    //userList là những người bị nghi ngờ
    function randomStoryVote(userVote, userList){
        var storyTemp = storyVote.filter((e) => e.userVote == userVote)

        var lengthList = storyTemp.length
        var random = Math.floor(Math.random() * lengthList);
        
        var storySelection = storyTemp[random]

        var user = ""
        for(var item of userList){
            if(item == userList[userList.length])
                user += item
            else
                user += item + ", "
        }
        if(userVote)
            return storySelection.phrase1 + " " + user + " " + storySelection.phrase2
        else
            return storySelection.phrase1
    }

    //die là tình trang của người đang biện hộ => false: là tha || true: bị giết
    //userVote là người đang biện hộ
    function randomStoryAdvocate(die, userVote){
        var storyTemp = storyAdvocate.filter((e) => e.die == die)

        var lengthList = storyTemp.length
        var random = Math.floor(Math.random() * lengthList);
        
        var storySelection = storyTemp[random]

        return storySelection.phrase1 + " " + userVote + " " + storySelection.phrase2
    }

    //userLove là người chết theo tình yêu
    //userDie là người vừa chết 
    //cupid là người giữ thẻ bài tình yêu
    function randomStoryDieLove(userLove, userDie, cupid){
        var lengthList = storyDieLove.length
        var random = Math.floor(Math.random() * lengthList);
        
        var storySelection = storyTemp[random]

        return storySelection.phrase1 + " " + userLove + " " + storySelection.phrase2 + " " + userDie + " " + storySelection.phrase3 + " " + cupid + " " + storySelection.phrase4
    }

    //hunter là thợ săn vừa bị chết
    //userShot là người bị sợ săn ngắm bắn
    function randomStoryDieShot(hunter, userShot){
        var lengthList = storyDieShot.length
        var random = Math.floor(Math.random() * lengthList);
        
        var storySelection = storyTemp[random]

        return storySelection.phrase1 + " " + hunter + " " + storySelection.phrase2 + " " + userShot + " " + storySelection.phrase3
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