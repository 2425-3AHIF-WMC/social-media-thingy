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
const auth_handler_1 = require("../middleware/auth-handler");
const usersDatabase_1 = require("../usersDatabase");
const boardsDatabase_1 = require("../boardsDatabase");
// Import the “like” helpers:
const postDatabase_1 = require("../postDatabase");
const feedRouter = (0, express_1.Router)();
feedRouter.get('/feed', auth_handler_1.authHandler, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1) Identify the current user
        const username = req.session.user;
        const userId = yield (0, usersDatabase_1.getUserID)(username);
        const user = yield (0, usersDatabase_1.giveUserInformation)(username);
        const userAvatar = user.profile_image
            ? `/${user.profile_image}`
            : '/uploads/default_profile.png';
        // 2) Gather all boards this user owns or belongs to
        const ownedBoards = yield (0, boardsDatabase_1.getUserBoard)(userId);
        const memberBoards = yield (0, boardsDatabase_1.getMemberBoards)(userId);
        // 3) Build a quick map so we don’t double-count the same board
        const allBoardsMap = {};
        for (const b of ownedBoards) {
            allBoardsMap[b.id] = b;
        }
        for (const b of memberBoards) {
            allBoardsMap[b.id] = b;
        }
        const allBoards = Object.values(allBoardsMap);
        // 4) Fetch every post from each board, and tag it with boardName & boardId
        const allPostsNested = yield Promise.all(allBoards.map(board => (0, boardsDatabase_1.getPostsByBoard)(board.id).then(rawPosts => rawPosts.map(p => (Object.assign(Object.assign({}, p), { hashtags: p.hashtags ? p.hashtags.split(',') : [], boardName: board.name, boardId: board.id }))))));
        // 5) Flatten into a single array
        let feedItems = allPostsNested.flat();
        // 6) Sort by newest
        feedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        // 7) Enrich each feedItem with likeCount + likedByCurrentUser
        const enrichedFeedItems = yield Promise.all(feedItems.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            // a) Count how many total likes this post has
            const likeRow = yield (0, postDatabase_1.getLikesCount)(item.id);
            const count = (likeRow && likeRow.count) || 0;
            // b) Check if this userId has already liked this post
            const liked = yield (0, postDatabase_1.hasLikedPost)(item.id, userId);
            return Object.assign(Object.assign({}, item), { likeCount: count, likedByCurrentUser: liked });
        })));
        // 8) Render “feed.ejs” with the enriched data
        res.render('feed', {
            user,
            userAvatar,
            feedItems: enrichedFeedItems
        });
    }
    catch (err) {
        console.error('Error rendering feed:', err);
        res.status(500).send('Internal Server Error');
    }
}));
exports.default = feedRouter;
