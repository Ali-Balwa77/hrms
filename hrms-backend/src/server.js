import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import holidayRoutes from './routes/holidayRoutes.js';
import ruleRoutes from './routes/ruleRoutes.js';
import passwordRoutes from './routes/passwordRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import userAccessRoutes from './routes/userAccessRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import leaveCancellationRoutes from './routes/leaveCancellationRoutes.js';
import leaveTypeRoutes from './routes/leaveTypeRoutes.js';
import reportingManagerRoutes from './routes/reportingManagerRoutes.js';
import quarterlyLeavePolicyRoutes from './routes/quarterlyLeavePolicyRoutes.js';
import designationRoutes from './routes/designationRoutes.js';
import mispunchRoutes from './routes/mispunchRoutes.js';
import { sendResponse } from './utils/apiResponse.js';
import { logger } from './utils/logger.js';
import { removeExpiredQuarterlyBalances } from "./utils/removeExpiredQuarterlyBalances.js";
import { refillAnnualLeaveBalances } from "./utils/refillAnnualLeaveBalances.js";
import { removeExpiredProbationBalances } from "./utils/removeExpiredProbationBalances.js";
import { startAnnualLeaveRefillJob } from "./jobs/annualLeaveRefillJob.js";
import { startQuarterlyLeaveCleanupJob } from "./jobs/quarterlyLeaveCleanupJob.js";
import { startProbationLeaveCleanupJob } from "./jobs/probationLeaveCleanupJob.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  'http://localhost:8000',
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((url) => url.trim()).filter(Boolean)
    : []),
];

const corsOptions = {
  origin: function (origin, callback) {
    // Postman, mobile app, server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

export const activeUsers = {};

export const getReceiverSocketId = (userId) => {
  if (!userId) return null;
  return activeUsers[userId.toString()] || null;
};

export const sendSocketNotification = (userId, notification) => {
  const socketId = getReceiverSocketId(userId);

  if (socketId) {
    io.to(socketId).emit("new_notification", notification);
  }
};

export const sendSocketEvent = (userId, eventName, payload) => {
  const socketId = getReceiverSocketId(userId);

  if (socketId) {
    io.to(socketId).emit(eventName, payload);
  }
};

io.on("connection", (socket) => {
  socket.on("register_user", (payload) => {
    const userId = typeof payload === "object" ? payload?.userId : payload;
    const employeeId = typeof payload === "object" ? payload?.employeeId : null;

    if (!userId && !employeeId) return;

    const registerIds = [userId, employeeId]
      .filter(Boolean)
      .map((id) => id.toString());

    registerIds.forEach((id) => {
      if (activeUsers[id] && activeUsers[id] !== socket.id) {
        io.to(activeUsers[id]).emit("force_logout");
      }

      activeUsers[id] = socket.id;
    });
  });

  socket.on("disconnect", () => {
    Object.entries(activeUsers).forEach(([userId, socketId]) => {
      if (socketId === socket.id) {
        delete activeUsers[userId];
      }
    });
  });
});

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/', (req, res) => sendResponse(res, 200, 'HRMS API running', { status: 'ok' }, {}));

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/role', roleRoutes);
app.use('/api/users', userAccessRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leave-cancel', leaveCancellationRoutes);
app.use('/api/leave-type', leaveTypeRoutes);
app.use('/api/reporting-manager', reportingManagerRoutes);
app.use('/api/quarterly-leave-policy', quarterlyLeavePolicyRoutes);
app.use('/api/designations', designationRoutes);
app.use('/api/mispunch', mispunchRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT;

connectDB().then(async () => {
  await removeExpiredQuarterlyBalances();
  await removeExpiredProbationBalances();
  await refillAnnualLeaveBalances();

  startAnnualLeaveRefillJob();
  startQuarterlyLeaveCleanupJob();
  startProbationLeaveCleanupJob();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
