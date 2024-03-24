import { app, shell, BrowserWindow, ipcMain/*, safeStorage*/ } from 'electron'
import * as path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

var last = {
  'message': '',
  'time': new Date(),
  'status': ''
};

/* DB Section */
const DB_CFG_PATH = path.resolve(app.getPath('appData'), 'db.info');

var database = {};

const db_data = readFile(DB_CFG_PATH, { encoding: 'utf-8', flag: 'r' });
database = JSON.parse(db_data);

import { Sequelize, DataTypes } from 'sequelize';

var energy;

function syncDB()
{
  
  if(database['dbname'] && database['dbname'] != '' && database['host'] && database['host'] != '' && database['port'] && database['port'] != '' && database['dialect'] && database['dialect'] != '')
  {
    console.log(database['dbname'] != '');
    const sequelize = new Sequelize(
      database['dbname'], 
      database['username'], 
      database['password'], 
      {
      host: database['host'], 
      port: database['port'],
      dialect: database['dialect'], 
      define: {
        timestamps: false 
      },
      dialectOptions: {
        useUTC: false
      },
      timezone: '+07:00',
      logging: false
    });
  
    sequelize.authenticate().then(() => {
      last['message'] = 'Database connected.';
      last['time'] = new Date();
      last['status'] = 'success';
      console.log('DB Connected');
    }).catch((err) => {
      last['message'] = 'Cannot connect to database.';
      last['time'] = new Date();
      last['status'] = 'error';
      console.log("Cannot connect to DB: ", err);

      return;
    });
  
    energy = sequelize.define(
      'energy',
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id' },
        SerialNo: { type: DataTypes.STRING, field: 'SerialNo' },
        SiteID: { type: DataTypes.STRING, field: 'SiteID' },
        NodeID: { type: DataTypes.STRING, field: 'NodeID' },
        ModbusID: { type: DataTypes.STRING, field: 'ModbusID' },
        DateTimeUpdate: { type: DataTypes.DATE, field: 'DateTimeUpdate'},
        Import_kWh: { type: DataTypes.DOUBLE, field: 'Import_kWh'},
        Export_kWh: { type: DataTypes.DOUBLE, field: 'Export_kWh'},
        TotalkWh: { type: DataTypes.DOUBLE, field: 'Total_kWh'},
        Total_kvarh: { type: DataTypes.FLOAT, field: 'Total_kvarh'},
        Ind_kvarh: { type: DataTypes.FLOAT, field: 'Ind_kvarh'},
        Cap_kvarh: { type: DataTypes.FLOAT, field: 'Cap_kvarh'},
        kVAh: { type: DataTypes.FLOAT, field: 'kVAh'},
        V1: { type: DataTypes.FLOAT, field: 'V1'},
        V2: { type: DataTypes.FLOAT, field: 'V2'},
        V3: { type: DataTypes.FLOAT, field: 'V3'},
        V12: { type: DataTypes.FLOAT, field: 'V12'},
        V23: { type: DataTypes.FLOAT, field: 'V23'},
        V31: { type: DataTypes.FLOAT, field: 'V31'},
        I1: { type: DataTypes.FLOAT, field: 'I1'},
        I2: { type: DataTypes.FLOAT, field: 'I2'},
        I3: { type: DataTypes.FLOAT, field: 'I3'},
        P1: { type: DataTypes.FLOAT, field: 'P1'},
        P2: { type: DataTypes.FLOAT, field: 'P2'},
        P3: { type: DataTypes.FLOAT, field: 'P3'},
        P_Sum: { type: DataTypes.FLOAT, field: 'P_Sum'},
        Q1: { type: DataTypes.FLOAT, field: 'Q1'},
        Q2: { type: DataTypes.FLOAT, field: 'Q2'},
        Q3: { type: DataTypes.FLOAT, field: 'Q3'},
        Q_Sum: { type: DataTypes.FLOAT, field: 'Q_Sum'},
        S1: { type: DataTypes.FLOAT, field: 'S1'},
        S2: { type: DataTypes.FLOAT, field: 'S2'},
        S3: { type: DataTypes.FLOAT, field: 'S3'},
        S_Sum: { type: DataTypes.FLOAT, field: 'S_Sum'},
        PF1: { type: DataTypes.FLOAT, field: 'PF1'},
        PF2: { type: DataTypes.FLOAT, field: 'PF2'},
        PF3: { type: DataTypes.FLOAT, field: 'PF3'},
        PF_Sum: { type: DataTypes.FLOAT, field: 'PF_Sum'},
        THD_U1: { type: DataTypes.FLOAT, field: 'THD_U1'},
        THD_U2: { type: DataTypes.FLOAT, field: 'THD_U2'},
        THD_U3: { type: DataTypes.FLOAT, field: 'THD_U3'},
        THD_I1: { type: DataTypes.FLOAT, field: 'THD_I1'},
        THD_I2: { type: DataTypes.FLOAT, field: 'THD_I2'},
        THD_I3: { type: DataTypes.FLOAT, field: 'THD_I3'},
        Frequency: { type: DataTypes.FLOAT, field: 'Frequency'},
        kWdemand: { type: DataTypes.DOUBLE, field: 'kWdemand'},
      },
      {
          tableName: 'energy' 
      }
    );
  
    sequelize.sync().then(() => {
      last['message'] = 'Database table synced.';
      last['time'] = new Date();
      last['status'] = 'success';
      console.log('Table synced');
    }).catch((err) => {
      last['message'] = 'Cannot sync database table.';
      last['time'] = new Date();
      last['status'] = 'error';
      console.log('Cannot sync table: ', err);

      return;
    });
  }
  else
  {
    last['message'] = 'Database is not set up.';
    last['time'] = new Date();
    last['status'] = 'error';
    console.log('Database is not set up.');

    return;
  }
}

syncDB();

/* MQTT Broker Section */
import Aedes from 'aedes'
import { createServer as wsCreateServer } from 'aedes-server-factory'
import { existsSync, readFileSync, writeFileSync } from 'fs';

const BN_CFG_PATH = path.resolve(app.getPath('appData'), 'blacknode.info');

interface Meter {
  id: Number;
  name: string;
  type: Number;
  status: string;
  last_update: Date;
}

interface Blacknode {
  name: string;
  clientid: string;
  mqtt: string;
  clientip: string;
  period: Number;
  serial: string;
  siteid: string;
  nodeid: string;
  meter_list: Array<Meter>;
  status: string;
  last_update: Date;
}

var blacknode = {};

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
  httpServer = wsCreateServer(aedesInst/*, {ws: true}*/)

  loadBNInfoFromLocal()

  aedesInst.on('clientDisconnect', function(client) {
    for(let sn of Object.keys(blacknode))
    {
      if(blacknode[sn].clientid == client.id)
      {
        blacknode[sn].status = 'off';
        blacknode[sn].last_update = new Date();
      }
    }

    writeFile(BN_CFG_PATH, JSON.stringify(blacknode), {flag: 'w'});
  });

  aedesInst.on('clientError', function(client, _err) {
    for(let sn of Object.keys(blacknode))
    {
      if(blacknode[sn].clientid == client.id)
      {
        blacknode[sn].status = 'error';
        blacknode[sn].last_update = new Date();
      }
    }

    writeFile(BN_CFG_PATH, JSON.stringify(blacknode), {flag: 'w'});
  });

  aedesInst.on('publish', function(pkt, _client) {
    //console.log(_client);

    const data_re = /^(DATABASE|REALTIME)\/(.*?)\/(.*?)\/(.*?)\/(\d*)$/;
    const cfg_re = /^CFG\/([^\/]*)$/;

    let cfg_m = pkt.topic.match(cfg_re);
    let data_m = pkt.topic.match(data_re);

    if(cfg_m)
    {
      // Configuration topic

      let sn = cfg_m[1];
      let cmd = pkt.payload.toString();

      console.log('SN: ', sn, cfg_m);

      if(cmd == 'request_config')
      {
        if(!blacknode.hasOwnProperty(sn))
        {
          let obj: Blacknode = {
            'name': 'undefined',
            'clientid': _client.id,
            'mqtt': 'undefined',
            'clientip': '0.0.0.0',
            'period': 15,
            'serial': sn,
            'siteid': 'undefined',
            'nodeid': 'undefined',
            'meter_list': [],
            'status': 'setup',
            'last_update': new Date()
          }

          for(let i=0; i<30; i++)
          {
            let initMeter: Meter = {
              id: i,
              name: 'undefined',
              type: 0,
              status: 'off',
              last_update: new Date()
            }

            obj.meter_list.push(initMeter);
          }

          blacknode[sn] = obj;
        }
        else
        {
          blacknode[sn].last_update = new Date();
          blacknode[sn].status = 'setup';
          blacknode[sn].clientid = _client.id;
        }

        writeFile(BN_CFG_PATH, JSON.stringify(blacknode), {flag: 'w'});

        last['message'] = 'Blacknode ' + sn + ' connected. Please initialize the blacknode.';
        last['time'] = new Date();
        last['status'] = 'success';
      }
      else if(cmd == 'ack_config')
      {
        blacknode[sn].last_update = new Date();
        blacknode[sn].status = 'on';
        blacknode[sn].clientid = _client.id;

        writeFile(BN_CFG_PATH, JSON.stringify(blacknode), {flag: 'w'});

        last['message'] = 'Blacknode ' + sn + ' is successfully configured.';
        last['time'] = new Date();
        last['status'] = 'success';
      }
    }
    else if(data_m)
    {
      // Data topic

      console.log(data_m);
      let dtype = data_m[1];
      let sn = data_m[2];
      let siteid = data_m[3];
      let nodeid = data_m[4];
      let modbusid = parseInt(data_m[5]);

      if(blacknode.hasOwnProperty(sn))
      {
        if(blacknode[sn].status == 'setup')
        {
          last['message'] = 'Received data from blacknode ' + sn + ' that is not initilized. Ignored.';
          last['time'] = new Date();
          last['status'] = 'error';
          console.log('Received data from a blacknode that is not initilized. Ignored.');
        }
        else
        {
          blacknode[sn].last_update = new Date();
          blacknode[sn].status = 'on';
          blacknode[sn].clientid = _client.id;

          blacknode[sn].meter_list[modbusid].last_update = blacknode[sn].last_update;
          blacknode[sn].meter_list[modbusid].status = 'on';
        }
        
      }
      else
      {
        last['message'] = 'Received data from blacknode ' + sn + ' that is not initilized. Ignored.';
        last['time'] = new Date();
        last['status'] = 'error';
        console.log('Received data from a blacknode that is not initilized. Ignored.');
      }

      if(dtype == 'DATABASE')
      {
        const pkt_re = /^t=(\d{4})-(\d{2})-(\d{2})\+(\d{2}):(\d{2}):(\d{2})&d=(.*)$/;

        let d = pkt.payload.toString().match(pkt_re);

        if(d)
        {
          // Payload pattern matched.

          let dt = new Date(d[1], d[2], d[3], d[4], d[5], d[6]);
          let e = d[7].split("|");

          if(e.length == 40)
          {
            try{
              energy.create({
                SerialNo: sn,
                SiteID: siteid,
                NodeID: nodeid,
                ModbusID: String(modbusid),
                DateTimeUpdate: dt,
                Import_kWh: parseFloat(e[0]),
                Export_kWh: parseFloat(e[1]),
                TotalkWh: parseFloat(e[2]),
                Total_kvarh: parseFloat(e[3]),
                Ind_kvarh: parseFloat(e[4]),
                Cap_kvarh: parseFloat(e[5]),
                kVAh: parseFloat(e[6]),
                V1: parseFloat(e[7]),
                V2: parseFloat(e[8]),
                V3: parseFloat(e[9]),
                V12: parseFloat(e[10]),
                V23: parseFloat(e[11]),
                V31: parseFloat(e[12]),
                I1: parseFloat(e[13]),
                I2: parseFloat(e[14]),
                I3: parseFloat(e[15]),
                P1: parseFloat(e[16]),
                P2: parseFloat(e[17]),
                P3: parseFloat(e[18]),
                P_Sum: parseFloat(e[19]),
                Q1: parseFloat(e[20]),
                Q2: parseFloat(e[21]),
                Q3: parseFloat(e[22]),
                Q_Sum: parseFloat(e[23]),
                S1: parseFloat(e[24]),
                S2: parseFloat(e[25]),
                S3: parseFloat(e[26]),
                S_Sum: parseFloat(e[27]),
                PF1: parseFloat(e[28]),
                PF2: parseFloat(e[29]),
                PF3: parseFloat(e[30]),
                PF_Sum: parseFloat(e[31]),
                THD_U1: parseFloat(e[32]),
                THD_U2: parseFloat(e[33]),
                THD_U3: parseFloat(e[34]),
                THD_I1: parseFloat(e[35]),
                THD_I2: parseFloat(e[36]),
                THD_I3: parseFloat(e[37]),
                Frequency: parseFloat(e[38]),
                kWdemand: parseFloat(e[39]),
              });
            }
            catch(err){
              console.log(err);
            }
          }
        }
        else
        {
          // Payload not matched. Ignored.
        }
      }
    }
    else
    {
      // Invalid topic
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

  for(let sn of Object.keys(blacknode))
  {
    blacknode[sn].status = 'off';
  }
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
    return authenticated
  });

  ipcMain.handle('auth:getUsername', () => {
    return username
  });

  ipcMain.handle('handler:isBlacknodeCallbackRegistered', () => {
    return bn_cb_registered;
  });

  ipcMain.handle('cmd:updateBN', (_event, cfg, sn) => {
    console.log('Update: ', cfg);

    let pkt = "t=" + cfg.period + "|ips=" + cfg.mqtt + "|ipc=" + cfg.clientip + "|key=" + cfg.siteid + "/" + cfg.nodeid + "|user=admin|pass=password|tal=30|";

    blacknode[sn].name = cfg.name;
    blacknode[sn].period = cfg.period;
    blacknode[sn].siteid = cfg.siteid;
    blacknode[sn].nodeid = cfg.nodeid;
    blacknode[sn].clientip = cfg.clientip;
    blacknode[sn].mqtt = cfg.mqtt;

    for(let i=0; i<30; i++)
    {
      blacknode[sn].meter_list[i].name = cfg.meter_list[i].name;
      blacknode[sn].meter_list[i].type = cfg.meter_list[i].type;

      if(cfg.meter_list[i].type != "")
      {
        pkt += String(i+1).padStart(2, '0') + ":" + cfg.meter_list[i].type.padStart(2, '0');
      }
      else
      {
        pkt += String(i+1).padStart(2, '0') + ":00";
      }
      
      if(i != 29)
      {
        pkt += "|";
      }
    }

    writeFile(BN_CFG_PATH, JSON.stringify(blacknode), {flag: 'w'});

    aedesInst.publish({cmd: 'publish', qos: 2, dup: false, retain: false, topic: 'ACK/' + sn, 'payload': pkt}, function() {});
  });

  ipcMain.handle('cmd:resetBN', (_event, key) => {
    // Reset based on command or topic
    console.log('Reset: ', key);
    let pkt = "reset"

    aedesInst.publish({cmd: 'publish', qos: 2, dup: false, retain: false, topic: 'RESET/' + key, 'payload': pkt}, function() {});
    last['message'] = 'Reset command was sent to ' + key + '.';
    last['time'] = new Date();
    last['status'] = 'success';
  });

  ipcMain.handle('cmd:removeBN', (_event, key) => {

    delete blacknode[key];

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

  ipcMain.handle('data:getDatabaseCFG', (_event) => {
    return database;
  });

  ipcMain.handle('data:setDatabaseCFG', (_event, dbCFG) => {
    database = {
      'host': dbCFG.host,
      'port': dbCFG.port,
      'dialect': dbCFG.dialect,
      'dbname': dbCFG.dbname,
      'username': dbCFG.username,
      'password': dbCFG.password
    };

    console.log(database);
    
    writeFile(DB_CFG_PATH, JSON.stringify(database), {flag: 'w'});

    syncDB();
  });

  ipcMain.handle('data:clearMessage', (_event) => {
    last['message'] = '';
    last['time'] = new Date();
    last['status'] = '';

    console.log('Clear messaged.');
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

  if((data['username'] == '' && data['password'] == '') || (data['username'] == 'admin' && data['password'] == 'password'))
  {
    last['message'] = 'Logged in successfully.';
    last['time'] = new Date();
    last['status'] = 'success';

    authenticated = true
    username = data['username']

    if(!aedesInst)
    {
      startMQTT()
    }
  }
  else
  {
    authenticated = false;
    last['message'] = 'Username or password is incorrect.';
    last['time'] = new Date();
    last['status'] = 'error';
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
  // Send Blacknode info to front-end every 1 second.

  let now = new Date();
  if(now.getTime() - last['time'].getTime() > 5000)
  {
    last['message'] = '';
    last['time'] = now;
    last['status'] = '';
  }

  if(mainWindow && mainWindow.webContents)
  {
    mainWindow.webContents.send('update-bn', blacknode);
    mainWindow.webContents.send('last-message', last);
  }
  
}, 1000);

setInterval(() => {
  // Save Blacknode every 5 minutes
  if(mainWindow && mainWindow.webContents)
  {
    mainWindow.webContents.send('update-bn', blacknode);
    mainWindow.webContents.send('last-message', last);

    writeFile(BN_CFG_PATH, JSON.stringify(blacknode), {flag: 'w'});
  }

  
}, 5*60*1000);
