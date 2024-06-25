import { app, shell, BrowserWindow, ipcMain, /*autoUpdater, dialog, safeStorage*/ } from 'electron'
import * as path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

import AutoLaunch from 'auto-launch'

import {
    last,
    meta_cfg,
    blacknode,
    writeFile,
    paths,
    loadMetaCFG,
    loadMetaDB,
    checkHeartbeat,
    db,
    // savetoDB
} from './global.js'

import { api_server, initAPI } from './api.js'
import { web_server, initWeb } from './web.js'
import { syncDB } from './db.js'

import crypto from 'crypto'

const QOS = 2

function loginWith(uname, pwd)
{
    let correctHash = crypto.createHash('sha512')
    correctHash.update('password')

    if(uname == 'admin' && pwd == correctHash.digest('hex'))
    {
        return true
    }
    else
    {
        return false
    }
}

// const updateServer = "https://nexusenergyct.com";
// const url = `${updateServer}/update_service/${process.platform}/${app.getVersion()}`

// autoUpdater.setFeedURL({ url })

// autoUpdater.checkForUpdates()

// autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
//     const dialogOpts = {
//         type: 'info',
//         buttons: ['Restart', 'Later'],
//         title: 'Application Update',
//         message: process.platform === 'win32' ? releaseNotes : releaseName,
//         detail:
//         'A new version has been downloaded. Restart the application to apply the updates.'
//     }

//     dialog.showMessageBox(dialogOpts).then((returnValue) => {
//         if (returnValue.response === 0) autoUpdater.quitAndInstall()
//     })
// })

// autoUpdater.on('error', (message) => {
//     console.error('There was a problem updating the application')
//     console.error(message)
// })

/* DB Section */
// const META_CFG_PATH = path.resolve(app.getPath('appData'), 'meta.cfg')
const META_CFG_PATH = path.join(process.cwd(), 'meta.cfg')
paths['META_CFG_PATH'] = META_CFG_PATH

/* MQTT Broker Section */
import { aedesInst, httpServer, startMQTT } from './mqtt.js'
var bn_cb_registered = false

// const BN_CFG_PATH = path.resolve(app.getPath('appData'), 'blacknode.info')
const BN_CFG_PATH = path.join(process.cwd(), 'blacknode.info')
paths['BN_CFG_PATH'] = BN_CFG_PATH

/* End of MQTT Broker Section */

let mainWindow
var gettimeTimeout

function createWindow(): void {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        minWidth: 900,
        minHeight: 700,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux'
            ? {
                  icon: path.join(__dirname, '../../build/icon.png')
              }
            : {}),
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })

    mainWindow.on('ready-to-show', async () => {
        mainWindow.show()

        loadMetaCFG()

        if(meta_cfg.auth_cred.remember)
        {
            if(loginWith(meta_cfg.auth_cred.username, meta_cfg.auth_cred.password))
            {
                authenticated = true
                username = meta_cfg.auth_cred.username;

                if (!aedesInst || aedesInst.closed) {
                    startMQTT(BN_CFG_PATH)
                    initWeb()
                    initAPI()
                    
                    await syncDB()
                    await loadMetaDB()
                }
            }
        }
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

var authenticated = false
var username = ''

app.whenReady().then(async () => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    ipcMain.handle('auth:isAuthenticated', () => {
        return authenticated
    })

    ipcMain.handle('auth:getUsername', () => {
        return username
    })

    ipcMain.handle('handler:isBlacknodeCallbackRegistered', () => {
        return bn_cb_registered
    })

    ipcMain.handle('cmd:updateBN', async (_event, cfg, sn) => {

        let prev_max = parseInt(blacknode[sn].maxmeter)
        let curr_max = parseInt(cfg.maxmeter)

        // let prev_siteid = blacknode[sn].siteid;
        // let prev_nodeid = blacknode[sn].nodeid;

        let pkt =
            't=' +
            cfg.period +
            '|ips=' +
            cfg.mqtt +
            '|ipc=' +
            cfg.clientip +
            '|sub=' +
            cfg.subnet +
            '|gate=' +
            cfg.gateway +
            '|dns=' +
            cfg.dns +
            '|key=' +
            cfg.siteid +
            '/' +
            cfg.nodeid +
            '|user=admin|pass=password|tal=' +
            String(cfg.maxmeter).padStart(2, '0') +
            '|'

        blacknode[sn].name = cfg.name
        blacknode[sn].period = cfg.period
        blacknode[sn].siteid = cfg.siteid
        blacknode[sn].nodeid = cfg.nodeid
        blacknode[sn].clientip = cfg.clientip
        blacknode[sn].mqtt = cfg.mqtt
        blacknode[sn].maxmeter = curr_max
        blacknode[sn].subnet = cfg.subnet
        blacknode[sn].gateway = cfg.gateway
        blacknode[sn].dns = cfg.dns

        if(curr_max < prev_max)
        {
            for(let i = curr_max; i < prev_max; i++)
            {
                if(db && db.gmember)
                {
                    await db.gmember.destroy({
                        where: {
                            SerialNo: sn,
                            SiteID: cfg.siteid,
                            NodeID: cfg.nodeid,
                            ModbusID: i+1
                        }
                    })
                }
            }
        }

        blacknode[sn].meter_list.length = curr_max

        if (curr_max > prev_max) {
            for (let i = prev_max; i < curr_max; i++) {
                let initMeter = {
                    id: i + 1,
                    name: 'undefined',
                    type: 0,
                    status: 'off',
                    last_update: new Date(),
                    last_db: new Date(0)
                }

                blacknode[sn].meter_list[i] = initMeter
            }
        }

        for (let i = 0; i < curr_max; i++) {
            if (i < prev_max) {
                blacknode[sn].meter_list[i].name = cfg.meter_list[i].name
                blacknode[sn].meter_list[i].type = cfg.meter_list[i].type

                if (cfg.meter_list[i].type != '') {
                    pkt +=
                        String(i + 1).padStart(2, '0') +
                        ':' +
                        cfg.meter_list[i].type.padStart(2, '0')
                } else {
                    pkt += String(i + 1).padStart(2, '0') + ':00'
                }
            } else {
                pkt += String(i + 1).padStart(2, '0') + ':00'
            }

            if (i != curr_max - 1) {
                pkt += '|'
            }
        }

        // if(db && db.gmember)
        // {
        //   db.gmember.update({
        //     SiteID: cfg.siteid,
        //     NodeID: cfg.nodeid
        //   }, {
        //     where: {
        //       SiteID: prev_siteid,
        //       NodeID: prev_nodeid,
        //     }
        //   });
        // }

        writeFile(BN_CFG_PATH, JSON.stringify(blacknode), { flag: 'w' })
        await loadMetaDB()

        if(cfg.sendack)
        {

            aedesInst.publish(
                { cmd: 'publish', qos: QOS, dup: false, retain: false, topic: 'ACK/' + sn, payload: pkt },
                function () {}
            )
        }
    })

    ipcMain.handle('cmd:resetBN', (_event, key) => {
        // Reset based on command or topic
        let pkt = 'reset'

        aedesInst.publish(
            {
                cmd: 'publish',
                qos: QOS,
                dup: false,
                retain: false,
                topic: 'RESET/' + key,
                payload: pkt
            },
            function () {}
        )
        last['message'] = 'Reset command was sent to ' + key + '.'
        last['time'] = new Date()
        last['status'] = 'success'
    })

    ipcMain.handle('cmd:removeBN', (_event, key) => {
        delete blacknode[key]

        writeFile(BN_CFG_PATH, JSON.stringify(blacknode), { flag: 'w' })
    })

    ipcMain.handle('data:getBlacknodeCFG', (_event, key) => {
        if (blacknode.hasOwnProperty(key)) {
            return blacknode[key]
        } else {
            return null
        }
    })

    ipcMain.handle('data:getDatabaseCFG', (_event) => {
        return meta_cfg.db
    })

    ipcMain.handle('data:setDatabaseCFG', async (_event, dbCFG) => {
        meta_cfg.db.host = dbCFG.host
        meta_cfg.db.port = dbCFG.port
        meta_cfg.db.dialect = dbCFG.dialect
        meta_cfg.db.dbname = dbCFG.dbname
        meta_cfg.db.username = dbCFG.username
        meta_cfg.db.password = dbCFG.password
 
        writeFile(META_CFG_PATH, JSON.stringify(meta_cfg), { flag: 'w' })

        await syncDB()
        await loadMetaDB()
    })

    ipcMain.handle('data:getAPICFG', (_event) => {
        return meta_cfg.api
    })

    ipcMain.handle('data:setAPICFG', (_event, apiCFG) => {
        meta_cfg.api.protocol = apiCFG.protocol
        meta_cfg.api.host = apiCFG.host
        meta_cfg.api.port = apiCFG.port
        meta_cfg.api.key = apiCFG.key

        writeFile(META_CFG_PATH, JSON.stringify(meta_cfg), { flag: 'w' })

        initAPI()
    })

    ipcMain.handle('data:getBrokerCFG', (_event) => {
        return meta_cfg.broker
    })

    ipcMain.handle('data:setBrokerCFG', async (_event, brokerCFG) => {
        meta_cfg.broker.webport = brokerCFG.webport
        meta_cfg.broker.apiport = brokerCFG.apiport
        meta_cfg.broker.autorun = brokerCFG.autorun
        meta_cfg.broker.cors = brokerCFG.cors

        writeFile(META_CFG_PATH, JSON.stringify(meta_cfg), { flag: 'w' })

        initAPI()
        initWeb()

        let autoLaunch = new AutoLaunch({
            name: app.getName(),
            path: app.getPath('exe')
            // path: process.cwd()
        })
    
        if(meta_cfg.broker.autorun)
        {
            autoLaunch.isEnabled().then((isEnabled) => {
                if(!isEnabled) autoLaunch.enable();
            })
        }
        else
        {
            autoLaunch.disable();
        }
    })

    ipcMain.handle('data:clearMessage', (_event) => {
        last['message'] = ''
        last['time'] = new Date()
        last['status'] = ''

        console.log('Clear messaged.')
    })

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// app.on('ready', () => {
//     // console.log(app.getName(), app.getPath('exe'), process.cwd());

    
// })

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('before-quit', async function () {
    clearInterval(secondInterval)
    clearInterval(minuteInterval)
    clearInterval(gettimeInterval)
    clearInterval(heartbeatInterval)
    // clearInterval(dbSaveInterval)

    // await savetoDB()

    if (gettimeTimeout) {
        clearTimeout(gettimeTimeout)
    }

    aedesInst.close(function () {})
    httpServer.close(function () {})
    api_server.close(function () {})
    web_server.close(function () {})
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('authenticate', async (_event, args) => {
    let data = JSON.parse(args)
    let hashPwd = crypto.createHash('sha512').update(data['password']).digest('hex')

    if (loginWith(data['username'], hashPwd)) {
        // last['message'] = 'Logged in successfully.';
        // last['time'] = new Date();
        // last['status'] = 'success';

        authenticated = true
        username = data['username']

        meta_cfg.auth_cred.username = username;
        meta_cfg.auth_cred.password = hashPwd
        meta_cfg.auth_cred.remember = data['remember'];

        writeFile(META_CFG_PATH, JSON.stringify(meta_cfg), { flag: 'w' })

        if (!aedesInst || aedesInst.closed) {
            loadMetaCFG()
            startMQTT(BN_CFG_PATH)
            initWeb()
            initAPI()
            
            
            await syncDB()
            await loadMetaDB()
        }
    } else {
        authenticated = false
        last['message'] = 'Username or password is incorrect.'
        last['time'] = new Date()
        last['status'] = 'error'
    }
})

ipcMain.on('logout', (_event, _args) => {
    authenticated = false
    username = ''

    aedesInst.close(function () {})

    // aedesInst = false

    httpServer.close(function () {})

    api_server.close(function () {})
    web_server.close(function () {})
})

ipcMain.on('registerCB', (_event, _args) => {
    bn_cb_registered = true
})

let secondInterval = setInterval(() => {
    // Send Blacknode info to front-end every 1 second.

    if (authenticated) {
        let now = new Date()
        if (now.getTime() - last['time'].getTime() > 10000) {
            last['message'] = ''
            last['time'] = now
            last['status'] = ''
        }

        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('update-bn', blacknode)
            mainWindow.webContents.send('last-message', last)
        }
    }
}, 1000)

let minuteInterval = setInterval(() => {
    // Save Blacknode every 5 minutes
    if (authenticated) {
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('update-bn', blacknode)
            mainWindow.webContents.send('last-message', last)

            if (Object.keys(blacknode).length > 0) {
                writeFile(BN_CFG_PATH, JSON.stringify(blacknode), { flag: 'w' })
            }
        }
    }
}, 5 * 60 * 1000)

let gettimeInterval = setInterval(() => {
    // sendtime every minute on the 0-9th second
    if (authenticated) {
        let now = new Date()

        if (aedesInst && !aedesInst.closed) {
            let pkt =
                'Y' +
                now.getFullYear() +
                'M' +
                String(now.getMonth() + 1).padStart(2, '0') +
                'D' +
                String(now.getDate()).padStart(2, '0') +
                'h' +
                String(now.getHours()).padStart(2, '0') +
                'm' +
                String(now.getMinutes()).padStart(2, '0') +
                's' +
                String(now.getSeconds()).padStart(2, '0')

            aedesInst.publish(
                {
                    cmd: 'publish',
                    qos: QOS,
                    dup: false,
                    retain: false,
                    topic: 'GETTIME',
                    payload: pkt
                },
                function () {}
            )
        }
    }
}, 5 * 1000)

let heartbeatInterval = setInterval(() => {
    // sendtime every minute on the 0-9th second
    if (authenticated) {
        if (aedesInst && !aedesInst.closed) {
            checkHeartbeat()
        }
    }
}, 15 * 60 * 1000)

// let dbSaveInterval = setInterval(() => {
//     if (authenticated) {
//         if (aedesInst && !aedesInst.closed) {
//             savetoDB()
//         }
//     }
// }, 5 * 1000)

// let gettimeInterval = setInterval(() => {
//   // sendtime every minute on the 0-9th second
//   if(authenticated)
//   {
//     let now = new Date();
//     let elapsedSecond = now.getTime() % (60*1000);

//     if(elapsedSecond < 9*1000)
//     {
//       // Send immediately
//       if(aedesInst && !aedesInst.closed)
//       {
//         let pkt = 'Y' + now.getFullYear() + 'M' + String(now.getMonth() + 1).padStart(2, '0') + 'D' + String(now.getDate()).padStart(2, '0') + 'h' + String(now.getHours()).padStart(2, '0') + 'm' + String(now.getMinutes()).padStart(2, '0') + 's' + String(now.getSeconds()).padStart(2, '0');

//         aedesInst.publish({cmd: 'publish', qos: 2, dup: false, retain: false, topic: 'GETTIME', 'payload': pkt}, function() {});
//       }

//     }
//     else
//     {
//       // Send later
//       gettimeTimeout = setTimeout(() => {
//         if(aedesInst && !aedesInst.closed)
//         {
//           let now = new Date();
//           let pkt = 'Y' + now.getFullYear() + 'M' + String(now.getMonth() + 1).padStart(2, '0') + 'D' + String(now.getDate()).padStart(2, '0') + 'h' + String(now.getHours()).padStart(2, '0') + 'm' + String(now.getMinutes()).padStart(2, '0') + 's' + String(now.getSeconds()).padStart(2, '0');

//           aedesInst.publish({cmd: 'publish', qos: 2, dup: false, retain: false, topic: 'GETTIME', 'payload': pkt}, function() {});
//         }

//       }, 65*1000 - elapsedSecond);
//     }
//   }
// }, 60*1000);
