"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const auth_handler_1 = require("../middleware/auth-handler");
const database_1 = require("../database");
const router = express_1.default.Router();
router.get('/', (req, res) => {
    res.send("hello there!");
});
router.get('/register', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../public/register.html'));
});
router.get('/login', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../public/login.html'));
});
router.get('/home', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../public/index.html'));
});
router.get('/dashboard', auth_handler_1.authHandler, (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../views/dashboard.html'));
});
router.get('/about-us', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../public/aboutus.html'));
});
router.get('/rnd', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../public/Rnd.html'));
});
router.get('/events', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../public/Events.html'));
});
router.get('/home', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../public/index.html'));
});
router.get('/username', auth_handler_1.authHandler, (req, res) => {
    const username = (req.session).user;
    if (username) {
        (0, database_1.giveUserInformation)(username).then((user) => {
            res.json(user);
        }).catch((error) => {
            res.status(400).send(error.message);
        });
    }
    else {
        res.status(400).send("Username is undefined");
    }
});
router.get('/admin', auth_handler_1.adminHandler, (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../views/admindashboard.html'));
});
router.get('/moderator', auth_handler_1.moderatorHandler, (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../views/moderatordashboard.html'));
});
exports.default = router;
