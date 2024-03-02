import { app, shell, BrowserWindow, ipcMain/*, safeStorage*/ } from 'electron'
import * as path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'


/* MQTT Broker Section */
import Aedes from 'aedes'
import { createServer as wsCreateServer } from 'aedes-server-factory'
import { existsSync, readFileSync, writeFileSync } from 'fs';

const METER_CFG_PATH = path.resolve(app.getPath('appData'), 'meters.info');
const BN_CFG_PATH = path.resolve(app.getPath('appData'), 'blacknode.info');


interface Meter {
  id: Number;
  name: string;
}

interface Blacknode {
  name: string;
  siteid: string;
  nodeid: string;
  meteron: any;
  meteroff: any;
  metercount: any;
  meter_list: Array<Meter>;
}

var DISCOVERY = true;
var meters = {};
var meterCount = 0;
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

  loadMeterInfoFromLocal()
  loadBNInfoFromLocal()

  aedesInst.on('publish', function(pkt, _client) {
    if(DISCOVERY)
    {
      const re = /LOG\/(DATABASE|REALTIME)\/(.*?)\/(.*?)\/(\d*)/;
      let m = pkt.topic.match(re);
  
      if(m)
      {
        let meterKey = m[2] + '-' + m[3] + '-' + m[4];
        meters[meterKey] = {'connected': true, 'meter_name': pkt.topic, 'modbus': -1, 'address': -1};
  
        let newMeterCount = Object.keys(meters).length;
  
        if(meterCount != newMeterCount)
        {
          meterCount = newMeterCount;
  
          writeFile(METER_CFG_PATH, JSON.stringify(meters), {flag: 'w' });

          let bnKey = m[2] + "-" + m[3];
          if(!blacknode.hasOwnProperty(bnKey))
          {
            let meterObj: Meter = {
              id: 0,
              name: meterKey
            }

            let obj: Blacknode = {
              'name': bnKey,
              'siteid': m[2],
              'nodeid': m[3],
              'meteron': 1,
              'meteroff': 0,
              'metercount': 1,
              'meter_list': [meterObj]
            }

            bn_list.push(obj);

            blacknode[bnKey] = obj;

            writeFile(BN_CFG_PATH, JSON.stringify(blacknode), {flag: 'w'});
          }
          else
          {
            let currentMeter = blacknode[bnKey].metercount+1;

            let meterObj: Meter = {
              id: currentMeter,
              name: meterKey
            }

            blacknode[bnKey].metercount++;
            blacknode[bnKey].meteron++;
            blacknode[bnKey].meterList.push(meterObj);

            writeFile(BN_CFG_PATH, JSON.stringify(blacknode), {flag: 'w'});

            for(let b of bn_list)
            {
              if(b.name == bnKey)
              {
                b.meteron++;
                b.metercount++;
                b.meter_list.push(meterObj);
              }
            }
          }
        }
      }
    }
  
    if(pkt.topic == 'bn_comm')
    {
      let jsonData;
  
      try
      {
        jsonData = JSON.parse(pkt.payload.toString());
        handleComm(jsonData);
      }
      catch(err)
      {
        // Not a JSON
      } 
      
    }
  
    // console.log(pkt.topic, pkt.payload.toString(), client);
  });
  
  httpServer.listen(WS_PORT, function () {
    console.log('websocket server listening on port ', WS_PORT)
  })
}

function loadMeterInfoFromLocal()
{
  const data = readFile(METER_CFG_PATH, { encoding: 'utf-8', flag: 'r' });

  meters = JSON.parse(data);
  meterCount = Object.keys(meters).length;
}

function loadBNInfoFromLocal()
{
  const data = readFile(BN_CFG_PATH, { encoding: 'utf-8', flag: 'r' });

  blacknode = JSON.parse(data);

  for(let key in blacknode)
  {
    let obj: Blacknode = {
      'name': blacknode[key]['sitename'],
      'siteid': blacknode[key]['siteid'],
      'nodeid': blacknode[key]['nodeid'],
      'meteron': blacknode[key]['meteron'],
      'meteroff': blacknode[key]['meteroff'],
      'metercount': blacknode[key]['metercount'],
      'meter_list': blacknode[key]['meter_list']
    }

    bn_list.push(obj)
  }
}

// function resetMeterList()
// {
//   writeFileSync(__dirname + '\\meters.info', '{}', {flag: 'w' });
// }

function handleComm(payload)
{
  console.log('handleComm: ', payload);

  if(payload['cmd'] == 'get_meter_cfg')
  {
    let pkt = {
      'cmd': 'get_meter_cfg_response',
      'data': meters
    };

    aedesInst.publish({cmd: 'publish', qos: 2, dup: false, retain: false, topic: 'bn_comm', 'payload': JSON.stringify(pkt)}, function() {});

    return true;
  }
  else if(payload['cmd'] == 'set_meter_cfg')
  {
    meters = payload['data'];
    meterCount = Object.keys(payload['data']).length;

    writeFileSync('meters.info', JSON.stringify(meters), {flag: 'w' });

    let pkt = {
      'cmd': 'set_meter_cfg_response',
      'data': 'success'
    };

    aedesInst.publish({cmd: 'publish', qos: 2, dup: false, retain: false, topic: 'bn_comm', 'payload': JSON.stringify(pkt)}, function() {});
  }
  else if(payload['cmd'] == 'get_bn_cfg')
  {
    let pkt = {
      'cmd': 'get_bn_cfg_response',
      'data': blacknode
    };

    aedesInst.publish({cmd: 'publish', qos: 2, dup: false, retain: false, topic: 'bn_comm', 'payload': JSON.stringify(pkt)}, function() {});

    return true;
  }
  else if(payload['cmd'] == 'set_bn_cfg')
  {

    blacknode = payload['data'];

    writeFileSync('blacknode.info', JSON.stringify(payload['data']), {flag: 'w' });

    let pkt = {
      'cmd': 'set_bn_cfg_response',
      'data': 'success'
    };

    aedesInst.publish({cmd: 'publish', qos: 2, dup: false, retain: false, topic: 'bn_comm', 'payload': JSON.stringify(pkt)}, function() {});
  }
  else if(payload['cmd'] == 'reboot')
  {
    console.log('Reboot blacknode server');
  }
  else
  {
    return false;
  }

  return false;
}

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
    console.log('Handle: ', authenticated)
    return authenticated
  });

  ipcMain.handle('auth:getUsername', () => {
    return username
  });

  ipcMain.handle('handler:isBlacknodeCallbackRegistered', () => {
    return bn_cb_registered;
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

  if(data['username'] == 'admin' && data['password'] == 'password')
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
}, 5000)
