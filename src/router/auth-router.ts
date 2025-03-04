import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { register, login, getOnlineUsers, logout } from '../authDatabase';
import CustomSession from "../model/session";

const router = Router();

router.post('/register', async (req, res) => {
    const { username, password, role, email} = req.body;
    try {
        await register(username, password, role, email);
        res.redirect('/');
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).send(error.message);
        } else {
            res.status(400).send('An unknown error occurred');
        }
    }
});

router.post('/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    try {
        await login(username, password);
        (req.session).user = username;
        res.redirect('/dashboard');
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).send(error.message);
        } else {
            res.status(400).send('An unknown error occurred');
        }
    }
});

router.get('/logout', (req: Request, res: Response) => {
    const username = req.session.user;
    if (username) {
        logout(username);
    }
    req.session.user = undefined;
    res.redirect('/');
});

router.get('/online-users', async (req: Request, res: Response) => {
    try {
        const users = await getOnlineUsers();
        res.json({ users, count: users.length });
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

export default router;