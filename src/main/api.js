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
    loadMetaDB
} from './global.js'
import { createReadStream } from 'fs'
import { syncDB } from './db.js'

export var api_server

const pmap = [
    {
        name: 'Import_kWh',
        unit: '',
        group: 'sum',
        weight: true,
        alarm: false
    },
    {
        name: 'Export_kWh',
        unit: '',
        group: 'sum',
        weight: true,
        alarm: false
    },
    {
        name: 'TotalkWh',
        unit: '',
        group: 'sum',
        weight: true,
        alarm: false
    },
    {
        name: 'Total_kvarh',
        unit: '',
        group: 'sum',
        weight: true,
        alarm: false
    },
    {
        name: 'Ind_kvarh',
        unit: '',
        group: 'sum',
        weight: true,
        alarm: false
    },
    {
        name: 'Cap_kvarh',
        unit: '',
        group: 'sum',
        weight: true,
        alarm: false
    },
    {
        name: 'kVAh',
        unit: '',
        group: 'sum',
        weight: true,
        alarm: false
    },
    {
        name: 'V1',
        unit: '(V)',
        group: 'avg',
        weight: false,
        alarm: true
    },
    {
        name: 'V2',
        unit: '(V)',
        group: 'avg',
        weight: false,
        alarm: true
    },
    {
        name: 'V3',
        unit: '(V)',
        group: 'avg',
        weight: false,
        alarm: true
    },
    {
        name: 'V12',
        unit: '(V)',
        group: 'avg',
        weight: false,
        alarm: true
    },
    {
        name: 'V23',
        unit: '(V)',
        group: 'avg',
        weight: false,
        alarm: true
    },
    {
        name: 'V31',
        unit: '(V)',
        group: 'avg',
        weight: false,
        alarm: true
    },
    {
        name: 'I1',
        unit: '(A)',
        group: 'sum',
        weight: true,
        alarm: true
    },
    {
        name: 'I2',
        unit: '(A)',
        group: 'sum',
        weight: true,
        alarm: true
    },
    {
        name: 'I3',
        unit: '(A)',
        group: 'sum',
        weight: true,
        alarm: true
    },
    {
        name: 'P1',
        unit: '(kW)',
        group: 'sum',
        weight: true,
        alarm: true
    },
    {
        name: 'P2',
        unit: '(kW)',
        group: 'sum',
        weight: true,
        alarm: true
    },
    {
        name: 'P3',
        unit: '(kW)',
        group: 'sum',
        weight: true,
        alarm: true
    },
    {
        name: 'P_Sum',
        unit: '(kW)',
        group: 'sum',
        weight: true,
        alarm: true
    },
    {
        name: 'Q1',
        unit: '(kvar)',
        group: 'sum',
        weight: true,
        alarm: true
    },
    {
        name: 'Q2',
        unit: '(kvar)',
        group: 'sum',
        weight: true,
        alarm: true
    },
    {
        name: 'Q3',
        unit: '(kvar)',
        group: 'sum',
        weight: true,
        alarm: true
    },
    {
        name: 'Q_Sum',
        unit: '(kvar)',
        group: 'sum',
        weight: true,
        alarm: true
    },
    {
        name: 'S1',
        unit: '(kVA)',
        group: 'sum',
        weight: true,
        alarm: true
    },
    {
        name: 'S2',
        unit: '(kVA)',
        group: 'sum',
        weight: true,
        alarm: true
    },
    {
        name: 'S3',
        unit: '(kVA)',
        group: 'sum',
        weight: true,
        alarm: true
    },
    {
        name: 'S_Sum',
        unit: '(kVA)',
        group: 'sum',
        weight: true,
        alarm: true
    },
    {
        name: 'PF1',
        unit: '',
        group: 'avg',
        weight: false,
        alarm: true
    },
    {
        name: 'PF2',
        unit: '',
        group: 'avg',
        weight: false,
        alarm: true
    },
    {
        name: 'PF3',
        unit: '',
        group: 'avg',
        weight: false,
        alarm: true
    },
    {
        name: 'PF_Sum',
        unit: '',
        group: 'avg',
        weight: false,
        alarm: true
    },
    {
        name: 'THD_U1',
        unit: '(%)',
        group: 'avg',
        weight: false,
        alarm: false
    },
    {
        name: 'THD_U2',
        unit: '(%)',
        group: 'avg',
        weight: false,
        alarm: false
    },
    {
        name: 'THD_U3',
        unit: '(%)',
        group: 'avg',
        weight: false,
        alarm: false
    },
    {
        name: 'THD_I1',
        unit: '(%)',
        group: 'avg',
        weight: false,
        alarm: false
    },
    {
        name: 'THD_I2',
        unit: '(%)',
        group: 'avg',
        weight: false,
        alarm: false
    },
    {
        name: 'THD_I3',
        unit: '(%)',
        group: 'avg',
        weight: false,
        alarm: false
    },
    {
        name: 'Frequency',
        unit: '(Hz)',
        group: 'avg',
        weight: false,
        alarm: true
    }
]

const cmap = {
    'Import_kWh': 'sum',
    'Export_kWh': 'sum',
    'TotalkWh': 'sum',
    'Total_kvarh': 'sum',
    'Ind_kvarh': 'sum',
    'Cap_kvarh': 'sum',
    'kVAh': 'sum',
    'V1': 'avg',
    'V2': 'avg',
    'V3': 'avg',
    'V12': 'avg',
    'V23': 'avg',
    'V31': 'avg',
    'I1': 'sum',
    'I2': 'sum',
    'I3': 'sum',
    'P1': 'sum',
    'P2': 'sum',
    'P3': 'sum',
    'P_Sum': 'sum',
    'Q1': 'sum',
    'Q2': 'sum',
    'Q3': 'sum',
    'Q_Sum': 'sum',
    'S1': 'sum',
    'S2': 'sum',
    'S3': 'sum',
    'S_Sum': 'sum',
    'PF1': 'avg',
    'PF2': 'avg',
    'PF3': 'avg',
    'PF_Sum': 'avg',
    'THD_U1': 'avg',
    'THD_U2': 'avg',
    'THD_U3': 'avg',
    'THD_I1': 'avg',
    'THD_I2': 'avg',
    'THD_I3': 'avg',
    'Frequency': 'avg'
}

function isOnPeak(dt) {
    let dayinweek = dt.getUTCDay()

    // Saturday or Sunday
    if (dayinweek == 0 || dayinweek == 6) {
        return false
    }

    // In case of holidays...
    let k = String(dt.getUTCFullYear()) + String(dt.getUTCMonth()) + String(dt.getUTCDate())

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
    const api = express()
    api.use(cors())
    api.use(express.json())
    api.use(express.urlencoded({ extended: true }))
    api.use(fileUpload())

    api.get('/dashboard_card', async (req, res) => {
        let ret = {}

        // calculate value and return
        let now = new Date()

        let tLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
        let tThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
        let tYesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1))
        let tToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
        let tTomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))

        let energyLastMonth = 0
        let energyThisMonth = 0
        let energyYesterday = 0
        let energyToday = 0

        let maxDemandLastMonth = 0
        let maxDemandThisMonth = 0
        let maxDemandYesterday = 0
        let maxDemandToday = 0

        let group = await db.group.findOne({
            where: { showDashboard: true }
        })

        var eData
        let all = true
        var snmKey = []

        if (group !== null) {
            let members = await db.gmember.findAll({
                where: { GroupID: group.id }
            })

            if (members !== null) {
                for (let m of members) {
                    let key = m.SiteID + '%' + m.NodeID + '%' + String(m.ModbusID)

                    snmKey.push(key)
                }

                all = false
            }
        }

        if (all) {
            eData = await db.energy.findAll({
                where: {
                    DateTimeUpdate: {
                        [Op.and]: {
                            [Op.gte]: tLastMonth,
                            [Op.lt]: now
                        }
                    }
                },
                order: [['DateTimeUpdate', 'ASC']]
            })
        } else {
            eData = await db.energy.findAll({
                where: {
                    DateTimeUpdate: {
                        [Op.and]: {
                            [Op.gte]: tLastMonth,
                            [Op.lt]: now
                        }
                    },
                    snmKey: snmKey
                },
                order: [['DateTimeUpdate', 'ASC']]
            })
        }

        let prevEnergy = 0
        let prevTime = null;

        for (let e of eData) {
            if (prevEnergy == 0) {
                prevEnergy = e.TotalkWh
                prevTime = e.DateTimeUpdate
                continue
            }

            let absEnergy = e.TotalkWh - prevEnergy

            if (absEnergy < 0) {
                absEnergy = 0
            }

            prevEnergy = e.TotalkWh

            if (e.DateTimeUpdate >= tLastMonth && e.DateTimeUpdate < tThisMonth) {
                // Last month
                if(prevTime >= tLastMonth && prevTime < tThisMonth)
                {
                    energyLastMonth += absEnergy

                    if (isOnPeak(e.DateTimeUpdate) && absEnergy * 4 > maxDemandLastMonth) {
                        maxDemandLastMonth = absEnergy * 4
                    }
                }
                
            } else {
                // This month
                if(prevTime >= tThisMonth && prevTime < tTomorrow)
                {
                    energyThisMonth += absEnergy

                    if (isOnPeak(e.DateTimeUpdate) && absEnergy * 4 > maxDemandThisMonth) {
                        maxDemandThisMonth = absEnergy * 4
                    }

                    if (e.DateTimeUpdate >= tYesterday && e.DateTimeUpdate < tToday) {
                        // Yesterday
                        if(prevTime >= tYesterday && prevTime < tTomorrow)
                        {
                            energyYesterday += absEnergy

                            if (isOnPeak(e.DateTimeUpdate) && absEnergy * 4 > maxDemandYesterday) {
                                maxDemandYesterday = absEnergy * 4
                            }
                        }
                        
                    } else if (e.DateTimeUpdate >= tToday && prevTime < tTomorrow) {
                        energyToday += absEnergy

                        if (isOnPeak(e.DateTimeUpdate) && absEnergy * 4 > maxDemandToday) {
                            maxDemandToday = absEnergy * 4
                        }
                    }
                }
                
            }

            prevTime = e.DateTimeUpdate
        }

        ret = {
            t_last_month: energyLastMonth,
            t_this_month: energyThisMonth,
            t_yesterday: energyYesterday,
            t_today: energyToday,
            b_last_month: maxDemandLastMonth,
            b_this_month: maxDemandThisMonth,
            b_yesterday: maxDemandYesterday,
            b_today: maxDemandToday
        }


        res.json(ret)
    })

    api.get('/dashboard/:year/:month/:day', async (req, res) => {
        let ret = []


        // calculate value and return
        for (let i = 0; i < 24; i++) {
            ret[i] = {
                category: String(i),
                value1: 0
            }
        }

        let year = req.params.year
        let month = parseInt(req.params.month) - 1
        let day = req.params.day

        let startTime = new Date(Date.UTC(year, month, day))
        let endTime = new Date(Date.UTC(year, month, day, 23, 59, 59))

        let group = await db.group.findOne({
            where: { showDashboard: true }
        })

        var eData
        let all = true
        var snmKey = []

        if (group !== null) {
            let members = await db.gmember.findAll({
                where: { GroupID: group.id }
            })

            if (members !== null) {
                for (let m of members) {
                    let key = m.SiteID + '%' + m.NodeID + '%' + String(m.ModbusID)

                    snmKey.push(key)
                }

                all = false
            }
        }

        if (all) {
            eData = await db.energy.findAll({
                where: {
                    DateTimeUpdate: {
                        [Op.and]: {
                            [Op.gte]: startTime,
                            [Op.lt]: endTime
                        }
                    }
                },
                order: [['DateTimeUpdate', 'ASC']]
            })
        } else {
            eData = await db.energy.findAll({
                where: {
                    DateTimeUpdate: {
                        [Op.and]: {
                            [Op.gte]: startTime,
                            [Op.lt]: endTime
                        }
                    },
                    snmKey: snmKey
                },
                order: [['DateTimeUpdate', 'ASC']]
            })
        }

        let prevEnergy = 0

        for (let e of eData) {
            if (prevEnergy == 0) {
                prevEnergy = e.TotalkWh
                continue
            }

            let absEnergy = e.TotalkWh - prevEnergy

            if (absEnergy < 0) {
                absEnergy = 0
            }

            prevEnergy = e.TotalkWh

            let adjustedTime = new Date(e.DateTimeUpdate)
            adjustedTime.setMinutes(adjustedTime.getMinutes() - 1)

            let hour = adjustedTime.getUTCHours()

            ret[hour].value1 += absEnergy
        }

        res.json(ret)
    })

    api.get('/dashboard/:year/:month', async (req, res) => {
        let ret = []

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

        let startTime = new Date(Date.UTC(year, month, 1))
        let endTime = new Date(Date.UTC(year, month, totalDays, 23, 59, 59))

        let group = await db.group.findOne({
            where: { showDashboard: true }
        })

        var eData
        let all = true
        var snmKey = []

        if (group !== null) {
            let members = await db.gmember.findAll({
                where: { GroupID: group.id }
            })

            if (members !== null) {
                for (let m of members) {
                    let key = m.SiteID + '%' + m.NodeID + '%' + String(m.ModbusID)

                    snmKey.push(key)
                }

                all = false
            }
        }

        if (all) {
            eData = await db.energy.findAll({
                where: {
                    DateTimeUpdate: {
                        [Op.and]: {
                            [Op.gte]: startTime,
                            [Op.lt]: endTime
                        }
                    }
                },
                order: [['DateTimeUpdate', 'ASC']]
            })
        } else {
            eData = await db.energy.findAll({
                where: {
                    DateTimeUpdate: {
                        [Op.and]: {
                            [Op.gte]: startTime,
                            [Op.lt]: endTime
                        }
                    },
                    snmKey: snmKey
                },
                order: [['DateTimeUpdate', 'ASC']]
            })
        }

        let prevEnergy = 0

        for (let e of eData) {
            if (prevEnergy == 0) {
                prevEnergy = e.TotalkWh
                continue
            }

            let absEnergy = e.TotalkWh - prevEnergy

            if (absEnergy < 0) {
                absEnergy = 0
            }

            prevEnergy = e.TotalkWh

            let adjustedTime = new Date(e.DateTimeUpdate)
            adjustedTime.setMinutes(adjustedTime.getMinutes() - 1)

            let day = adjustedTime.getUTCDate() - 1

            ret[day].value1 += absEnergy
        }

        res.json(ret)
    })

    api.get('/dashboard/:year', async (req, res) => {
        let ret = []

        let year = req.params.year

        // calculate value and return
        for (let i = 0; i < 12; i++) {
            ret[i] = {
                category: String(i + 1),
                value1: 0
            }
        }

        let startTime = new Date(Date.UTC(year, 0, 1))
        let endTime = new Date(Date.UTC(year, 11, 31, 59, 59, 59))

        let group = await db.group.findOne({
            where: { showDashboard: true }
        })

        var eData
        let all = true
        var snmKey = []

        if (group !== null) {
            let members = await db.gmember.findAll({
                where: { GroupID: group.id }
            })

            if (members !== null) {
                for (let m of members) {
                    let key = m.SiteID + '%' + m.NodeID + '%' + String(m.ModbusID)

                    snmKey.push(key)
                }

                all = false
            }
        }

        if (all) {
            eData = await db.energy.findAll({
                where: {
                    DateTimeUpdate: {
                        [Op.and]: {
                            [Op.gte]: startTime,
                            [Op.lt]: endTime
                        }
                    }
                },
                order: [['DateTimeUpdate', 'ASC']]
            })
        } else {
            eData = await db.energy.findAll({
                where: {
                    DateTimeUpdate: {
                        [Op.and]: {
                            [Op.gte]: startTime,
                            [Op.lt]: endTime
                        }
                    },
                    snmKey: snmKey
                },
                order: [['DateTimeUpdate', 'ASC']]
            })
        }

        let prevEnergy = 0

        for (let e of eData) {
            if (prevEnergy == 0) {
                prevEnergy = e.TotalkWh
                continue
            }

            let absEnergy = e.TotalkWh - prevEnergy

            if (absEnergy < 0) {
                absEnergy = 0
            }

            prevEnergy = e.TotalkWh

            let adjustedTime = new Date(e.DateTimeUpdate)
            adjustedTime.setMinutes(adjustedTime.getMinutes() - 1)

            let month = adjustedTime.getUTCMonth()
            ret[month].value1 += absEnergy
        }

        res.json(ret)
    })

    api.get('/dashboard', async (req, res) => {
        let ret = []

        // calculate value and return
        let now = new Date()

        for (let i = 0; i < 24; i++) {
            ret[i] = {
                category: String(i + 1),
                value1: 0
            }
        }

        let startTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
        let endTime = new Date(Date.UTC(year, month, day, 0, 0, 0))

        let group = await db.group.findOne({
            where: { showDashboard: true }
        })

        var eData
        let all = true
        var snmKey = []

        if (group !== null) {
            let members = await db.gmember.findAll({
                where: { GroupID: group.id }
            })

            if (members !== null) {
                for (let m of members) {
                    let key = m.SiteID + '%' + m.NodeID + '%' + String(m.ModbusID)

                    snmKey.push(key)
                }

                all = false
            }
        }

        if (all) {
            eData = await db.energy.findAll({
                where: {
                    DateTimeUpdate: {
                        [Op.and]: {
                            [Op.gte]: startTime,
                            [Op.lt]: endTime
                        }
                    }
                },
                order: [['DateTimeUpdate', 'ASC']]
            })
        } else {
            eData = await db.energy.findAll({
                where: {
                    DateTimeUpdate: {
                        [Op.and]: {
                            [Op.gte]: startTime,
                            [Op.lt]: endTime
                        }
                    },
                    snmKey: snmKey
                },
                order: [['DateTimeUpdate', 'ASC']]
            })
        }

        let prevEnergy = 0

        for (let e of eData) {
            if (prevEnergy == 0) {
                prevEnergy = e.TotalkWh
                continue
            }

            let absEnergy = e.TotalkWh - prevEnergy

            if (absEnergy < 0) {
                absEnergy = 0
            }

            prevEnergy = e.TotalkWh

            let adjustedTime = new Date(e.DateTimeUpdate)
            adjustedTime.setMinutes(adjustedTime.getMinutes() - 1)

            let hour = adjustedTime.getUTCHours() - 1
            ret[hour].value1 += absEnergy
        }

        res.json(ret)
    })

    /* Monitoring API */
    api.get('/group_meter_info', async (req, res) => {
        let ret = {
            group: [],
            meter: []
        }

        let initGroup = []
        let groups = {}

        if (db.gmember) {
            let groupInfo = await db.gmember.findAll()

            if (groupInfo !== null) {
                for (let g of groupInfo) {
                    if (!(g.GroupID in initGroup)) {
                        groups[g.GroupID] = {
                            id: g.GroupID,
                            name: group[g.GroupID].name,
                            parameter: [],
                            member: []
                        }

                        for (let i = 0; i < pmap.length; i++) {
                            groups[g.GroupID].parameter.push({
                                name: pmap[i].name + ' ' + pmap[i].unit,
                                display:
                                    group[g.GroupID].name +
                                    ' - ' +
                                    pmap[i].name +
                                    ' ' +
                                    pmap[i].unit,
                                selectedSeries: 'G@' + String(g.GroupID) + '%' + pmap[i].name
                            })
                        }
                    }

                    groups[g.GroupID].member.push({
                        name: blacknode[g.SerialNo].name,
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
                        name: pmap[j].name + ' ' + pmap[j].unit,
                        display:
                            blacknode[sn].meter_list[i].name +
                            ' - ' +
                            pmap[j].name +
                            ' ' +
                            pmap[j].unit,
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
                            pmap[j].name
                    })
                }

                ret.meter.push(obj)
            }
        }

        res.json(ret)
    })

    api.post('/rt_chart', (req, res) => {
        let ret = {}

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
                        
                        total += lastUpdateData[snid][param];
                    }
                }

                if(cmap[param] == 'avg')
                {
                    ret[k] = {
                        time: new Date(),
                        value: total/count
                    };
                }
                else if(cmap[param] == 'sum')
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

    api.get('/meter_data_table', (req, res) => {
        let ret = []

        let now = new Date()

        let sn = Object.keys(blacknode)

        for (let i = 0; i < pmap.length; i++) {
            ret[i] = {}
            ret[i]['parameter'] = pmap[i].name + ' ' + pmap[i].unit

            for (let s of sn) {
                for (let j = 0; j < blacknode[s].meter_list.length; j++) {
                    let k = s + '%' + String(j)

                    if (
                        lastUpdateData[k] &&
                        lastUpdateData[k].DateTimeUpdate &&
                        now.getTime() - lastUpdateData[k].DateTimeUpdate.getTime() < 60 * 1000
                    ) {
                        ret[i][blacknode[s].meter_list[j].name] =
                            lastUpdateData[k][pmap[i].name]
                    } else {
                        ret[i][blacknode[s].meter_list[j].name] = -1
                    }
                }
            }
        }

        res.json(ret)
    })

    api.get('/node_monitor', (req, res) => {
        let ret = {}

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

    api.get('/meter_list', (req, res) => {
        let ret = {}
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

    api.get('/phasor_graph/:m', (req, res) => {
        let arr = req.params.m.split(':')
        let sn = arr[0]
        let modbusid = parseInt(arr[1]) - 1
        let snid = sn + '%' + String(modbusid)
        let now = new Date()

        let ret;

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

        res.json(ret)
    })

    // Management Section
    api.get('/backup_impro', (req, res) => {

        if (paths && paths['META_CFG_PATH']) {
            res.setHeader('Content-disposition', 'attachment; filename=meta.info')
            res.setHeader('Content-type', 'application/json')

            var filestream = createReadStream(paths['META_CFG_PATH'])
            filestream.pipe(res)
        }
    })

    api.post('/backup_impro', async (req, res) => {
        if (paths && paths['META_CFG_PATH']) {
            try {
                writeFile(paths['META_CFG_PATH'], req.files.file.data, { flag: 'w' })

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

    api.get('/backup_bn', (req, res) => {
        if (paths && paths['BN_CFG_PATH']) {
            res.setHeader('Content-disposition', 'attachment; filename=blacknode.info')
            res.setHeader('Content-type', 'application/json')

            var filestream = createReadStream(paths['BN_CFG_PATH'])
            filestream.pipe(res)
        }
    })

    api.post('/backup_bn', (req, res) => {
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
        res.json(group)
    })

    api.get('/meter', async (_req, res) => {
        let ret = []

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

    api.post('/update_member', async (req, res) => {
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

        let typemap = {
            BN_DC: 'Blacknode Disconnected',
            METER_DC: 'Meter Disconnected',
            OVER_RANGE: 'Parameter Over-range'
        }

        try {
            let alarms = await db.alarm.findAll({
                limit: limit,
                offset: parseInt(req.params.page) * limit
            })

            for (let a of alarms) {
                let dev = ''

                if (a.ModbusID != 0) {
                    dev = blacknode[a.SerialNo].meter_list[a.ModbusID-1].name
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
        if (paths && paths['META_CFG_PATH']) {
            try {
                let keys = Object.keys(req.body);

                for(let k of keys)
                {
                    meta_cfg.param.mm[k].min = req.body[k].min;
                    meta_cfg.param.mm[k].max = req.body[k].max;
                }

                writeFile(paths['META_CFG_PATH'], JSON.stringify(meta_cfg), { flag: 'w' });
                res.send("SUCCESS");
            } catch(err) {
                console.log("Cannot save parameter.");
                res.send("Cannot save parameter.");
            }
            
        }
    });

    api.get('/parameter', async (req, res) => {
        res.json(meta_cfg.param.mm);
    });

    api.get('/holiday', async (req, res) => {
        res.json(holidays);
    });

    api.post('/holiday', async (req, res) => {
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
        try {
            let users = await db.user.findAll();

            res.json(users);
        } catch (err) {
            console.log("Cannot get user.");
            res.json({});
        }
    });

    api.post('/user', async (req, res) => {
        try {
            await db.user.create({
                name: req.body.name,
                username: req.body.username,
                email: req.body.email,
                password: await bcrypt.hash(req.body.password, 3),
                DateTime: new Date(),
                status: req.body.status
            });

            // Create corresponding role and project as needed...

            res.send("SUCCESS");
        } catch (err) {
            console.log("Cannot add user.");
            res.send("Cannot add user");
        }
    });

    api.post('/user/:action/:id', async (req, res) => {
        if(req.params.action == "edit")
        {
            try {
                await db.user.update(
                    {
                        name: req.body.name,
                        // username: req.body.username,
                        email: req.body.email,
                        password: await bcrypt.hash(req.body.password, 3),
                        DateTime: new Date(),
                        status: req.body.status
                    },
                    {
                        where: { id: parseInt(req.params.id) }
                    }
                )

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

    api.post('/rp_chart/:type/:year/:month/:day', async (req, res) => {
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
        else
        {
            end_date.setUTCDate(end_date.getUTCDate() + 1);
        }

        let start_seq = Math.trunc(start_date.getTime()/1000/60/15);
        let end_seq = Math.trunc(end_date.getTime()/1000/60/15);

        let arr_size = end_seq-start_seq;

        if(req.params.type == 'year')
        {
            arr_size = 12;
        }
        else if(req.params.type == 'month')
        {
            arr_size /= 96;
        }

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

                let eData = await db.energy.findAll({
                    attributes: ['DateTimeUpdate', param],
                    where: {
                        DateTimeUpdate: {
                            [Op.and]: {
                                [Op.gte]: start_date,
                                [Op.lt]: end_date
                            }
                        },
                        snmKey: siteid + "%" + nodeid + "%" + modbusid
                    },
                    order: [['DateTimeUpdate', 'ASC']]
                })

                ret[k] = [];

                for(let i=0; i<arr_size; i++)
                {
                    let time;

                    if(req.params.type == 'year')
                    {
                        time = new Date(start_date);
                        time.setUTCMonth(time.getUTCMonth() + i);
                    }
                    else if(req.params.type == 'month')
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
                        value: 0
                    });
                }

                for(let e of eData)
                {
                    let seq;
                    // let time;
                    
                    if(req.params.type == 'year')
                    {
                        seq = e.DateTimeUpdate.getUTCMonth();
                    }
                    else if(req.params.type == 'month')
                    {
                        seq = e.DateTimeUpdate.getUTCDate()-1;
                    }
                    else
                    {
                        seq = Math.trunc(e.DateTimeUpdate.getTime()/1000/60/15) - start_seq;
                    }

                    // [TODO] Calculate depending on parameter type (accumulative/instance)
                    ret[k][seq].value = e[param];
                }
            }
            else if(arr[0] == 'G')
            {
                arr = arr[1].split("%");

                let gid = parseInt(arr[0]);

                let param = arr[1];

                let count = 0;

                ret[k] = [];
                let tmp = [];

                for(let i=0; i<arr_size; i++)
                {
                    let time;

                    if(req.params.type == 'year')
                    {
                        time = new Date(start_date);
                        time.setUTCMonth(time.getUTCMonth() + i);
                    }
                    else if(req.params.type == 'month')
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
                        value: 0
                    });

                    tmp.push(0);
                }

                for(let m of group[gid].member)
                {
                    let sn = m.serial;
                    let siteid = blacknode[sn].siteid;
                    let nodeid = blacknode[sn].nodeid;
                    let modbusid = parseInt(m.modbusid);

                    let eData = await db.energy.findAll({
                        attributes: ['DateTimeUpdate', param],
                        where: {
                            DateTimeUpdate: {
                                [Op.and]: {
                                    [Op.gte]: start_date,
                                    [Op.lt]: end_date
                                }
                            },
                            snmKey: siteid + "%" + nodeid + "%" + modbusid
                        },
                        order: [['DateTimeUpdate', 'ASC']]
                    })

                    for(let e of eData)
                    {
                        let seq;
                    
                        if(req.params.type == 'year')
                        {
                            seq = e.DateTimeUpdate.getUTCMonth();
                                                    
                        }
                        else if(req.params.type == 'month')
                        {
                            seq = e.DateTimeUpdate.getUTCDate()-1;
                                                   
                        }
                        else
                        {
                            seq = Math.trunc(e.DateTimeUpdate.getTime()/1000/60/15) - start_seq;
                        }

                        // ret[k][seq].value += e.TotalkWh;
                        // [TODO] Calculate depending on parameter type (accumulative/instance)
                        tmp[seq] = e[param];
                    }

                    for(let i=0; i<arr_size; i++)
                    {
                        ret[k][i].value += tmp[i];
                        tmp[i] = 0;
                    }
                    
                    count += 1;
                }

                if(cmap[param] == 'avg')
                {
                    for(let i=0; i<arr_size; i++)
                    {
                        ret[k][i].value = ret[k][k].value/count;
                    }
                }
            }
        }

        res.json(ret)
    })

    api_server = api.listen(8888, () => {
        console.log('API Server is running at 8888.')
    })
}
