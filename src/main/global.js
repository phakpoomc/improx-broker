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

export var blacknode = {};

export var group = {};

export var lastUpdateTime = {};
export var lastUpdateData = {};

export var paths = {};

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