import sqlite3 from 'sqlite3';
import {open} from 'sqlite';
import bcrypt from 'bcrypt';
import {v4 as uuidv4} from 'uuid';
import fs from 'fs';
import {Database} from "sqlite";
import CustomSession from "./model/session";

let db: Database;

const onlineUsers = new Set<string>();

async function init() {
    if (!db) {
        db = await open({
            filename: './data/users.sqlite',
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
        const uuid = uuidv4();
        await db.run('INSERT INTO users (username, password, role, email, uuid) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, role, givenEmail, uuid]);
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

init().catch(console.error);

export { register, login, getUserRole, giveModerator, removeModerator, giveUserInformation, logout, getOnlineUsers };