import Aedes from 'aedes'
import { createServer as wsCreateServer } from 'aedes-server-factory'
import { EventEmitter } from 'events';

import {
    lastAlarm,
    checkOverRange,
    blacknode,
    loadBNInfoFromLocal,
    writeFile,
    last,
    lastUpdateTime,
    lastUpdateData,
    db,
    cached,
    initCache,
    qLock,
    setCacheDirty,
    isOnPeak,
    meta_cfg
    // addQueue
} from './global.js'

export var aedesInst
export var httpServer

const QOS = 0

export async function startMQTT(BN_CFG_PATH)
{
    if(aedesInst)
    {
        aedesInst.close()
        httpServer.close()
        aedesInst = null
        start(BN_CFG_PATH)
    }
    else
    {
        start(BN_CFG_PATH)
    }
}

async function start(BN_CFG_PATH) {
    loadBNInfoFromLocal(BN_CFG_PATH)

    aedesInst = new Aedes({concurrency: Math.max(EventEmitter.defaultMaxListeners, 400)})
    httpServer = wsCreateServer(aedesInst /*, {ws: true}*/)

    // aedesInst.authorizeSubscribe = function (client, sub, cb) {
        // console.log('authorizeSubscribe', client.id, new Date(), client.id, sub)
        // cb(null, sub)
    // }

    // aedesInst.authorizePublish = function (client, pkt, cb) {
        // console.log('authorizePublish', client.id, new Date(), client.id, pkt.topic)
        // cb(null)
    // }

    // aedesInst.authenticate = function (client, username, password, callback) {
    //     console.log('authenticate', client.id, new Date())
    //     callback(null, true)
    //   }

    aedesInst.on('clientDisconnect', function (client) {
        // console.log('Disconnect', client.id, new Date());

        for (let sn of Object.keys(blacknode)) {
            if (blacknode[sn].clientid == client.id) {
                blacknode[sn].status = 'off'
                blacknode[sn].last_update = new Date()

                if(blacknode[sn].maxmeter > 0)
                {
                    for(let i=0; i<blacknode[sn].maxmeter; i++)
                    {
                        blacknode[sn].meter_list[i].status = 'off'
                    }
                }

                if (db && db.alert) {
                    let id = blacknode[sn].SiteID + '%' + blacknode[sn].NodeID + '%0'
                    db.alarm.create({
                        SerialNo: blacknode[sn].SerialNo,
                        SiteID: blacknode[sn].SiteID,
                        NodeID: blacknode[sn].NodeID,
                        ModbusID: 0,
                        snmKey: id,
                        DateTime: now,
                        type: 'BN_DC',
                        status: 'unread'
                    })

                    lastAlarm[id] = blacknode[sn].last_update
                }
            }
        }

        writeFile(BN_CFG_PATH, JSON.stringify(blacknode), { flag: 'w' })

        client.close();
    })

    // aedesInst.on('connectionError', function (client, err) {
    //     console.log('connectionError', client.id, new Date(), err);
    // })

    // aedesInst.on('subscribe', function (sub, client) {
    //     console.log('subscribe', client.id, new Date(), sub);
    // })

    // aedesInst.on('client', function (client) {
    //     console.log('client connected', client.id, new Date());
    // })

    // aedesInst.on('clientReady', function (client) {
    //     console.log('client ready', client.id, new Date());
    // })

    // aedesInst.on('keepaliveTimeout', function (client) {
    //     console.log('timeout', client.id, new Date());
    // })

    aedesInst.on('clientError', function (client, err) {
        // console.log('clientError', client.id, new Date(), err);

        for (let sn of Object.keys(blacknode)) {
            if (blacknode[sn].clientid == client.id) {
                blacknode[sn].status = 'error'
                blacknode[sn].last_update = new Date()

                if(blacknode[sn].maxmeter > 0)
                {
                    for(let i=0; i<blacknode[sn].maxmeter; i++)
                    {
                        blacknode[sn].meter_list[i].status = 'off'
                    }
                }

                if (db && db.alert) {
                    let id = blacknode[sn].SiteID + '%' + blacknode[sn].NodeID + '%0'
                    db.alarm.create({
                        SerialNo: blacknode[sn].SerialNo,
                        SiteID: blacknode[sn].SiteID,
                        NodeID: blacknode[sn].NodeID,
                        ModbusID: 0,
                        snmKey: id,
                        DateTime: now,
                        type: 'BN_DC',
                        status: 'unread'
                    })

                    lastAlarm[id] = blacknode[sn].last_update
                }
            }
        }

        writeFile(BN_CFG_PATH, JSON.stringify(blacknode), { flag: 'w' })

        client.close();
    })

    aedesInst.on('publish', function (pkt, _client) {
        const data_re = /^(DATABASE|REALTIME)\/(.*?)\/(.*?)\/(.*?)\/(\d*)$/
        const cfg_re = /^CFG\/([^\/]*)$/

        let cfg_m = pkt.topic.match(cfg_re)
        let data_m = pkt.topic.match(data_re)

        if (cfg_m) {
            // Configuration topic

            let sn = cfg_m[1]
            let cmd = pkt.payload.toString()

            if (cmd == 'request_config') {
                if (!blacknode.hasOwnProperty(sn)) {
                    let obj = {
                        name: 'undefined',
                        clientid: _client.id,
                        mqtt: 'undefined',
                        clientip: '0.0.0.0',
                        period: 15,
                        serial: sn,
                        siteid: 'undefined',
                        nodeid: 'undefined',
                        maxmeter: 0,
                        meter_list: [],
                        status: 'setup',
                        last_update: new Date()
                    }

                    // for(let i=0; i<30; i++)
                    // {
                    //   let initMeter = {
                    //     id: i+1,
                    //     name: 'undefined',
                    //     type: 0,
                    //     status: 'off',
                    //     last_update: new Date()
                    //   }

                    //   obj.meter_list.push(initMeter);
                    // }

                    blacknode[sn] = obj
                } else {
                    blacknode[sn].last_update = new Date()
                    blacknode[sn].status = 'setup'
                    blacknode[sn].clientid = _client.id
                }

                writeFile(BN_CFG_PATH, JSON.stringify(blacknode), { flag: 'w' })

                last['message'] = 'Blacknode ' + sn + ' connected. Please initialize the blacknode.'
                last['time'] = new Date()
                last['status'] = 'success'
            } else if (cmd == 'ack_config') {
                if (!blacknode.hasOwnProperty(sn)) {
                    last['message'] =
                        'Please first press "request config" button on Blacknode ' + sn + '.'
                    last['time'] = new Date()
                    last['status'] = 'error'

                    return
                }

                blacknode[sn].last_update = new Date()
                blacknode[sn].status = 'on'
                blacknode[sn].clientid = _client.id

                writeFile(BN_CFG_PATH, JSON.stringify(blacknode), { flag: 'w' })

                last['message'] = 'Blacknode ' + sn + ' is successfully configured.'
                last['time'] = new Date()
                last['status'] = 'success'
            }
        } else if (data_m) {
            // Data topic
            let dtype = data_m[1]
            let sn = data_m[2]
            let siteid = data_m[3]
            let nodeid = data_m[4]
            let modbusid = parseInt(data_m[5]) - 1
            let snid = sn + '%' + String(modbusid)

            if (blacknode.hasOwnProperty(sn)) {
                if (blacknode[sn].status == 'setup') {
                    last['message'] =
                        'Received data from blacknode ' + sn + ' that is not initilized. Ignored.'
                    last['time'] = new Date()
                    last['status'] = 'error'
                    console.log('Received data from a blacknode that is not initilized. Ignored.')
                } else {
                    blacknode[sn].last_update = new Date()
                    blacknode[sn].status = 'on'
                    blacknode[sn].clientid = _client.id

                    if(blacknode[sn].meter_list.length > modbusid)
                    {
                        blacknode[sn].meter_list[modbusid].last_update = blacknode[sn].last_update
                        blacknode[sn].meter_list[modbusid].status = 'on'
                    }
                    else
                    {
                        last['message'] = 'Received data from modbus ' + data_m[5] + ' that is out of range. Ignored.'
                        last['time'] = new Date()
                        last['status'] = 'error'
                        console.log('Received data from a modbusid that is out of range. Ignored.')
                    }
                    
                }
            } else {
                last['message'] =
                    'Received data from blacknode ' + sn + ' that is not initilized. Ignored.'
                last['time'] = new Date()
                last['status'] = 'error'
                console.log('Received data from a blacknode that is not initilized. Ignored.')

                return
            }

            if (dtype == 'DATABASE') {
                const pkt_re = /^t=(\d{4})-(\d{2})-(\d{2})\+(\d{2}):(\d{2}):(\d{2})&d=(.*)$/

                let d = pkt.payload.toString().match(pkt_re)

                if (d) {
                    // Payload pattern matched.

                    let dt = new Date(Date.UTC(d[1], parseInt(d[2]) - 1, d[3], d[4], d[5], d[6]))
                    let e = d[7].split('|')

                    if (e.length == 39) {
                        if (db.energy == null) {
                            last['message'] =
                                'Received MQTT packet(s) but the database is not initialized.'
                            last['time'] = new Date()
                            last['status'] = 'error'

                            aedesInst.publish(
                                {
                                    cmd: 'publish',
                                    qos: QOS,
                                    dup: false,
                                    retain: false,
                                    topic:
                                        'LOG/DATABASE/' +
                                        sn +
                                        '/' +
                                        siteid +
                                        '/' +
                                        nodeid +
                                        '/' +
                                        String(modbusid + 1).padStart(2, '0'),
                                    payload: 'ERROR: database'
                                },
                                function () {}
                            )
                            return
                        }

                        try {
                            let obj = {
                                SerialNo: sn,
                                SiteID: siteid,
                                NodeID: nodeid,
                                ModbusID: String(modbusid + 1),
                                snmKey: siteid + '%' + nodeid + '%' + String(modbusid + 1),
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
                                // kWdemand: parseFloat(e[2]) * 4
                            }

                            // Check duplicate
                            
                            if(!blacknode[sn].meter_list[modbusid].last_db)
                            {
                                blacknode[sn].meter_list[modbusid].last_db = new Date(0)
                            }

                            let lastDB = new Date(blacknode[sn].meter_list[modbusid].last_db)

                            if(lastDB.getTime() < dt.getTime())
                            {
                                blacknode[sn].meter_list[modbusid].last_db = dt

                                checkOverRange(obj)

                                db.energy.create(obj, {raw: true}).then(() => {
                                    aedesInst.publish(
                                        {
                                            cmd: 'publish',
                                            qos: QOS,
                                            dup: false,
                                            retain: false,
                                            topic:
                                                'LOG/DATABASE/' +
                                                sn +
                                                '/' +
                                                siteid +
                                                '/' +
                                                nodeid +
                                                '/' +
                                                String(modbusid + 1).padStart(2, '0'),
                                            payload: 'OK'
                                        },
                                        function () {}
                                    )

                                    let snmk = siteid + '%' + nodeid + '%' + String(modbusid + 1);
                                    let adjustedTime = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), dt.getUTCHours(), dt.getUTCMinutes()))
                                    // adjustedTime.setUTCMinutes(adjustedTime.getUTCMinutes() - 1)
                                    let tKey = adjustedTime.getUTCFullYear() + '-' + (adjustedTime.getUTCMonth()+1) + '-' + adjustedTime.getUTCDate() + '-' + adjustedTime.getUTCHours() + '-' + adjustedTime.getUTCMinutes()

                                    let energy = 0;

                                    if(meta_cfg.useImport.value)
                                    {
                                        energy = obj.Import_kWh
                                    }
                                    else
                                    {
                                        energy = obj.TotalkWh
                                    }

                                    if(!cached.hasOwnProperty(snmk))
                                    {
                                        cached[snmk] = {
                                            energyLastMonth: 0,
                                            energyThisMonth: 0,
                                            energyYesterday: 0,
                                            energyToday: 0,
                                            maxDemandLastMonth: {},
                                            maxDemandThisMonth: {},
                                            maxDemandYesterday: {},
                                            maxDemandToday: {},
                                            prevEnergy: energy,
                                            prevTime: dt
                                        }
                                    }
                                    else
                                    {
                                        if(!qLock)
                                        {
                                            let now = new Date();

                                            let tLastMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0))
                                            let tThisMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0))
                                            let tYesterday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0))
                                            let tToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0))
                                            let tTomorrow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0))

                                            let gap = ((obj.DateTimeUpdate - cached[snmk].prevTime)/60/1000)/60
                                            let absEnergy = energy - cached[snmk].prevEnergy
                                            let d = absEnergy/gap;

                                            if (dt >= tLastMonth && dt <= tThisMonth) {
                                                // Last month
                                                if(cached[snmk].prevTime >= tLastMonth && cached[snmk].prevTime <= tThisMonth)
                                                {
                                                    cached[snmk].energyLastMonth += absEnergy
                                    
                                                    if (isOnPeak(dt)) {
                                                        cached[snmk].maxDemandLastMonth[tKey] = d;
                                                    }
                                                }
                                            } else {
                                                // This month
                                                if(cached[snmk].prevTime >= tThisMonth && cached[snmk].prevTime <= tTomorrow)
                                                {
                                                    cached[snmk].energyThisMonth += absEnergy
                                    
                                                    if (isOnPeak(dt)) {
                                                        if(d > cached[snmk].maxDemandThisMonth)
                                                        {
                                                            cached[snmk].maxDemandThisMonth[tKey] = d;
                                                        }
                                                    }
                                    
                                                    if (dt >= tYesterday && dt <= tToday) {
                                                        // Yesterday
                                                        if(cached[snmk].prevTime >= tYesterday && cached[snmk].prevTime <= tTomorrow)
                                                        {
                                                            cached[snmk].energyYesterday += absEnergy
                                    
                                                            if (isOnPeak(dt)) {
                                                                if(d > cached[snmk].maxDemandYesterday)
                                                                {
                                                                    cached[snmk].maxDemandYesterday[tKey] = d;
                                                                }
                                                            }
                                                        }
                                                        
                                                    } else if (dt >= tToday && cached[snmk].prevTime <= tTomorrow) {
                                                        cached[snmk].energyToday += absEnergy
                                    
                                                        if (isOnPeak(dt)) {
                                                            if(d > cached[snmk].maxDemandToday)
                                                            {
                                                                cached[snmk].maxDemandToday[tKey] = d;
                                                            }
                                                        }
                                                    }
                                                }
                                            }

                                            cached[snmk].prevTime = dt;
                                            cached[snmk].prevEnergy = energy;
                                        }
                                        else
                                        {
                                            setCacheDirty();
                                            initCache();
                                        }
                                    }

                                })
                            }
                            else
                            {
                                console.log('Received duplicated packet. Ignored.')

                                aedesInst.publish(
                                    {
                                        cmd: 'publish',
                                        qos: QOS,
                                        dup: false,
                                        retain: false,
                                        topic:
                                            'LOG/DATABASE/' +
                                            sn +
                                            '/' +
                                            siteid +
                                            '/' +
                                            nodeid +
                                            '/' +
                                            String(modbusid + 1).padStart(2, '0'),
                                        payload: 'OK'
                                    },
                                    function () {}
                                )
                            }
                            

                            // let aQ = {
                            //     cmd: 'publish',
                            //     qos: QOS,
                            //     dup: false,
                            //     retain: false,
                            //     topic:
                            //         'LOG/DATABASE/' +
                            //         sn +
                            //         '/' +
                            //         siteid +
                            //         '/' +
                            //         nodeid +
                            //         '/' +
                            //         String(modbusid + 1),
                            //     payload: 'OK'
                            // };

                            // addQueue(obj, aQ)

                            
                        } catch (err) {
                            aedesInst.publish(
                                {
                                    cmd: 'publish',
                                    qos: QOS,
                                    dup: false,
                                    retain: false,
                                    topic:
                                        'LOG/DATABASE/' +
                                        sn +
                                        '/' +
                                        siteid +
                                        '/' +
                                        nodeid +
                                        '/' +
                                        String(modbusid + 1).padStart(2, '0'),
                                    payload: 'ERROR: database'
                                },
                                function () {}
                            )
                            console.log(err)
                        }
                    } else {
                        aedesInst.publish(
                            {
                                cmd: 'publish',
                                qos: QOS,
                                dup: false,
                                retain: false,
                                topic:
                                    'LOG/DATABASE/' +
                                    sn +
                                    '/' +
                                    siteid +
                                    '/' +
                                    nodeid +
                                    '/' +
                                    String(modbusid + 1).padStart(2, '0'),
                                payload: 'ERROR: parameter'
                            },
                            function () {}
                        )
                    }
                } else {
                    aedesInst.publish(
                        {
                            cmd: 'publish',
                            qos: QOS,
                            dup: false,
                            retain: false,
                            topic:
                                'LOG/DATABASE/' +
                                sn +
                                '/' +
                                siteid +
                                '/' +
                                nodeid +
                                '/' +
                                String(modbusid + 1).padStart(2, '0'),
                            payload: 'ERROR: time'
                        },
                        function () {}
                    )
                }
            } else if (dtype == 'REALTIME') {
                const pkt_re = /^d=(.*)$/

                let d = pkt.payload.toString().match(pkt_re)

                if (d) {
                    // Payload pattern matched.
                    let e = d[1].split('|')

                    if (e.length == 39) {
                        // Avoid updating too often
                        let first = false

                        if (!(snid in lastUpdateTime)) {
                            lastUpdateTime[snid] = new Date()
                            lastUpdateData[snid] = {}

                            first = true
                        }

                        let now = new Date()

                        if (first || now.getTime() - lastUpdateTime[snid].getTime() > 500) {
                            // Update object if last update is more than 500 msecs away, ignore otherwise
                            lastUpdateTime[snid] = now

                            let lastFifteenTime = new Date()
                            lastFifteenTime.setUTCMinutes(
                                parseInt(Math.trunc(lastFifteenTime.getUTCMinutes() / 15) * 15)
                            )
                            lastFifteenTime.setUTCSeconds(0)
                            lastFifteenTime.setUTCMilliseconds(0)
                            let lastFifteenData = (lastUpdateData[snid].lastFifteenData) ? lastUpdateData[snid].lastFifteenData : parseFloat(e[2])

                            if (
                                lastUpdateData[snid] &&
                                lastUpdateData[snid].lastFifteenTime &&
                                lastUpdateData[snid].lastFifteenTime.getTime() != lastFifteenTime.getTime()
                            ) {
                                lastFifteenData = parseFloat(e[2])
                            }

                            let obj = {
                                SerialNo: sn,
                                SiteID: siteid,
                                NodeID: nodeid,
                                ModbusID: String(modbusid),
                                DateTimeUpdate: now,
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
                                kWdemand: (parseFloat(e[2]) - lastFifteenData) * 4,
                                lastFifteenTime: lastFifteenTime,
                                lastFifteenData: lastFifteenData
                            }

                            checkOverRange(obj, true)

                            Object.assign(lastUpdateData[snid], obj)
                        }
                    }
                }
            }
        } else {
            // Invalid topic
        }

    })

    httpServer.listen((meta_cfg.broker.mqttport) ? meta_cfg.broker.mqttport : 8884, function () {
        console.log('MQTT server is running at ', (meta_cfg.broker.mqttport) ? meta_cfg.broker.mqttport : 8884)
    })
}
