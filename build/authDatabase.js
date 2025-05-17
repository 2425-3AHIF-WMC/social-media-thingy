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
exports.register = register;
exports.login = login;
exports.logout = logout;
exports.getOnlineUsers = getOnlineUsers;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = require("./database");
const onlineUsers = new Set();
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
            yield (0, database_1.init)();
            const user = yield database_1.db.get('SELECT * FROM users WHERE username = ?', [username]);
            const email = yield database_1.db.get('SELECT * FROM users WHERE email = ?', [givenEmail]);
            if (user) {
                throw new Error('User already exists');
            }
            if (email) {
                throw new Error('Email already exists');
            }
            const hashedPassword = yield bcrypt_1.default.hash(password, 10);
            yield database_1.db.run('INSERT INTO users (username, password, role, email) VALUES (?, ?, ?, ?)', [username, hashedPassword, role, givenEmail]);
        }
        catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    });
}
function login(username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, database_1.init)();
            const user = yield database_1.db.get('SELECT * FROM users WHERE username = ?', [username]);
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
function logout(username) {
    onlineUsers.delete(username);
}
function getOnlineUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        return Array.from(onlineUsers);
    });
}
