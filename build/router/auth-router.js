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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../database");
const router = (0, express_1.Router)();
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, role, email } = req.body;
    try {
        yield (0, database_1.register)(username, password, role, email);
        res.redirect('/');
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).send(error.message);
        }
        else {
            res.status(400).send('An unknown error occurred');
        }
    }
}));
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        yield (0, database_1.login)(username, password);
        (req.session).user = username;
        res.redirect('/dashboard');
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).send(error.message);
        }
        else {
            res.status(400).send('An unknown error occurred');
        }
    }
}));
router.get('/logout', (req, res) => {
    const username = req.session.user;
    if (username) {
        (0, database_1.logout)(username);
    }
    req.session.user = undefined;
    res.redirect('/');
});
router.get('/online-users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield (0, database_1.getOnlineUsers)();
        res.json({ users, count: users.length });
    }
    catch (error) {
        res.status(500).send('Server Error');
    }
}));
exports.default = router;
