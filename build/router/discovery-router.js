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
const usersDatabase_1 = require("../usersDatabase");
const router = (0, express_1.Router)();
router.get('/discovery', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, database_1.init)();
        // 1) Prüfen, ob ein User in der Session liegt
        let user = null;
        if (req.session && req.session.user) {
            const username = req.session.user;
            const userId = yield (0, usersDatabase_1.getUserID)(username);
            user = yield (0, usersDatabase_1.getUserById)(userId);
        }
        // 2) Optionaler Suchbegriff
        const { search } = req.query;
        const lowerSearch = typeof search === 'string' ? search.toLowerCase() : null;
        // 3) Alle Boards + board_types + hashtag_list aus der DB holen
        const rows = yield database_1.db.all(`
      SELECT 
        b.id,
        b.name,
        b.description,
        b.profile_image,
        b.header_image,
        b.board_type_id,
        bt.type_name,
        GROUP_CONCAT(h.name) AS hashtag_list
      FROM boards b
      LEFT JOIN board_types bt   ON bt.id = b.board_type_id
      LEFT JOIN board_hashtags bh ON bh.board_id = b.id
      LEFT JOIN hashtags h       ON h.id = bh.hashtag_id
      GROUP BY b.id, bt.type_name
      ORDER BY bt.id, b.name
    `);
        // 4) Filtern bei Suche
        let filtered = rows;
        if (lowerSearch) {
            filtered = rows.filter((board) => {
                const nameMatch = board.name.toLowerCase().includes(lowerSearch);
                const descMatch = board.description.toLowerCase().includes(lowerSearch);
                const hashtags = board.hashtag_list ? board.hashtag_list.toLowerCase() : '';
                const hashMatch = hashtags.includes(lowerSearch);
                return nameMatch || descMatch || hashMatch;
            });
        }
        // 5) Gefilterte Boards nach Typ aufteilen
        const artBoards = [];
        const writingBoards = [];
        const comicBoards = [];
        const allBoards = [];
        filtered.forEach((board) => {
            const t = board.type_name.toLowerCase();
            if (t === 'art') {
                artBoards.push(board);
            }
            else if (t === 'writing') {
                writingBoards.push(board);
            }
            else if (t === 'comic') {
                comicBoards.push(board);
            }
            else if (t === 'all') {
                allBoards.push(board);
            }
        });
        const allGroupsMap = {};
        allBoards.forEach((board) => {
            if (board.hashtag_list) {
                const tags = board.hashtag_list
                    .split(',')
                    .map((t) => t.trim().toLowerCase())
                    .filter((t) => t.length > 0);
                tags.forEach((tag) => {
                    if (!allGroupsMap[tag]) {
                        allGroupsMap[tag] = { hashtag: tag, boards: [] };
                    }
                    allGroupsMap[tag].boards.push(board);
                });
            }
            else {
                // Falls keine Hashtags → "Uncategorized"
                const tag = '_uncategorized';
                if (!allGroupsMap[tag]) {
                    allGroupsMap[tag] = { hashtag: 'Uncategorized', boards: [] };
                }
                allGroupsMap[tag].boards.push(board);
            }
        });
        // Map in sortiertes Array umwandeln
        const allGroups = Object.values(allGroupsMap).sort((a, b) => {
            if (a.hashtag === 'Uncategorized')
                return 1;
            if (b.hashtag === 'Uncategorized')
                return -1;
            return a.hashtag.localeCompare(b.hashtag);
        });
        // 7) Rendern (user kann null sein)
        res.render('discovery', {
            user, // entweder das User‐Objekt oder null
            artBoards,
            writingBoards,
            comicBoards,
            allGroups,
            currentSearch: typeof search === 'string' ? search : ''
        });
    }
    catch (err) {
        console.error('Error rendering discovery:', err);
        res.status(500).send('Internal Server Error');
    }
}));
exports.default = router;
