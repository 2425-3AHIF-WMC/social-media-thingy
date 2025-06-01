import express from 'express';
import path from "path";
import { adminHandler, authHandler, moderatorHandler } from '../middleware/auth-handler';
import authRouter from "./auth-router";
import { giveUserInformation, getUserID, getUserInfo } from "../usersDatabase";
import {getBoards, getUserBoard} from "../boardsDatabase";
import {getOnlineUsers} from "../authDatabase";

const router = express.Router();

router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/register.html'));
});

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/login.html'));
});

router.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});

router.get('/dashboard', authHandler, async (req, res) => {
    try {
        const username = req.session.user;
        if (!username) {
            return res.status(400).send('Username is undefined');
        }
        const user = await giveUserInformation(username);
        const userId = await getUserID(username);
        const userInfo = await getUserInfo(userId);
        const boards = await getUserBoard(userId);
        const onlineUsers = await getOnlineUsers();

        // Fetch user images
        const userProfileImage = userInfo.profile_image ? `/${userInfo.profile_image}` : '/uploads/default_profile.png';
        const userHeaderImage = userInfo.header_image ? `/${userInfo.header_image}` : '/uploads/default_header.png';

        res.render('dashboard', { user, boards, onlineUsers, userProfileImage, userHeaderImage });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/about-us', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/aboutus.html'));
});

router.get('/events', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/Events.html'));
});

router.get('/discovery', authHandler, async (req, res) => {
    try {
        const username = req.session.user;
        if (!username) {
            return res.status(400).send('Username is undefined');
        }
        const user = await giveUserInformation(username);
        let boards = await getBoards();

        // If a search query exists, filter boards by name, description, or hashtag
        const { search } = req.query;
        if (search) {
            const searchTerm = search.toString().toLowerCase();
            boards = boards.filter(board =>
                board.name.toLowerCase().includes(searchTerm) ||
                board.description.toLowerCase().includes(searchTerm) ||
                (board.hashtag && board.hashtag.toLowerCase().includes(searchTerm))
            );
        }

        res.render('discovery', { user, boards });
    } catch (error) {
        console.error("Error fetching boards:", error);
        res.status(500).json({ error: 'Failed to fetch boards' });
    }
});

router.get('/username', authHandler, (req, res) => {
    const username = req.session.user;
    if (username) {
        giveUserInformation(username).then((user) => {
            res.json(user);
        }).catch((error) => {
            res.status(400).send(error.message);
        });
    } else {
        res.status(400).send("Username is undefined");
    }
});

router.get('/admin', adminHandler, (req, res) => {
    res.sendFile(path.join(__dirname, '../../views/admindashboard.html'));
});

router.get('/moderator', moderatorHandler, (req, res) => {
    res.sendFile(path.join(__dirname, '../../views/moderatordashboard.html'));
});
export default router;