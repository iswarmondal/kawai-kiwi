const { createServer } = require("http");
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");
const admin = require("firebase-admin");

const dotenv = require("dotenv");
dotenv.config();

const firebaseAdminCred = JSON.parse(process.env.SERVICE_ACCOUNT_CREDENTIAL);

admin.initializeApp({
  credential: admin.credential.cert(firebaseAdminCred),
});

const httpServer = createServer((req, res) => {
  // Add health check endpoint
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }

  // Add default page handler
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <html>
        <head>
          <title>WebRTC Server</title>
        </head>
        <body>
          <h1>WebRTC Server</h1>
          <p>Server is running successfully.</p>
          <p>Status: <a href="/health">Check health</a></p>
        </body>
      </html>
    `);
    return;
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: ["https://kawaiikiwi.online", "http://kawaiikiwi.online"],
    credentials: true,
    methods: ["GET", "POST"],
  },
});

const users = {};

// Add middleware to verify Firebase token before allowing connection
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.log("Token not found");
    return next(new Error("Authentication token missing"));
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    socket.user = decodedToken;
    console.log("User authenticated");
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  const callerID = socket.id;

  socket.on("peer:find", () => {
    // Add user to the pool when they connect
    users[callerID] = null;

    // Get all users in the pool
    const availableUsers = Object.keys(users).filter(
      (userID) => userID !== socket.id && users[userID] === null
    );

    const randomUser =
      availableUsers[Math.floor(Math.random() * availableUsers.length)];

    if (randomUser) {
      // Store the pairing
      users[callerID] = randomUser;
      users[randomUser] = callerID;

      // Let each user know who they are paired with
      io.to(randomUser).emit("peer:accepted");
      io.to(callerID).emit("peer:found");
      console.log(`paired ${callerID} with ${randomUser}`);
    } else {
      console.log(`no available users for ${callerID}`);
      // No available users
      io.to(callerID).emit("peer:alone");
    }
  });

  socket.on("peer:offer", (offer) => {
    console.log("peer:offer", socket.id);
    const sendTo = users[socket.id];
    if (sendTo) {
      io.to(sendTo).emit("peer:call", offer);
    }
  });

  socket.on("peer:answer", (answer) => {
    console.log("peer:answer", socket.id);
    const sendTo = users[socket.id];

    if (sendTo) {
      io.to(sendTo).emit("peer:answer", answer);
    }
  });

  socket.on("peer:sent:icecandidate", (candidate) => {
    console.log("peer:sent:icecandidate", socket.id);
    const sendTo = users[socket.id];
    if (sendTo) {
      io.to(sendTo).emit("peer:sent:icecandidate", candidate);
    }
  });

  socket.on("disconnect", () => {
    // If the disconnected user was paired, notify their partner
    const partnerId = users[callerID];
    if (partnerId && users[partnerId] === callerID) {
      io.to(partnerId).emit("peer:disconnected");
      users[partnerId] = null;
    }

    // Remove the disconnected user
    delete users[callerID];
  });

  // Handle connection errors
  socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
    socket.emit("error", "Failed to connect");
  });
});

// Initialize Socket.IO Admin UI
// username: "admin"
// password: "v0jzqf^!$DSTdpnWrz1P&a"
instrument(io, {
  auth: {
    type: "basic",
    username: "admin",
    password: "$2a$12$l9POcke0GwiWtcIuHWFPRO/hGiNuFRwCAcAg.H7wbRaiVK9jqL6By", // "v0jzqf^!$DSTdpnWrz1P&a" encrypted with bcrypt
  },
  mode: "development",
});

httpServer.listen(8080, "0.0.0.0", () => {
  console.log("Server is running on 0.0.0.0:8080");
});
