import { existsSync, readFileSync, writeFileSync } from 'fs'
import { Sequelize, Op } from 'sequelize';
const fs = require('fs')
import * as path from 'path'

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
export var meter_types_store = {}
export var overview_store = {clear:false,monthly_kwh:{},currMonth:new Date().getMonth(),multiplier:{},column:{},graph:{}}

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

export function isOnPeak(dt) {
    const dayinweek = dt.getUTCDay()

    // Saturday or Sunday
    if (dayinweek == 0 || dayinweek == 6) {
        return false
    }

    // In case of holidays...
    const k = String(dt.getUTCFullYear()) + '-' + String(parseInt(dt.getUTCMonth()) + 1) + '-' + String(dt.getUTCDate())

    if (holidays[k]) {
        return false
    }

    // Mon - Fri
    const hours = dt.getUTCHours()
    const min = dt.getUTCMinutes()

    if (hours < 9 || hours > 22) {
        return false
    } else {
        if ((hours == 9 && min == 0) || (hours == 22 && min > 0)) {
            return false
        }
    }

    return true
}




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

    for (const sn of Object.keys(blacknode)) {
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

export async function loadOverview(isClear){
    //create overview to store data
    const overviewPath = path.join(process.cwd(), 'overview_data.cfg')

    if (!fs.existsSync(overviewPath)) {
        fs.writeFileSync(overviewPath, '', 'utf8')
    }   
    
    if(isClear){
        overview_store = {};
        overview_store = {clear:false,monthly_kwh:{},currMonth:new Date().getMonth(),multiplier:{},column:{},graph:{}}
        writeFile(overviewPath, JSON.stringify(overview_store, null, 2), { flag: 'w' })
    }


    const group = await db.group.findAll({
        where: {
            type: {
                [Op.or]: [
                    { [Op.like]: 'overview-%' },
                    { [Op.like]: 'go-%' }
                ]
            }
        }
    });

    let ov_json = null
    try {
        const ov_data = fs.readFileSync(overviewPath, 'utf8')
        ov_json = JSON.parse(ov_data)
    } catch (err) {
    }
    const newMonth = new Date()
    const fetch_keys = []
    for (const g of group) {
        if (group !== null) {
            const members = await db.gmember.findAll({
                where: { GroupID: g.id }
            })
            if(g.type.startsWith('overview-kWh') || g.type == 'overview-incomming' || g.type?.startsWith('go-value')){
                overview_store['monthly_kwh'][g.type] = {
                    keys: [],
                    value: {},
                    prevValue: {}
                }
            }

            if(g.type.startsWith('go-graph-extend')){
                overview_store['monthly_kwh'][g.type+g.name] = {
                    keys: [],
                    value: {},
                    prevValue: {}
                }
                overview_store['graph'][g.type+g.name] = [];
            }else if(g.type.startsWith('go-graph')){
                overview_store['monthly_kwh'][g.type] = {
                    keys: [],
                    value: {},
                    prevValue: {}
                }
                overview_store['graph'][g.type] = [];
            }

            if(g.type.startsWith('overview-mold') || g.type.startsWith('overview-furnace') || g.type.startsWith('overview-air-comp')){
                overview_store['column'][g.type] = [];
            }

            if (members !== null) {
                for (const m of members) {
                    const key = m.SiteID + '%' + m.NodeID + '%' + String(m.ModbusID)

                    if(g.type.startsWith('overview-mold') || g.type.startsWith('overview-furnace') || g.type.startsWith('overview-air-comp')){
                        overview_store['column'][g.type].push({
                            snKey:m.SerialNo+ "%" + String(m.ModbusID-1),
                            snmKey:key,
                        });
                    }
                    if(g.type.startsWith('go-graph-extend')){
                        overview_store['graph'][g.type+g.name].push({
                            snKey:m.SerialNo+ "%" + String(m.ModbusID-1),
                            snmKey:key
                        })
                        overview_store.monthly_kwh[g.type+g.name].keys.push(key)
                        overview_store.monthly_kwh[g.type+g.name].value[key] = 0;
                        overview_store.monthly_kwh[g.type+g.name].prevValue[key] = 0;
                        fetch_keys.push(key)
                    }else if(g.type.startsWith('go-graph')){
                        overview_store['graph'][g.type].push({
                            snKey:m.SerialNo+ "%" + String(m.ModbusID-1),
                            snmKey:key
                        });
                        overview_store.monthly_kwh[g.type].keys.push(key)
                        overview_store.monthly_kwh[g.type].value[key] = 0;
                        overview_store.monthly_kwh[g.type].prevValue[key] = 0;
                        fetch_keys.push(key)
                    }
                    if (g.type == 'overview-incomming' || g.type?.startsWith('go-value')) {
                        if (
                            ov_json &&
                            ov_json[m.SerialNo + '%' + String(m.ModbusID - 1)]
                        )
                            overview_store[m.SerialNo + '%' + String(m.ModbusID - 1)] =
                                ov_json[m.SerialNo + '%' + String(m.ModbusID - 1)]
                        else
                            overview_store[m.SerialNo + '%' + String(m.ModbusID - 1)] =
                                []
                        overview_store.monthly_kwh[g.type].keys.push(key)
                        overview_store.monthly_kwh[g.type].value[key] = 0;
                        overview_store.monthly_kwh[g.type].prevValue[key] = 0;
                        fetch_keys.push(key)
                    }
                    if(g.type.startsWith('overview-kWh')){
                        overview_store.monthly_kwh[g.type].keys.push(key)
                        overview_store.monthly_kwh[g.type].value[key] = 0;
                        overview_store.monthly_kwh[g.type].prevValue[key] = 0;
                        fetch_keys.push(key)
                    }
                    if(g.type.startsWith('go-graph-extend')) overview_store['multiplier'][g.type+g.name+'-'+key] = m.multiplier
                    else overview_store['multiplier'][g.type+'-'+key] = m.multiplier
                   
                }
            }
        }
    }

    const startTime = new Date(
        Date.UTC(newMonth.getFullYear(), newMonth.getMonth(), 1, 0, 0, 0)
    )
    const endTime = new Date(
        Date.UTC(
            newMonth.getFullYear(),
            newMonth.getMonth(),
            newMonth.getDate(),
            newMonth.getHours(),
            newMonth.getMinutes(),
            0
        )
    )

    const eData = await db.energy.findAll({
        where: {
            DateTimeUpdate: {
                [Op.and]: {
                    [Op.gte]: startTime,
                    [Op.lte]: endTime
                }
            },
            snmKey: fetch_keys
        },
        order: [
            ['DateTimeUpdate', 'ASC'],
            ['id', 'asc']
        ]
    })
    const prevValue = {}
    for (const e of eData) {
        if (e.Import_kWh <= 0) {
            continue
        }
        if (!prevValue[e.snmKey]) {
            prevValue[e.snmKey] = e.Import_kWh
            continue
        }
        for (const k in overview_store.monthly_kwh) {
            const kwh = (e.Import_kWh - prevValue[e.snmKey]) * overview_store['multiplier'][k+"-"+e.snmKey]
            if (overview_store.monthly_kwh[k].keys.includes(e.snmKey))
                overview_store.monthly_kwh[k].value[e.snmKey] += kwh
        }
        prevValue[e.snmKey] = e.Import_kWh
    }

    writeFile(overviewPath, JSON.stringify(overview_store, null, 2), { flag: 'w' })
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
            group[g.id] = { id: g.id, name: g.name, showDashboard: g.showDashboard,type:g.type, member: [] }
        }

        let gmembers = await db.gmember.findAll()

        for (let g of gmembers) {
            let m = {
                serial: g.SerialNo,
                siteid: g.SiteID,
                nodeid: g.NodeID,
                modbusid: g.ModbusID,
                multiplier: g.multiplier,
                line:g.line,
                order_meter:g.order_meter,
                is_consumption:g.is_consumption
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
            group[g.id] = { id: g.id, name: g.name, showDashboard: g.showDashboard,type:g.type, member: [] }
        }

        let gmembers = await db.gmember.findAll()

        for (let g of gmembers) {
            let m = {
                serial: g.SerialNo,
                siteid: g.SiteID,
                nodeid: g.NodeID,
                modbusid: g.ModbusID,
                multiplier: g.multiplier,
                line:g.line,
                order_meter:g.order_meter,
                is_consumption:g.is_consumption
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
