"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const auth_handler_1 = require("../middleware/auth-handler");
const usersDatabase_1 = require("../usersDatabase");
const boardsDatabase_1 = require("../boardsDatabase");
const authDatabase_1 = require("../authDatabase");
const router = express_1.default.Router();
router.get('/register', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../public/register.html'));
});
router.get('/login', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../public/login.html'));
});
router.get('/home', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../public/index.html'));
});
router.get('/dashboard', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const username = req.session.user;
        if (!username) {
            return res.status(400).send('Username is undefined');
        }
        const user = yield (0, usersDatabase_1.giveUserInformation)(username);
        const userId = yield (0, usersDatabase_1.getUserID)(username);
        const userInfo = yield (0, usersDatabase_1.getUserInfo)(userId);
        const boards = yield (0, boardsDatabase_1.getUserBoard)(userId);
        const onlineUsers = yield (0, authDatabase_1.getOnlineUsers)();
        // Fetch user images
        const userProfileImage = userInfo.profile_image ? `/${userInfo.profile_image}` : '/uploads/default_profile.png';
        const userHeaderImage = userInfo.header_image ? `/${userInfo.header_image}` : '/uploads/default_header.png';
        res.render('dashboard', { user, boards, onlineUsers, userProfileImage, userHeaderImage });
    }
    catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).send('Internal Server Error');
    }
}));
router.get('/about-us', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../public/aboutus.html'));
});
router.get('/username', auth_handler_1.authHandler, (req, res) => {
    const username = req.session.user;
    if (username) {
        (0, usersDatabase_1.giveUserInformation)(username).then((user) => {
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
