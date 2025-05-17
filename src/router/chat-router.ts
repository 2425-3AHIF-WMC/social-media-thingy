import { Router } from 'express';
import { authHandler } from '../middleware/auth-handler';
import { getChatMessagesByBoard, addChatMessage } from '../chatDatabase';
import { getUserID } from '../usersDatabase';

const chatRouter = Router();

chatRouter.get(
    '/chat/:boardId/messages',
    authHandler,
    async (req, res) => {
        const boardId = Number(req.params.boardId);
        try {
            const msgs = await getChatMessagesByBoard(boardId);
            return res.json(msgs);
        } catch (err) {
            console.error('Error fetching chat messages:', err);
            return res.status(500).json({ error: 'Failed to fetch messages' });
        }
    }
);

chatRouter.post(
    '/chat/:boardId/messages',
    authHandler,
    async (req, res) => {
        const boardId = Number(req.params.boardId);
        const userId  = await getUserID(req.session.user);
        const { content } = req.body;
        const msg = await addChatMessage(boardId, userId, content);
        return res.status(201).json(msg);
    }
);

export default chatRouter;
