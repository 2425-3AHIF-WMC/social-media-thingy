import { createServer } from 'http';
import { Server as IOServer, Socket } from 'socket.io';
import dotenv from 'dotenv';

import app from './app';
import { addChatMessage } from './chatDatabase';
import { getBoardMembers, getBoardById } from './boardsDatabase';

dotenv.config();
const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);
const io = new IOServer(httpServer);

interface UserInfo {
    id: string;
    username: string;
    avatar: string;
    role?: string;
}

const onlineUsers = new Map<string, Set<UserInfo>>();

io.on('connection', (socket: Socket & { user?: UserInfo }) => {
    console.log('🟢 Socket connected:', socket.id);

    socket.on('joinBoard', (boardId: number) => {
        const room = `board_${boardId}`;
        socket.join(room);

        socket.on('registerUser', async (user: UserInfo) => {
            const board = await getBoardById(boardId);
            const isOwner = board.ownerId === Number(user.id);

            const members = await getBoardMembers(boardId);
            const memberRow = members.find(m => m.userId === Number(user.id));

            const role = isOwner
                ? 'owner'
                : memberRow?.role || 'member';

            socket.user = { ...user, role };

            let set = onlineUsers.get(room);
            if (!set) {
                set = new Set();
                onlineUsers.set(room, set);
            }
            set.add(socket.user);

            io.to(room).emit('onlineUsers', Array.from(set));
        });
    });

    socket.on('newMessage', async ({ boardId, content, user }) => {
        const msg = await addChatMessage(boardId, user.id, content);
        io.to(`board_${boardId}`).emit('message', {
            ...msg,
            username: user.username,
            avatar: user.avatar
        });
    });

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
