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
exports.moderatorHandler = exports.adminHandler = exports.authHandler = void 0;
const database_1 = require("../database");
function authHandler(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((req.session).user) {
            next();
        }
        else {
            res.status(401).send('Unauthorized');
        }
    });
}
exports.authHandler = authHandler;
function adminHandler(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((req.session).user) {
            const username = (req.session).user;
            try {
                const role = yield (0, database_1.getUserRole)(username);
                if (role === 'admin') {
                    next();
                }
                else {
                    res.status(401).send('Unauthorized');
                }
            }
            catch (error) {
                res.status(401).send('Server Error');
            }
        }
        else {
            res.status(401).send('Unauthorized');
        }
    });
}
exports.adminHandler = adminHandler;
function moderatorHandler(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((req.session).user) {
            const username = (req.session).user;
            try {
                const role = yield (0, database_1.getUserRole)(username);
                if (role === 'moderator' || role === 'admin') {
                    next();
                }
                else {
                    res.status(401).send('Unauthorized');
                }
            }
            catch (error) {
                res.status(401).send('Server Error');
            }
        }
        else {
            res.status(401).send('Unauthorized');
        }
    });
}
exports.moderatorHandler = moderatorHandler;
