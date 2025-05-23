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
exports.createPostWithProject = createPostWithProject;
exports.createPostWithoutProject = createPostWithoutProject;
exports.getPosts = getPosts;
exports.getPostById = getPostById;
exports.getPostOwnerName = getPostOwnerName;
exports.getPostsForBoard = getPostsForBoard;
exports.getPostsByBoard = getPostsByBoard;
exports.getPostOwnerId = getPostOwnerId;
exports.deletePost = deletePost;
exports.editPost = editPost;
exports.likePost = likePost;
exports.unlikePost = unlikePost;
exports.getLikesCount = getLikesCount;
exports.hasLikedPost = hasLikedPost;
exports.ensureHashtag = ensureHashtag;
exports.addHashtagsToPost = addHashtagsToPost;
const database_1 = require("./database");
// in postDatabase.ts, drop createdAt entirely from the INSERT:
// src/database/postDatabase.ts
function createPostWithProject(title, content, userId, boardId, type, hashtag, image, projectId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const result = yield database_1.db.run(
        // ← exactly 8 columns here:
        `INSERT INTO Posts
       (title,
        content,
        userId,
        boardId,
        type,
        hashtag,
        image,
        project_id)
     VALUES
       (?, ?, ?, ?, ?, ?, ?, ?)`, // ← exactly 8 placeholders
        [
            title,
            content,
            userId,
            boardId,
            type,
            hashtag,
            image,
            projectId || null
        ]);
        return { id: result.lastID };
    });
}
// src/database/postDatabase.ts
function createPostWithoutProject(title, content, userId, boardId, type, hashtag, image) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const result = yield database_1.db.run(
        // exactly 7 columns:
        `INSERT INTO Posts
       (title,
        content,
        userId,
        boardId,
        type,
        hashtag,
        image)
     VALUES
       (?, ?, ?, ?, ?, ?, ?)`, // exactly 7 placeholders
        [
            title,
            content,
            userId,
            boardId,
            type,
            hashtag,
            image || null
        ]);
        return { id: result.lastID };
    });
}
function getPosts(boardId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        return yield database_1.db.all('SELECT * FROM Posts WHERE boardId = ?', [boardId]);
    });
}
function getPostById(postId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        return yield database_1.db.get('SELECT * FROM Posts WHERE id = ?', [postId]);
    });
}
function getPostOwnerName(postId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const user = yield database_1.db.get('SELECT username FROM users WHERE id = (SELECT userId FROM Posts WHERE id = ?)', postId);
        if (!user) {
            throw new Error('User not found');
        }
        return user.username;
    });
}
function getPostsForBoard(boardId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        return yield database_1.db.all('SELECT * FROM Posts WHERE boardId = ?', [boardId]);
    });
}
function getPostsByBoard(boardId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        return yield database_1.db.all(`
    SELECT *
    FROM (
      SELECT
        p.id,
        p.title,
        p.content,
        p.type,
        p.image,
        p.createdAt,
        u.username         AS username,
        u.profile_image    AS avatar,
        GROUP_CONCAT(h.name) AS hashtags
      FROM Posts p
      LEFT JOIN users u           ON u.id = p.userId
      LEFT JOIN post_hashtags ph  ON ph.post_id   = p.id
      LEFT JOIN hashtags    h     ON h.id         = ph.hashtag_id
      WHERE p.boardId = ?
      GROUP BY p.id
    )
    ORDER BY datetime(createdAt) DESC,  -- newest timestamp first
             id DESC                   -- tiebreak on auto-inc ID
  `, [boardId]);
    });
}
function getPostOwnerId(postId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const user = yield database_1.db.get('SELECT userId FROM Posts WHERE id = ?', postId);
        if (!user) {
            throw new Error('User not found');
        }
        return user.userId;
    });
}
function deletePost(postId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        yield database_1.db.run('DELETE FROM Posts WHERE id = ?', postId);
    });
}
function editPost(postId, content, image) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        yield database_1.db.run('UPDATE Posts SET content = ?, image = ? WHERE id = ?', [content, image || null, postId]);
    });
}
function likePost(postId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        yield database_1.db.run('INSERT INTO Likes (postId, userId) VALUES (?, ?)', [postId, userId]);
    });
}
function unlikePost(postId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        yield database_1.db.run('DELETE FROM Likes WHERE postId = ? AND userId = ?', [postId, userId]);
    });
}
function getLikesCount(postId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        return yield database_1.db.get('SELECT COUNT(*) as count FROM Likes WHERE postId = ?', postId);
    });
}
function hasLikedPost(postId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const result = yield database_1.db.get('SELECT COUNT(*) as count FROM Likes WHERE postId = ? AND userId = ?', [postId, userId]);
        return result.count > 0;
    });
}
function ensureHashtag(tag) {
    return __awaiter(this, void 0, void 0, function* () {
        yield database_1.db.run(`INSERT OR IGNORE INTO hashtags (name) VALUES (?)`, [tag]);
        const row = yield database_1.db.get(`SELECT id FROM hashtags WHERE name = ?`, [tag]);
        if (!row)
            throw new Error(`Konnte Hashtag ${tag} nicht finden oder anlegen`);
        return row.id;
    });
}
function addHashtagsToPost(postId, tags) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const tag of tags) {
            const hashtagId = yield ensureHashtag(tag.trim());
            yield database_1.db.run(`INSERT OR IGNORE INTO post_hashtags (post_id, hashtag_id) VALUES (?, ?)`, [postId, hashtagId]);
        }
    });
}
