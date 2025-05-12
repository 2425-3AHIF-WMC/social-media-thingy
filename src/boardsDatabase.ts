import sqlite3 from 'sqlite3';
import {open} from 'sqlite';
import bcrypt from 'bcrypt';
import fs from 'fs';
import {Database} from "sqlite";
import CustomSession from "./model/session";
import {db, init} from "./database";
import {Post} from "./model/IPost";

//createBoard(userId, name, description, profileImage, headerImage, visibility);

/*
export async function createBoard(ownerID: number, name: string, description: string, profileImage: string = 'uploads/default_profile.png', headerImage: string = 'uploads/default_header.png', visibility: string = 'public', hashtag: string = '') {
    await init();

    const result = await db.run(
        'INSERT INTO boards (name, description, ownerId, profile_image, header_image, visibility, hashtag) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, description, ownerID, profileImage, headerImage, visibility, hashtag]
    );

    return { id: result.lastID, name, description, profileImage, headerImage, visibility, hashtag };
}*/

export async function createBoard(
    ownerId: number,
    name: string,
    description: string,
    visibility: string,
    hashtag: string = '',
    boardTypeId: number,
    profileImage: string = 'uploads/default_profile.jpg',
    headerImage: string = 'uploads/default_header.jpg'
) {
    await init();

    const result = await db.run(
        `INSERT INTO boards (name, description, ownerId, profile_image, header_image, visibility, hashtag,
                             board_type_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description, ownerId, profileImage, headerImage, visibility, hashtag, boardTypeId]
    );

    return {
        id: result.lastID,
        name,
        description,
        ownerId,
        profileImage,
        headerImage,
        visibility,
        hashtag,
        boardTypeId
    };
}

export async function getBoards() {
    await init();
    return await db.all('SELECT * FROM boards');
}

export async function getUserBoard(userId:number) {
    if (userId){
        await init();
        return await db.all('SELECT * FROM boards WHERE ownerId = ?', [userId]);
    }
    else {
        return await db.all('SELECT * FROM boards');
    }
}

export async function getBoardById(boardId: number) {
    await init();
    return await db.get('SELECT * FROM boards WHERE id = ?', [boardId]);
}

export async function getBoardOwnerName(boardId: number): Promise<string> {
    await init();
    const user = await db.get('SELECT username FROM users WHERE id = (SELECT ownerId FROM boards WHERE id = ?)', boardId);
    if (!user) {
        throw new Error('User not found');
    }
    return user.username;
}

export async function getBoardOwnerId(boardId: number): Promise<number> {
    await init();
    const user = await db.get('SELECT ownerId FROM boards WHERE id = ?', boardId);
    if (!user) {
        throw new Error('User not found');
    }
    return user.ownerId;
}

export async function joinBoard(boardId: number, userId: number) {
    await init();
    await db.run('INSERT INTO BoardMembers (boardId, userId) VALUES (?, ?)', [boardId, userId]);
}

export async function getBoardMembers(boardId: number) {
    await init();
    return await db.all('SELECT * FROM BoardMembers WHERE boardId = ?', [boardId]);
}

export async function updateOwnerRole(boardId: number, userId: number, role: string) {
    await init();
    await db.run('UPDATE BoardMembers SET role = ? WHERE boardId = ? AND userId = ?', [role, boardId, userId]);
}

export async function doesUserExist(userId: number): Promise<boolean> {
    await init();
    const result = await db.get('SELECT COUNT(*) as count FROM Users WHERE id = ?', [userId]);
    return result.count > 0;
}

export async function isUserMemberOfBoard(userId: number, boardId: number): Promise<boolean> {
    await init();
    const result = await db.get('SELECT COUNT(*) as count FROM BoardMembers WHERE userId = ? AND boardId = ?', [userId, boardId]);
    return result.count > 0;
}

export async function addHashtagToBoard(boardId: number | undefined, hashtags: string[]){
    const uniqueHashtags = [...new Set(hashtags.map(tag => tag.trim().toLowerCase()))];

    for (const tag of uniqueHashtags) {
        let hashtagId;

        const existingHashtag = await db.get('SELECT id FROM hashtags WHERE name = ?', [tag]);
        if (existingHashtag) {
            hashtagId = existingHashtag.id;
        } else {

            const result = await db.run('INSERT INTO hashtags (name) VALUES (?)', [tag]);
            hashtagId = result.lastID;
        }

        await db.run(
            'INSERT OR IGNORE INTO board_hashtags (board_id, hashtag_id) VALUES (?, ?)',
            [boardId, hashtagId]
        );

    }
}

export async function createProject(
    name: string,
    description: string,
    boardId: number
) {
    await init();

    const result = await db.run(
        `INSERT INTO project (name, description, board_id) VALUES (?, ?, ?)`,
        [name, description, boardId]
    );

    return {
        id: result.lastID,
        name,
        description,
        boardId
    };
}

export async function getProjectsForBoard(boardId: number) {
    await init();
    return await db.all('SELECT * FROM project WHERE board_id = ?', [boardId]);
}

export async function getPostsByBoard(boardId: number): Promise<Post[]> {
    await init();
    return db.all<Post[]>(
        `SELECT
       p.id,
       p.title,
       p.content,
       p.type,
       p.image,
       p.createdAt,
       p.userId,
       p.boardId,
       p.project_id    AS projectId,
       GROUP_CONCAT(h.name) AS hashtags
     FROM Posts p
     LEFT JOIN post_hashtags ph ON ph.post_id = p.id
     LEFT JOIN hashtags h        ON h.id         = ph.hashtag_id
     WHERE p.boardId = ?
     GROUP BY p.id
     ORDER BY p.createdAt DESC;
    `,
        [boardId]
    );
}