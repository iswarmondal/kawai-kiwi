import { Server, Socket } from "https://deno.land/x/socket_io@0.2.1/mod.ts";

const io = new Server({
  cors: {
    origin: ["*"],
    credentials: false,
  },
});

const users: Record<string, string | null> = {};

io.on("connection", (socket: Socket) => {
  console.log(`socket ${socket.id} connected`);
  const callerID = socket.id;

  // Add user to the pool when they connect
  users[callerID] = null;

  socket.on("peer:find", () => {
    console.log("peer:find", callerID);

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
      io.to(callerID).emit("peer:found", randomUser);
      io.to(randomUser).emit("peer:found", callerID);
      
      console.log(`paired ${callerID} with ${randomUser}`);
    } else {
      // No available users
      socket.emit("peer:alone");
    }
  });

  socket.on("disconnect", () => {
    console.log(`socket ${socket.id} disconnected`);

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
