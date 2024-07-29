import { existsSync, readFileSync, writeFileSync } from 'fs'
import { Sequelize } from 'sequelize';
// import { aedesInst } from './mqtt.js'

export var last = {
    message: '',
    time: new Date(),
    status: ''
}

// Static paths on Appdata
export var paths = {}

// DB Instances
export var db = {}

// Configuration from files
export var meta_cfg = {};
export var blacknode = {}

// Configuration from DB
export var lastAlarm = {}
export var holidays = {}
export var group = {}

// Temp object for realtime use
export var lastUpdateTime = {}
export var lastUpdateData = {}

export var lastFeedTime = {}

export var MAX_HEARTBEAT = 60 * 60 * 1000

const MINIMUM_REALERT = 61 * 60 * 1000

// var dbQueue = [];
// var aedesQueue = [];

var qLock = false;

// export async function addQueue(obj, aedObj)
// {
//     if(!qLock)
//     {
//         qLock = true;

//         dbQueue.push(obj);
//         aedesQueue.push(aedObj);

//         qLock = false;
//     }
    
// }

// export async function savetoDB()
// {
//     if(!qLock)
//     {
//         qLock = true;

//         if(dbQueue.length > 0 && aedesQueue.length == dbQueue.length && db && db.energy)
//         {
//             try {
//                 await db.energy.bulkCreate(dbQueue)

//                 for(let i=0; i<dbQueue.length; i++)
//                 {
//                     checkOverRange(dbQueue[i], false)

//                     if (aedesInst && !aedesInst.closed) {
//                         await aedesInst.publish(aedesQueue[i])
//                     }
                    
//                 }

//                 console.log("Bulk of energy data is saved. Total: ", dbQueue.length);

//                 dbQueue.length = 0;
//                 aedesQueue.length = 0;

//             } catch(err) {
//                 last['message'] = 'Cannot insert database in bulk.'
//                 last['time'] = new Date()
//                 last['status'] = 'error'
//                 qLock = false;

//                 for(let i=0; i<dbQueue.length; i++)
//                 {
//                     if (aedesInst && !aedesInst.closed) {
//                         aedesQueue[i].payload = 'ERROR: database'

//                         await aedesInst.publish(aedesQueue[i])
//                     }
//                 }
//             }
//         }

//         qLock = false;
//     }
// }

export function loadMetaCFG()
{
    // Load DB
    if (paths && paths.META_CFG_PATH) {
        const cfg_data = readFile(paths.META_CFG_PATH, { encoding: 'utf-8', flag: 'r' })
        meta_cfg = JSON.parse(cfg_data);

        if(!meta_cfg.db)
        {
            meta_cfg.db = {};
        }
        if(!meta_cfg.api)
        {
            meta_cfg.api = {};
        }
        if(!meta_cfg.broker)
            {
                meta_cfg.broker = {};
            }
        if(!meta_cfg.param)
        {
            meta_cfg.param = {};

        }
        if(!meta_cfg.auth_cred)
        {
            meta_cfg.auth_cred = {
                remember: false
            };
        }
        if(!meta_cfg.useImport)
        {
            meta_cfg.useImport = {
                value: false
            }
        }


    } else {
        console.log('Fail to load meta Config.')
        last.message = 'Fail to load meta config.'
        last.time = new Date()
        last.status = 'error'
    }
}

export function loadBNInfoFromLocal(BN_CFG_PATH) {
    const data = readFile(BN_CFG_PATH, { encoding: 'utf-8', flag: 'r' })

    blacknode = JSON.parse(data)

    for (let sn of Object.keys(blacknode)) {
        if (blacknode[sn].status != 'setup') {
            blacknode[sn].status = 'off'

            if(blacknode[sn].maxmeter > 0)
            {
                for(let i=0; i<blacknode[sn].maxmeter; i++)
                {
                    blacknode[sn].meter_list[i].status = 'off'
                }
            }
        }
    }
}

export async function loadMetaDB()
{
    if(!db)
    {
        return;
    }

    // Init holiday
    if (db.holiday) {
        holidays = {};

        let h = await db.holiday.findAll()

        for (let d of h) {
            let k = String(d.DateTime.getUTCFullYear()) + '-' + String(d.DateTime.getUTCMonth()+1) + '-' + String(d.DateTime.getUTCDate())

            holidays[k] = {
                name: d.name,
                date: k,
                id: d.id
            };
        }
    }

    // Init feeder meter
    if(db.feedmeter)
    {
        lastFeedTime = {}

        let feedMeters = await db.feedmeter.findAll({
            attributes: [
                [Sequelize.fn('max', Sequelize.col('FeederDateTime')), 'max'],
                'FeederMeterName'
            ],
            group: ['FeederMeterName']
        })

        for(let m of feedMeters)
        {
            lastFeedTime[m.dataValues.FeederMeterName] = m.dataValues.max
        }
    
    }

    // Init alarm
    if (db.alarm) {
        lastAlarm = {};

        let latest = await db.alarm.findAll({
            where: {
                status: 'unread'
            }
        })

        

        for (let l of latest) {
            lastAlarm[l.snmKey] = l.DateTime
        }
    }

    // Init group
    if (db.group && db.gmember) {
        group = {}

        let groups = await db.group.findAll()

        for (let g of groups) {
            group[g.id] = { id: g.id, name: g.name, showDashboard: g.showDashboard, member: [] }
        }

        let gmembers = await db.gmember.findAll()

        for (let g of gmembers) {
            let m = {
                serial: g.SerialNo,
                siteid: g.SiteID,
                nodeid: g.NodeID,
                modbusid: g.ModbusID,
                multiplier: g.multiplier
            }

            group[g.GroupID].member.push(m)
        }
    }
}

export async function loadHoliday() {
    if (db && db.holiday) {
        holidays = {};

        let h = await db.holiday.findAll()

        for (let d of h) {
            let k = String(d.DateTime.getUTCFullYear()) + '-' + String(d.DateTime.getUTCMonth()+1) + '-' + String(d.DateTime.getUTCDate())

            holidays[k] = {
                name: d.name,
                date: k,
                id: d.id
            };
        }
    }
}

export async function loadGroup() {
    if (db && db.group && db.gmember) {
        group = {}

        let groups = await db.group.findAll()

        for (let g of groups) {
            group[g.id] = { id: g.id, name: g.name, showDashboard: g.showDashboard, member: [] }
        }

        let gmembers = await db.gmember.findAll()

        for (let g of gmembers) {
            let m = {
                serial: g.SerialNo,
                siteid: g.SiteID,
                nodeid: g.NodeID,
                modbusid: g.ModbusID,
                multiplier: g.multiplier
            }

            group[g.GroupID].member.push(m)
        }
    } else {
        console.log('Fail to load Group info.')
        last.message = 'Fail to load Group info.'
        last.time = new Date()
        last.status = 'error'
    }
}

export async function loadAlarm() {
    if (db && db.alarm) {
        lastAlarm = {};

        let latest = await db.alarm.findAll({
            where: {
                status: 'unread'
            }
        })

        for (let l of latest) {
            lastAlarm[l.snmKey] = l.DateTime
        }
    }
}

export function checkHeartbeat() {
    let now = new Date()

    let keys = Object.keys(lastUpdateTime)

    for (let k of keys) {
        if (now.getTime() - lastUpdateTime[k].getTime() > MAX_HEARTBEAT) {
            let arr = k.split('%')
            let sn = arr[0]
            let modbusid = arr[1]

            let id = blacknode[sn].SiteID + '%' + blacknode[sn].NodeID + '%' + modbusid

            blacknode[sn].meter_list[modbusid].status = 'off'

            if (db && db.alert) {
                db.alarm.create({
                    SerialNo: blacknode[sn].SerialNo,
                    SiteID: blacknode[sn].SiteID,
                    NodeID: blacknode[sn].NodeID,
                    ModbusID: modbusid,
                    snmKey: id,
                    DateTime: now,
                    type: 'METER_DC',
                    status: 'unread'
                })

                lastAlarm[id] = now
            }
        }
    }
}

export function checkOverRange(obj, shift) {
    if(shift)
    {
        obj['ModbusID'] = parseInt(obj['ModbusID']) + 1;
    }

    let smKey = obj['SerialNo'] + ':' + String(obj['ModbusID'])

    if(!meta_cfg.param.hasOwnProperty(smKey))
    {
        return
    }

    if(!meta_cfg.param[smKey].enable)
    {
        return
    }

    let keys = Object.keys(meta_cfg.param[smKey].mm)
    let now = new Date()

    let id = obj['SiteID'] + '%' + obj['NodeID'] + '%' + String(obj['ModbusID'])

    if (lastAlarm[id] && now.getTime() - lastAlarm[id].getTime() < MINIMUM_REALERT) {
        return
    }

    for (let k of keys) {
        if (obj[k] < meta_cfg.param[smKey].mm[k].min || obj[k] > meta_cfg.param[smKey].mm[k].max) {
            if (db && db.alarm) {
                db.alarm.create({
                    SerialNo: obj.SerialNo,
                    SiteID: obj.SiteID,
                    NodeID: obj.NodeID,
                    ModbusID: parseInt(obj.ModbusID),
                    snmKey: id,
                    DateTime: now,
                    type: 'OVER_RANGE',
                    status: 'unread'
                })

                lastAlarm[id] = now
            }
        }
    }
}

export function writeFile(path, data, flag) {
    // if(safeStorage.isEncryptionAvailable())
    // {
    //   writeFileSync(path, safeStorage.encryptString(data));
    // }
    // else
    // {
    //   writeFileSync(path, data);
    // }

    writeFileSync(path, data, flag)
}

export function readFile(path, flag) {
    if (!existsSync(path)) {
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
        writeFileSync(path, '{}', { flag: 'w' })
    }

    let data = readFileSync(path, flag)

    // if(safeStorage.isEncryptionAvailable())
    // {
    //   return safeStorage.decryptString(data);
    // }
    // else
    // {
    //   return data;
    // }
    return data.toString()
}
