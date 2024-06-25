import express from 'express'
import * as path from 'path'

import { meta_cfg } from './global.js'

// console.log(__dirname);

export var web_server

export function initWeb() {
    if(web_server)
    {
        web_server.close()
    }

    var web = express()
    let webpath = path.join(process.cwd(), 'webserver')

    web.post('/api_info', (req, res) => {
        res.json(meta_cfg.api)
    })

    web.use(express.static(webpath))

    web.get('/', (req, res) => {
        res.sendFile(path.join(webpath, 'index.html'))
    })

    web_server = web.listen((meta_cfg.broker.webport) ? meta_cfg.broker.webport : 8844, () => {
        console.log('Web server is running at ', (meta_cfg.broker.webport) ? meta_cfg.broker.webport : 8844)
    })
}
