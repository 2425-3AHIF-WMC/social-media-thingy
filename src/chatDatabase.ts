import {db, init} from "./database";


export async function getChatMessagesByBoard(boardId: number) {
    await init();
    return db.all(`
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
}


export async function addChatMessage(
    boardId: number,
    userId: number,
    content: string
) {
    await init();
    const result = await db.run(
        `INSERT INTO chat_messages (board_id, user_id, content) VALUES (?, ?, ?)`,
        [boardId, userId, content]
    );
    return {
        id: result.lastID,
        boardId,
        userId,
        content,
        createdAt: new Date().toISOString()
    };
}
