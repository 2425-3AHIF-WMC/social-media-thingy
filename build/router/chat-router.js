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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_handler_1 = require("../middleware/auth-handler");
const chatDatabase_1 = require("../chatDatabase");
const usersDatabase_1 = require("../usersDatabase");
const chatRouter = (0, express_1.Router)();
chatRouter.get('/chat/:boardId/messages', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const boardId = Number(req.params.boardId);
    try {
        const msgs = yield (0, chatDatabase_1.getChatMessagesByBoard)(boardId);
        return res.json(msgs);
    }
    catch (err) {
        console.error('Error fetching chat messages:', err);
        return res.status(500).json({ error: 'Failed to fetch messages' });
    }
}));
chatRouter.post('/chat/:boardId/messages', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const boardId = Number(req.params.boardId);
    const userId = yield (0, usersDatabase_1.getUserID)(req.session.user);
    const { content } = req.body;
    const msg = yield (0, chatDatabase_1.addChatMessage)(boardId, userId, content);
    return res.status(201).json(msg);
}));
exports.default = chatRouter;
