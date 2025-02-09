import express from 'express';
import path from "path";
import {adminHandler, authHandler, moderatorHandler} from '../middleware/auth-handler';
import authRouter from "./auth-router";
import {giveUserInformation} from "../database";

const router = express.Router();


router.get('/', (req, res) => {
    res.send("hello there!")
})

router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/register.html'));
});

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/login.html'));
});

router.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));

});

router.get('/dashboard',  authHandler, (req, res) => {
    res.sendFile(path.join(__dirname, '../../views/dashboard.html'));

});

router.get('/about-us', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/aboutus.html'));
});

router.get('/rnd', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/Rnd.html'));
});

router.get('/events', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/Events.html'));
});


router.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});

router.get('/username', authHandler, (req, res) => {
    const username = (req.session).user;
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

router.get('/admin', adminHandler , (req, res) => {
    res.sendFile(path.join(__dirname, '../../views/admindashboard.html'));
});

router.get('/moderator', moderatorHandler,(req, res) => {
    res.sendFile(path.join(__dirname, '../../views/moderatordashboard.html'));
});

export default router;