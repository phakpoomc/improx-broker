import { existsSync, readFileSync, writeFileSync } from 'fs'
import { Sequelize, Op } from 'sequelize';

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

export var qLock = false;
export var cacheDirty = false;

// Cache
export var cached = {}

export function isOnPeak(dt) {
    let dayinweek = dt.getUTCDay()

    // Saturday or Sunday
    if (dayinweek == 0 || dayinweek == 6) {
        return false
    }

    // In case of holidays...
    let k = String(dt.getUTCFullYear()) + '-' + String(parseInt(dt.getUTCMonth()) + 1) + '-' + String(dt.getUTCDate())

    if (holidays[k]) {
        return false
    }

    // Mon - Fri
    let hours = dt.getUTCHours()
    let min = dt.getUTCMinutes()

    if (hours < 9 || hours > 22) {
        return false
    } else {
        if ((hours == 9 && min == 0) || (hours == 22 && min > 0)) {
            return false
        }
    }

    return true
}

export function setCacheDirty()
{
    cacheDirty = true;
}

var timeout = null;

export async function initCache() 
{
    if(qLock)
    {
        if(cacheDirty)
        {
            if(!timeout)
            {
                setTimeout(initCache, 3*60*1000);
            }
            
            cacheDirty = false;
        }

        return {msg: 'Lock is busy. Cannot initialize cache', status: 'error'};
    }

    qLock = true;
    timeout = null;

    if(!db)
    {
        qLock = false;
        return {msg: 'DB is busy. Cannot initialize cache.', status: 'error'};
    }

    cached = {};

    // calculate value and return
    let now = new Date()

    let tLastMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0))
    let tThisMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0))
    let tYesterday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0))
    let tToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0))
    let tTomorrow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0))

    let lastTime = new Date(tLastMonth);
    let currTime = new Date(tLastMonth);
    currTime.setDate(currTime.getDate() + 1 );

    var tasksDone = 0;
    var maxTasks = Math.ceil((tTomorrow.getTime() - lastTime.getTime())/(24*60*60*1000));
    var availableSlots = 1;
    var maxAvailableSlots = 1;

    var promises = [];

    for(;;)
    {
    // while(true) {
        if(tasksDone >= maxTasks)
        {
            break;
        }

        if(availableSlots > 0)
        {
            if(availableSlots == maxAvailableSlots && currTime > tTomorrow)
            {
                break;
            }

            // console.log("Loading ", lastTime);
            availableSlots--;


            var energyData = db.energy.findAll({ 
                attributes: ['snmKey', 'DateTimeUpdate', 'Import_kWh', 'TotalkWh'],
                where: {
                    DateTimeUpdate: {
                        [Op.and]: {
                            [Op.gte]: lastTime,
                            [Op.lte]: currTime
                        }
                    }
                },
                order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']],
                raw: true
            })

            currTime.setDate(currTime.getDate() + 1)
            lastTime.setDate(lastTime.getDate() + 1)

            promises.push(energyData)
        } else {
        
            await Promise.all(promises).then((data) => {
                for(let eData of data) {

                    // console.log(eData.length)
                    promises = [];
                // energyData.then((eData) => {
                    let prevEnergy = {}
                    let prevTime = {}

                    for (let e of eData) {
                        if(!cached.hasOwnProperty(e.snmKey))
                        {
                            cached[e.snmKey] = {
                                energyLastMonth: 0,
                                energyThisMonth: 0,
                                energyYesterday: 0,
                                energyToday: 0,
                                maxDemandLastMonth: {}, //Init keys here
                                maxDemandThisMonth: {},
                                maxDemandYesterday: {},
                                maxDemandToday: {},
                                prevEnergy: 0,
                                prevTime: null
                            }

                            let sDate = new Date(tLastMonth)
                            let eDate = new Date(tToday)

                            for(; sDate <= eDate; sDate.setMinutes(sDate.getMinutes() + 15))
                            {
                                let adjustedTime = new Date(Date.UTC(sDate.getUTCFullYear(), sDate.getUTCMonth(), sDate.getUTCDate(), sDate.getUTCHours(), sDate.getUTCMinutes()))
                                // adjustedTime.setUTCMinutes(adjustedTime.getUTCMinutes() - 1)
                                let tKey = adjustedTime.getUTCFullYear() + '-' + (adjustedTime.getUTCMonth()+1) + '-' + adjustedTime.getUTCDate() + '-' + adjustedTime.getUTCHours() + '-' + adjustedTime.getUTCMinutes()
                                cached[e.snmKey].maxDemandLastMonth[tKey] = 0;
                                cached[e.snmKey].maxDemandThisMonth[tKey] = 0;
                                cached[e.snmKey].maxDemandYesterday[tKey] = 0;
                                cached[e.snmKey].maxDemandToday[tKey] = 0;
                            }
                        }
            
                        let energy = 0;
                
                        if(meta_cfg.useImport.value)
                        {
                            energy = e.Import_kWh
                        }
                        else
                        {
                            energy = e.TotalkWh
                        }
                
                        if (!prevTime[e.snmKey]) {
                            prevEnergy[e.snmKey] = energy
                            prevTime[e.snmKey] = e.DateTimeUpdate

                            cached[e.snmKey].prevEnergy = energy;
                            cached[e.snmKey].prevTime = e.DateTimeUpdate;

                            continue
                        }
                
                        let adjustedTime = new Date(Date.UTC(e.DateTimeUpdate.getUTCFullYear(), e.DateTimeUpdate.getUTCMonth(), e.DateTimeUpdate.getUTCDate(), e.DateTimeUpdate.getUTCHours(), e.DateTimeUpdate.getUTCMinutes()))
                        // adjustedTime.setUTCMinutes(adjustedTime.getUTCMinutes() - 1)
                        let tKey = adjustedTime.getUTCFullYear() + '-' + (adjustedTime.getUTCMonth()+1) + '-' + adjustedTime.getUTCDate() + '-' + adjustedTime.getUTCHours() + '-' + adjustedTime.getUTCMinutes()
            
                        let absEnergy = (energy - prevEnergy[e.snmKey])
                
                        prevEnergy[e.snmKey] = energy
            

                        if(e.DateTimeUpdate > cached[e.snmKey].prevTime)
                        {
                            cached[e.snmKey].prevEnergy = energy;
                            cached[e.snmKey].prevTime = e.DateTimeUpdate;
                        }
                        
            
                        let gap = ((e.DateTimeUpdate - prevTime[e.snmKey])/1000/60)/60
            
                        let d = absEnergy/gap;
                
                        if (e.DateTimeUpdate >= tLastMonth && e.DateTimeUpdate <= tThisMonth) {
                            // Last month
                            if(prevTime[e.snmKey] >= tLastMonth && prevTime[e.snmKey] <= tThisMonth)
                            {
                                cached[e.snmKey].energyLastMonth += absEnergy
                
                                if (isOnPeak(e.DateTimeUpdate)) {
                                    cached[e.snmKey].maxDemandLastMonth[tKey] = d;
                                }
                            }
                        } else {
                            // This month
                            if(prevTime[e.snmKey] >= tThisMonth && prevTime[e.snmKey] <= tTomorrow)
                            {
                                cached[e.snmKey].energyThisMonth += absEnergy
                
                                if (isOnPeak(e.DateTimeUpdate)) {
                                    if(d > cached[e.snmKey].maxDemandThisMonth)
                                    {
                                        cached[e.snmKey].maxDemandThisMonth[tKey] = d;
                                    }
                                }
                
                                if (e.DateTimeUpdate >= tYesterday && e.DateTimeUpdate <= tToday) {
                                    // Yesterday
                                    if(prevTime[e.snmKey] >= tYesterday && prevTime[e.snmKey] <= tTomorrow)
                                    {
                                        cached[e.snmKey].energyYesterday += absEnergy
                
                                        if (isOnPeak(e.DateTimeUpdate)) {
                                            if(d > cached[e.snmKey].maxDemandYesterday)
                                            {
                                                cached[e.snmKey].maxDemandYesterday[tKey] = d;
                                            }
                                        }
                                    }
                                    
                                } else if (e.DateTimeUpdate >= tToday && prevTime[e.snmKey] <= tTomorrow) {
                                    cached[e.snmKey].energyToday += absEnergy
                
                                    if (isOnPeak(e.DateTimeUpdate)) {
                                        if(d > cached[e.snmKey].maxDemandToday)
                                        {
                                            cached[e.snmKey].maxDemandToday[tKey] = d;
                                        }
                                    }
                                }
                            }
                        }
                
                        prevTime[e.snmKey] = e.DateTimeUpdate
                    }

                    tasksDone++;
                    availableSlots++;
                }
            })
        }

        

        
    }

    let elapsed = new Date();
    console.log('Cached initialization done. Took', (elapsed.getTime() - now.getTime())/1000, 'seconds');

    // let keys = Object.keys(cached);

    // for(let k of keys)
    // {
    //     let obj = {
    //         energyLastMonth: cached[k].energyLastMonth,
    //         energyThisMonth: cached[k].energyThisMonth,
    //         energyYesterday: cached[k].energyYesterday,
    //         energyToday: cached[k].energyToday
    //     }

    //     console.log(k, obj)
    // }
    qLock = false;

    return {msg: 'Cached initialization done. Took ' + String((elapsed.getTime() - now.getTime())/1000) + ' seconds', status: 'success'};

    // return promisedData.then((eData) => {
    //     for (let e of eData) {
    //         if(!cached.hasOwnProperty(e.snmKey))
    //         {
    //             cached[e.snmKey] = {
    //                 energyLastMonth: 0,
    //                 energyThisMonth: 0,
    //                 energyYesterday: 0,
    //                 energyToday: 0,
    //                 maxDemandLastMonth: {},
    //                 maxDemandThisMonth: {},
    //                 maxDemandYesterday: {},
    //                 maxDemandToday: {},
    //                 prevEnergy: 0,
    //                 prevTime: null
    //             }
    //         }

    //         let energy = 0;
    
    //         if(meta_cfg.useImport.value)
    //         {
    //             energy = e.Import_kWh
    //         }
    //         else
    //         {
    //             energy = e.TotalkWh
    //         }
    
    //         if (!prevTime[e.snmKey]) {
    //             prevEnergy[e.snmKey] = energy
    //             prevTime[e.snmKey] = e.DateTimeUpdate
    //             continue
    //         }
    
    //         let adjustedTime = new Date(Date.UTC(e.DateTimeUpdate.getUTCFullYear(), e.DateTimeUpdate.getUTCMonth(), e.DateTimeUpdate.getUTCDate(), e.DateTimeUpdate.getUTCHours(), e.DateTimeUpdate.getUTCMinutes()))
    //         // adjustedTime.setUTCMinutes(adjustedTime.getUTCMinutes() - 1)
    //         let tKey = adjustedTime.getUTCFullYear() + '-' + (adjustedTime.getUTCMonth()+1) + '-' + adjustedTime.getUTCDate() + '-' + adjustedTime.getUTCHours() + '-' + adjustedTime.getUTCMinutes()

    //         let absEnergy = (energy - prevEnergy[e.snmKey])
    
    //         prevEnergy[e.snmKey] = energy

    //         cached[e.snmKey].prevEnergy = energy;
    //         cached[e.snmKey].prevTime = e.DateTimeUpdate;

    //         let gap = ((e.DateTimeUpdate - prevTime[e.snmKey])/1000/60)/60

    //         let d = absEnergy/gap;
    
    //         if (e.DateTimeUpdate >= tLastMonth && e.DateTimeUpdate <= tThisMonth) {
    //             // Last month
    //             if(prevTime[e.snmKey] >= tLastMonth && prevTime[e.snmKey] <= tThisMonth)
    //             {
    //                 cached[e.snmKey].energyLastMonth += absEnergy
    
    //                 if (isOnPeak(e.DateTimeUpdate)) {
    //                     cached[e.snmKey].maxDemandLastMonth[tKey] = d;
    //                 }
    //             }
    //         } else {
    //             // This month
    //             if(prevTime[e.snmKey] >= tThisMonth && prevTime[e.snmKey] <= tTomorrow)
    //             {
    //                 cached[e.snmKey].energyThisMonth += absEnergy
    
    //                 if (isOnPeak(e.DateTimeUpdate)) {
    //                     if(d > cached[e.snmKey].maxDemandThisMonth)
    //                     {
    //                         cached[e.snmKey].maxDemandThisMonth[tKey] = d;
    //                     }
    //                 }
    
    //                 if (e.DateTimeUpdate >= tYesterday && e.DateTimeUpdate <= tToday) {
    //                     // Yesterday
    //                     if(prevTime[e.snmKey] >= tYesterday && prevTime[e.snmKey] <= tTomorrow)
    //                     {
    //                         cached[e.snmKey].energyYesterday += absEnergy
    
    //                         if (isOnPeak(e.DateTimeUpdate)) {
    //                             if(d > cached[e.snmKey].maxDemandYesterday)
    //                             {
    //                                 cached[e.snmKey].maxDemandYesterday[tKey] = d;
    //                             }
    //                         }
    //                     }
                        
    //                 } else if (e.DateTimeUpdate >= tToday && prevTime[e.snmKey] <= tTomorrow) {
    //                     cached[e.snmKey].energyToday += absEnergy
    
    //                     if (isOnPeak(e.DateTimeUpdate)) {
    //                         if(d > cached[e.snmKey].maxDemandToday)
    //                         {
    //                             cached[e.snmKey].maxDemandToday[tKey] = d;
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    
    //         prevTime[e.snmKey] = e.DateTimeUpdate
    //     }

    //     let elapsed = new Date();
    //     console.log('Cached initialization done. Took', (elapsed.getTime() - now.getTime())/1000, 'seconds');

    //     // let keys = Object.keys(cached);

    //     // for(let k of keys)
    //     // {
    //     //     let obj = {
    //     //         energyLastMonth: cached[k].energyLastMonth,
    //     //         energyThisMonth: cached[k].energyThisMonth,
    //     //         energyYesterday: cached[k].energyYesterday,
    //     //         energyToday: cached[k].energyToday
    //     //     }

    //     //     console.log(k, obj)
    //     // }
    //     qLock = false;

    //     return {msg: 'Cached initialization done. Took ' + String((elapsed.getTime() - now.getTime())/1000) + ' seconds', status: 'success'};
    // })
}
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
