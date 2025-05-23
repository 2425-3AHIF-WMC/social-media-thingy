import sqlite3 from 'sqlite3';
import {open} from 'sqlite';
import bcrypt from 'bcrypt';
import fs from 'fs';
import {Database} from "sqlite";
import CustomSession from "./model/session";
import {db, init} from "./database";
import { getBoardOwnerId } from './boardsDatabase';
import {Post} from "./model/IPost";

// in postDatabase.ts, drop createdAt entirely from the INSERT:

// src/database/postDatabase.ts

export async function createPostWithProject(
    title: string,
    content: string,
    userId: number,
    boardId: number,
    type: string,
    hashtag: string,
    image: string | null,
    projectId?: number | null
): Promise<{ id: number | undefined }> {
    await init();
    const result = await db.run(
        // ← exactly 8 columns here:
        `INSERT INTO Posts
       (title,
        content,
        userId,
        boardId,
        type,
        hashtag,
        image,
        project_id)
     VALUES
       (?, ?, ?, ?, ?, ?, ?, ?)`,   // ← exactly 8 placeholders
        [
            title,
            content,
            userId,
            boardId,
            type,
            hashtag,
            image,
            projectId || null
        ]
    );
    return { id: result.lastID };
}



// src/database/postDatabase.ts

export async function createPostWithoutProject(
    title: string,
    content: string,
    userId: number,
    boardId: number,
    type: string,
    hashtag: string,
    image: string | null
): Promise<{ id: number | undefined }> {
    await init();
    const result = await db.run(
        // exactly 7 columns:
        `INSERT INTO Posts
       (title,
        content,
        userId,
        boardId,
        type,
        hashtag,
        image)
     VALUES
       (?, ?, ?, ?, ?, ?, ?)`,  // exactly 7 placeholders
        [
            title,
            content,
            userId,
            boardId,
            type,
            hashtag,
            image || null
        ]
    );
    return { id: result.lastID };
}


export async function getPosts(boardId: number) {
    await init();
    return await db.all('SELECT * FROM Posts WHERE boardId = ?', [boardId]);
}

export async function getPostById(postId: number) {
    await init();
    return await db.get('SELECT * FROM Posts WHERE id = ?', [postId]);
}

export async function getPostOwnerName(postId: number): Promise<string> {
    await init();
    const user = await db.get('SELECT username FROM users WHERE id = (SELECT userId FROM Posts WHERE id = ?)', postId);
    if (!user) {
        throw new Error('User not found');
    }
    return user.username;
}

export async function getPostsForBoard (boardId: number) {
    await init();
    return await db.all('SELECT * FROM Posts WHERE boardId = ?', [boardId]);
}

export async function getPostsByBoard(boardId: number) {
    await init();
    return await db.all<Post[]>(`
    SELECT *
    FROM (
      SELECT
        p.id,
        p.title,
        p.content,
        p.type,
        p.image,
        p.createdAt,
        u.username         AS username,
        u.profile_image    AS avatar,
        GROUP_CONCAT(h.name) AS hashtags
      FROM Posts p
      LEFT JOIN users u           ON u.id = p.userId
      LEFT JOIN post_hashtags ph  ON ph.post_id   = p.id
      LEFT JOIN hashtags    h     ON h.id         = ph.hashtag_id
      WHERE p.boardId = ?
      GROUP BY p.id
    )
    ORDER BY datetime(createdAt) DESC,  -- newest timestamp first
             id DESC                   -- tiebreak on auto-inc ID
  `, [boardId]);
}

export async function getPostOwnerId(postId: number): Promise<number> {
    await init();
    const user = await db.get('SELECT userId FROM Posts WHERE id = ?', postId);
    if (!user) {
        throw new Error('User not found');
    }
    return user.userId;
}

export async function deletePost(postId: number) {
    await init();
    await db.run('DELETE FROM Posts WHERE id = ?', postId);
}

export async function editPost(postId: number, content: string, image?: string) {
    await init();
    await db.run('UPDATE Posts SET content = ?, image = ? WHERE id = ?', [content, image || null, postId]);
}

export async function likePost(postId: number, userId: number) {
    await init();
    await db.run('INSERT INTO Likes (postId, userId) VALUES (?, ?)', [postId, userId]);
}

export async function unlikePost(postId: number, userId: number) {
    await init();
    await db.run('DELETE FROM Likes WHERE postId = ? AND userId = ?', [postId, userId]);
}

export async function getLikesCount(postId: number) {
    await init();
    return await db.get('SELECT COUNT(*) as count FROM Likes WHERE postId = ?', postId);
}

export async function hasLikedPost(postId: number, userId: number): Promise<boolean> {
    await init();
    const result = await db.get('SELECT COUNT(*) as count FROM Likes WHERE postId = ? AND userId = ?', [postId, userId]);
    return result.count > 0;
}

export async function ensureHashtag(tag: string): Promise<number> {
    await db.run(
        `INSERT OR IGNORE INTO hashtags (name) VALUES (?)`,
        [tag]
    );

    const row = await db.get<{ id: number }>(
        `SELECT id FROM hashtags WHERE name = ?`,
        [tag]
    );
    if (!row) throw new Error(`Konnte Hashtag ${tag} nicht finden oder anlegen`);
    return row.id;
}

export async function addHashtagsToPost(postId: number | undefined, tags: string[]): Promise<void> {
    for (const tag of tags) {
        const hashtagId = await ensureHashtag(tag.trim());
        await db.run(
            `INSERT OR IGNORE INTO post_hashtags (post_id, hashtag_id) VALUES (?, ?)`,
            [postId, hashtagId]
        );
    }
}
