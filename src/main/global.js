import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path'

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

export function loadBNInfoFromLocal(BN_CFG_PATH)
{
  const data = readFile(BN_CFG_PATH, { encoding: 'utf-8', flag: 'r' });

  blacknode = JSON.parse(data);

  for(let sn of Object.keys(blacknode))
  {
    blacknode[sn].status = 'off';
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