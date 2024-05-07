import { existsSync, readFileSync, writeFileSync } from 'fs';

// interface Meter {
//     id: Number;
//     name: string;
//     type: Number;
//     status: string;
//     last_update: Date;
// }
  
// interface Blacknode {
//     name: string;
//     clientid: string;
//     mqtt: string;
//     clientip: string;
//     period: Number;
//     serial: string;
//     siteid: string;
//     nodeid: string;
//     meter_list: Array<Meter>;
//     status: string;
//     last_update: Date;
// }

export var last = {
    'message': '',
    'time': new Date(),
    'status': ''
};

export var db = {};

export var db_cfg = {};
export var api_cfg = {};
export var param_cfg = {};
export var param_mm = {};
export var lastAlarm = {};

export var holidays = {};

export var blacknode = {};

export var group = {};

export var lastUpdateTime = {};
export var lastUpdateData = {};

export var paths = {};

var MAX_HEARTBEAT = 20*60*1000;

export async function initHoliday()
{
  if(db && db.holiday)
  {
    let h = await db.holiday.findAll();

    for(let d of h)
    {
      let k = String(d.getFullYear()) + '-' + String(d.getMonth()) + String(d.getDate()); 

      holidays[k] = true;
    }
  }
}

export function checkHeartbeat()
{
  let now = new Date();

  let keys = Object.keys(lastUpdateTime);

  for(let k of keys)
  {
    if(now.getTime() - lastUpdateTime[k].getTime() > MAX_HEARTBEAT)
    {
      if(db && db.alert)
      {
        let arr = k.split("%");
        let sn = arr[0];
        let modbusid = arr[1];

        let id = blacknode[sn].SiteID + "%" + blacknode[sn].NodeID + "%" + modbusid;

        db.alarm.create({
          SerialNo: blacknode[sn].SerialNo,
          SiteID: blacknode[sn].SiteID,
          NodeID: blacknode[sn].NodeID,
          ModbusID: modbusid,
          snmKey: id,
          DateTime: now,
          type: 'METER_DC',
          status: 'unread'
        });

        lastAlarm[id] = now;
      }
    }
  }
}

export function loadBNInfoFromLocal(BN_CFG_PATH)
{
  const data = readFile(BN_CFG_PATH, { encoding: 'utf-8', flag: 'r' });

  blacknode = JSON.parse(data);

  for(let sn of Object.keys(blacknode))
  {
    blacknode[sn].status = 'off';
  }
}

export async function loadGroup()
{
  if(db && db.group && db.gmember)
  {
    group = {};
    
    let groups = await db.group.findAll();

    for(let g of groups)
    {
      group[g.id] = {name: g.name, showDashboard: g.showDashboard, member: []};
    }

    let gmembers = await db.gmember.findAll();

    for(let g of gmembers)
    {
      let m = {
        serial: g.SerialNo,
        siteid: g.SiteID,
        nodeid: g.NodeID,
        modbusid: g.ModbusID,
        multiplier: g.multiplier
      };

      group[g.GroupID].member.push(m);
    }
  }
  else
  {
    console.log("Fail to load Group info.");
    last.message = "Fail to load Group info.";
    last.time = new Date();
    last.status = "error";
  }
}

export function loadDBCFG()
{
  if(paths && paths.DB_CFG_PATH)
  {
    const db_data = readFile(paths.DB_CFG_PATH, { encoding: 'utf-8', flag: 'r' });
    let loadedCFG = JSON.parse(db_data);

    db_cfg.host = loadedCFG.host;
    db_cfg.port = loadedCFG.port;
    db_cfg.dialect = loadedCFG.dialect;
    db_cfg.dbname = loadedCFG.dbname;
    db_cfg.username = loadedCFG.username;
    db_cfg.password = loadedCFG.password;
  }
  else
  {
    console.log("Fail to load DB Config.");
    last.message = "Fail to load DB info.";
    last.time = new Date();
    last.status = "error";
  }
}

export function loadAPICFG()
{
  if(paths && paths.API_CFG_PATH)
  {
    const api_data = readFile(paths.API_CFG_PATH, { encoding: 'utf-8', flag: 'r' });

    let loadedCFG = JSON.parse(api_data);

    api_cfg.protocol = loadedCFG.protocol;
    api_cfg.port = loadedCFG.port;
  }
  else
  {
    console.log("Fail to load API Config.");
    last.message = "Fail to load API info.";
    last.time = new Date();
    last.status = "error";
  }
}

export function initAlarm()
{
  if(db && db.alarm)
  {
    let latest = db.alarm.findAll({
      order: ['DateTime', 'DESC'],
      group: 'snmKey'
    });

    for(let l of latest)
    {
      lastAlarm[l.snmKey] = l.DateTime;
    }
  }

  if(paths && paths.PARAM_CFG_PATH)
  {
    const param_data = readFile(paths.PARAM_CFG_PATH, { encoding: 'utf-8', flag: 'r' });
    let loadedCFG = JSON.parse(param_data);

    if(loadedCFG.minimum_realert)
    {
      param_cfg.minimum_realert = loadedCFG.minimum_realert;
    }
    else
    {
      param_cfg.minimum_realert = 14*60*1000;
    }

    if(loadedCFG.mm)
    {
      param_mm = loadedCFG.mm;
    }
    else
    {
      param_mm = {
        V1: {min: 0, max:230},
        V2: {min: 0, max:230},
        V3: {min: 0, max:230},
        V12: {min: 0, max:230},
        V23: {min: 0, max:230},
        V31: {min: 0, max:230},
        I1: {min: 0, max:100},
        I2: {min: 0, max:100},
        I3: {min: 0, max:100},
        P1: {min: 0, max:230000},
        P2: {min: 0, max:230000},
        P3: {min: 0, max:230000},
        P_Sum: {min: 0, max:230000},
        Q1: {min: 0, max:1000000},
        Q2: {min: 0, max:1000000},
        Q3: {min: 0, max:1000000},
        Q_Sum: {min: 0, max:1000000},
        S1: {min: 0, max:1000000},
        S2: {min: 0, max:1000000},
        S3: {min: 0, max:1000000},
        S_Sum: {min: 0, max:1000000},
        PF1: {min: -1, max:1},
        PF2: {min: -1, max:1},
        PF3: {min: -1, max:1},
        PF_Sum: {min: -1, max:1},
        Frequency: {min: 0, max:120},
      };
    }
  }
  else
  {
    console.log("Fail to load Parameter Config.");
    last.message = "Fail to load Parameter info.";
    last.time = new Date();
    last.status = "error";
  }
}

export function checkOverRange(obj)
{
  let keys = Object.keys(param_mm);
  let now = new Date();

  let id = obj['SiteID'] + '%' + obj['NodeID'] + '%' + obj['ModbusID'];

  if(lastAlarm[id] && now.getTime() - lastAlarm[id].getTime() < param_cfg['mininum_realert'])
  {
    return;
  }

  for(let k of keys)
  {
    if(obj[k] < param_mm[k].min || obj[k] > param_mm[k].max)
    {
      if(db && db.alarm)
      {
        db.alarm.create({
          SerialNo: obj.SerialNo,
          SiteID: obj.SiteID,
          NodeID: obj.NodeID,
          ModbusID: obj.ModbusID,
          snmKey: id,
          DateTime: now,
          type: 'OVER_RANGE',
          status: 'unread'
        });

        lastAlarm[id] = now;
      }
    }
  }
}

export function writeFile(path, data, flag)
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

export function readFile(path, flag)
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