const { Socket } = require("socket.io");
const UserModel = require("../../models/user.model");
const jwt = require("jsonwebtoken");
let CONNECTIONS = [];
const ACCESS_SECRET = process.env.JWT_SECRET;

const handleWSConnection = socket => {
  console.log("A new web socket connection has been established");

  socket.on("disconnect", () => {
    console.log("A connection has been closed!");
    CONNECTIONS = CONNECTIONS.filter(s => s !== socket);
  });

  setTimeout(() => {
    if (!socket.user) {
      socket.disconnect();
    }
  }, 4000);

  socket.on("authenticate", async token => {
    if (!token) {
      return socket.disconnect();
    }
    let id;
    token = token.trim();
    try {
      const { id: userID } = jwt.verify(token, ACCESS_SECRET);
      id = userID?.trim();
      console.log(id);
    } catch (e) {
      console.log(e);
      return socket.disconnect();
    }
    if (!id) {
      return socket.disconnect();
    }
    let user = await UserModel.findById(id).populate("department");

    if (!user) {
      return socket.disconnect();
    }
    socket.user = user.toObject();
    socket.user.id = socket.user._id.toString();
    CONNECTIONS.push(socket);
  });
};

const sendNotification = notification => {
  console.log("Sending notification...");
  CONNECTIONS.forEach(socket => {
    if (socket.user.id.toString() === notification.user.toString()) {
      console.log("Sending to socket user : ", socket.user);
      socket.emit("notification", notification);
    }
  });
};

module.exports = {
  handleWSConnection,
  sendNotification,
};
