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
exports.createBoard = createBoard;
exports.getBoards = getBoards;
exports.getUserBoard = getUserBoard;
exports.getBoardById = getBoardById;
exports.getBoardOwnerName = getBoardOwnerName;
exports.getBoardOwnerId = getBoardOwnerId;
exports.joinBoard = joinBoard;
exports.getBoardMembers = getBoardMembers;
exports.updateOwnerRole = updateOwnerRole;
exports.doesUserExist = doesUserExist;
exports.isUserMemberOfBoard = isUserMemberOfBoard;
exports.addBoardMember = addBoardMember;
exports.addHashtagToBoard = addHashtagToBoard;
exports.createProject = createProject;
exports.getProjectsForBoard = getProjectsForBoard;
exports.getPostsByBoard = getPostsByBoard;
exports.getPostsByProject = getPostsByProject;
exports.getMemberBoards = getMemberBoards;
const database_1 = require("./database");
/*
export async function createBoard(ownerID: number, name: string, description: string, profileImage: string = 'uploads/default_profile.png', headerImage: string = 'uploads/default_header.png', visibility: string = 'public', hashtag: string = '') {
    await init();

    const result = await db.run(
        'INSERT INTO boards (name, description, ownerId, profile_image, header_image, visibility, hashtag) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, description, ownerID, profileImage, headerImage, visibility, hashtag]
    );

    return { id: result.lastID, name, description, profileImage, headerImage, visibility, hashtag };
}*/
function createBoard(ownerId_1, name_1, description_1, visibility_1) {
    return __awaiter(this, arguments, void 0, function* (ownerId, name, description, visibility, hashtag = '', boardTypeId, profileImage = 'uploads/default_profile.jpg', headerImage = 'uploads/default_header.jpg') {
        yield (0, database_1.init)();
        const result = yield database_1.db.run(`INSERT INTO boards (name, description, ownerId, profile_image, header_image, visibility, hashtag,
                             board_type_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [name, description, ownerId, profileImage, headerImage, visibility, hashtag, boardTypeId]);
        return {
            id: result.lastID,
            name,
            description,
            ownerId,
            profileImage,
            headerImage,
            visibility,
            hashtag,
            boardTypeId
        };
    });
}
function getBoards() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        return yield database_1.db.all('SELECT * FROM boards');
    });
}
function getUserBoard(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (userId) {
            yield (0, database_1.init)();
            return yield database_1.db.all('SELECT * FROM boards WHERE ownerId = ?', [userId]);
        }
        else {
            return yield database_1.db.all('SELECT * FROM boards');
        }
    });
}
function getBoardById(boardId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        return yield database_1.db.get('SELECT * FROM boards WHERE id = ?', [boardId]);
    });
}
function getBoardOwnerName(boardId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const user = yield database_1.db.get('SELECT username FROM users WHERE id = (SELECT ownerId FROM boards WHERE id = ?)', boardId);
        if (!user) {
            throw new Error('User not found');
        }
        return user.username;
    });
}
function getBoardOwnerId(boardId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const user = yield database_1.db.get('SELECT ownerId FROM boards WHERE id = ?', boardId);
        if (!user) {
            throw new Error('User not found');
        }
        return user.ownerId;
    });
}
function joinBoard(boardId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        yield database_1.db.run('INSERT INTO BoardMembers (boardId, userId) VALUES (?, ?)', [boardId, userId]);
    });
}
function getBoardMembers(boardId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        return yield database_1.db.all('SELECT * FROM BoardMembers WHERE boardId = ?', [boardId]);
    });
}
function updateOwnerRole(boardId, userId, role) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        yield database_1.db.run('UPDATE BoardMembers SET role = ? WHERE boardId = ? AND userId = ?', [role, boardId, userId]);
    });
}
function doesUserExist(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const result = yield database_1.db.get('SELECT COUNT(*) as count FROM Users WHERE id = ?', [userId]);
        return result.count > 0;
    });
}
function isUserMemberOfBoard(userId, boardId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const row = yield database_1.db.get(`SELECT 1 FROM BoardMembers WHERE userId = ? AND boardId = ?`, [userId, boardId]);
        return !!row;
    });
}
function addBoardMember(userId_1, boardId_1) {
    return __awaiter(this, arguments, void 0, function* (userId, boardId, role = 'member') {
        yield database_1.db.run(`INSERT INTO BoardMembers (userId, boardId, role) VALUES (?, ?, ?)`, [userId, boardId, role]);
    });
}
function addHashtagToBoard(boardId, hashtags) {
    return __awaiter(this, void 0, void 0, function* () {
        const uniqueHashtags = [...new Set(hashtags.map(tag => tag.trim().toLowerCase()))];
        for (const tag of uniqueHashtags) {
            let hashtagId;
            const existingHashtag = yield database_1.db.get('SELECT id FROM hashtags WHERE name = ?', [tag]);
            if (existingHashtag) {
                hashtagId = existingHashtag.id;
            }
            else {
                const result = yield database_1.db.run('INSERT INTO hashtags (name) VALUES (?)', [tag]);
                hashtagId = result.lastID;
            }
            yield database_1.db.run('INSERT OR IGNORE INTO board_hashtags (board_id, hashtag_id) VALUES (?, ?)', [boardId, hashtagId]);
        }
    });
}
function createProject(name, description, boardId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const result = yield database_1.db.run(`INSERT INTO project (name, description, board_id) VALUES (?, ?, ?)`, [name, description, boardId]);
        return {
            id: result.lastID,
            name,
            description,
            boardId
        };
    });
}
function getProjectsForBoard(boardId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        return yield database_1.db.all('SELECT * FROM project WHERE board_id = ?', [boardId]);
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
function getPostsByProject(projectId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        return database_1.db.all(`
    SELECT
      p.id,
      p.title,
      p.content,
      p.type,
      p.image,
      p.createdAt,
      u.username       AS username,
      u.profile_image  AS avatar
    FROM Posts p
    JOIN users u        ON u.id = p.userId
    WHERE p.project_id = ?
    ORDER BY p.createdAt DESC
  `, [projectId]);
    });
}
function getMemberBoards(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        return yield database_1.db.all(`SELECT b.*
       FROM boards b
       JOIN BoardMembers bm ON b.id = bm.boardId
      WHERE bm.userId = ?`, [userId]);
    });
}
