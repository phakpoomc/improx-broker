import express from 'express';
import * as path from 'path'

// import { last } from './global.js';

// console.log(__dirname);

export const web = express();

export function initWeb()
{
    let webpath = path.join(process.cwd(), 'webserver');
    // webpath = "D:\\project\\improx-broker\\dist\\win-unpacked\\webserver\\"
    web.use(express.static(webpath));

    web.get('/', (req, res) => {
        res.sendFile(path.join(webpath, 'index.html'));
    });
}
