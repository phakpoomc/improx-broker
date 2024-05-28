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
    loadMetaCFG
} from './global.js'
import { createReadStream } from 'fs'
import { syncDB } from './db.js'

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
        storage: 'accumulative',
        weight: true,
        alarm: false,
    },
    'Export_kWh': {
        name: 'Export_kWh',
        unit: '',
        group: 'sum',
        storage: 'accumulative',
        weight: true,
        alarm: false,
    },
    'TotalkWh': {
        name: 'TotalkWh',
        unit: '',
        group: 'sum',
        storage: 'accumulative',
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
        storage: 'instance',
        weight: false,
        alarm: false,
    },
}

const pmap = Object.keys(cmap)

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

        let tLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0))
        let tThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0))
        let tYesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 0, 0, 0))
        let tToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0))
        let tTomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0))

        let energyLastMonth = 0
        let energyThisMonth = 0
        let energyYesterday = 0
        let energyToday = 0

        // let maxDemandLastMonth = 0
        // let maxDemandThisMonth = 0
        // let maxDemandYesterday = 0
        // let maxDemandToday = 0

        let group = await db.group.findOne({
            where: { showDashboard: true }
        })

        var eData
        let all = true
        var snmKey = []
        let prevEnergy = {}
        let prevTime = {}
        let maxDemandLastMonth = {}
        let maxDemandThisMonth = {}
        let maxDemandYesterday = {}
        let maxDemandToday = {}

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
                            [Op.lte]: tTomorrow
                        }
                    }
                },
                order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
            })
        } else {
            eData = await db.energy.findAll({
                where: {
                    DateTimeUpdate: {
                        [Op.and]: {
                            [Op.gte]: tLastMonth,
                            [Op.lte]: tTomorrow
                        }
                    },
                    snmKey: snmKey
                },
                order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
            })
        }

        for (let e of eData) {
            let sn = e.SerialNo
            let period = blacknode[sn].period * 60 * 1000

            if (!prevTime[e.snmKey] || e.DateTimeUpdate.getTime() - prevTime[e.snmKey].getTime() != period) {
                prevEnergy[e.snmKey] = e.TotalkWh
                prevTime[e.snmKey] = e.DateTimeUpdate
                continue
            }

            let adjustedTime = new Date(Date.UTC(e.DateTimeUpdate.getUTCFullYear(), e.DateTimeUpdate.getUTCMonth(), e.DateTimeUpdate.getUTCDate(), e.DateTimeUpdate.getUTCHours(), e.DateTimeUpdate.getUTCMinutes()))
            adjustedTime.setUTCMinutes(adjustedTime.getUTCMinutes() - 1)
            let tKey = adjustedTime.getUTCFullYear() + '-' + adjustedTime.getUTCMonth() + '-' + adjustedTime.getUTCDate() + '-' + adjustedTime.getUTCHours() + '-' + adjustedTime.getUTCMinutes()


            let absEnergy = e.TotalkWh - prevEnergy[e.snmKey]

            if (absEnergy == -1) {
                absEnergy = 0
            }

            prevEnergy[e.snmKey] = e.TotalkWh

            if (e.DateTimeUpdate >= tLastMonth && e.DateTimeUpdate <= tThisMonth) {
                // Last month
                if(prevTime[e.snmKey] >= tLastMonth && prevTime[e.snmKey] <= tThisMonth)
                {
                    energyLastMonth += absEnergy

                    if (isOnPeak(e.DateTimeUpdate)) {
                        if(!(tKey in maxDemandLastMonth))
                        {
                            maxDemandLastMonth[tKey] = {}
                        }

                        maxDemandLastMonth[tKey][e.snmKey] = absEnergy * DEMAND
                    }
                }
                
            } else {
                // This month
                if(prevTime[e.snmKey] >= tThisMonth && prevTime[e.snmKey] <= tTomorrow)
                {
                    energyThisMonth += absEnergy

                    if(absEnergy > 10000)
                    {
                        console.log(absEnergy, e.DateTimeUpdate)
                    }
                    

                    if (isOnPeak(e.DateTimeUpdate)) {
                        if(!(tKey in maxDemandThisMonth))
                        {
                            maxDemandThisMonth[tKey] = {}
                        }

                        maxDemandThisMonth[tKey][e.snmKey] = absEnergy * DEMAND
                    }

                    if (e.DateTimeUpdate >= tYesterday && e.DateTimeUpdate <= tToday) {
                        // Yesterday
                        if(prevTime[e.snmKey] >= tYesterday && prevTime[e.snmKey] <= tTomorrow)
                        {
                            energyYesterday += absEnergy

                            if (isOnPeak(e.DateTimeUpdate)) {
                                if(!(tKey in maxDemandYesterday))
                                {
                                    maxDemandYesterday[tKey] = {}
                                }

                                maxDemandYesterday[tKey][e.snmKey] = absEnergy * DEMAND
                            }
                        }
                        
                    } else if (e.DateTimeUpdate >= tToday && prevTime[e.snmKey] <= tTomorrow) {
                        energyToday += absEnergy

                        if (isOnPeak(e.DateTimeUpdate)) {
                            if(!(tKey in maxDemandToday))
                            {
                                maxDemandToday[tKey] = {}
                            }

                            maxDemandToday[tKey][e.snmKey] = absEnergy * DEMAND
                        }
                    }
                }
                
            }

            prevTime[e.snmKey] = e.DateTimeUpdate
        }

        

        let todayKeys = Object.keys(maxDemandToday)
        let yesterdayKeys = Object.keys(maxDemandYesterday)
        let thisMonthKeys = Object.keys(maxDemandThisMonth)
        let lastMonthKeys = Object.keys(maxDemandLastMonth)

        let sumMaxDemandToday = 0
        let sumMaxDemandYesterday = 0
        let sumMaxDemandThisMonth = 0
        let sumMaxDemandLastMonth = 0
        
        for(let k of todayKeys)
        {
            let tmpSum = 0

            for(let snm of snmKey)
            {
                tmpSum += maxDemandToday[k][snm]
            }

            if(tmpSum > sumMaxDemandToday)
            {
                sumMaxDemandToday = tmpSum
            }
        }

        for(let k of yesterdayKeys)
        {
            let tmpSum = 0

            for(let snm of snmKey)
            {
                tmpSum += maxDemandYesterday[k][snm]
            }

            if(tmpSum > sumMaxDemandYesterday)
            {
                sumMaxDemandYesterday = tmpSum
            }
        }

        for(let k of thisMonthKeys)
        {
            let tmpSum = 0

            for(let snm of snmKey)
            {
                tmpSum += maxDemandThisMonth[k][snm]
            }

            if(tmpSum > sumMaxDemandThisMonth)
            {
                sumMaxDemandThisMonth = tmpSum
            }
        }

        for(let k of lastMonthKeys)
            {
                let tmpSum = 0
    
                for(let snm of snmKey)
                {
                    tmpSum += maxDemandLastMonth[k][snm]
                }
    
                if(tmpSum > sumMaxDemandLastMonth)
                {
                    sumMaxDemandLastMonth = tmpSum
                }
            }

        ret = {
            t_last_month: energyLastMonth,
            t_this_month: energyThisMonth,
            t_yesterday: energyYesterday,
            t_today: energyToday,
            b_last_month: sumMaxDemandLastMonth,
            b_this_month: sumMaxDemandThisMonth,
            b_yesterday: sumMaxDemandYesterday,
            b_today: sumMaxDemandToday
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
        let day = parseInt(req.params.day)

        let startTime = new Date(Date.UTC(year, month, day, 0, 0, 0))
        let endTime = new Date(Date.UTC(year, month, day + 1, 0, 0, 0))

        let group = await db.group.findOne({
            where: { showDashboard: true }
        })

        var eData
        let all = true
        var snmKey = []
        let prevEnergy = {}
        let prevTime = {}

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
                            [Op.lte]: endTime
                        }
                    }
                },
                order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
            })
        } else {
            eData = await db.energy.findAll({
                where: {
                    DateTimeUpdate: {
                        [Op.and]: {
                            [Op.gte]: startTime,
                            [Op.lte]: endTime
                        }
                    },
                    snmKey: snmKey
                },
                order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
            })
        }

        for (let e of eData) {
            let sn = e.SerialNo
            let period = blacknode[sn].period * 60 * 1000

            if (!prevTime[e.snmKey] || e.DateTimeUpdate.getTime() - prevTime[e.snmKey].getTime() != period) {
                prevTime[e.snmKey] = e.DateTimeUpdate
                prevEnergy[e.snmKey] = e.TotalkWh
                continue
            }

            let absEnergy = e.TotalkWh - prevEnergy[e.snmKey]

            if (absEnergy == -1) {
                absEnergy = 0
            }

            prevEnergy[e.snmKey] = e.TotalkWh

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
        let endTime = new Date(Date.UTC(year, month + 1, 0, 0, 0, 0))

        let group = await db.group.findOne({
            where: { showDashboard: true }
        })

        var eData
        let all = true
        var snmKey = []
        let prevEnergy = {}
        let prevTime = {}

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
                            [Op.lte]: endTime
                        }
                    }
                },
                order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
            })
        } else {
            eData = await db.energy.findAll({
                where: {
                    DateTimeUpdate: {
                        [Op.and]: {
                            [Op.gte]: startTime,
                            [Op.lte]: endTime
                        }
                    },
                    snmKey: snmKey
                },
                order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
            })
        }

        for (let e of eData) {
            let sn = e.SerialNo
            let period = blacknode[sn].period * 60 * 1000

            if (!prevTime[e.snmKey] || e.DateTimeUpdate.getTime() - prevTime[e.snmKey].getTime() != period) {
                prevTime[e.snmKey] = e.DateTimeUpdate
                prevEnergy[e.snmKey] = e.TotalkWh
                continue
            }

            let absEnergy = e.TotalkWh - prevEnergy[e.snmKey]

            if (absEnergy == -1) {
                absEnergy = 0
            }

            prevEnergy[e.snmKey] = e.TotalkWh

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

        let group = await db.group.findOne({
            where: { showDashboard: true }
        })

        var eData
        let all = true
        var snmKey = []
        let prevEnergy = {}
        let prevTime = {}

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
                            [Op.lte]: endTime
                        }
                    }
                },
                order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
            })
        } else {
            eData = await db.energy.findAll({
                where: {
                    DateTimeUpdate: {
                        [Op.and]: {
                            [Op.gte]: startTime,
                            [Op.lte]: endTime
                        }
                    },
                    snmKey: snmKey
                },
                order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
            })
        }

        for (let e of eData) {
            let sn = e.SerialNo
            let period = blacknode[sn].period * 60 * 1000

            if (!prevTime[e.snmKey] || e.DateTimeUpdate.getTime() - prevTime[e.snmKey].getTime() != period) {
                prevTime[e.snmKey] = e.DateTimeUpdate
                prevEnergy[e.snmKey] = e.TotalkWh
                continue
            }

            let absEnergy = e.TotalkWh - prevEnergy[e.snmKey]

            if (absEnergy == -1) {
                absEnergy = 0
            }

            prevEnergy[e.snmKey] = e.TotalkWh

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

        // calculate value and return
        let now = new Date()

        for (let i = 0; i < 24; i++) {
            ret[i] = {
                category: String(i + 1),
                value1: 0
            }
        }

        let startTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()))
        let endTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

        let group = await db.group.findOne({
            where: { showDashboard: true }
        })

        var eData
        let all = true
        var snmKey = []
        let prevEnergy = {}
        let prevTime = {}

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
                            [Op.lte]: endTime
                        }
                    }
                },
                order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
            })
        } else {
            eData = await db.energy.findAll({
                where: {
                    DateTimeUpdate: {
                        [Op.and]: {
                            [Op.gte]: startTime,
                            [Op.lte]: endTime
                        }
                    },
                    snmKey: snmKey
                },
                order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
            })
        }

        for (let e of eData) {
            let sn = e.SerialNo
            let period = blacknode[sn].period * 60 * 1000

            if (!prevTime[e.snmKey] || e.DateTimeUpdate.getTime() - prevTime[e.snmKey].getTime() != period) {
                prevTime[e.snmKey] = e.DateTimeUpdate
                prevEnergy[e.snmKey] = e.TotalkWh
                continue
            }

            let absEnergy = e.TotalkWh - prevEnergy[e.snmKey]

            if (absEnergy == -1) {
                absEnergy = 0
            }

            prevEnergy[e.snmKey] = e.TotalkWh

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

    api.get('/meter_data_table', (req, res) => {
        let ret = []

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
                        now.getTime() - lastUpdateData[k].DateTimeUpdate.getTime() < 60 * 1000
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
            let u = await db.user.create({
                name: req.body.name,
                username: req.body.username,
                email: req.body.email,
                password: await bcrypt.hash(req.body.password, 3),
                DateTime: new Date(),
                status: req.body.status
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
                        attributes: ['DateTimeUpdate', 'TotalkWh', param],
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
                        attributes: ['DateTimeUpdate', param],
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
                                if(e['TotalkWh'])
                                {
                                    dval = (e['TotalkWh'] - prev_dval) * DEMAND
                                }
                                else
                                {
                                    console.log('Error: cannot calculate demand')
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
                        dval = e[param]
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

                    prev_dval = dval
                    prev_time = e.DateTimeUpdate
                }


                for(let i=0; i<arr_size; i++)
                {
                    if(count[i] > 0)
                    {
                        ret[k][i].value /= count[i];
                    }
                }

                // ret[k].length = ret[k].length - 1
            }
            else if(arr[0] == 'G')
            {
                arr = arr[1].split("%");

                let gid = parseInt(arr[0]);

                let param = arr[1];

                ret[k] = [];
                let dxt = {};
                let count = []

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

                    let eData;

                    if(param == 'kWdemand')
                    {
                        eData = await db.energy.findAll({
                            attributes: ['DateTimeUpdate', 'TotalkWh',  param],
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
                            attributes: ['DateTimeUpdate', param],
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
                                    if(e['TotalkWh'])
                                    {
                                        dval = (e['TotalkWh'] - prev_dval) * DEMAND
                                    }
                                    else
                                    {
                                        console.log('Error: cannot calculate demand')
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
                            dval = e[param]
                        }

                        dxt[tkey] += dval

                        prev_dval = dval
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

                    let seq;

                    if(req.params.type == 'year')
                    {
                        seq = tt.getUTCMonth();
                                                
                    }
                    else if(req.params.type == 'month')
                    {
                        seq = tt.getUTCDate()-1;
                                                
                    }
                    else
                    {
                        seq = Math.trunc(tt.getTime()/1000/60/15) - start_seq;
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
                
                for(let i=0; i<arr_size; i++)
                {
                    if(count[i] > 0)
                    {
                        ret[k][i].value /= count[i];
                    }
                }

                // ret[k].length = ret[k].length - 1;
            }
        }

        res.json(ret)
    })

    api_server = api.listen(8888, () => {
        console.log('API Server is running at 8888.')
    })
}
