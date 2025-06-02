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
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
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
router.get('/chapter/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, database_1.init)();
    const postId = Number(req.params.id);
    const post = yield database_1.db.get(`SELECT
       id,
       title,
       content,
       createdAt,
       boardId,
       project_id
     FROM Posts
     WHERE id = ? AND type = 'chapter'`, [postId]);
    if (!post) {
        return res.status(404).send('Chapter not found');
    }
    const chapter = yield database_1.db.get(`SELECT
       source_path,
       file_type
     FROM Chapters
     WHERE post_id = ?`, [postId]);
    if (!chapter) {
        return res.status(404).send('Chapter metadata missing');
    }
    const absPath = path_1.default.resolve(__dirname, '..', chapter.source_path);
    let html = '';
    try {
        if (chapter.file_type === 'txt') {
            const txt = yield fs_1.default.promises.readFile(absPath, 'utf8');
            html = txt
                .split('\n\n')
                .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
                .join('');
        }
        else if (chapter.file_type === 'docx') {
            const result = yield mammoth_1.default.convertToHtml({ path: absPath });
            html = result.value;
        }
    }
    catch (err) {
        console.error('Error converting chapter file:', err);
        return res.status(500).send('Failed to load chapter content');
    }
    const projectId = post.project_id;
    const prev = projectId
        ? yield getAdjacentPost(projectId, post.createdAt, 'prev')
        : null;
    const next = projectId
        ? yield getAdjacentPost(projectId, post.createdAt, 'next')
        : null;
    res.render('chapter', {
        post,
        html,
        prev,
        next
    });
}));
router.get('/comic/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, database_1.init)();
    const postId = Number(req.params.id);
    const post = yield database_1.db.get(`SELECT
       id,
       title,
       content,
       createdAt,
       boardId,
       project_id
     FROM Posts
     WHERE id = ? AND type = 'comic'`, [postId]);
    if (!post) {
        return res.status(404).send('Comic not found');
    }
    const chapterMeta = yield database_1.db.get(`SELECT
       id,
       project_id,
       created_at AS createdAt
     FROM Chapters
     WHERE post_id = ?`, [postId]);
    if (!chapterMeta) {
        return res.status(404).send('Comic chapter metadata not found');
    }
    const pages = yield database_1.db.all(`SELECT
       page_number AS page_number,
       image_path  AS image_path
     FROM ComicPages
     WHERE chapter_id = ?
     ORDER BY page_number`, [chapterMeta.id]);
    const projId = chapterMeta.project_id;
    const prev = projId
        ? yield getAdjacentPost(projId, chapterMeta.createdAt, 'prev')
        : null;
    const next = projId
        ? yield getAdjacentPost(projId, chapterMeta.createdAt, 'next')
        : null;
    res.render('comic', {
        post,
        pages,
        prev,
        next
    });
}));
exports.default = router;
