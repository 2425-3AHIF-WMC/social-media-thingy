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
exports.getChatMessagesByBoard = getChatMessagesByBoard;
exports.addChatMessage = addChatMessage;
const database_1 = require("./database");
function getChatMessagesByBoard(boardId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        return database_1.db.all(`
    SELECT
      cm.id,
      cm.content,
      cm.created_at    AS createdAt,
      cm.user_id       AS userId,
      u.username       AS username,
      u.profile_image  AS avatar   
    FROM chat_messages cm
    JOIN users u        ON u.id = cm.user_id
    WHERE cm.board_id = ?
    ORDER BY cm.created_at ASC
  `, [boardId]);
    });
}
function addChatMessage(boardId, userId, content) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const result = yield database_1.db.run(`INSERT INTO chat_messages (board_id, user_id, content) VALUES (?, ?, ?)`, [boardId, userId, content]);
        return {
            id: result.lastID,
            boardId,
            userId,
            content,
            createdAt: new Date().toISOString()
        };
    });
}
