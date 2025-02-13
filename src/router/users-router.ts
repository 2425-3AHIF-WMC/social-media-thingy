import path from "path";
import fs from "fs";

const usersDir = path.resolve(__dirname, '..', 'users');

if(!fs.existsSync(usersDir)){
    fs.mkdirSync(usersDir, {recursive: true});
}