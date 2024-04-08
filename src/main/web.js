import express from 'express';
import * as path from 'path'

// import { last } from './global.js';

// console.log(__dirname);

export var web_server;

export function initWeb()
{
    var web = express();
    let webpath = path.join(process.cwd(), 'webserver');
    // webpath = "D:\\project\\improx-broker\\dist\\win-unpacked\\webserver\\"
    web.use(express.static(webpath));

    web.get('/', (req, res) => {
        res.sendFile(path.join(webpath, 'index.html'));
    });

    web_server = web.listen(8844, () => {
        console.log('Web server is running at 8844.');
    });
}
