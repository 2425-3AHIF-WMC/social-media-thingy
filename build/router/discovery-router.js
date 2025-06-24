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
// src/routes/discovery-router.ts
const express_1 = require("express");
const database_1 = require("../database");
const usersDatabase_1 = require("../usersDatabase");
const router = (0, express_1.Router)();
// 1) Discovery-Übersicht
router.get('/discovery', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        yield (0, database_1.init)();
        let user = null;
        if ((_a = req.session) === null || _a === void 0 ? void 0 : _a.user) {
            const uid = yield (0, usersDatabase_1.getUserID)(req.session.user);
            user = yield (0, usersDatabase_1.getUserById)(uid);
        }
        // Alle Boards laden und nach Typ aufteilen
        const rows = yield database_1.db.all(`
      SELECT b.id, b.name, b.description, b.profile_image, b.header_image,
             b.board_type_id, bt.type_name, GROUP_CONCAT(h.name) AS hashtag_list
      FROM boards b
      LEFT JOIN board_types bt   ON bt.id = b.board_type_id
      LEFT JOIN board_hashtags bh ON bh.board_id = b.id
      LEFT JOIN hashtags h       ON h.id = bh.hashtag_id
      GROUP BY b.id, bt.type_name
      ORDER BY bt.id, b.name
    `);
        // Filter nach Suchbegriff
        const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : null;
        const filtered = search
            ? rows.filter(b => {
                var _a, _b;
                return b.name.toLowerCase().includes(search) ||
                    b.description.toLowerCase().includes(search) ||
                    ((_b = (_a = b.hashtag_list) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== null && _b !== void 0 ? _b : '').includes(search);
            })
            : rows;
        // Aufteilen
        const artBoards = filtered.filter(b => b.type_name.toLowerCase() === 'art');
        const writingBoards = filtered.filter(b => b.type_name.toLowerCase() === 'writing');
        const comicBoards = filtered.filter(b => b.type_name.toLowerCase() === 'comic');
        const allBoards = filtered.filter(b => !['art', 'writing', 'comic'].includes(b.type_name.toLowerCase()));
        res.render('discovery', {
            user,
            currentSearch: typeof req.query.search === 'string' ? req.query.search : '',
            artBoards,
            writingBoards,
            comicBoards,
            allBoards
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}));
// 2) Kategorie-Seite (Art, Writing, Comic oder “all” mit Hashtag-Filter)
router.get('/discovery/category/:key', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        yield (0, database_1.init)();
        let user = null;
        if ((_a = req.session) === null || _a === void 0 ? void 0 : _a.user) {
            const uid = yield (0, usersDatabase_1.getUserID)(req.session.user);
            user = yield (0, usersDatabase_1.getUserById)(uid);
        }
        const key = req.params.key; // z.B. 'art', 'writing', 'comic' oder 'all-foo'
        // gleiche Basis-Query
        const rows = yield database_1.db.all(`
      SELECT b.id, b.name, b.description, b.profile_image, b.header_image,
             b.board_type_id, bt.type_name, GROUP_CONCAT(h.name) AS hashtag_list
      FROM boards b
      LEFT JOIN board_types bt   ON bt.id = b.board_type_id
      LEFT JOIN board_hashtags bh ON bh.board_id = b.id
      LEFT JOIN hashtags h       ON h.id = bh.hashtag_id
      GROUP BY b.id, bt.type_name
      ORDER BY b.name
    `);
        let boards;
        if (['art', 'writing', 'comic'].includes(key)) {
            boards = rows.filter(r => r.type_name.toLowerCase() === key);
        }
        else if (key.startsWith('all-')) {
            // all-<slug>, slug => hashtag
            const tag = key.slice(4).replace(/-/g, ' ');
            boards = rows.filter(r => {
                var _a;
                return ((_a = r.hashtag_list) !== null && _a !== void 0 ? _a : '').toLowerCase().split(',').map(s => s.trim())
                    .includes(tag.toLowerCase());
            });
        }
        else {
            // sonst alle “uncategorized”
            boards = rows.filter(r => !r.hashtag_list);
        }
        const title = ['art', 'writing', 'comic'].includes(key)
            ? key.charAt(0).toUpperCase() + key.slice(1)
            : key.startsWith('all-')
                ? tagCase(key.slice(4))
                : 'Others';
        res.render('discovery-category', { user, title, boards });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}));
function tagCase(slug) {
    return slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}
exports.default = router;
