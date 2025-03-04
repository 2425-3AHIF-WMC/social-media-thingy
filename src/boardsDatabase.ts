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
