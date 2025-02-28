import express from 'express';
import path from 'path';
import session from 'express-session';
import dotenv from 'dotenv';
import authRouter from './router/auth-router';
import fileRouter from './router/file-router';
import roleRouter from "./router/role-router";
import boardRouter from './router/board-router';
import userRouter from './router/users-router';

import { cookie } from "express-validator";
import CustomSession from "./model/session";

dotenv.config();
const app = express();
const port = 3001;


app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'whatever-man',
    resave: false,
    saveUninitialized: true,
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use('/profile_images', express.static(path.join(__dirname, 'profile_images'), {
    setHeaders: (res, filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypeMap: Record<string, string> = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif"
        };

        if (mimeTypeMap[ext]) {
            res.setHeader("Content-Type", mimeTypeMap[ext]);
        }
    }
}));

app.use('/', authRouter);
app.use('/', fileRouter);
app.use('/', roleRouter);
app.use('/', boardRouter);
app.use('/', userRouter);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});