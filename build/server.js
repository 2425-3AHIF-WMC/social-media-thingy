"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const chatDatabase_1 = require("./chatDatabase");
const boardsDatabase_1 = require("./boardsDatabase");
dotenv_1.default.config();
const PORT = process.env.PORT || 3001;
const httpServer = (0, http_1.createServer)(app_1.default);
const io = new socket_io_1.Server(httpServer);
const onlineUsers = new Map();
io.on('connection', (socket) => {
    console.log('🟢 Socket connected:', socket.id);
    socket.on('joinBoard', (boardId) => {
        const room = `board_${boardId}`;
        socket.join(room);
        socket.on('registerUser', (user) => __awaiter(void 0, void 0, void 0, function* () {
            const board = yield (0, boardsDatabase_1.getBoardById)(boardId);
            const isOwner = board.ownerId === Number(user.id);
            const members = yield (0, boardsDatabase_1.getBoardMembers)(boardId);
            const memberRow = members.find(m => m.userId === Number(user.id));
            const role = isOwner
                ? 'owner'
                : (memberRow === null || memberRow === void 0 ? void 0 : memberRow.role) || 'member';
            socket.user = Object.assign(Object.assign({}, user), { role });
            let set = onlineUsers.get(room);
            if (!set) {
                set = new Set();
                onlineUsers.set(room, set);
            }
            set.add(socket.user);
            io.to(room).emit('onlineUsers', Array.from(set));
        }));
    });
    socket.on('newMessage', (_a) => __awaiter(void 0, [_a], void 0, function* ({ boardId, content, user }) {
        const msg = yield (0, chatDatabase_1.addChatMessage)(boardId, user.id, content);
        io.to(`board_${boardId}`).emit('message', Object.assign(Object.assign({}, msg), { username: user.username, avatar: user.avatar }));
    }));
    socket.on('disconnect', () => {
        console.log('🔴 Socket disconnected:', socket.id);
        onlineUsers.forEach((set, room) => {
            if (socket.user && set.has(socket.user)) {
                set.delete(socket.user);
                io.to(room).emit('onlineUsers', Array.from(set));
            }
        });
    });
});
httpServer.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
