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
exports.getBoards = exports.createBoard = exports.getOnlineUsers = exports.logout = exports.giveUserInformation = exports.removeModerator = exports.giveModerator = exports.getUserRole = exports.login = exports.register = exports.getUserID = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const bcrypt_1 = __importDefault(require("bcrypt"));
let db;
const onlineUsers = new Set();
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!db) {
            db = yield (0, sqlite_1.open)({
                filename: './data/aegiraDatabase.sqlite',
                driver: sqlite3_1.default.Database
            });
        }
    });
}
function register(username_1, password_1) {
    return __awaiter(this, arguments, void 0, function* (username, password, role = 'user', givenEmail) {
        try {
            if (!username) {
                throw new Error('Username is required');
            }
            if (!password) {
                throw new Error('Password is required');
            }
            if (!givenEmail) {
                throw new Error('Email is required');
            }
            yield init();
            const user = yield db.get('SELECT * FROM users WHERE username = ?', [username]);
            const email = yield db.get('SELECT * FROM users WHERE email = ?', [givenEmail]);
            if (user) {
                throw new Error('User already exists');
            }
            if (email) {
                throw new Error('Email already exists');
            }
            const hashedPassword = yield bcrypt_1.default.hash(password, 10);
            yield db.run('INSERT INTO users (username, password, role, email) VALUES (?, ?, ?, ?)', [username, hashedPassword, role, givenEmail]);
        }
        catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    });
}
exports.register = register;
function login(username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield init();
            const user = yield db.get('SELECT * FROM users WHERE username = ?', [username]);
            if (!user) {
                throw new Error('Invalid username or password');
            }
            const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                throw new Error('Invalid username or password');
            }
            onlineUsers.add(username);
        }
        catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    });
}
exports.login = login;
function logout(username) {
    onlineUsers.delete(username);
}
exports.logout = logout;
function getUserRole(username) {
    return __awaiter(this, void 0, void 0, function* () {
        yield init();
        const user = yield db.get('SELECT role FROM users WHERE username = ?', username);
        if (!user) {
            throw new Error('User not found');
        }
        return user.role;
    });
}
exports.getUserRole = getUserRole;
function giveModerator(username) {
    return __awaiter(this, void 0, void 0, function* () {
        yield init();
        const user = yield db.get('SELECT * FROM users WHERE username = ?', username);
        if (!user) {
            throw new Error('User not found');
        }
        yield db.run('UPDATE users SET role = ? WHERE username = ?', 'moderator', username);
    });
}
exports.giveModerator = giveModerator;
function removeModerator(username) {
    return __awaiter(this, void 0, void 0, function* () {
        yield init();
        const user = yield db.get('SELECT * FROM users WHERE username = ?', username);
        if (!user) {
            throw new Error('User not found');
        }
        yield db.run('UPDATE users SET role = ? WHERE username = ?', 'user', username);
    });
}
exports.removeModerator = removeModerator;
function giveUserInformation(username) {
    return __awaiter(this, void 0, void 0, function* () {
        yield init();
        const user = yield db.get('SELECT * FROM users WHERE username = ?', username);
        if (!user) {
            throw new Error('User not found');
        }
        return {
            username: user.username,
            email: user.email,
            role: user.role
        };
    });
}
exports.giveUserInformation = giveUserInformation;
function getOnlineUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        return Array.from(onlineUsers);
    });
}
exports.getOnlineUsers = getOnlineUsers;
function getUserID(username) {
    return __awaiter(this, void 0, void 0, function* () {
        yield init();
        const user = yield db.get('SELECT id FROM users WHERE username = ?', username);
        if (!user) {
            throw new Error('User not found');
        }
        return user.id;
    });
}
exports.getUserID = getUserID;
function createBoard(ownerID_1, name_1, description_1) {
    return __awaiter(this, arguments, void 0, function* (ownerID, name, description, profileImage = 'default_profile.png', headerImage = 'default_header.png') {
        yield init();
        const result = yield db.run('INSERT INTO boards (name, description, ownerId,  profile_image, header_image) VALUES (?,?, ?, ?, ?)', [name, description, ownerID, profileImage, headerImage]);
        return { id: result.lastID, name, description, profileImage, headerImage };
    });
}
exports.createBoard = createBoard;
function getBoards() {
    return __awaiter(this, void 0, void 0, function* () {
        yield init();
        return yield db.all('SELECT * FROM boards');
    });
}
exports.getBoards = getBoards;
init().catch(console.error);
