"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const express_session_1 = __importDefault(require("express-session"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_router_1 = __importDefault(require("./router/auth-router"));
const file_router_1 = __importDefault(require("./router/file-router"));
const role_router_1 = __importDefault(require("./router/role-router"));
const board_router_1 = __importDefault(require("./router/board-router"));
const users_router_1 = __importDefault(require("./router/users-router"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = 3001;
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'whatever-man',
    resave: false,
    saveUninitialized: true,
}));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, 'uploads')));
app.use('/', auth_router_1.default);
app.use('/', file_router_1.default);
app.use('/', role_router_1.default);
app.use('/', board_router_1.default);
app.use('/', users_router_1.default);
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
