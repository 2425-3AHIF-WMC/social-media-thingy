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
exports.getUserRole = getUserRole;
exports.giveModerator = giveModerator;
exports.removeModerator = removeModerator;
exports.giveUserInformation = giveUserInformation;
exports.getUserInfo = getUserInfo;
exports.getUserID = getUserID;
exports.getUserNameById = getUserNameById;
exports.updateUserFieldInDB = updateUserFieldInDB;
exports.updateUserProfileImage = updateUserProfileImage;
exports.updateProfileHeaderImage = updateProfileHeaderImage;
exports.getUserById = getUserById;
const database_1 = require("./database");
///Get functions
function getUserRole(username) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const user = yield database_1.db.get('SELECT role FROM users WHERE username = ?', username);
        if (!user) {
            throw new Error('User not found');
        }
        return user.role;
    });
}
function giveModerator(username) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const user = yield database_1.db.get('SELECT * FROM users WHERE username = ?', username);
        if (!user) {
            throw new Error('User not found');
        }
        yield database_1.db.run('UPDATE users SET role = ? WHERE username = ?', 'moderator', username);
    });
}
function removeModerator(username) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const user = yield database_1.db.get('SELECT * FROM users WHERE username = ?', username);
        if (!user) {
            throw new Error('User not found');
        }
        yield database_1.db.run('UPDATE users SET role = ? WHERE username = ?', 'user', username);
    });
}
function giveUserInformation(username) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const user = yield database_1.db.get('SELECT * FROM users WHERE username = ?', username);
        if (!user) {
            throw new Error('User not found');
        }
        return {
            username: user.username,
            email: user.email,
            role: user.role,
            bio: user.bio,
            pronouns: user.pronouns,
            links: user.links,
            badges: user.badges,
            profile_image: user.profile_image,
            header_image: user.header_image
        };
    });
}
function getUserInfo(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        return yield database_1.db.get('SELECT * FROM users WHERE id = ?', [userId]);
    });
}
function getUserID(username) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const user = yield database_1.db.get('SELECT id FROM users WHERE username = ?', username);
        if (!user) {
            throw new Error('User not found');
        }
        return user.id;
    });
}
function getUserNameById(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        const user = yield database_1.db.get('SELECT username FROM users WHERE id = ?', userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user.username;
    });
}
function updateUserFieldInDB(userId, field, value) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, database_1.init)();
            const allowedFields = ["bio", "pronouns", "links", "badges"]; // Ensure only valid fields are updated
            if (!allowedFields.includes(field)) {
                console.error("Invalid field update attempt:", field);
                return false;
            }
            yield database_1.db.run(`UPDATE users SET ${field} = ? WHERE id = ?`, [value, userId]);
            return true;
        }
        catch (error) {
            console.error("Error updating user field in database:", error);
            return false;
        }
    });
}
function updateUserProfileImage(userId, profileImage) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, database_1.init)();
            yield database_1.db.run('UPDATE users SET profile_image = ? WHERE id = ?', [profileImage, userId]);
            return true;
        }
        catch (error) {
            console.error("Error updating profile image in database:", error);
            return false;
        }
    });
}
function updateProfileHeaderImage(userId, headerImage) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, database_1.init)();
            yield database_1.db.run('UPDATE users SET header_image = ? WHERE id = ?', [headerImage, userId]);
            return true;
        }
        catch (error) {
            console.error("Error updating header image in database:", error);
            return false;
        }
    });
}
function getUserById(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.init)();
        return database_1.db.get(`SELECT id, username, profile_image
     FROM users
     WHERE id = ?`, [userId]);
    });
}
(0, database_1.init)().catch(console.error);
