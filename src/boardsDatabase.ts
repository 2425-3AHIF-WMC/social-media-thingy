import sqlite3 from 'sqlite3';
import {open} from 'sqlite';
import bcrypt from 'bcrypt';
import fs from 'fs';
import {Database} from "sqlite";
import CustomSession from "./model/session";
import {db, init} from "./database";

//createBoard(userId, name, description, profileImage, headerImage, visibility);
export async function createBoard(ownerID: number, name: string, description: string, profileImage: string = 'uploads/default_profile.png', headerImage: string = 'uploads/default_header.png', visibility: string = 'public', hashtag: string = '') {
    await init();

    const result = await db.run(
        'INSERT INTO boards (name, description, ownerId, profile_image, header_image, visibility, hashtag) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, description, ownerID, profileImage, headerImage, visibility, hashtag]
    );

    return { id: result.lastID, name, description, profileImage, headerImage, visibility, hashtag };
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