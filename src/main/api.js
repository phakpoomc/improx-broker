import express from 'express'
import fileUpload from 'express-fileupload'
import cors from 'cors'
import bcrypt from 'bcrypt'
import { Op } from 'sequelize'
import {
    lastUpdateData,
    lastUpdateTime,
    blacknode,
    db,
    paths,
    writeFile,
    meta_cfg,
    loadBNInfoFromLocal,
    group,
    loadGroup,
    holidays,
    loadHoliday,
    loadAlarm,
    loadMetaDB,
    loadMetaCFG,
    cached,
    lastFeedTime,
    MAX_HEARTBEAT
} from './global.js'
import { createReadStream } from 'fs'
import { syncDB } from './db.js'
import ExcelJS from 'exceljs'
import * as path from 'path'
import bodyParser from 'body-parser'

import session from 'express-session'

export var api_server

const MAX_NUMBER = 99999999999
const TIME_PERIOD = 15*60*1000
const DEMAND = 60*60*1000/TIME_PERIOD

// gtype = Group Method, dtype = data storage type (accumulative/instance)
const cmap = {
    'Import_kWh': {
        name: 'Import_kWh',
        unit: '',
        group: 'sum',
        storage: 'instance',
        weight: true,
        alarm: false,
    },
    'Export_kWh': {
        name: 'Export_kWh',
        unit: '',
        group: 'sum',
        storage: 'instance',
        weight: true,
        alarm: false,
    },
    'TotalkWh': {
        name: 'TotalkWh',
        unit: '',
        group: 'sum',
        storage: 'instance',
        weight: true,
        alarm: false,
    },
    'Total_kvarh': {
        name: 'Total_kvarh',
        unit: '',
        group: 'sum',
        storage: 'accumulative',
        weight: true,
        alarm: false,
    },
    'Ind_kvarh': {
        name: 'Ind_kvarh',
        unit: '',
        group: 'sum',
        storage: 'accumulative',
        weight: true,
        alarm: false,
    },
    'Cap_kvarh': {
        name: 'Cap_kvarh',
        unit: '',
        group: 'sum',
        storage: 'accumulative',
        weight: true,
        alarm: false,
    },
    'kVAh': {
        name: 'kVAh',
        unit: '',
        group: 'sum',
        storage: 'accumulative',
        weight: true,
        alarm: false,
    },
    'V1': {
        name: 'V1',
        unit: '(V)',
        group: 'avg',
        storage: 'instance',
        weight: false,
        alarm: true,
    },
    'V2': {
        name: 'V2',
        unit: '(V)',
        group: 'avg',
        storage: 'instance',
        weight: false,
        alarm: true,
    },
    'V3': {
        name: 'V3',
        unit: '(V)',
        group: 'avg',
        storage: 'instance',
        weight: false,
        alarm: true,
    },
    'V12': {
        name: 'V12',
        unit: '(V)',
        group: 'avg',
        storage: 'instance',
        weight: false,
        alarm: true,
    },
    'V23': {
        name: 'V23',
        unit: '(V)',
        group: 'avg',
        storage: 'instance',
        weight: false,
        alarm: true,
    },
    'V31': {
        name: 'V31',
        unit: '(V)',
        group: 'avg',
        storage: 'instance',
        weight: false,
        alarm: true,
    },
    'I1': {
        name: 'I1',
        unit: '(A)',
        group: 'sum',
        storage: 'instance',
        weight: true,
        alarm: true,
    },
    'I2': {
        name: 'I2',
        unit: '(A)',
        group: 'sum',
        storage: 'instance',
        weight: true,
        alarm: true,
    },
    'I3': {
        name: 'I3',
        unit: '(A)',
        group: 'sum',
        storage: 'instance',
        weight: true,
        alarm: true,
    },
    'P1': {
        name: 'P1',
        unit: '(kW)',
        group: 'sum',
        storage: 'instance',
        weight: true,
        alarm: true,
    },
    'P2': {
        name: 'P2',
        unit: '(kW)',
        group: 'sum',
        storage: 'instance',
        weight: true,
        alarm: true,
    },
    'P3': {
        name: 'P3',
        unit: '(kW)',
        group: 'sum',
        storage: 'instance',
        weight: true,
        alarm: true,
    },
    'P_Sum': {
        name: 'P_Sum',
        unit: '(kW)',
        group: 'sum',
        storage: 'instance',
        weight: true,
        alarm: true,
    },
    'Q1': {
        name: 'Q1',
        unit: '(kvar)',
        group: 'sum',
        storage: 'instance',
        weight: true,
        alarm: true,
    },
    'Q2': {
        name: 'Q2',
        unit: '(kvar)',
        group: 'sum',
        storage: 'instance',
        weight: true,
        alarm: true,
    },
    'Q3': {
        name: 'Q3',
        unit: '(kvar)',
        group: 'sum',
        storage: 'instance',
        weight: true,
        alarm: true,
    },
    'Q_Sum': {
        name: 'Q_Sum',
        unit: '(kvar)',
        group: 'sum',
        storage: 'instance',
        weight: true,
        alarm: true,
    },
    'S1': {
        name: 'S1',
        unit: '(kVA)',
        group: 'sum',
        storage: 'instance',
        weight: true,
        alarm: true,
    },
    'S2': {
        name: 'S2',
        unit: '(kVA)',
        group: 'sum',
        storage: 'instance',
        weight: true,
        alarm: true,
    },
    'S3': {
        name: 'S3',
        unit: '(kVA)',
        group: 'sum',
        storage: 'instance',
        weight: true,
        alarm: true,
    },
    'S_Sum': {
        name: 'S_Sum',
        unit: '(kVA)',
        group: 'sum',
        storage: 'instance',
        weight: true,
        alarm: true,
    },
    'PF1': {
        name: 'PF1',
        unit: '',
        group: 'avg',
        storage: 'instance',
        weight: false,
        alarm: true,
    },
    'PF2': {
        name: 'PF2',
        unit: '',
        group: 'avg',
        storage: 'instance',
        weight: false,
        alarm: true,
    },
    'PF3': {
        name: 'PF3',
        unit: '',
        group: 'avg',
        storage: 'instance',
        weight: false,
        alarm: true,
    },
    'PF_Sum': {
        name: 'PF_Sum',
        unit: '',
        group: 'avg',
        storage: 'instance',
        weight: false,
        alarm: true,
    },
    'THD_U1': {
        name: 'THD_U1',
        unit: '(%)',
        group: 'avg',
        storage: 'instance',
        weight: false,
        alarm: false,
    },
    'THD_U2': {
        name: 'THD_U2',
        unit: '(%)',
        group: 'avg',
        storage: 'instance',
        weight: false,
        alarm: false,
    },
    'THD_U3': {
        name: 'THD_U3',
        unit: '(%)',
        group: 'avg',
        storage: 'instance',
        weight: false,
        alarm: false,
    },
    'THD_I1': {
        name: 'THD_I1',
        unit: '(%)',
        group: 'avg',
        storage: 'instance',
        weight: false,
        alarm: false,
    },
    'THD_I2': {
        name: 'THD_I2',
        unit: '(%)',
        group: 'avg',
        storage: 'instance',
        weight: false,
        alarm: false,
    },
    'THD_I3': {
        name: 'THD_I3',
        unit: '(%)',
        group: 'avg',
        storage: 'instance',
        weight: false,
        alarm: false,
    },
    'Frequency': {
        name: 'Frequency',
        unit: '(Hz)',
        group: 'avg',
        storage: 'instance',
        weight: false,
        alarm: true,
    },
    'kWdemand': {
        name: 'kWdemand',
        unit: '',
        group: 'sum',
        storage: 'accumulative',
        weight: false,
        alarm: false,
    },
}

const pmap = Object.keys(cmap)

function checkRoles(givenRoles, allowedRoles)
{
    for(let r of givenRoles)
    {
        if(allowedRoles.includes(r))
        {
            return true
        }
    }

    return false
}

const routes = {
    'index': ['owner', 'user', 'admin', 'test'],
    'alarm': ['owner', 'user', 'admin', 'test'],
    'backupbn': ['owner', 'admin', 'test'],
    'backupimpro': ['owner', 'admin', 'test'],
    'groupmanage': ['owner', 'admin', 'test'],
    'holidaymanage': ['owner', 'admin', 'test'],
    'management': ['owner', 'admin', 'test'],
    'meterdata': ['owner', 'user', 'admin', 'test'],
    'metermonitor': ['owner', 'user', 'admin', 'test'],
    'nodemonitor': ['owner', 'user', 'admin', 'test'],
    'parametermanage': ['owner', 'admin', 'test'],
    'phasor': ['owner', 'user', 'admin', 'test'],
    'report': ['owner', 'user', 'admin', 'test'],
    'usermanage': ['owner', 'admin', 'test'],
}

const apis = {
    'dashboard': ['owner', 'user', 'admin', 'test'],
    'group_meter_info': ['owner', 'user', 'admin', 'test'],
    'rt_chart': ['owner', 'user', 'admin', 'test'],
    'meter_data_table': ['owner', 'user', 'admin', 'test'],
    'node_monitor': ['owner', 'user', 'admin', 'test'],
    'meter_list': ['owner', 'user', 'admin', 'test'],
    'phasor': ['owner', 'user', 'admin', 'test'],
    'backup': ['owner', 'admin', 'test'],
    'getmeter': ['owner', 'user', 'admin', 'test'],
    'getgroup': ['owner', 'user', 'admin', 'test'],
    'management': ['owner', 'admin', 'test'],
    'alarm': ['owner', 'user', 'admin', 'test'],
    'getparameter': ['owner', 'user', 'admin', 'test'],
    'getholiday': ['owner', 'user', 'admin', 'test'],
    'getuser': ['owner', 'user', 'admin', 'test'],
    'rp_chart': ['owner', 'user', 'admin', 'test'],
    'feedmeter': ['owner', 'admin', 'test']
}

async function routeguard(req, route)
{
    if(routes.hasOwnProperty(route))
    {
        if(req.session && (req.session.user != null || req.session.user != undefined))
        {
            if(checkRoles(req.session.role, routes[route]))
            {
                return true
            }
        }
    }

    return false
}

async function apiguard(req, route, token)
{
    if(apis.hasOwnProperty(route))
    {
        if(req.session && (req.session.user != null || req.session.user != undefined))
        {
            if(checkRoles(req.session.role, apis[route]))
            {
                return true
            }
        }
        else if(meta_cfg.api.key != "" && meta_cfg.api.key == token)
        {
            return true
        }
        // else if(token is valid)
        // {}
    }

    return false
}

function isOnPeak(dt) {
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


export function initAPI() {
    if(api_server)
    {
        api_server.close()
    }

    let origin = '*'

    if(meta_cfg && meta_cfg.broker && meta_cfg.broker.cors && meta_cfg.broker.cors.length > 0)
    {
        origin = meta_cfg.broker.cors
    }

    console.log('CORS: ', origin)
    
    const api = express()
    api.use(cors({
        credentials: true,
        methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD"],
        origin:  origin
    }))
    api.use(express.json())
    api.use(bodyParser.urlencoded({ extended: false }))
    api.use(bodyParser.json())
    api.use(fileUpload())
    api.use(session({
        secret: 'improx',
        resave: false,
        saveUninitialized: true,
        cookie: {
            httpOnly: true,
            maxAge: 86400*1000*7,
            secure: false
        },
        rolling: true
    }))

    api.get('/routeguard/:route', async (req, res) => {
        let allowed = await routeguard(req, req.params.route)

        if(allowed)
        {
            res.send('OK')
        }
        else
        {
            res.send('ERR')
        }
    })

    api.post('/login', async (req, res) => {
        let uname = req.body.username
        let passwd = req.body.password

        if(db && db.user && db.userrole)
        {
            let found = await db.user.findOne({
                where: {
                    username: uname,
                }
            })

            if(found)
            {
                let match = await bcrypt.compare(passwd, found.password)

                if(match)
                {
                    let rs = await db.userrole.findAll({
                        attributes: ['role'],
                        where: {
                            userid: found.id
                        }
                    })
    
                    let roles = []
    
                    for(let r of rs)
                    {
                        roles.push(r.role)
                    }
    
                    req.session.regenerate((err) => {
                        if(!err)
                        {
                            req.session.user = uname
                            req.session.role = roles
    
                            req.session.save((err) => {
                                if(!err)
                                {
                                    res.send(uname)
                                }
                                else
                                {
                                    res.send('a')
                                }
                            })
                        }
                        else
                        {
                            res.send('b')
                        }
                    })
                }
                else
                {
                    res.send('c')
                }
            }
            else
            {
                res.send('d')
            }
        }
        else
        {
            res.send('e')
        }
    })

    api.get('/logout', (req, res) => {
        req.session.user = null
        req.session.destroy((err) => {
            res.send('OK')
        })
    })

    api.get('/dashboard_card', async (req, res) => {
        let ret = {
            t_last_month: 0,
            t_this_month: 0,
            t_yesterday: 0,
            t_today: 0,
            b_last_month: 0,
            b_this_month: 0,
            b_yesterday: 0,
            b_today: 0
        }

        if(await apiguard(req, 'dashboard', '') == false)
        {
            ret = {
                t_last_month: 0,
                t_this_month: 0,
                t_yesterday: 0,
                t_today: 0,
                b_last_month: 0,
                b_this_month: 0,
                b_yesterday: 0,
                b_today: 0
            }
            res.json(ret)
            return
        }

        let user = await db.user.findOne({
            where: { username: req.session.user }
        })

        if(user && user.dataValues.group)
        {
            var group = await db.group.findOne({
                where: { id: user.dataValues.group }
            })
        }
        else
        {
            var group = await db.group.findOne({
                where: { showDashboard: true }
            })
        } 

        group = group.dataValues;

        let all = true
        var snmKey = []
        let prevEnergy = {}
        let prevTime = {}
        let multmap = {}

        if (group !== null) {
            let members = await db.gmember.findAll({
                where: { GroupID: group.id }
            })

            if (members !== null) {
                for (let m of members) {
                    let key = m.SiteID + '%' + m.NodeID + '%' + String(m.ModbusID)

                    snmKey.push(key)
                    prevEnergy[key] = 0
                    prevTime[key] = null
                    multmap[key] = parseFloat(m.multiplier)
                }

                all = false
            }
        }

        if(all)
        {
            snmKey = Object.keys(cached);
        }

        for(let k of snmKey)
        {
            if(!cached.hasOwnProperty(k))
            {
                continue;
            }

            ret.t_last_month += cached[k].energyLastMonth;
            ret.t_this_month += cached[k].energyThisMonth;
            ret.t_yesterday += cached[k].energyYesterday;
            ret.t_today += cached[k].energyToday;

            var kDLastMonth = Object.keys(cached[k].maxDemandLastMonth);
            var kDThisMonth = Object.keys(cached[k].maxDemandThisMonth);
            var kDYesterday = Object.keys(cached[k].maxDemandYesterday);
            var kDToday = Object.keys(cached[k].maxDemandToday);
        }

        for(let t of kDLastMonth) {
            let sum = 0;

            for(let k of snmKey)
            {
                if(!cached[k].maxDemandLastMonth[t])
                {
                    cached[k].maxDemandLastMonth[t] = 0;
                }

                sum += cached[k].maxDemandLastMonth[t];
            }

            if(sum > ret.b_last_month)
            {
                ret.b_last_month = sum;
            }
        };

        for(let t of kDThisMonth) {
            let sum = 0;

            for(let k of snmKey)
            {
                if(!cached[k].maxDemandLastMonth[t])
                {
                    cached[k].maxDemandThisMonth[t] = 0;
                }

                sum += cached[k].maxDemandThisMonth[t];
            }

            if(sum > ret.b_this_month)
            {
                ret.b_this_month = sum;
            }
        };

        for(let t of kDYesterday) {
            let sum = 0;

            for(let k of snmKey)
            {
                if(!cached[k].maxDemandYesterday[t])
                {
                    cached[k].maxDemandYesterday[t] = 0;
                }

                sum += cached[k].maxDemandYesterday[t];
            }

            if(sum > ret.b_yesterday)
            {
                ret.b_yesterday = sum;
            }
        };

        for(let t of kDToday) {
            let sum = 0;

            for(let k of snmKey)
            {
                if(!cached[k].maxDemandToday[t])
                {
                    cached[k].maxDemandToday[t] = 0;
                }

                sum += cached[k].maxDemandToday[t];
            }

            if(sum > ret.b_today)
            {
                ret.b_today = sum;
            }
        };

        res.json(ret)
    })

    api.get('/dashboard/:year/:month/:day', async (req, res) => {
        let ret = []

        if(await apiguard(req, 'dashboard', '') == false)
        {
            res.json(ret)
            return
        }

        // calculate value and return
        for (let i = 0; i < 24; i++) {
            ret[i] = {
                category: String(i),
                value1: 0
            }
        }

        let year = req.params.year
        let month = parseInt(req.params.month) - 1
        let day = parseInt(req.params.day)

        let startTime = new Date(Date.UTC(year, month, day, 0, 0, 0))
        let endTime = new Date(Date.UTC(year, month, day + 1, 0, 0, 0))

        let now = new Date()
        now = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0)

        if(now < endTime)
        {
            endTime = new Date(now)
        }

        let timeList = [];

        for(let t = startTime; t<endTime; t.setMinutes(t.getMinutes() + 60))
        {
            timeList.push(new Date(t));
        }

        let user = await db.user.findOne({
            where: { username: req.session.user }
        })

        if(user && user.dataValues.group)
        {
            var group = await db.group.findOne({
                where: { id: user.dataValues.group }
            })
        }
        else
        {
            var group = await db.group.findOne({
                where: { showDashboard: true }
            })
        } 

        group = group.dataValues;

        var eData
        let all = true
        var snmKey = []
        let prevEnergy = {}
        let prevTime = {}
        let multmap = {}

        if (group !== null) {
            let members = await db.gmember.findAll({
                where: { GroupID: group.id }
            })

            if (members !== null) {
                for (let m of members) {
                    let key = m.SiteID + '%' + m.NodeID + '%' + String(m.ModbusID)

                    snmKey.push(key)
                    prevEnergy[key] = 0
                    prevTime[key] = null
                    multmap[key] = parseFloat(m.multiplier)
                }

                all = false
            }
        }

        if (all) {
            eData = await db.energy.findAll({
                attributes: ['snmKey', 'DateTimeUpdate', 'Import_kWh', 'TotalkWh'],
                where: {
                    DateTimeUpdate: timeList
                    // DateTimeUpdate: {
                    //     [Op.and]: {
                    //         [Op.gte]: startTime,
                    //         [Op.lte]: endTime
                    //     }
                    // }
                },
                order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
            })
        } else {
            eData = await db.energy.findAll({
                where: {
                    // DateTimeUpdate: {
                    //     [Op.and]: {
                    //         [Op.gte]: startTime,
                    //         [Op.lte]: endTime
                    //     }
                    // },
                    DateTimeUpdate: timeList,
                    snmKey: snmKey
                },
                order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
            })
        }

        for (let e of eData) {
            // let sn = e.SerialNo
            // let period = blacknode[sn].period * 60 * 1000
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
                prevTime[e.snmKey] = e.DateTimeUpdate
                prevEnergy[e.snmKey] = energy
                continue
            }

            let absEnergy = (energy - prevEnergy[e.snmKey]) * multmap[e.snmKey]

            // if (absEnergy == -1) {
            //     absEnergy = 0
            // }

            prevEnergy[e.snmKey] = energy

            let adjustedTime = new Date(e.DateTimeUpdate)
            adjustedTime.setMinutes(adjustedTime.getMinutes() - 1)

            let hour = adjustedTime.getUTCHours()

            ret[hour].value1 += absEnergy

            prevTime[e.snmKey] = e.DateTimeUpdate

        }

        res.json(ret)
    })

    api.get('/dashboard/:year/:month', async (req, res) => {
        let ret = []

        if(await apiguard(req, 'dashboard', '') == false)
        {
            res.json(ret)
            return
        }

        let year = req.params.year
        let month = parseInt(req.params.month) - 1

        let d = new Date(Date.UTC(year, month + 1, 0))
        let totalDays = d.getUTCDate()

        // calculate value and return
        for (let i = 0; i < totalDays; i++) {
            ret[i] = {
                category: String(i + 1),
                value1: 0
            }
        }

        let startTime = new Date(Date.UTC(year, month, 1, 0, 0, 0))
        let endTime = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0))

        let now = new Date()
        now = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0)

        if(now < endTime)
        {
            endTime = new Date(now)
        }

        let timeList = [];

        for(let t = startTime; t<endTime; t.setDate(t.getDate() + 1))
        {
            timeList.push(new Date(t));
        }

        let user = await db.user.findOne({
            where: { username: req.session.user }
        })

        if(user && user.dataValues.group)
        {
            var group = await db.group.findOne({
                where: { id: user.dataValues.group }
            })
        }
        else
        {
            var group = await db.group.findOne({
                where: { showDashboard: true }
            })
        } 

        group = group.dataValues;

        var eData
        let all = true
        var snmKey = []
        let prevEnergy = {}
        let prevTime = {}
        let multmap = {}

        if (group !== null) {
            let members = await db.gmember.findAll({
                where: { GroupID: group.id }
            })

            if (members !== null) {
                for (let m of members) {
                    let key = m.SiteID + '%' + m.NodeID + '%' + String(m.ModbusID)

                    snmKey.push(key)
                    prevEnergy[key] = 0
                    prevTime[key] = null
                    multmap[key] = parseFloat(m.multiplier)
                }

                all = false
            }
        }

        if (all) {
            eData = await db.energy.findAll({
                attributes: ['snmKey', 'DateTimeUpdate', 'Import_kWh', 'TotalkWh'],
                where: {
                    // DateTimeUpdate: {
                    //     [Op.and]: {
                    //         [Op.gte]: startTime,
                    //         [Op.lte]: endTime
                    //     }
                    // }
                    DateTimeUpdate: timeList
                },
                order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
            })
        } else {
            eData = await db.energy.findAll({
                attributes: ['snmKey', 'DateTimeUpdate', 'Import_kWh', 'TotalkWh'],
                where: {
                    // DateTimeUpdate: {
                    //     [Op.and]: {
                    //         [Op.gte]: startTime,
                    //         [Op.lte]: endTime
                    //     }
                    // },
                    DateTimeUpdate: timeList,
                    snmKey: snmKey
                },
                order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
            })
        }

        for (let e of eData) {
            // let sn = e.SerialNo
            // let period = blacknode[sn].period * 60 * 1000
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
                prevTime[e.snmKey] = e.DateTimeUpdate
                prevEnergy[e.snmKey] = energy
                continue
            }

            let absEnergy = (energy - prevEnergy[e.snmKey]) * multmap[e.snmKey]

            // if (absEnergy == -1) {
            //     absEnergy = 0
            // }

            prevEnergy[e.snmKey] = energy

            let adjustedTime = new Date(e.DateTimeUpdate)

            adjustedTime.setMinutes(adjustedTime.getMinutes() - 1)

            let day = adjustedTime.getUTCDate() - 1

            ret[day].value1 += absEnergy

            prevTime[e.snmKey] = e.DateTimeUpdate
        }

        res.json(ret)
    })

    api.get('/dashboard/:year', async (req, res) => {
        let ret = []

        if(await apiguard(req, 'dashboard', '') == false)
        {
            res.json(ret)
            return
        }

        let year = parseInt(req.params.year)

        // calculate value and return
        for (let i = 0; i < 12; i++) {
            ret[i] = {
                category: String(i + 1),
                value1: 0
            }
        }

        let startTime = new Date(Date.UTC(year, 0, 1, 0, 0, 0))
        let endTime = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0))

        let now = new Date()
        now = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0)

        if(now < endTime)
        {
            endTime = new Date(now)
        }

        let timeList = [];

        for(let t = startTime; t<endTime; t.setMonth(t.getMonth() + 1))
        {

            timeList.push(new Date(t));
        }

        let user = await db.user.findOne({
            where: { username: req.session.user }
        })

        if(user && user.dataValues.group)
        {
            var group = await db.group.findOne({
                where: { id: user.dataValues.group }
            })
        }
        else
        {
            var group = await db.group.findOne({
                where: { showDashboard: true }
            })
        } 

        group = group.dataValues;

        var eData
        let all = true
        var snmKey = []
        let prevEnergy = {}
        let prevTime = {}
        let multmap = {}

        if (group !== null) {
            let members = await db.gmember.findAll({
                where: { GroupID: group.id }
            })

            if (members !== null) {
                for (let m of members) {
                    let key = m.SiteID + '%' + m.NodeID + '%' + String(m.ModbusID)

                    snmKey.push(key)
                    prevEnergy[key] = 0
                    prevTime[key] = null
                    multmap[key] = parseFloat(m.multiplier)
                }

                all = false
            }
        }

        if (all) {
            eData = await db.energy.findAll({
                attributes: ['snmKey', 'DateTimeUpdate', 'Import_kWh', 'TotalkWh'],
                where: {
                    // DateTimeUpdate: {
                    //     [Op.and]: {
                    //         [Op.gte]: startTime,
                    //         [Op.lte]: endTime
                    //     }
                    // }
                    DateTimeUpdate: timeList
                },
                order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
            })
        } else {
            eData = await db.energy.findAll({
                attributes: ['snmKey', 'DateTimeUpdate', 'Import_kWh', 'TotalkWh'],
                where: {
                    // DateTimeUpdate: {
                    //     [Op.and]: {
                    //         [Op.gte]: startTime,
                    //         [Op.lte]: endTime
                    //     }
                    // },
                    DateTimeUpdate: timeList,
                    snmKey: snmKey
                },
                order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
            })
        }

        for (let e of eData) {
            // let sn = e.SerialNo
            // let period = blacknode[sn].period * 60 * 1000
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
                prevTime[e.snmKey] = e.DateTimeUpdate
                prevEnergy[e.snmKey] = energy
                continue
            }

            let absEnergy = (energy - prevEnergy[e.snmKey]) * multmap[e.snmKey]

            // if (absEnergy == -1) {
            //     absEnergy = 0
            // }

            prevEnergy[e.snmKey] = energy

            let adjustedTime = new Date(e.DateTimeUpdate)
            adjustedTime.setMinutes(adjustedTime.getMinutes() - 1)

            let month = adjustedTime.getUTCMonth()
            ret[month].value1 += absEnergy

            prevTime[e.snmKey] = e.DateTimeUpdate
        }

        res.json(ret)
    })

    api.get('/dashboard', async (req, res) => {
        let ret = []

        if(await apiguard(req, 'dashboard', '') == false)
        {
            res.json(ret)
            return
        }

        // calculate value and return
        let now = new Date()

        for (let i = 0; i < 24; i++) {
            ret[i] = {
                category: String(i + 1),
                value1: 0
            }
        }

        let startTime = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0))
        let endTime = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()))
        
        let timeList = [];

        for(let t = startTime; t<endTime; t.setMinutes(t.getMinutes() + 60))
        {
            timeList.push(new Date(t));
        }

        let user = await db.user.findOne({
            where: { username: req.session.user }
        })

        if(user && user.dataValues.group)
        {
            var group = await db.group.findOne({
                where: { id: user.dataValues.group }
            })
        }
        else
        {
            var group = await db.group.findOne({
                where: { showDashboard: true }
            })
        } 

        group = group.dataValues;

        var eData
        let all = true
        var snmKey = []
        let prevEnergy = {}
        let prevTime = {}
        let multmap = {}

        if (group !== null) {
            let members = await db.gmember.findAll({
                where: { GroupID: group.id }
            })

            if (members !== null) {
                for (let m of members) {
                    let key = m.SiteID + '%' + m.NodeID + '%' + String(m.ModbusID)

                    snmKey.push(key)
                    prevEnergy[key] = 0
                    prevTime[key] = null
                    multmap[key] = parseFloat(m.multiplier)
                }

                all = false
            }
        }

        if (all) {
            eData = await db.energy.findAll({
                attributes: ['snmKey', 'DateTimeUpdate', 'Import_kWh', 'TotalkWh'],
                where: {
                    // DateTimeUpdate: {
                    //     [Op.and]: {
                    //         [Op.gte]: startTime,
                    //         [Op.lte]: endTime
                    //     }
                    // }
                    DateTimeUpdate: timeList
                },
                order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
            })
        } else {
            eData = await db.energy.findAll({
                attributes: ['snmKey', 'DateTimeUpdate', 'Import_kWh', 'TotalkWh'],
                where: {
                    // DateTimeUpdate: {
                    //     [Op.and]: {
                    //         [Op.gte]: startTime,
                    //         [Op.lte]: endTime
                    //     }
                    // },
                    DateTimeUpdate: timeList,
                    snmKey: snmKey
                },
                order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
            })
        }

        for (let e of eData) {
            // let sn = e.SerialNo
            // let period = blacknode[sn].period * 60 * 1000
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
                prevTime[e.snmKey] = e.DateTimeUpdate
                prevEnergy[e.snmKey] = energy
                continue
            }

            let absEnergy = (energy - prevEnergy[e.snmKey]) * multmap[e.snmKey]

            // if (absEnergy == -1) {
            //     absEnergy = 0
            // }

            prevEnergy[e.snmKey] = energy

            let adjustedTime = new Date(e.DateTimeUpdate)
            adjustedTime.setMinutes(adjustedTime.getMinutes() - 1)

            let hour = adjustedTime.getUTCHours() - 1
            ret[hour].value1 += absEnergy

            prevTime[e.snmKey] = e.DateTimeUpdate
        }

        res.json(ret)
    })

    /* Monitoring API */
    api.get('/group_meter_info', async (req, res) => {
        let ret = {
            group: [],
            meter: []
        }

        if(await apiguard(req, 'group_meter_info', '') == false)
        {
            res.json(ret)
            return
        }

        let initGroup = []
        let groups = {}

        if (db.gmember) {
            let groupInfo = await db.gmember.findAll()

            if (groupInfo !== null) {
                for (let g of groupInfo) {
                    if (!(initGroup.includes(g.GroupID))) {
                        groups[g.GroupID] = {
                            id: g.GroupID,
                            name: group[g.GroupID].name,
                            parameter: [],
                            member: []
                        }

                        initGroup.push(g.GroupID)

                        for (let i = 0; i < pmap.length; i++) {
                            groups[g.GroupID].parameter.push({
                                name: cmap[pmap[i]].name + ' ' + cmap[pmap[i]].unit,
                                display:
                                    group[g.GroupID].name +
                                    ' - ' +
                                    cmap[pmap[i]].name +
                                    ' ' +
                                    cmap[pmap[i]].unit,
                                selectedSeries: 'G@' + String(g.GroupID) + '%' + cmap[pmap[i]].name
                            })
                        }
                    }

                    groups[g.GroupID].member.push({
                        name: blacknode[g.SerialNo].meter_list[g.ModbusID-1].name,
                        SerialNo: g.SerialNo
                    })
                }
            }
        }

        let gKey = Object.keys(groups)

        for (let k of gKey) {
            ret.group.push(groups[k])
        }

        let bnKey = Object.keys(blacknode)

        for (let sn of bnKey) {
            for (let i = 0; i < blacknode[sn].meter_list.length; i++) {
                let obj = {
                    name: blacknode[sn].meter_list[i].name,
                    SerialNo: blacknode[sn].serial,
                    SiteID: blacknode[sn].siteid,
                    NodeID: blacknode[sn].nodeid,
                    ModbusID: i,
                    parameter: []
                }

                for (let j = 0; j < pmap.length; j++) {
                    obj.parameter.push({
                        name: cmap[pmap[j]].name + ' ' + cmap[pmap[j]].unit,
                        display:
                            blacknode[sn].meter_list[i].name +
                            ' - ' +
                            cmap[pmap[j]].name +
                            ' ' +
                            cmap[pmap[j]].unit,
                        selectedSeries:
                            'M@' +
                            sn +
                            '@' +
                            blacknode[sn].siteid +
                            '@' +
                            blacknode[sn].nodeid +
                            '@' +
                            String(i) +
                            '%' +
                            cmap[pmap[j]].name
                    })
                }

                ret.meter.push(obj)
            }
        }

        res.json(ret)
    })

    api.post('/rt_chart', async (req, res) => {
        let ret = {}

        if(await apiguard(req, 'rt_chart', '') == false)
        {
            res.json(ret)
            return
        }

        let p = req.body

        for (let k of p) {
            // Get data and fill
            let arr = k.split("@");

            if(arr[0] == 'M')
            {
                let sn = arr[1];
                // let siteid = arr[2];
                // let nodeid = arr[3];

                arr = arr[4].split("%");

                let modbusid = arr[0];
                let param = arr[1];

                let snid = sn + "%" + modbusid;

                if(lastUpdateData[snid] && lastUpdateTime[snid])
                {
                    ret[k] = {
                        time: lastUpdateTime[snid],
                        value: lastUpdateData[snid][param]
                    };
                }
                else
                {
                    ret[k] = {
                        time: new Date(),
                        value: 0
                    };
                }

            }
            else if(arr[0] == 'G')
            {
                arr = arr[1].split("%");

                let gid = parseInt(arr[0]);
                let param = arr[1];

                let total = 0;
                let count = 0;

                for(let m of group[gid].member)
                {
                    let sn = m.serial;
                    let modbusid = parseInt(m.modbusid) - 1;
                    let snid = sn + "%" + String(modbusid);

                    count += 1;

                    if(lastUpdateData[snid] && lastUpdateTime[snid])
                    {
                        total += lastUpdateData[snid][param] * m.multiplier;
                    }
                }

                if(cmap[param].group == 'avg')
                {
                    ret[k] = {
                        time: new Date(),
                        value: total/count
                    };
                }
                else if(cmap[param].group == 'sum')
                {
                    ret[k] = {
                        time: new Date(),
                        value: total
                    };
                }
                else
                {
                    console.log("Invalid parameter");
                }
            }
            else
            {
                console.log("Received invalid parameter");
            }
        }

        res.json(ret)
    })

    api.get('/meter_data_table', async (req, res) => {
        let ret = []

        if(await apiguard(req, 'meter_data_table', '') == false)
        {
            res.json(ret)
            return
        }

        let now = new Date()

        let sn = Object.keys(blacknode)

        for (let i = 0; i < pmap.length; i++) {
            ret[i] = {}
            ret[i]['parameter'] = cmap[pmap[i]].name + ' ' + cmap[pmap[i]].unit

            for (let s of sn) {
                for (let j = 0; j < blacknode[s].meter_list.length; j++) {
                    let k = s + '%' + String(j)

                    if (
                        lastUpdateData[k] &&
                        lastUpdateData[k].DateTimeUpdate &&
                        now.getTime() - lastUpdateData[k].DateTimeUpdate.getTime() < MAX_HEARTBEAT
                    ) {
                        ret[i][blacknode[s].meter_list[j].name] =
                            lastUpdateData[k][cmap[pmap[i]].name]
                    } else {
                        ret[i][blacknode[s].meter_list[j].name] = -1
                    }
                }
            }
        }

        res.json(ret)
    })

    api.get('/node_monitor', async (req, res) => {
        let ret = {}

        if(await apiguard(req, 'node_monitor', '') == false)
        {
            res.json(ret)
            return
        }
    
        let status_list = ['on', 'off', 'error', 'setup']
        let keys = Object.keys(blacknode)

        // calculate value and return
        for (let k of keys) {
            let bn = blacknode[k]

            ret[bn.serial] = {
                id: 'Node ' + String(bn.nodeid),
                location: bn.name,
                status: bn.status,
                maxmeter: bn.maxmeter,
                meter_list: []
            }

            for (let i = 0; i < bn.maxmeter; i++) {
                ret[bn.serial].meter_list[i] = {
                    id: i + 1,
                    address: bn.meter_list[i].id,
                    name: bn.meter_list[i].name,
                    status: bn.meter_list[i].status
                }
            }
        }

        res.json(ret)
    })

    api.get('/meter_list', async (req, res) => {
        let ret = {}

        if(await apiguard(req, 'meter_list', '') == false)
        {
            res.json(ret)
            return
        }

        let keys = Object.keys(blacknode)

        for (let k of keys) {
            for (let i = 0; i < blacknode[k].meter_list.length; i++) {
                ret[k + '%' + String(i)] = {
                    value: blacknode[k].meter_list[i].name + ' <' + k + ':' + String(i + 1) + '>'
                }
            }
        }

        res.json(ret)
    })

    api.get('/phasor_graph/:m', async (req, res) => {
        let arr = req.params.m.split(':')
        let sn = arr[0]
        let modbusid = parseInt(arr[1]) - 1
        let snid = sn + '%' + String(modbusid)
        let now = new Date()

        let ret;

        if(await apiguard(req, 'phasor', '') == false)
        {
            res.json({})
            return
        }

        if(blacknode[sn].meter_list.length > modbusid)
        {
            if (
                lastUpdateTime &&
                lastUpdateTime[snid] &&
                now.getTime() - lastUpdateTime[snid].getTime() < 60 * 1000
            ) {
                ret = {
                    sn: sn,
                    modbusid: modbusid,
                    name: blacknode[sn].meter_list[modbusid].name,
                    V1: lastUpdateData[snid].V1,
                    I1: lastUpdateData[snid].I1,
                    P1: lastUpdateData[snid].P1,
                    Q1: lastUpdateData[snid].Q1,
                    S1: lastUpdateData[snid].S1,
                    PF1: lastUpdateData[snid].PF1,
                    THD_U1: lastUpdateData[snid].THD_U1,
                    THD_I1: lastUpdateData[snid].THD_I1,
                    i1: (180 / Math.PI) * Math.acos(lastUpdateData[snid].PF1),
                    V2: lastUpdateData[snid].V2,
                    I2: lastUpdateData[snid].I2,
                    P2: lastUpdateData[snid].P2,
                    Q2: lastUpdateData[snid].Q2,
                    S2: lastUpdateData[snid].S2,
                    PF2: lastUpdateData[snid].PF2,
                    THD_U2: lastUpdateData[snid].THD_U2,
                    THD_I2: lastUpdateData[snid].THD_I2,
                    i2: (180 / Math.PI) * Math.acos(lastUpdateData[snid].PF2) + 120,
                    V3: lastUpdateData[snid].V3,
                    I3: lastUpdateData[snid].I3,
                    P3: lastUpdateData[snid].P3,
                    Q3: lastUpdateData[snid].Q3,
                    S3: lastUpdateData[snid].S3,
                    PF3: lastUpdateData[snid].PF3,
                    THD_U3: lastUpdateData[snid].THD_U3,
                    THD_I3: lastUpdateData[snid].THD_I3,
                    i3: (180 / Math.PI) * Math.acos(lastUpdateData[snid].PF3) + 240,
                    lastUpdateTime: lastUpdateTime[snid].toLocaleString()
                };
            } else {
                ret = {
                    sn: sn,
                    modbusid: modbusid,
                    name: blacknode[sn].meter_list[modbusid].name,
                    V1: 0,
                    I1: 0,
                    P1: 0,
                    Q1: 0,
                    S1: 0,
                    PF1: 0,
                    THD_U1: 0,
                    THD_I1: 0,
                    i1: (180 / Math.PI) * Math.acos(0),
                    V2: 0,
                    I2: 0,
                    P2: 0,
                    Q2: 0,
                    S2: 0,
                    PF2: 0,
                    THD_U2: 0,
                    THD_I2: 0,
                    i2: (180 / Math.PI) * Math.acos(0) + 120,
                    V3: 0,
                    I3: 0,
                    P3: 0,
                    Q3: 0,
                    S3: 0,
                    PF3: 0,
                    THD_U3: 0,
                    THD_I3: 0,
                    i3: (180 / Math.PI) * Math.acos(0) + 240,
                    lastUpdateTime: now.toLocaleString()
                };
            }
        } else {
            ret = {
                sn: sn,
                modbusid: modbusid,
                name: "Invalid Modbus ID",
                V1: 0,
                I1: 0,
                P1: 0,
                Q1: 0,
                S1: 0,
                PF1: 0,
                THD_U1: 0,
                THD_I1: 0,
                i1: (180 / Math.PI) * Math.acos(0),
                V2: 0,
                I2: 0,
                P2: 0,
                Q2: 0,
                S2: 0,
                PF2: 0,
                THD_U2: 0,
                THD_I2: 0,
                i2: (180 / Math.PI) * Math.acos(0) + 120,
                V3: 0,
                I3: 0,
                P3: 0,
                Q3: 0,
                S3: 0,
                PF3: 0,
                THD_U3: 0,
                THD_I3: 0,
                i3: (180 / Math.PI) * Math.acos(0) + 240,
                lastUpdateTime: now.toLocaleString()
            };
        }

        res.json(ret)
    })

    // Management Section
    api.get('/backup_impro', async (req, res) => {
        if(await apiguard(req, 'backup', '') == false)
        {
            return
        }

        if (paths && paths['META_CFG_PATH']) {
            res.setHeader('Content-disposition', 'attachment; filename=meta.info')
            res.setHeader('Content-type', 'application/json')

            var filestream = createReadStream(paths['META_CFG_PATH'])
            filestream.pipe(res)
        }
    })

    api.post('/backup_impro', async (req, res) => {
        if(await apiguard(req, 'backup', '') == false)
        {
            return
        }

        if (paths && paths['META_CFG_PATH']) {
            try {
                writeFile(paths['META_CFG_PATH'], req.files.file.data, { flag: 'w' })

                await loadMetaCFG();

                await syncDB();
                await loadMetaDB();

                res.send('SUCCESS')
            } catch (e) {
                res.send('Not a JSON file')
            }
        } else {
            res.send('Paths is not configured.')
        }
    })

    api.get('/backup_bn', async (req, res) => {
        if(await apiguard(req, 'backup', '') == false)
        {
            return
        }

        if (paths && paths['BN_CFG_PATH']) {
            res.setHeader('Content-disposition', 'attachment; filename=blacknode.info')
            res.setHeader('Content-type', 'application/json')

            var filestream = createReadStream(paths['BN_CFG_PATH'])
            filestream.pipe(res)
        }
    })

    api.post('/backup_bn', async (req, res) => {
        if(await apiguard(req, 'backup', '') == false)
        {
            return
        }

        if (paths && paths['BN_CFG_PATH']) {
            try {
                writeFile(paths['BN_CFG_PATH'], req.files.file.data, { flag: 'w' })

                loadBNInfoFromLocal(paths['BN_CFG_PATH'])

                res.send('SUCCESS')
            } catch (e) {
                res.send('Not a JSON file')
            }
        } else {
            res.send('Paths is not configured.')
        }
    })

    api.get('/group', async (_req, res) => {
        if(await apiguard(_req, 'getgroup', '') == false)
        {
            res.json({})
            return
        }

        res.json(group)
    })

    api.get('/meter', async (_req, res) => {
        let ret = []

        if(await apiguard(_req, 'getmeter', '') == false)
        {
            res.json([])
            return
        }

        let sn = Object.keys(blacknode)

        for (let s of sn) {
            for (let i = 0; i < blacknode[s].meter_list.length; i++) {
                ret.push({
                    sn: s,
                    siteid: blacknode[s].siteid,
                    nodeid: blacknode[s].nodeid,
                    modbusid: i + 1,
                    name: blacknode[s].meter_list[i].name
                })
            }
        }

        res.json(ret)
    })

    api.post('/update_group', async (req, res) => {
        if(await apiguard(req, 'management', '') == false)
        {
            res.send('Permission not allowed.')
            return
        }

        let id = req.body.id
        let name = req.body.name

        try {
            await db.group.update(
                {
                    name: name
                },
                {
                    where: { id: id }
                }
            )

            await loadGroup()

            res.send('SUCCESS')
        } catch (err) {
            res.send('Cannot create group.')
        }
    })

    api.get('/create_group/:name', async (req, res) => {
        if(await apiguard(req, 'management', '') == false)
        {
            res.send('Permission not allowed.')
            return
        }

        try {
            await db.group.create({ name: req.params.name, showDashboard: false })

            await loadGroup()

            res.send('SUCCESS')
        } catch (err) {
            console.log(err)
            res.send('Cannot create group.')
        }
    })

    api.get('/delete_group/:id', async (req, res) => {
        if(await apiguard(req, 'management', '') == false)
        {
            res.send('Permission not allowed.')
            return
        }

        try {
            await db.gmember.destroy({
                where: { GroupID: parseInt(req.params.id) }
            })

            await db.group.destroy({
                where: { id: parseInt(req.params.id) }
            })

            await loadGroup()

            res.send('SUCCESS')
        } catch (err) {
            res.send('Cannot delete group.')
        }
    })

    api.get('/getUseImportSetting', async (_req, res) => {
        if(await apiguard(_req, 'getgroup', '') == false)
        {
            res.json({value: false})
            return
        }

        res.json(meta_cfg.useImport)
    })

    api.post('/setUseImportSetting', async (req, res) => {
        if(await apiguard(req, 'management', '') == false)
        {
            res.send('Permission not allowed.')
            return
        }

        let value = req.body.value

        if (paths && paths['META_CFG_PATH']) {
            try {
                meta_cfg.useImport.value = value

                writeFile(paths['META_CFG_PATH'], JSON.stringify(meta_cfg), { flag: 'w' });
                res.send("SUCCESS");
            } catch(err) {
                console.log("Cannot save parameter.");
                res.send("Cannot save parameter.");
            }  
        }
        else
        {
            console.log("Cannot save parameter.");
            res.send("Cannot save parameter.");
        }
    })

    api.post('/update_member', async (req, res) => {
        if(await apiguard(req, 'management', '') == false)
        {
            res.send('Permission not allowed.')
            return
        }

        let groupid = req.body.id
        let member = req.body.member

        try {
            await db.gmember.destroy({
                where: { GroupID: groupid }
            })

            await db.gmember.bulkCreate(member)

            await loadGroup()
            res.send('SUCCESS')
        } catch (err) {
            res.send('Cannot update group members')
        }
    })

    api.get('/set_dashboard/:group', async (req, res) => {
        if(await apiguard(req, 'management', '') == false)
        {
            res.send('Permission not allowed.')
            return
        }

        let id = parseInt(req.params.group)

        try {
            await db.group.update(
                { showDashboard: false },
                {
                    where: {
                        id: {
                            [Op.not]: id
                        }
                    }
                }
            )

            await db.group.update(
                { showDashboard: true },
                {
                    where: { id: id }
                }
            )

            await loadGroup()

            res.send('SUCCESS')
        } catch (err) {
            console.log('Cannot save dashboard configuration.')

            res.send('Cannot save dashboard configuration.')
        }
    })

    api.get('/unset_dashboard/:group', async (req, res) => {
        if(await apiguard(req, 'management', '') == false)
        {
            res.send('Permission not allowed.')
            return
        }

        let id = parseInt(req.params.group)

        try {
            await db.group.update(
                { showDashboard: false },
                {
                    where: { id: id }
                }
            )

            await loadGroup()

            res.send('SUCCESS')
        } catch (err) {
            console.log('Cannot save dashboard configuration.')

            res.send('Cannot save dashboard configuration.')
        }
    })

    api.get('/alarm/count', async (req, res) => {
        if(await apiguard(req, 'alarm', '') == false)
        {
            res.send('0')
            return
        }

        try {
            let cnt = await db.alarm.findAll({ where: { status: 'unread' } })

            res.send(String(cnt.length))
        } catch (err) {
            console.log('Cannot count unread alarms.')
            res.send('0')
        }
    })

    api.get('/alarm/view/:page', async (req, res) => {
        let limit = 20
        let ret = []

        if(await apiguard(req, 'alarm', '') == false)
        {
            res.json(ret)
            return
        }

        let typemap = {
            BN_DC: 'Blacknode Disconnected',
            METER_DC: 'Meter Disconnected',
            OVER_RANGE: 'Parameter Over-range'
        }

        try {
            let alarms = await db.alarm.findAll({
                // limit: limit,
                // offset: parseInt(req.params.page) * limit
                order: [['DateTime', 'DESC']]
            })

            for (let a of alarms) {
                let dev = ''

                if (a.ModbusID != 0) {
                    if(blacknode[a.SerialNo].meter_list.length > a.ModbusID - 1)
                    {
                        dev = blacknode[a.SerialNo].meter_list[a.ModbusID-1].name
                    }
                    else
                    {
                        dev = "Invalid Modbus ID"
                    }
                    
                } else {
                    dev = blacknode[a.SerialNo].name
                }

                ret.push({
                    id: a.id,
                    time: a.DateTime.toLocaleString(),
                    event: typemap[a.type],
                    device: dev,
                    status: a.status
                })
            }
        } catch (err) {
            console.log('Cannot retrieve alarm data.')
        }

        res.json(ret)
    })

    api.post('/alarm/update/:status', async (req, res) => {
        if(await apiguard(req, 'alarm', '') == false)
        {
            res.send('Permission not allowed.')
            return
        }

        if (req.params.status == 'delete') {
            try {
                await db.alarm.destroy({
                    where: { id: req.body }
                })

                await loadAlarm();
                res.send('SUCCESS')
            } catch (err) {
                console.log('Cannot delete ', req.body)
                res.send('Cannot delete.')
            }
        } else if (
            req.params.status == 'read' ||
            req.params.status == 'unread' ||
            req.params.status == 'archive'
        ) {
            try {
                await db.alarm.update(
                    { status: req.params.status },
                    {
                        where: { id: req.body }
                    }
                )

                await loadAlarm();
                res.send('SUCCESS')
            } catch (err) {
                console.log('Cannot update status ', req.body)
                res.send('Cannot update status.')
            }
        } else {
            console.log('Receive an invalid alarm API.')
            res.send('Invalid command.')
        }
    })

    api.post('/set_parameter', async (req, res) => {
        if(await apiguard(req, 'management', '') == false)
        {
            res.send('Permission not allowed.')
            return
        }

        if (paths && paths['META_CFG_PATH']) {
            try {
                let keys = Object.keys(req.body.params);

                if(!meta_cfg.param.hasOwnProperty(req.body.meter))
                {
                    meta_cfg.param[req.body.meter] = {
                        meter: req.body.meter,
                        enable: req.body.enable,
                        mm: {}
                    }
                }

                for(let k of keys)
                {
                    if(!meta_cfg.param[req.body.meter].mm.hasOwnProperty(k))
                    {
                        meta_cfg.param[req.body.meter].mm[k] = {
                            min: MAX_NUMBER,
                            max: (-1) * MAX_NUMBER,
                        }
                    }
                    meta_cfg.param[req.body.meter].mm[k].min = req.body.params[k].min;
                    meta_cfg.param[req.body.meter].mm[k].max = req.body.params[k].max;
                }

                meta_cfg.param[req.body.meter].meter = req.body.meter
                meta_cfg.param[req.body.meter].enable = req.body.enable


                writeFile(paths['META_CFG_PATH'], JSON.stringify(meta_cfg), { flag: 'w' });
                res.send("SUCCESS");
            } catch(err) {
                console.log("Cannot save parameter.");
                res.send("Cannot save parameter.");
            }
            
        }
    });

    api.get('/parameter', async (req, res) => {
        res.json({"meter": "", "enable": false, "mm": {"V1":{"min":"-99999999999","max":"999999999999"},"V2":{"min":"-99999999999","max":"999999999999"},"V3":{"min":"-99999999999","max":"999999999999"},"V12":{"min":"-99999999999","max":"999999999999"},"V23":{"min":"-99999999999","max":"999999999999"},"V31":{"min":"-99999999999","max":"999999999999"},"I1":{"min":"-99999999999","max":"999999999999"},"I2":{"min":"-99999999999","max":"999999999999"},"I3":{"min":"-99999999999","max":"999999999999"},"P1":{"min":"-99999999999","max":"999999999999"},"P2":{"min":"-99999999999","max":"999999999999"},"P3":{"min":"-99999999999","max":"999999999999"},"P_Sum":{"min":"-99999999999","max":"999999999999"},"Q1":{"min":"-99999999999","max":"999999999999"},"Q2":{"min":"-99999999999","max":"999999999999"},"Q3":{"min":"-99999999999","max":"999999999999"},"Q_Sum":{"min":"-99999999999","max":"999999999999"},"S1":{"min":"-99999999999","max":"999999999999"},"S2":{"min":"-99999999999","max":"999999999999"},"S3":{"min":"-99999999999","max":"999999999999"},"S_Sum":{"min":"-99999999999","max":"999999999999"},"PF1":{"min":"-99999999999","max":"999999999999"},"PF2":{"min":"-99999999999","max":"999999999999"},"PF3":{"min":"-99999999999","max":"999999999999"},"PF_Sum":{"min":"-99999999999","max":"999999999999"},"Frequency":{"min":"-99999999999","max":"999999999999"}}})
        // res.json(meta_cfg.param.mm);
    });

    api.get('/parameter/:meterkey', async (req, res) => {
        if(await apiguard(req, 'getparameter', '') == false)
        {
            res.json({"meter": "", "enable": false, "mm": {"V1":{"min":"-99999999999","max":"999999999999"},"V2":{"min":"-99999999999","max":"999999999999"},"V3":{"min":"-99999999999","max":"999999999999"},"V12":{"min":"-99999999999","max":"999999999999"},"V23":{"min":"-99999999999","max":"999999999999"},"V31":{"min":"-99999999999","max":"999999999999"},"I1":{"min":"-99999999999","max":"999999999999"},"I2":{"min":"-99999999999","max":"999999999999"},"I3":{"min":"-99999999999","max":"999999999999"},"P1":{"min":"-99999999999","max":"999999999999"},"P2":{"min":"-99999999999","max":"999999999999"},"P3":{"min":"-99999999999","max":"999999999999"},"P_Sum":{"min":"-99999999999","max":"999999999999"},"Q1":{"min":"-99999999999","max":"999999999999"},"Q2":{"min":"-99999999999","max":"999999999999"},"Q3":{"min":"-99999999999","max":"999999999999"},"Q_Sum":{"min":"-99999999999","max":"999999999999"},"S1":{"min":"-99999999999","max":"999999999999"},"S2":{"min":"-99999999999","max":"999999999999"},"S3":{"min":"-99999999999","max":"999999999999"},"S_Sum":{"min":"-99999999999","max":"999999999999"},"PF1":{"min":"-99999999999","max":"999999999999"},"PF2":{"min":"-99999999999","max":"999999999999"},"PF3":{"min":"-99999999999","max":"999999999999"},"PF_Sum":{"min":"-99999999999","max":"999999999999"},"Frequency":{"min":"-99999999999","max":"999999999999"}}})
            return
        }

        if(meta_cfg.param.hasOwnProperty(req.params.meterkey))
        {
            res.json(meta_cfg.param[req.params.meterkey]);
        }
        else
        {
            res.json({"meter": "", "enable": false, "mm": {"V1":{"min":"-99999999999","max":"999999999999"},"V2":{"min":"-99999999999","max":"999999999999"},"V3":{"min":"-99999999999","max":"999999999999"},"V12":{"min":"-99999999999","max":"999999999999"},"V23":{"min":"-99999999999","max":"999999999999"},"V31":{"min":"-99999999999","max":"999999999999"},"I1":{"min":"-99999999999","max":"999999999999"},"I2":{"min":"-99999999999","max":"999999999999"},"I3":{"min":"-99999999999","max":"999999999999"},"P1":{"min":"-99999999999","max":"999999999999"},"P2":{"min":"-99999999999","max":"999999999999"},"P3":{"min":"-99999999999","max":"999999999999"},"P_Sum":{"min":"-99999999999","max":"999999999999"},"Q1":{"min":"-99999999999","max":"999999999999"},"Q2":{"min":"-99999999999","max":"999999999999"},"Q3":{"min":"-99999999999","max":"999999999999"},"Q_Sum":{"min":"-99999999999","max":"999999999999"},"S1":{"min":"-99999999999","max":"999999999999"},"S2":{"min":"-99999999999","max":"999999999999"},"S3":{"min":"-99999999999","max":"999999999999"},"S_Sum":{"min":"-99999999999","max":"999999999999"},"PF1":{"min":"-99999999999","max":"999999999999"},"PF2":{"min":"-99999999999","max":"999999999999"},"PF3":{"min":"-99999999999","max":"999999999999"},"PF_Sum":{"min":"-99999999999","max":"999999999999"},"Frequency":{"min":"-99999999999","max":"999999999999"}}})
        }
    });

    api.get('/holiday', async (req, res) => {
        if(await apiguard(req, 'getholiday', '') == false)
        {
            res.json({})
            return
        }

        res.json(holidays);
    });

    api.post('/holiday', async (req, res) => {
        if(await apiguard(req, 'management', '') == false)
        {
            res.send('Permission not allowed.')
            return
        }

        try {
            await db.holiday.create({
                DateTime: req.body.date,
                name: req.body.name
            });

            await loadHoliday();

            res.send("SUCCESS");
        } catch (err) {
            console.log("Cannot add holiday.");
            res.send("Cannot add holiday");
        }
    });

    api.post('/holiday/:action/:id', async (req, res) => {
        if(await apiguard(req, 'management', '') == false)
        {
            res.send('Permission not allowed.')
            return
        }

        if(req.params.action == "edit")
        {
            try {
                await db.holiday.update(
                    {
                        DateTime: req.body.date,
                        name: req.body.name
                    },
                    {
                        where: { id: parseInt(req.params.id) }
                    }
                )

                await loadHoliday();
                res.send("SUCCESS");
                
            } catch (err) {
                console.log("Cannot update holiday.");
                res.send("Cannot update holiday.");
            }
        }
        else if(req.params.action == "delete")
        {
            try {
                await db.holiday.destroy({
                    where: { id: parseInt(req.params.id) }
                });

                await loadHoliday();
                res.send("SUCCESS");

            } catch (err) {
                console.log("Cannot delete holiday.");
                res.send("Cannot delete holiday.");
            }
        }
        else
        {
            console.log("Invalid parameter.");
            res.send("Invalid parameter.");
        }
    });

    api.get('/user', async (req, res) => {
        if(await apiguard(req, 'getuser', '') == false)
        {
            res.json({});
            return
        }

        try {
            let users = await db.user.findAll({
                attributes: ['id', 'name', 'username', 'email', 'status', 'group']
            });

            let ret = []

            let allRoles = await db.userrole.findAll()

            let roleMap = {}

            for(let r of allRoles)
            {
                if(!roleMap.hasOwnProperty(r.userid))
                {
                    roleMap[r.userid] = []
                }

                roleMap[r.userid].push(r.role)
            }

            for(let user of users)
            {
                ret.push({
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    status: user.status,
                    group: user.group,
                    roles: (roleMap[user.id]) ? roleMap[user.id] : ['inactive']
                })
            }

            res.json(ret);
        } catch (err) {
            console.log("Cannot get user.");
            res.json({});
        }
    });

    api.post('/user', async (req, res) => {
        if(await apiguard(req, 'management', '') == false)
        {
            res.send('Permission not allowed.')
            return
        }

        try {
            if(req.body.password.length < 8)
            {
                res.send("Password is too short. Try a new password.")
                return;
            }
            let u = await db.user.create({
                name: req.body.name,
                username: req.body.username,
                email: req.body.email,
                password: await bcrypt.hash(req.body.password, 3),
                DateTime: new Date(),
                status: req.body.status,
                group: parseInt(req.body.group)
            });

            // Create corresponding role and project as needed...
            if(req.body.roles && req.body.roles.length > 0)
            {
                for(let i=0; i<req.body.roles.length; i++)
                {
                    await db.userrole.create({
                        userid: u.id,
                        role: req.body.roles[i]
                    })
                }
            }
            else
            {
                await db.userrole.create({
                    userid: u.id,
                    role: "user"
                })
            }

            res.send("SUCCESS");
        } catch (err) {
            console.log("Cannot add user.");
            res.send("Cannot add user");
        }
    });

    api.post('/user/:action/:id', async (req, res) => {
        if(await apiguard(req, 'management', '') == false)
        {
            res.send('Permission not allowed.')
            return
        }

        if(req.params.action == "edit")
        {
            try {
                if(req.body.password.length < 8)
                {
                    res.send("Password is too short. Try a new password.")
                    return;
                }
                
                let u = await db.user.update(
                    {
                        name: req.body.name,
                        username: req.body.username,
                        email: req.body.email,
                        password: await bcrypt.hash(req.body.password, 3),
                        DateTime: new Date(),
                        status: req.body.status,
                        group: parseInt(req.body.group)
                    },
                    {
                        where: { id: parseInt(req.params.id) }
                    }
                )

                await db.userrole.destroy({
                    where: {
                        userid: req.params.id
                    }
                })

                if(req.body.roles && req.body.roles.length > 0)
                {
                    for(let i=0; i<req.body.roles.length; i++)
                    {
                        await db.userrole.create({
                            userid: parseInt(req.params.id),
                            role: req.body.roles[i]
                        })
                    }
                }
                else
                {
                    await db.userrole.create({
                        userid: parseInt(req.params.id),
                        role: "user"
                    })
                }

                res.send("SUCCESS");
                
            } catch (err) {
                console.log("Cannot update user.");
                res.send("Cannot update user.");
            }
        }
        else if(req.params.action == "delete")
        {
            try {
                await db.user.destroy({
                    where: { id: parseInt(req.params.id) }
                });

                res.send("SUCCESS");

            } catch (err) {
                console.log("Cannot delete user.");
                res.send("Cannot delete user.");
            }
        }
        else
        {
            console.log("Invalid parameter.");
            res.send("Invalid parameter.");
        }
    });

    api.post('/rp_chart/:type/:year/:month/:day/:syear/:smonth/:sday', async (req, res) => {
        if(await apiguard(req, 'rp_chart', '') == false)
        {
            res.json({})
            return
        }

        let start_date = new Date(Date.UTC(req.params.year, parseInt(req.params.month)-1, req.params.day));
        let end_date = new Date(Date.UTC(req.params.year, parseInt(req.params.month)-1, req.params.day));

        if(req.params.type == "year")
        {
            start_date.setUTCMonth(0);
            start_date.setUTCDate(1);

            end_date.setUTCFullYear(end_date.getUTCFullYear() + 1);
            end_date.setUTCMonth(0);
            end_date.setUTCDate(1);
        }
        else if(req.params.type == "month")
        {
            start_date.setUTCDate(1);

            end_date.setUTCMonth(end_date.getUTCMonth() + 1);
            end_date.setUTCDate(1);
        }
        else if(req.params.type == "range")
        {
            start_date.setUTCFullYear(parseInt(req.params.syear))
            start_date.setUTCMonth(parseInt(req.params.smonth) - 1)
            start_date.setUTCDate(req.params.sday)
        }
        else
        {
            end_date.setUTCDate(end_date.getUTCDate() + 1);
        }

        let now = new Date()
        now = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0))

        // console.log(now, end_date)

        if(now < end_date)
        {
            end_date = new Date(now)
        }

        // console.log(now, end_date)

        let start_seq = Math.trunc(start_date.getTime()/1000/60/15);
        let end_seq = Math.trunc(end_date.getTime()/1000/60/15);

        let arr_size = end_seq-start_seq;

        if(req.params.type == 'year')
        {
            arr_size = 12;
        }
        else if(req.params.type == 'month' || req.params.type == "range")
        {
            arr_size /= 96;
        }

        arr_size += 1

        let ret = {}

        let p = req.body

        for (let k of p) {
            // Get data and fill
            let arr = k.split("@");

            if(arr[0] == 'M')
            {
                // let sn = arr[1];
                let siteid = arr[2];
                let nodeid = arr[3];

                arr = arr[4].split("%");

                let modbusid = String(parseInt(arr[0]) + 1);
                let param = arr[1];
                let eData;

                if(param == 'kWdemand')
                {
                    eData = await db.energy.findAll({
                        attributes: ['DateTimeUpdate', 'SerialNo', 'TotalkWh'],
                        where: {
                            DateTimeUpdate: {
                                [Op.and]: {
                                    [Op.gte]: start_date,
                                    [Op.lte]: end_date
                                }
                            },
                            snmKey: siteid + "%" + nodeid + "%" + modbusid
                        },
                        order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
                    })
                }
                else
                {
                    eData = await db.energy.findAll({
                        attributes: ['DateTimeUpdate', 'SerialNo', param],
                        where: {
                            DateTimeUpdate: {
                                [Op.and]: {
                                    [Op.gte]: start_date,
                                    [Op.lte]: end_date
                                }
                            },
                            snmKey: siteid + "%" + nodeid + "%" + modbusid
                        },
                        order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
                    })
                }

                ret[k] = []
                let count = []

                for(let i=0; i<arr_size; i++)
                {
                    let time;

                    if(req.params.type == 'year')
                    {
                        time = new Date(start_date);
                        time.setUTCMonth(time.getUTCMonth() + i);
                    }
                    else if(req.params.type == 'month' || req.params.type == "range")
                    {
                        time = new Date(start_date);
                        time.setUTCDate(time.getUTCDate() + i);
                    }
                    else
                    {
                        time = new Date(start_date.getTime() + (i*15*60*1000));
                    }

                    ret[k].push({
                        time: time,
                        value: 0,
                        maxv: (-1) * MAX_NUMBER,
                        minv: MAX_NUMBER
                    });

                    count.push(0)
                }

                let prev_dval  = -1;
                let prev_time = null;

                for(let e of eData)
                {
                    let seq;
                    let dval;

                    let adjustedTime = new Date(e.DateTimeUpdate.getTime())
                    // adjustedTime.setUTCMinutes(adjustedTime.getUTCMinutes()-1)
                    
                    if(req.params.type == 'year')
                    {
                        seq = adjustedTime.getUTCMonth();
                    }
                    else if(req.params.type == 'month' || req.params.type == "range")
                    {
                        seq = Math.trunc((adjustedTime.getTime() - start_date.getTime())/(24*60*60*1000))
                    }
                    else
                    {
                        seq = Math.trunc(adjustedTime.getTime()/1000/60/15) - start_seq;

                        if(seq < 0) 
                        {
                            seq = 0
                        }
                    }

                    if(cmap[param].storage == "accumulative")
                    {
                        let sn = e.SerialNo
                        let period = blacknode[sn].period * 60 * 1000

                        if(prev_time == null || e.DateTimeUpdate.getTime() - prev_time.getTime() != period)
                        {
                            prev_time = e.DateTimeUpdate

                            if(param == 'kWdemand')
                            {
                                prev_dval = e['TotalkWh']
                            }
                            else
                            {
                                prev_dval = e[param]
                            }

                            continue
                        }
                        else
                        {
                            if(param == 'kWdemand')
                            {
                                if(e['TotalkWh'] != undefined || e['TotalkWh'] != -1)
                                {
                                    dval = (e['TotalkWh'] - prev_dval) * DEMAND
                                }
                                else
                                {
                                    dval = 0
                                }
                            }
                            else
                            {
                                dval = e[param] - prev_dval
                            }
                            
                        }
                    }
                    else
                    {
                        if(param == 'kwDemand')
                        {
                            dval = e['TotalkWh']
                        }
                        else
                        {
                            dval = e[param]
                        }
                        
                    }

                    //Get the average

                    ret[k][seq].value += dval;
                    count[seq]++;
                    
                    if(dval > ret[k][seq].maxv)
                    {
                        ret[k][seq].maxv = dval
                    }

                    if(dval < ret[k][seq].minv)
                    {
                        ret[k][seq].minv = dval
                    }

                    if(param == 'kWdemand')
                    {
                        prev_dval = e['TotalkWh']
                    }
                    else
                    {
                        prev_dval = e[param]
                    }
                    
                    prev_time = e.DateTimeUpdate
                }


                if(cmap[param].storage != "accumulative")
                {
                    for(let i=0; i<arr_size; i++)
                    {
                        if(count[i] > 0)
                        {
                            ret[k][i].value /= count[i];
                        }
                    }
                }

                if(req.params.type != 'day')
                {
                    ret[k].length = ret[k].length - 1
                }
            }
            else if(arr[0] == 'G')
            {
                arr = arr[1].split("%");

                let gid = parseInt(arr[0]);

                let param = arr[1];

                ret[k] = [];
                let dxt = {};
                let count = []
                let multmap = {}

                for(let i=0; i<arr_size; i++)
                {
                    let time;

                    if(req.params.type == 'year')
                    {
                        time = new Date(start_date);
                        time.setUTCMonth(time.getUTCMonth() + i);
                    }
                    else if(req.params.type == 'month' || req.params.type == "range")
                    {
                        time = new Date(start_date);
                        time.setUTCDate(time.getUTCDate() + i);
                    }
                    else
                    {
                        time = new Date(start_date.getTime() + (i*15*60*1000));
                    }

                    ret[k].push({
                        time: time,
                        value: 0,
                        minv: MAX_NUMBER,
                        maxv: (-1)*MAX_NUMBER
                    });

                    count.push(0)
                }

                for(let m of group[gid].member)
                {
                    let sn = m.serial;
                    let siteid = blacknode[sn].siteid;
                    let nodeid = blacknode[sn].nodeid;
                    let modbusid = parseInt(m.modbusid);

                    let snmKey = siteid + "%" + nodeid + "%" + modbusid
                    multmap[snmKey] = parseFloat(m.multiplier)

                    let eData;

                    if(param == 'kWdemand')
                    {
                        eData = await db.energy.findAll({
                            attributes: ['DateTimeUpdate', 'SerialNo', 'TotalkWh', 'snmKey'],
                            where: {
                                DateTimeUpdate: {
                                    [Op.and]: {
                                        [Op.gte]: start_date,
                                        [Op.lte]: end_date
                                    }
                                },
                                snmKey: siteid + "%" + nodeid + "%" + modbusid
                            },
                            order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
                        })
                    }
                    else
                    {
                        eData = await db.energy.findAll({
                            attributes: ['DateTimeUpdate', 'SerialNo', param, 'snmKey'],
                            where: {
                                DateTimeUpdate: {
                                    [Op.and]: {
                                        [Op.gte]: start_date,
                                        [Op.lte]: end_date
                                    }
                                },
                                snmKey: siteid + "%" + nodeid + "%" + modbusid
                            },
                            order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
                        })
                    }

                    let prev_time = null
                    let prev_dval = -1

                    for(let e of eData)
                    {
                        let dval
                        let tkey = e.DateTimeUpdate.getUTCFullYear() + '-' + e.DateTimeUpdate.getUTCMonth() + '-' + e.DateTimeUpdate.getUTCDate() + '-' + e.DateTimeUpdate.getUTCHours() + '-' + e.DateTimeUpdate.getUTCMinutes()

                        if(!dxt.hasOwnProperty(tkey))
                        {
                            dxt[tkey] = 0
                        }
    
                        if(cmap[param].storage == "accumulative")
                        {
                            let sn = e.SerialNo
                            let period = blacknode[sn].period * 60 * 1000

                            if(prev_time == null || e.DateTimeUpdate.getTime() - prev_time.getTime() != period)
                            {
                                prev_time = e.DateTimeUpdate

                                if(param == 'kWdemand')
                                {
                                    prev_dval = e['TotalkWh']
                                }
                                else
                                {
                                    prev_dval = e[param]
                                }
                                
                                continue
                            }
                            else
                            {
                                if(param == 'kWdemand')
                                {
                                    if(e['TotalkWh'] != undefined || e['TotalkWh'] != -1)
                                    {
                                        dval = (e['TotalkWh'] - prev_dval) * DEMAND
                                    }
                                    else
                                    {
                                        dval = 0
                                    }
                                }
                                else
                                {
                                    dval = e[param] - prev_dval
                                }
                                
                            }
                        }
                        else
                        {
                            if(param == 'kWdemand')
                            {
                                dval = e['TotalkWh']
                            }
                            else
                            {
                                dval = e[param]
                            }
                            
                        }

                        dxt[tkey] += dval * multmap[e.snmKey]

                        if(param == 'kWdemand')
                        {
                            prev_dval = e['TotalkWh']
                        }
                        else
                        {
                            prev_dval = e[param]
                        }

                        prev_time = e.DateTimeUpdate
                    }
                }

                let dKey = Object.keys(dxt)
                
                for(let dk of dKey)
                {
                    if(cmap[param].group == 'avg')
                    {
                        if(group[gid].member.length > 0)
                        {
                            dxt[dk] /= group[gid].member.length
                        }  
                    }

                    let arr = dk.split('-')
                    let tt = new Date(Date.UTC(arr[0], arr[1], arr[2], arr[3], arr[4]))

                    // tt.setUTCMinutes(tt.getUTCMinutes() - 1)

                    let seq;

                    if(req.params.type == 'year')
                    {
                        seq = tt.getUTCMonth();
                                                
                    }
                    else if(req.params.type == 'month' || req.params.type == "range")
                    {
                        seq = Math.trunc((tt.getTime() - start_date.getTime())/(24*60*60*1000))
                                                
                    }
                    else
                    {
                        seq = Math.trunc(tt.getTime()/1000/60/15) - start_seq;

                        if(seq < 0)
                        {
                            seq = 0
                        }
                    }
                    
                    ret[k][seq].value += dxt[dk];
                    count[seq]++;
                    
                    if(dxt[dk] > ret[k][seq].maxv)
                    {
                        ret[k][seq].maxv = dxt[dk]
                    }

                    if(dxt[dk] < ret[k][seq].minv)
                    {
                        ret[k][seq].minv = dxt[dk]
                    }
                }

                if(cmap[param].storage != 'accumulative')
                {
                    for(let i=0; i<arr_size; i++)
                    {
                        if(count[i] > 0)
                        {
                            ret[k][i].value /= count[i];
                        }
                    }
                }

                if(req.params.type != 'day')
                {
                    ret[k].length = ret[k].length - 1;
                }
            }
        }

        res.json(ret)
    })

    api.post('/rp_export/:type/:ttype/:year/:month/:day/:syear/:smonth/:sday', async (req, res) => {
        if(await apiguard(req, 'rp_chart', '') == false)
        {
            res.send('Permission not allowed.')
            return
        }

        const workbook = new ExcelJS.Workbook()

        if(req.params.ttype == 'electrical')
        {
            await workbook.xlsx.readFile(path.join(process.cwd(), 'Report-01_template.xlsx'))
        }
        else
        {
            await workbook.xlsx.readFile(path.join(process.cwd(), 'Report-02_energy_template.xlsx'))
            var feederWS = workbook.getWorksheet('RawFeeder')
        }
        
        let worksheet = workbook.getWorksheet('RawData')

        let start_date = new Date(Date.UTC(req.params.year, parseInt(req.params.month)-1, req.params.day));
        let end_date = new Date(Date.UTC(req.params.year, parseInt(req.params.month)-1, req.params.day));

        if(req.params.type == "year")
        {
            start_date.setUTCMonth(0);
            start_date.setUTCDate(1);

            end_date.setUTCFullYear(end_date.getUTCFullYear() + 1);
            end_date.setUTCMonth(0);
            end_date.setUTCDate(1);
        }
        else if(req.params.type == "month")
        {
            start_date.setUTCDate(1);

            end_date.setUTCMonth(end_date.getUTCMonth() + 1);
            end_date.setUTCDate(1);
        }
        else if(req.params.type == "range")
        {
            start_date.setUTCFullYear(parseInt(req.params.syear))
            start_date.setUTCMonth(parseInt(req.params.smonth) - 1)
            start_date.setUTCDate(req.params.sday)
        }
        else
        {
            end_date.setUTCDate(end_date.getUTCDate() + 1);
        }

        let now = new Date()
        now = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0)

        if(now < end_date)
        {
            end_date = new Date(now)
        }

        let start_seq = Math.trunc(start_date.getTime()/1000/60/15);
        let end_seq = Math.trunc(end_date.getTime()/1000/60/15);

        let arr_size = end_seq - start_seq + 1;

        let ret = {}

        let p = req.body

        let kwhType = "TotalkWh"

        if(meta_cfg.useImport && meta_cfg.useImport.value)
        {
            kwhType = "Import_kWh"
        }

        for (let k of p) {
            // Get data and fill
            let arr = k.split("@");

            if(arr[0] == 'M')
            {
                let sn = arr[1];
                let siteid = arr[2];
                let nodeid = arr[3];

                arr = arr[4].split("%");

                let modbusid = String(parseInt(arr[0]) + 1);
                let param = arr[1];
                let eData;

                if(param == "TotalkWh" && req.params.ttype != 'electrical' && meta_cfg.useImport && meta_cfg.useImport.value)
                {
                    var cellName = blacknode[sn].meter_list[parseInt(arr[0])].name + '.' + kwhType
                    param = kwhType
                }
                else
                {
                    var cellName = blacknode[sn].meter_list[parseInt(arr[0])].name + '.' + param
                }
                

                if(param == 'kWdemand')
                {
                    eData = await db.energy.findAll({
                        attributes: ['DateTimeUpdate', 'SerialNo', kwhType],
                        where: {
                            DateTimeUpdate: {
                                [Op.and]: {
                                    [Op.gte]: start_date,
                                    [Op.lte]: end_date
                                }
                            },
                            snmKey: siteid + "%" + nodeid + "%" + modbusid
                        },
                        order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
                    })
                }
                else
                {
                    eData = await db.energy.findAll({
                        attributes: ['DateTimeUpdate', 'SerialNo', param],
                        where: {
                            DateTimeUpdate: {
                                [Op.and]: {
                                    [Op.gte]: start_date,
                                    [Op.lte]: end_date
                                }
                            },
                            snmKey: siteid + "%" + nodeid + "%" + modbusid
                        },
                        order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
                    })
                }

                ret[cellName] = []
                let count = []

                for(let i=0; i<arr_size; i++)
                {
                    ret[cellName].push(0);
                    count.push(0)
                }

                let prev_dval  = -1;
                let prev_time = null;

                for(let e of eData)
                {
                    let seq;
                    let dval;

                    let adjustedTime = new Date(e.DateTimeUpdate.getTime())
                    // adjustedTime.setUTCMinutes(adjustedTime.getUTCMinutes()-1)

                    seq = Math.trunc(adjustedTime.getTime()/1000/60/15) - start_seq;

                    if(seq < 0) 
                    {
                        seq = 0
                    }

                    if(cmap[param].storage == "accumulative")
                    {
                        let sn = e.SerialNo
                        let period = blacknode[sn].period * 60 * 1000

                        if(prev_time == null || e.DateTimeUpdate.getTime() - prev_time.getTime() != period)
                        {
                            prev_time = e.DateTimeUpdate

                            if(param == 'kWdemand')
                            {
                                prev_dval = e[kwhType]
                            }
                            else
                            {
                                prev_dval = e[param]
                            }

                            continue
                        }
                        else
                        {
                            if(param == 'kWdemand')
                            {
                                if(e[kwhType] != undefined || e[kwhType] != -1)
                                {
                                    dval = (e[kwhType] - prev_dval) * DEMAND
                                }
                                else
                                {
                                    dval = 0
                                }
                            }
                            else
                            {
                                dval = e[param] - prev_dval
                            }
                            
                        }
                    }
                    else
                    {
                        if(param == 'kWdemand')
                        {
                            dval = e[kwhType]
                        }
                        else
                        {
                            dval = e[param]
                        }
                    }

                    //Get the average

                    ret[cellName][seq] += dval;
                    count[seq]++;

                    if(param == 'kWdemand')
                    {
                        prev_dval = e[kwhType]
                    }
                    else
                    {
                        prev_dval = e[param]
                    }
                    
                    prev_time = e.DateTimeUpdate
                }


                if(cmap[param].storage != "accumulative")
                {
                    for(let i=0; i<arr_size; i++)
                    {
                        if(count[i] > 0)
                        {
                            ret[cellName][i] /= count[i];
                        }
                    }
                }

                if(req.params.type != 'day')
                {
                    ret[cellName].length = ret[cellName].length - 1
                }
            }
            else if(arr[0] == 'G')
            {
                arr = arr[1].split("%");

                let gid = parseInt(arr[0]);

                let param = arr[1];

                
                let dxt = {};
                let multmap = {};
                let count = []

                if(param == "TotalkWh" && req.params.ttype != 'electrical' && meta_cfg.useImport && meta_cfg.useImport.value)
                {
                    var cellName = group[gid].name + '.' + kwhType
                    param = kwhType
                }
                else
                {
                    var cellName = group[gid].name + '.' + param
                }
                
                ret[cellName] = [];

                for(let i=0; i<arr_size; i++)
                {
                    ret[cellName].push(0);
                    count.push(0)
                }

                for(let m of group[gid].member)
                {
                    let sn = m.serial;
                    let siteid = blacknode[sn].siteid;
                    let nodeid = blacknode[sn].nodeid;
                    let modbusid = parseInt(m.modbusid);
                    let snmKey = siteid + "%" + nodeid + "%" + modbusid

                    multmap[snmKey] = parseFloat(m.multiplier)

                    let eData;

                    if(param == 'kWdemand')
                    {
                        eData = await db.energy.findAll({
                            attributes: ['DateTimeUpdate', 'SerialNo', kwhType, 'snmKey'],
                            where: {
                                DateTimeUpdate: {
                                    [Op.and]: {
                                        [Op.gte]: start_date,
                                        [Op.lte]: end_date
                                    }
                                },
                                snmKey: siteid + "%" + nodeid + "%" + modbusid
                            },
                            order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
                        })
                    }
                    else
                    {
                        eData = await db.energy.findAll({
                            attributes: ['DateTimeUpdate', 'SerialNo', param, 'snmKey'],
                            where: {
                                DateTimeUpdate: {
                                    [Op.and]: {
                                        [Op.gte]: start_date,
                                        [Op.lte]: end_date
                                    }
                                },
                                snmKey: siteid + "%" + nodeid + "%" + modbusid
                            },
                            order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
                        })
                    }

                    let prev_time = null
                    let prev_dval = -1

                    for(let e of eData)
                    {
                        let dval
                        let tkey = e.DateTimeUpdate.getUTCFullYear() + '-' + e.DateTimeUpdate.getUTCMonth() + '-' + e.DateTimeUpdate.getUTCDate() + '-' + e.DateTimeUpdate.getUTCHours() + '-' + e.DateTimeUpdate.getUTCMinutes()

                        if(!dxt.hasOwnProperty(tkey))
                        {
                            dxt[tkey] = 0
                        }
    
                        if(cmap[param].storage == "accumulative")
                        {
                            let sn = e.SerialNo
                            let period = blacknode[sn].period * 60 * 1000

                            if(prev_time == null || e.DateTimeUpdate.getTime() - prev_time.getTime() != period)
                            {
                                prev_time = e.DateTimeUpdate

                                if(param == 'kWdemand')
                                {
                                    prev_dval = e[kwhType]
                                }
                                else
                                {
                                    prev_dval = e[param]
                                }
                                
                                continue
                            }
                            else
                            {
                                if(param == 'kWdemand')
                                {
                                    if(e[kwhType] != undefined || e[kwhType] != -1)
                                    {
                                        dval = (e[kwhType] - prev_dval) * DEMAND
                                    }
                                    else
                                    {
                                        dval = 0
                                    }
                                }
                                else
                                {
                                    dval = e[param] - prev_dval
                                }
                                
                            }
                        }
                        else
                        {
                            if(param == 'kWdemand')
                            {
                                dval = e[kwhType]
                            }
                            else
                            {
                                dval = e[param]
                            }
                        }

                        dxt[tkey] += dval * multmap[e.snmKey]

                        if(param == 'kWdemand')
                        {
                            prev_dval = e[kwhType]
                        }
                        else
                        {
                            prev_dval = e[param]
                        }

                        prev_time = e.DateTimeUpdate
                    }
                }

                let dKey = Object.keys(dxt)
                
                for(let dk of dKey)
                {
                    if(cmap[param].group == 'avg')
                    {
                        if(group[gid].member.length > 0)
                        {
                            dxt[dk] /= group[gid].member.length
                        }  
                    }

                    let arr = dk.split('-')
                    let tt = new Date(Date.UTC(arr[0], arr[1], arr[2], arr[3], arr[4]))

                    // tt.setUTCMinutes(tt.getUTCMinutes() - 1)

                    let seq;

                    seq = Math.trunc(tt.getTime()/1000/60/15) - start_seq;

                    if(seq < 0)
                    {
                        seq = 0
                    }
                    
                    ret[cellName][seq] += dxt[dk];
                    count[seq]++;
                    
                }

                if(cmap[param].storage != 'accumulative')
                {
                    for(let i=0; i<arr_size; i++)
                    {
                        if(count[i] > 0)
                        {
                            ret[cellName][i] /= count[i];
                        }
                    }
                }

                if(req.params.type != 'day')
                {
                    ret[cellName].length = ret[cellName].length - 1;
                }
                
            }
        }

        if(req.params.ttype != 'electrical')
        {
            let fData = await db.feedmeter.findAll({
                where: {
                    DateTime: {
                        [Op.and]: {
                            [Op.gte]: start_date,
                            [Op.lte]: end_date
                        }
                    }
                },
                order: [['FeederDateTime', 'ASC'], ['id', 'asc']]
            })

            let fRet = {}

            for(let f of fData)
            {
                if(!fRet[f.name])
                {
                    fRet[f.name] = []

                    for(let i=0; i<arr_size; i++)
                    {
                        fRet[f.name].push(0);
                    }
                }

                let adjustedTime = new Date(f.DateTime.getTime())

                let seq = Math.trunc(adjustedTime.getTime()/1000/60/15) - start_seq;

                fRet[f.name][seq] = f.value
            }

            let keys = Object.keys(fRet)
            let currCol = 2

            for(let k of keys)
            {
                let col = feederWS.getColumn(currCol)

                col.values = [k].concat(fRet[k])
                col.width = k.length + 5
                currCol++
            }

            for(let i=1; i<=arr_size; i++)
            {
                feederWS.getCell('A' + String(i+1)).value = new Date(start_date.getTime() + ((i-1)*15*60*1000));
            }
        }
        

        let keys = Object.keys(ret)
        let currCol = 2

        for(let k of keys)
        {
            let col = worksheet.getColumn(currCol)

            col.values = [k].concat(ret[k])
            col.width = k.length+5
            currCol++
        }



        for(let i=1; i<=arr_size; i++)
        {
            worksheet.getCell('A' + String(i+1)).value = new Date(start_date.getTime() + ((i-1)*15*60*1000));
        }

        res.attachment(req.params.ttype + '_export.xlsx')
        workbook.xlsx.write(res).then(() => {
            res.end()
        })
    })

    api.post('/feedmeter', async (req, res) => {
        if(await apiguard(req, 'feedmeter', req.body.token) == false)
        {
            res.send('Permission not allowed.')
            return
        }

        let now = new Date()
        now.setMinutes(parseInt(Math.trunc(now.getMinutes()/15) * 15))
        let utc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0, 0))

        if(!lastFeedTime[req.body.name] || lastFeedTime[req.body.name] < utc)
        {
            await db.feedmeter.create({
                DateTime: utc,
                name: req.body.name,
                value: parseFloat(req.body.value)
            })

            lastFeedTime[req.body.name] = utc
        }

        res.send("SUCCESS");
    })

    api_server = api.listen((meta_cfg.broker.apiport) ? meta_cfg.broker.apiport : 8888, () => {
        console.log('API Server is running at ', (meta_cfg.broker.apiport) ? meta_cfg.broker.apiport : 8888)
    })
}
