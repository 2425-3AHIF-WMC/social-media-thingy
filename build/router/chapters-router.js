"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const chapterStorage = multer_1.default.diskStorage({ /* dest: 'uploads/chapters' */});
const comicStorage = multer_1.default.diskStorage({ /* dest: 'uploads/comics'   */});
