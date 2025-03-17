import sqlite3 from 'sqlite3';
import {open} from 'sqlite';
import bcrypt from 'bcrypt';
import fs from 'fs';
import {Database} from "sqlite";
import CustomSession from "./model/session";
import {db, init} from "./database";

export async function createPost(
    title: string,
    content: string,
    userId: number,
    boardId: number,
    type: string,
    createdAt: Date,
    hashtag: string,
    image?: string
) {
    await init();

    const result = await db.run(
        'INSERT INTO Posts (title, content, userId, boardId, type, createdAt, hashtag, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [title, content, userId, boardId, type, createdAt, hashtag, image || null]
    );

    return {
        id: result.lastID,
        title,
        content,
        userId,
        boardId,
        type,
        createdAt,
        hashtag,
        image: image || null
    };
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


