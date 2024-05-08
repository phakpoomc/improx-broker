import express from 'express'
import * as path from 'path'

import { api_cfg } from './global.js'

// console.log(__dirname);

export var web_server

export function initWeb() {
    var web = express()
    let webpath = path.join(process.cwd(), 'webserver')

    web.use(express.static(webpath))

    web.get('/', (req, res) => {
        res.sendFile(path.join(webpath, 'index.html'))
    })

    web.get('/api_info', (req, res) => {
        res.json(api_cfg)
    })

    web_server = web.listen(8844, () => {
        console.log('Web server is running at 8844.')
    })
}
