const express = require("express");
const cors = require("cors");

const con = require("./dbScripts/connect");

const AuthRouter = require("./routes/Auth");
const userRouter = require("./routes/user");
const friendsRouter = require("./routes/friends");
const invitesRouter = require("./routes/invites");
const commentRouter = require("./routes/comment");
const exercisesRouter = require("./routes/exercises");
const workoutsRouter = require("./routes/workouts");
const messagesRouter = require("./routes/messages");
const uploadVideosRouter = require("./routes/Upload");
const DemoRouter = require("./routes/Demo");
const getBotId=require("./utils/GetBotId");
const CreateBot=require("./utils/CreateBot")
require("dotenv").config();
const app = express();
const server = require("http").Server(app);
const initilize = require("./socketScripts/MainSocket").intilize;
initilize(server);
getBotId().catch(err=>{
    if(err=="No Bot")
    CreateBot();
}
)
const port = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());

app.use("/Auth", AuthRouter);
app.use("/exercises", exercisesRouter);
app.use("/workouts", workoutsRouter);
app.use("/user", userRouter);
app.use("/friends", friendsRouter);
app.use("/invites", invitesRouter);
app.use("/comment", commentRouter);
app.use("/messages", messagesRouter);
app.use("/SetVideo", uploadVideosRouter);
app.use("/Demo", DemoRouter);
server.listen(port);
