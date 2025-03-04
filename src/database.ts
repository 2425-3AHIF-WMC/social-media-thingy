import sqlite3 from 'sqlite3';
import {open} from 'sqlite';
import bcrypt from 'bcrypt';
import fs from 'fs';
import {Database} from "sqlite";
import CustomSession from "./model/session";

export let db: Database;

const onlineUsers = new Set<string>();

export async function init() {
    if (!db) {
        db = await open({
            filename: './data/aegiraDatabase.sqlite',
            driver: sqlite3.Database
        });
    }
}

init().catch(console.error);
