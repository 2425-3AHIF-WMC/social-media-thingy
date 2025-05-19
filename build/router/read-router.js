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
// routes/read-router.ts
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const mammoth_1 = __importDefault(require("mammoth"));
const database_1 = require("../database");
const router = (0, express_1.Router)();
function getAdjacentPost(projectId, createdAt, direction) {
    return __awaiter(this, void 0, void 0, function* () {
        const op = direction === 'next' ? '>' : '<';
        const ord = direction === 'next' ? 'ASC' : 'DESC';
        const row = yield database_1.db.get(`SELECT id, type
     FROM Posts
     WHERE project_id = ?
       AND datetime(createdAt) ${op} datetime(?)
     ORDER BY datetime(createdAt) ${ord}
     LIMIT 1`, [projectId, createdAt]);
        return row || null;
    });
}
// GET /chapter/:id
router.get('/chapter/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, database_1.init)();
    const postId = parseInt(req.params.id, 10);
    const post = yield database_1.db.get(`SELECT * FROM Posts WHERE id = ? AND type = 'chapter'`, [postId]);
    if (!post)
        return res.status(404).send('Chapter not found');
    let html = null;
    const fp = post.file_path;
    const fmt = post.file_format;
    try {
        if (fmt === 'txt') {
            const txt = yield fs_1.default.promises.readFile(fp, 'utf8');
            html = txt
                .split('\n\n')
                .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
                .join('');
        }
        else if (fmt === 'docx') {
            const result = yield mammoth_1.default.convertToHtml({ path: fp });
            html = result.value;
        }
        // if pdf, we'll let the EJS template handle PDF.js
    }
    catch (e) {
        console.error('Error converting chapter file:', e);
        return res.status(500).send('Failed to load chapter');
    }
    const projectId = post.project_id;
    const prev = projectId
        ? yield getAdjacentPost(projectId, post.createdAt, 'prev')
        : null;
    const next = projectId
        ? yield getAdjacentPost(projectId, post.createdAt, 'next')
        : null;
    res.render('chapter', { post, html, prev, next });
}));
router.get('/comic/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, database_1.init)();
    const postId = +req.params.id;
    const post = yield database_1.db.get(`SELECT * FROM Posts WHERE id = ? AND type = 'comic'`, [postId]);
    if (!post)
        return res.status(404).send('Not found');
    const pages = yield database_1.db.all(`SELECT page_number, image_path 
     FROM ComicPages 
     WHERE post_id = ? 
     ORDER BY page_number`, [postId]);
    const projectId = post.project_id;
    const prev = projectId
        ? yield getAdjacentPost(projectId, post.createdAt, 'prev')
        : null;
    const next = projectId
        ? yield getAdjacentPost(projectId, post.createdAt, 'next')
        : null;
    res.render('comic', { post, pages, prev, next });
}));
exports.default = router;
