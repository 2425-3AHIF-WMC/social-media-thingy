import sqlite3 from 'sqlite3';
import {open} from 'sqlite';
import bcrypt from 'bcrypt';
import fs from 'fs';
import {Database} from "sqlite";
import CustomSession from "./model/session";
import {db, init} from "./database";

const onlineUsers = new Set<string>();

export async function register(username: string, password: string, role: string = 'user', givenEmail: string) {
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

export async function login(username: string, password: string) {
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

export function logout(username: string) {
    onlineUsers.delete(username);
}

export async function getOnlineUsers() {
    return Array.from(onlineUsers);
}