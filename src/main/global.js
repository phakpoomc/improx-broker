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

export var blacknode = {};

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