import { existsSync, readFileSync, writeFileSync } from 'fs'

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

var MAX_HEARTBEAT = 20 * 60 * 1000

export async function loadMetaCFG()
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
        if(!meta_cfg.param)
        {
            meta_cfg.param = {
                minimum_realert: 14 * 60 * 1000,
                mm: {
                    V1: { min: 0, max: 230 },
                    V2: { min: 0, max: 230 },
                    V3: { min: 0, max: 230 },
                    V12: { min: 0, max: 230 },
                    V23: { min: 0, max: 230 },
                    V31: { min: 0, max: 230 },
                    I1: { min: 0, max: 100 },
                    I2: { min: 0, max: 100 },
                    I3: { min: 0, max: 100 },
                    P1: { min: 0, max: 230000 },
                    P2: { min: 0, max: 230000 },
                    P3: { min: 0, max: 230000 },
                    P_Sum: { min: 0, max: 230000 },
                    Q1: { min: 0, max: 1000000 },
                    Q2: { min: 0, max: 1000000 },
                    Q3: { min: 0, max: 1000000 },
                    Q_Sum: { min: 0, max: 1000000 },
                    S1: { min: 0, max: 1000000 },
                    S2: { min: 0, max: 1000000 },
                    S3: { min: 0, max: 1000000 },
                    S_Sum: { min: 0, max: 1000000 },
                    PF1: { min: -1, max: 1 },
                    PF2: { min: -1, max: 1 },
                    PF3: { min: -1, max: 1 },
                    PF_Sum: { min: -1, max: 1 },
                    Frequency: { min: 0, max: 120 }
                }
            };
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
            let k = String(d.DateTime.getFullYear()) + '-' + String(d.DateTime.getMonth()) + '-' + String(d.DateTime.getDate())

            holidays[k] = {
                name: d.name,
                date: k,
                id: d.id
            };
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
            group[g.id] = { name: g.name, showDashboard: g.showDashboard, member: [] }
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
            let k = String(d.DateTime.getFullYear()) + '-' + String(d.DateTime.getMonth()) + '-' + String(d.DateTime.getDate())

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
            group[g.id] = { name: g.name, showDashboard: g.showDashboard, member: [] }
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
            if (db && db.alert) {
                let arr = k.split('%')
                let sn = arr[0]
                let modbusid = arr[1]

                let id = blacknode[sn].SiteID + '%' + blacknode[sn].NodeID + '%' + modbusid

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

export function checkOverRange(obj) {
    let keys = Object.keys(meta_cfg.param.mm)
    let now = new Date()

    let id = obj['SiteID'] + '%' + obj['NodeID'] + '%' + obj['ModbusID']

    if (lastAlarm[id] && now.getTime() - lastAlarm[id].getTime() < meta_cfg.param['mininum_realert']) {
        return
    }

    for (let k of keys) {
        if (obj[k] < meta_cfg.param.mm[k].min || obj[k] > meta_cfg.param.mm[k].max) {
            if (db && db.alarm) {
                db.alarm.create({
                    SerialNo: obj.SerialNo,
                    SiteID: obj.SiteID,
                    NodeID: obj.NodeID,
                    ModbusID: parseInt(obj.ModbusID) + 1,
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
