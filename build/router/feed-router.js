"use strict";
// src/routes/feed-router.ts
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
const auth_handler_1 = require("../middleware/auth-handler");
const usersDatabase_1 = require("../usersDatabase");
// Vorher: getUserBoard holte nur Owner-Boards. Jetzt haben wir zusätzlich getMemberBoards.
const boardsDatabase_1 = require("../boardsDatabase");
const feedRouter = (0, express_1.Router)();
feedRouter.get('/feed', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1) Welcher User ist eingeloggt?
        const username = req.session.user;
        const userId = yield (0, usersDatabase_1.getUserID)(username);
        const user = yield (0, usersDatabase_1.giveUserInformation)(username);
        const userAvatar = user.profile_image
            ? `/${user.profile_image}`
            : '/uploads/default_profile.png';
        // 2) Hol alle Boards, die der User besitzt (Owner)
        const ownedBoards = yield (0, boardsDatabase_1.getUserBoard)(userId);
        // 3) Hol zusätzlich alle Boards, in denen der User Mitglied ist
        const memberBoards = yield (0, boardsDatabase_1.getMemberBoards)(userId);
        // 4) Beide Listen zusammenführen und Duplikate entfernen (nach board.id)
        const allBoardsMap = {};
        for (const b of ownedBoards) {
            allBoardsMap[b.id] = b;
        }
        for (const b of memberBoards) {
            allBoardsMap[b.id] = b;
        }
        // Jetzt sind in allBoards nur eindeutige Boards
        const allBoards = Object.values(allBoardsMap);
        // 5) Für jedes dieser Boards alle Posts holen
        const allPostsNested = yield Promise.all(allBoards.map(board => (0, boardsDatabase_1.getPostsByBoard)(board.id).then(rawPosts => rawPosts.map(p => (Object.assign(Object.assign({}, p), { 
            // Falls in getPostsByBoard das Feld "hashtags" noch ein CSV‐String ist:
            hashtags: p.hashtags ? p.hashtags.split(',') : [], boardName: board.name, boardId: board.id }))))));
        // 6) Flatten in ein einzelnes Array
        let feedItems = allPostsNested.flat();
        // 7) Nach Erstellzeit sortieren (absteigend, neueste oben)
        feedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        // 8) Rendern
        res.render('feed', {
            user,
            userAvatar,
            feedItems
        });
    }
    catch (err) {
        console.error('Error rendering feed:', err);
        res.status(500).send('Internal Server Error');
    }
}));
exports.default = feedRouter;
