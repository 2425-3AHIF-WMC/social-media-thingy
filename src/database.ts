import sqlite3 from 'sqlite3';
import {open} from 'sqlite';
import bcrypt from 'bcrypt';
import fs from 'fs';
import {Database} from "sqlite";
import CustomSession from "./model/session";

export let db: Database;

const onlineUsers = new Set<string>();

async function init() {
    if (!db) {
        db = await open({
            filename: './data/aegiraDatabase.sqlite',
            driver: sqlite3.Database
        });
    }
}


async function register(username: string, password: string, role: string = 'user', givenEmail: string) {
    try {
        if (!username) {
            throw new Error('Username is required');
        }
        if (!password) {
            throw new Error('Password is required');
        }
        if (!givenEmail) {
            throw new Error('Email is required');
        }

        await init();
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        const email = await db.get('SELECT * FROM users WHERE email = ?', [givenEmail]);

        if (user) {
            throw new Error('User already exists');
        }
        if (email) {
            throw new Error('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run('INSERT INTO users (username, password, role, email) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, role, givenEmail]);
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

async function login(username: string, password: string) {
    try {
        await init();
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

        if (!user) {
            throw new Error('Invalid username or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new Error('Invalid username or password');
        }

        onlineUsers.add(username);
    }
    catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

function logout(username: string) {
    onlineUsers.delete(username);
}


async function getUserRole(username: string): Promise<string> {
    await init();
    const user = await db.get('SELECT role FROM users WHERE username = ?', username);
    if (!user) {
        throw new Error('User not found');
    }
    return user.role;
}

async function giveModerator(username: string) {
    await init();
   const user = await db.get('SELECT * FROM users WHERE username = ?', username);
    if (!user) {
        throw new Error('User not found');
    }
    await db.run('UPDATE users SET role = ? WHERE username = ?', 'moderator', username);
}

async function removeModerator(username: string) {
    await init();
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);
    if (!user) {
        throw new Error('User not found');
    }
    await db.run('UPDATE users SET role = ? WHERE username = ?', 'user', username);
}

async function giveUserInformation(username: string) {
    await init();
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);
    if (!user) {
        throw new Error('User not found');
    }

    return {
        username: user.username,
        email: user.email,
        role: user.role
    };
}


async function getOnlineUsers() {
    return Array.from(onlineUsers);
}

async function getUserID(username?: string ) : Promise<number> {
    await init();
    const user = await db.get('SELECT id FROM users WHERE username = ?', username);
    if (!user) {
        throw new Error('User not found');
    }
    return user.id;
}

//createBoard(userId, name, description, profileImage, headerImage, visibility);
async function createBoard(ownerID: number, name: string, description: string, profileImage: string = 'uploads/default_profile.png', headerImage: string = 'uploads/default_header.png', visibility: string = 'public', hashtag: string = '') {
    await init();

    const result = await db.run(
        'INSERT INTO boards (name, description, ownerId, profile_image, header_image, visibility, hashtag) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, description, ownerID, profileImage, headerImage, visibility, hashtag]
    );

    return { id: result.lastID, name, description, profileImage, headerImage, visibility, hashtag };
}

async function getBoards() {
    await init();
    return await db.all('SELECT * FROM boards');
}

async function getUserBoard(userId:number) {
  if (userId){
    await init();
    return await db.all('SELECT * FROM boards WHERE ownerId = ?', [userId]);
  }
  else {
      return await db.all('SELECT * FROM boards');
  }
}

async function getBoardById(boardId: number) {
    await init();
    return await db.get('SELECT * FROM boards WHERE id = ?', [boardId]);
}

async function updateUserFieldInDB(userId: number, field: string, value: string): Promise<boolean> {
    try {
        await init();

        const allowedFields = ["bio", "pronouns", "links", "badges"]; // Ensure only valid fields are updated
        if (!allowedFields.includes(field)) {
            console.error("Invalid field update attempt:", field);
            return false;
        }

        await db.run(`UPDATE users SET ${field} = ? WHERE id = ?`, [value, userId]);
        return true;
    } catch (error) {
        console.error("Error updating user field in database:", error);
        return false;
    }
}

async function updateUserProfileImage( userId: number, profileImage: string) {
    try {
        await init();
        await db.run('UPDATE users SET profile_image = ? WHERE id = ?', [profileImage, userId]);
        return true;
    } catch (error) {
        console.error("Error updating profile image in database:", error);
        return false;
    }
}

async function updateProfileHeaderImage(userId: number, headerImage: string) {
    try {
        await init();
        await db.run('UPDATE users SET header_image = ? WHERE id = ?', [headerImage, userId]);
        return true;
    } catch (error) {
        console.error("Error updating header image in database:", error);
        return false;
    }
}

async function getUserInfo(userId: number) {
    await init();
    return await db.get('SELECT * FROM users WHERE id = ?', [userId]);
}

init().catch(console.error);

export {
    getUserID,  register, login, getUserRole,
    giveModerator, removeModerator, giveUserInformation,
    logout, getOnlineUsers, createBoard, getBoards,
    getUserBoard, updateUserFieldInDB, updateUserProfileImage,
    updateProfileHeaderImage, getBoardById, getUserInfo};