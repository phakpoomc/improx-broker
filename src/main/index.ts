import { app, shell, BrowserWindow, ipcMain/*, safeStorage*/ } from 'electron'
import * as path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'


/* MQTT Broker Section */
import Aedes from 'aedes'
import { createServer as wsCreateServer } from 'aedes-server-factory'
import { existsSync, readFileSync, writeFileSync } from 'fs';

const BN_CFG_PATH = path.resolve(app.getPath('appData'), 'blacknode.info');


interface Meter {
  id: Number;
  name: string;
  status: string;
  last_update: Date;
}

interface Blacknode {
  name: string;
  serial: string;
  siteid: string;
  nodeid: string;
  meteron: any;
  meteroff: any;
  metercount: any;
  meter_list: Array<Meter>;
  status: string;
  last_update: Date;
}

var DISCOVERY = true;
var blacknode = {};
var bn_list: Blacknode[] = [];

var bn_cb_registered = false;

var aedesInst; 
var httpServer; 

const WS_PORT = 8884

function writeFile(path, data, flag)
{
  // if(safeStorage.isEncryptionAvailable())
  // {
  //   writeFileSync(path, safeStorage.encryptString(data));
  // }
  // else
  // {
  //   writeFileSync(path, data);
  // }
  writeFileSync(path, data, flag);
}

function readFile(path, flag)
{
  if(!existsSync(path))
  {
    // if(safeStorage.isEncryptionAvailable())
    // {
    //   let encText = safeStorage.encryptString('{}');

    //   writeFileSync(path, encText);
    //   return encText;
    // }
    // else
    // {
    //   writeFileSync(path, "{}");
    //   return "{}";
    // }
    writeFileSync(path, "{}", {flag: 'w'});
  }

  let data = readFileSync(path, flag);

  // if(safeStorage.isEncryptionAvailable())
  // {
  //   return safeStorage.decryptString(data);
  // }
  // else
  // {
  //   return data;
  // }
  return data.toString();
}

function startMQTT()
{
  aedesInst = new Aedes()
  httpServer = wsCreateServer(aedesInst, {ws: true})

  loadBNInfoFromLocal()

  aedesInst.on('publish', function(pkt, _client) {
    if(DISCOVERY)
    {
      const re = /LOG\/(DATABASE|REALTIME)\/(.*?)\/(.*?)\/(\d*)/;
      let m = pkt.topic.match(re);
  
      if(m)
      {
        let meterKey = m[2] + '-' + m[3] + '-' + m[4];
        let bnKey = m[2] + "-" + m[3];
        let meterID = Number(m[4]);
  
        if(!blacknode.hasOwnProperty(bnKey))
        {
          let obj: Blacknode = {
            'name': bnKey,
            'serial': bnKey,
            'siteid': m[2],
            'nodeid': m[3],
            'meteron': 1,
            'meteroff': 0,
            'metercount': 1,
            'meter_list': [],
            'status': 'on',
            'last_update': new Date()
          }

          for(let i=0; i<30; i++)
          {
            let initMeter: Meter = {
              id: i,
              name: 'undefined',
              status: 'off',
              last_update: new Date()
            }

            obj.meter_list.push(initMeter);
          }

          let meterObj: Meter = {
            id: meterID,
            name: meterKey,
            status: 'on',
            last_update: new Date()
          }

          if(meterID >=0 && meterID < 30)
          {
            obj.meter_list[meterID] = meterObj;
          }
          else
          {
            obj.meter_list[0] = meterObj;
          }

          bn_list.push(obj);

          blacknode[bnKey] = obj;

          writeFile(BN_CFG_PATH, JSON.stringify(blacknode), {flag: 'w'});
        }
        else
        {
          let meterID = Number(m[4]);

          let meterObj: Meter = {
            id: meterID,
            name: meterKey,
            status: 'on',
            last_update: new Date()
          }

          if(meterID >=0 && meterID < 30)
          {
            blacknode[bnKey].meter_list[meterID] = meterObj;
          }
          else
          {
            blacknode[bnKey].meter_list[0] = meterObj;
          }
          
          blacknode[bnKey].metercount++;
          blacknode[bnKey].meteron++;
          blacknode[bnKey].status = 'on';
          blacknode[bnKey].last_update = new Date();
          blacknode[bnKey].meter_list[meterID] = meterObj;


          writeFile(BN_CFG_PATH, JSON.stringify(blacknode), {flag: 'w'});

          
        }
      }
    }
  
    if(pkt.topic == 'bn_comm')
    {
      // let jsonData;
  
      // try
      // {
      //   jsonData = JSON.parse(pkt.payload.toString());
      //   // handleComm(jsonData);
      // }
      // catch(err)
      // {
      //   // Not a JSON
      // } 
      
    }
  
    // console.log(pkt.topic, pkt.payload.toString(), client);
  });
  
  httpServer.listen(WS_PORT, function () {
    console.log('websocket server listening on port ', WS_PORT)
  })
}

function loadBNInfoFromLocal()
{
  const data = readFile(BN_CFG_PATH, { encoding: 'utf-8', flag: 'r' });

  blacknode = JSON.parse(data);

  bn_list = [];

  for(let key in blacknode)
  {
    let obj: Blacknode = {
      'name': blacknode[key]['name'],
      'serial': blacknode[key]['serial'],
      'siteid': blacknode[key]['siteid'],
      'nodeid': blacknode[key]['nodeid'],
      'meteron': blacknode[key]['meteron'],
      'meteroff': blacknode[key]['meteroff'],
      'metercount': blacknode[key]['metercount'],
      'meter_list': blacknode[key]['meter_list'],
      'status': blacknode[key]['status'],
      'last_update': blacknode[key]['last_update']
    }

    bn_list.push(obj)
  }
}

// function resetMeterList()
// {
//   writeFileSync(__dirname + '\\meters.info', '{}', {flag: 'w' });
// }

// function handleComm(payload)
// {
//   console.log('handleComm: ', payload);

//   // if(payload['cmd'] == 'get_meter_cfg')
//   // {
//   //   let pkt = {
//   //     'cmd': 'get_meter_cfg_response',
//   //     'data': meters
//   //   };

//   //   aedesInst.publish({cmd: 'publish', qos: 2, dup: false, retain: false, topic: 'bn_comm', 'payload': JSON.stringify(pkt)}, function() {});

//   //   return true;
//   // }
//   // else if(payload['cmd'] == 'set_meter_cfg')
//   // {
//   //   meters = payload['data'];
//   //   meterCount = Object.keys(payload['data']).length;

//   //   writeFileSync('meters.info', JSON.stringify(meters), {flag: 'w' });

//   //   let pkt = {
//   //     'cmd': 'set_meter_cfg_response',
//   //     'data': 'success'
//   //   };

//   //   aedesInst.publish({cmd: 'publish', qos: 2, dup: false, retain: false, topic: 'bn_comm', 'payload': JSON.stringify(pkt)}, function() {});
//   // }
//   // else if(payload['cmd'] == 'get_bn_cfg')
//   // {
//   //   let pkt = {
//   //     'cmd': 'get_bn_cfg_response',
//   //     'data': blacknode
//   //   };

//   //   aedesInst.publish({cmd: 'publish', qos: 2, dup: false, retain: false, topic: 'bn_comm', 'payload': JSON.stringify(pkt)}, function() {});

//   //   return true;
//   // }
//   // else if(payload['cmd'] == 'set_bn_cfg')
//   // {

//   //   blacknode = payload['data'];

//   //   writeFileSync('blacknode.info', JSON.stringify(payload['data']), {flag: 'w' });

//   //   let pkt = {
//   //     'cmd': 'set_bn_cfg_response',
//   //     'data': 'success'
//   //   };

//   //   aedesInst.publish({cmd: 'publish', qos: 2, dup: false, retain: false, topic: 'bn_comm', 'payload': JSON.stringify(pkt)}, function() {});
//   // }
//   // else if(payload['cmd'] == 'reboot')
//   // {
//   //   console.log('Reboot blacknode server');
//   // }
//   // else
//   // {
//   //   return false;
//   // }

//   return false;
// }

/* End of MQTT Broker Section */

let mainWindow;

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 1024,
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

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
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
var username = ""

app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  ipcMain.handle('auth:isAuthenticated', () => {
    return authenticated
  });

  ipcMain.handle('auth:getUsername', () => {
    return username
  });

  ipcMain.handle('handler:isBlacknodeCallbackRegistered', () => {
    return bn_cb_registered;
  });

  ipcMain.handle('cmd:updateBN', (_event, cfg) => {
    console.log('Update: ', cfg);

    let pkt = {
      'cmd': 'update_bn_cfg',
      'data': cfg
    };

    aedesInst.publish({cmd: 'publish', qos: 2, dup: false, retain: false, topic: 'bn_comm', 'payload': JSON.stringify(pkt)}, function() {});

  });

  ipcMain.handle('cmd:resetBN', (_event, key) => {
    // Reset based on command or topic
    console.log('Reset: ', key);
    let pkt = {
      'cmd': 'reset',
      'data': key
    };

    aedesInst.publish({cmd: 'publish', qos: 2, dup: false, retain: false, topic: 'bn_comm', 'payload': JSON.stringify(pkt)}, function() {});
  });

  ipcMain.handle('cmd:removeBN', (_event, key) => {
    console.log('Removing key ', key, bn_list);
    delete blacknode[key];
    
    let found = -1;
    for(let i=0; i<bn_list.length; i++)
    {
      console.log(bn_list[i].name);
      if(bn_list[i].name == key)
      {
        found = i;
        console.log(found);
        break;
      }
    }

    if(found != -1)
    {
      bn_list.splice(found, 1);
    }

    console.log('After: ', bn_list);

    writeFile(BN_CFG_PATH, JSON.stringify(blacknode), {flag: 'w'});
  });

  ipcMain.handle('data:getBlacknodeCFG', (_event, key) => {
    if(blacknode.hasOwnProperty(key))
    {
      return blacknode[key];
    }
    else
    {
      return null;
    }
  });

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

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.



ipcMain.on('authenticate', (_event, args) => {
  let data = JSON.parse(args);

  //console.log(event);

  if(data['username'] == '' && data['password'] == '')
  {
    authenticated = true
    username = data['username']

    if(!aedesInst)
    {
      startMQTT()
    }
  }
  else
  {
    authenticated = false
  }
});

ipcMain.on('logout', (_event, _args) => {
  authenticated = false
  username = ''

  aedesInst.close(function(){})
  aedesInst = false

  httpServer.close(function(){})
  
  //console.log(event, args);
});

ipcMain.on('registerCB', (_event, _args) => {
  bn_cb_registered = true
});

setInterval(() => {
  // const obj: Blacknode = {
  //   'name': 'sitename' + String(iteration),
  //   'siteid': String(iteration),
  //   'nodeid': String(iteration),
  //   'meteron': 0,
  //   'meteroff': 0,
  //   'metercount': 0,
  //   'meter_list': []
  // }
  // bn_list.push(obj);

  mainWindow.webContents.send('update-bn', bn_list);
}, 1000)
