import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

interface AuthedSocket extends Socket {
  userId?: string;
}

export function initSockets(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  io.use((socket: AuthedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Not authenticated"));
      const decoded = jwt.verify(token, env.jwtSecret) as { id: string };
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: AuthedSocket) => {
    if (socket.userId) socket.join(`user:${socket.userId}`);

    socket.on("join_conversation", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("send_message", (payload: { conversationId: string; message: any }) => {
      io.to(`conversation:${payload.conversationId}`).emit("new_message", payload.message);
    });

    socket.on("booking_status_update", (payload: { userId: string; booking: any }) => {
      io.to(`user:${payload.userId}`).emit("booking_updated", payload.booking);
    });

    socket.on("disconnect", () => {});
  });

  return io;
}
