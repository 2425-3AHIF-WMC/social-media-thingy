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
function createPostWithProject(title, content, userId, boardId, type, createdAt, hashtag, image, projectId, filePath, // new
fileFormat // new
) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const result = yield database_1.db.run(`INSERT INTO Posts
       (title, content, userId, boardId, type, createdAt, hashtag, image,
        project_id, file_path, file_format)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [title, content, userId, boardId, type, createdAt.toISOString(),
            hashtag, image, projectId, filePath || null, fileFormat || null]);
        return { id: result.lastID, /*…other fields…*/ };
    });
}
function createPostWithoutProject(title, content, userId, boardId, type, createdAt, hashtag, image) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const result = yield database_1.db.run(`INSERT INTO Posts (title, content, userId, boardId, type, createdAt, hashtag, image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [title, content, userId, boardId, type, createdAt, hashtag, image || null]);
        return {
            id: result.lastID,
            title,
            content,
            userId,
            boardId,
            type,
            createdAt,
            hashtag,
            image: image || null
        };
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
