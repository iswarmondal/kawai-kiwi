import { Server, Socket } from "https://deno.land/x/socket_io@0.2.1/mod.ts";

export const io = new Server({
  cors: {
    origin: ["http://localhost:5173"],
    credentials: false,
  },
});

const users: Record<string, string | null> = {};

io.on("connection", (socket: Socket) => {
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

  socket.on("peer:offer", (offer: any) => {
    console.log("peer:offer", socket.id);
    const sendTo = users[socket.id];
    if (sendTo) {
      io.to(sendTo).emit("peer:call", offer);
    }
  });

  socket.on("peer:answer", (answer: any) => {
    console.log("peer:answer", socket.id);
    const sendTo = users[socket.id];

    if (sendTo) {
      io.to(sendTo).emit("peer:answer", answer);
    }
  });

  socket.on("peer:sent:icecandidate", (candidate: any) => {
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
  socket.on("connect_error", (error: Error) => {
    console.error("Connection error:", error);
    socket.emit("error", "Failed to connect");
  });
});

await Deno.serve({
  port: 8080,
  hostname: "0.0.0.0",
  handler: io.handler(),
}).finished;
