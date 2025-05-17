import sqlite3 from 'sqlite3';
import {open} from 'sqlite';
import bcrypt from 'bcrypt';
import fs from 'fs';
import {Database} from "sqlite";
import CustomSession from "./model/session";
import {db, init} from "./database";

///Get functions
export async function getUserRole(username: string): Promise<string> {
    await init();
    const user = await db.get('SELECT role FROM users WHERE username = ?', username);
    if (!user) {
        throw new Error('User not found');
    }
    return user.role;
}

export async function giveModerator(username: string) {
    await init();
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);
    if (!user) {
        throw new Error('User not found');
    }
    await db.run('UPDATE users SET role = ? WHERE username = ?', 'moderator', username);
}

export async function removeModerator(username: string) {
    await init();
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);
    if (!user) {
        throw new Error('User not found');
    }
    await db.run('UPDATE users SET role = ? WHERE username = ?', 'user', username);
}

export async function giveUserInformation(username: string) {
    await init();
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);
    if (!user) {
        throw new Error('User not found');
    }

    return {
        username: user.username,
        email: user.email,
        role: user.role,
        bio: user.bio,
        pronouns: user.pronouns,
        links: user.links,
        badges: user.badges,
        profile_image: user.profile_image,
        header_image: user.header_image
    };
}

export async function getUserInfo(userId: number) {
    await init();
    return await db.get('SELECT * FROM users WHERE id = ?', [userId]);
}

export async function getUserID(username?: string ) : Promise<number> {
    await init();
    const user = await db.get('SELECT id FROM users WHERE username = ?', username);
    if (!user) {
        throw new Error('User not found');
    }
    return user.id;
}

export async function getUserNameById(userId: number) {
   await init();
    const user = await db.get('SELECT username FROM users WHERE id = ?', userId);
    if (!user) {
        throw new Error('User not found');
    }
    return user.username;
}

//Update functions
export async function updateUserFieldInDB(userId: number, field: string, value: string): Promise<boolean> {
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

export async function updateUserProfileImage( userId: number, profileImage: string) {
    try {
        await init();
        await db.run('UPDATE users SET profile_image = ? WHERE id = ?', [profileImage, userId]);
        return true;
    } catch (error) {
        console.error("Error updating profile image in database:", error);
        return false;
    }
}

export async function updateProfileHeaderImage(userId: number, headerImage: string) {
    try {
        await init();
        await db.run('UPDATE users SET header_image = ? WHERE id = ?', [headerImage, userId]);
        return true;
    } catch (error) {
        console.error("Error updating header image in database:", error);
        return false;
    }
}


export async function getUserById(userId: number): Promise<{
    id: number;
    username: string;
    profile_image: string;
} | undefined> {
    await init();
    return db.get(
        `SELECT id, username, profile_image
     FROM users
     WHERE id = ?`,
        [userId]
    );
}

init().catch(console.error);



