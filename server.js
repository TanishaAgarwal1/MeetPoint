
const express= require("express");
const path=require("path");

const fileUpload=require("express-fileupload");
const fs=require('fs');
var app=express();
var server=app.listen(3000,function( ){
    console.log("listensing from port 3000");
});

const io=require("socket.io")(server,{
    allowEIO3: true // false by default
  });
app.use(express.static(path.join(__dirname,"")));

// Serve action.html as the default page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'action.html'));
});

app.use(fileUpload());
var userConnections=[];
io.on("connection",(socket)=>{
    console.log("socket id is",socket.id);
    

    socket.on("userconnect",(data)=>{
        console.log("userconnect",data.displayName,data.meetingid);

        var other_users=userConnections.filter((p)=>p.meeting_id == data.meetingid);
        userConnections.push({
            connectionId:socket.id,
            user_id:data.displayName,
            meeting_id:data.meetingid,
        });

var userCount =userConnections.length;
console.log(userCount)

        other_users.forEach((v)=>{
            socket.to(v.connectionId).emit("inform_other_about_me",{
                other_user_id:data.displayName,
                connID: socket.id,
                userNumber:userCount,

                
            });
        });

        socket.emit("inform_me_about_other_user",other_users);
    });
    socket.on("SDPProcess",(data)=>{
        socket.to(data.to_connid).emit("SDPProcess",{
            message:data.message,
            from_connid:socket.id,
        });
    });

    socket.on("sendMessage",(msg)=>{
        console.log(msg);
        var mUser=userConnections.find((p)=>p.connectionId==socket.id);
        if(mUser){
            var meetingid=mUser.meeting_id;
            var from=mUser.user_id;
            var list=userConnections.filter((p)=>p.meeting_id==meetingid);
            list.forEach((v)=>{
                socket.to(v.connectionId).emit("showChatMessage",{
                    from:from,
                    message:msg
                });
            });

        }
    });

    socket.on("fileTransferToOther",(msg)=>{
        console.log(msg);
        var mUser=userConnections.find((p)=>p.connectionId==socket.id);
        if(mUser){
            var meetingid=mUser.meeting_id;
            var from=mUser.user_id;
            var list=userConnections.filter((p)=>p.meeting_id==meetingid);
            list.forEach((v)=>{
                socket.to(v.connectionId).emit("showFileMessage",{
                    username:msg.username,
                   meetingid :msg.meetingid,
                   filePath  :msg.filePath,
                   fileName :msg.fileName,
                   
                });
            });

        }
    });


  



    socket.on("disconnect", function () {
        console.log("Disconnected");
        var disconnectedUserIndex = userConnections.findIndex(
          (p) => p.connectionId == socket.id
        );
        if (disconnectedUserIndex !== -1) {
          var meetingid = userConnections[disconnectedUserIndex].meeting_id;
          userConnections.splice(disconnectedUserIndex, 1); // Remove the disconnected user from the array
          var list = userConnections.filter((p) => p.meeting_id == meetingid);
          list.forEach((v) => {
            var userNumberAfterUserLeave = userConnections.length; // The length will be updated correctly now
            socket.to(v.connectionId).emit("inform_other_about_disconnected_user", {
              connId: socket.id,
              uNumber: userNumberAfterUserLeave, // This value will be updated correctly now
            });
          });
        }
      });
      
   
});


app.post("/attachImg",function(req,res){
    var data=req.body;
    var imageFile=req.files.zipfile;
    console.log(imageFile);
    var dir="public/assests/attachment/"+data.meeting_id+"/";
    if(!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    imageFile.mv("public/assests/attachment/"+data.meeting_id+"/"+imageFile.name, function(error){
        if(error){
            console.log("couldn't upload the img file,error: ",error);

        }
        else{
            console.log("image file successfully uploaded");
        }
    })


})
