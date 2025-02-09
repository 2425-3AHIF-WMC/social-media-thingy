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
exports.getOnlineUsers = exports.logout = exports.giveUserInformation = exports.removeModerator = exports.giveModerator = exports.getUserRole = exports.login = exports.register = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
let db;
const onlineUsers = new Set();
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!db) {
            db = yield (0, sqlite_1.open)({
                filename: './data/users.sqlite',
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
            const uuid = (0, uuid_1.v4)();
            yield db.run('INSERT INTO users (username, password, role, email, uuid) VALUES (?, ?, ?, ?, ?)', [username, hashedPassword, role, givenEmail, uuid]);
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
init().catch(console.error);
