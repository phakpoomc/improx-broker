import express from 'express';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import { Op } from 'sequelize';
import { lastUpdateData, lastUpdateTime, blacknode, db, paths, writeFile, loadBNInfoFromLocal, loadDBCFG, group, loadGroup } from './global.js';
import { createReadStream } from 'fs';
import { syncDB } from './db.js';

export var api_server;

var MOCK = false;

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
    },
];

function isOnPeak(dt)
{
    let dayinweek = dt.getDay();

    // Saturday or Sunday
    if(dayinweek == 0 || dayinweek == 6)
    {
        return false;
    }

    // Mon - Fri
    let hours = dt.getHours();

    if(hours < 9 || hours >= 22)
    {
        return false;
    }

    // In case of holidays...

    return true;
}

export function initAPI()
{
    const api = express();
    api.use(cors());
    api.use(express.json());
    api.use(express.urlencoded({extended: true}));
    api.use(fileUpload());

    api.get('/dashboard_card', async (req, res) => {
        let ret = {};

        if(MOCK)
        {
            ret = {
                't_last_month': Math.floor(Math.random() * 1000), 
                't_this_month': Math.floor(Math.random() * 1000), 
                't_yesterday': Math.floor(Math.random() * 1000), 
                't_today': Math.floor(Math.random() * 1000), 
                'b_last_month': Math.floor(Math.random() * 1000), 
                'b_this_month': Math.floor(Math.random() * 1000), 
                'b_yesterday': Math.floor(Math.random() * 1000), 
                'b_today': Math.floor(Math.random() * 1000), 
            };
        }
        else
        {
            // calculate value and return
            let now = new Date();
            let tLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            let tThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            let tYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            let tToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            let energyLastMonth = 0;
            let energyThisMonth = 0;
            let energyYesterday = 0;
            let energyToday = 0;

            let maxDemandLastMonth = 0;
            let maxDemandThisMonth = 0;
            let maxDemandYesterday = 0;
            let maxDemandToday = 0;

            let group = await db.group.findOne({
                where: {showDashboard: true}
            });

            var eData;
            let all = true;
            var snmKey = [];


            if(group !== null)
            {
                let members = await db.gmember.findAll({
                    where: {GroupID: group.id}
                });

                if(members !== null)
                {
                    for(let m of members)
                    {
                        let key = m.SiteID + '-' + m.NodeID + '-' + String(m.ModbusID);

                        snmKey.push(key);
                    }

                    all = false;
                }
            }

            if(all)
            {
                eData = await db.energy.findAll({
                    where: {
                        DateTimeUpdate: {
                            [Op.and]: {
                                [Op.gte]: tLastMonth,
                                [Op.lt]: now
                            }
                        }
                    },
                    order: [
                        ['DateTimeUpdate', 'ASC']
                    ]
                });
            }
            else
            {
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
                    order: [
                        ['DateTimeUpdate', 'ASC']
                    ]
                });
            }

            let prevEnergy = 0;

            for(let e of eData)
            {
                if(prevEnergy == 0)
                {
                    prevEnergy = e.TotalkWh;
                    continue;
                }

                let absEnergy = e.TotalkWh - prevEnergy;
                prevEnergy = e.TotalkWh;

                if(e.DateTimeUpdate >= tLastMonth && e.DateTimeUpdate < tThisMonth)
                {
                    // Last month
                    energyLastMonth += absEnergy;

                    if(isOnPeak(e.DateTimeUpdate) && absEnergy*4 > maxDemandLastMonth)
                    {
                        maxDemandLastMonth = absEnergy*4;
                    }
                }
                else
                {
                    // This month
                    energyThisMonth += absEnergy;

                    if(isOnPeak(e.DateTimeUpdate) && absEnergy*4 > maxDemandThisMonth)
                    {
                        maxDemandThisMonth = absEnergy*4;
                    }

                    if(e.DateTimeUpdate >= tYesterday && e.DateTimeUpdate < tToday)
                    {
                        // Yesterday
                        energyYesterday += absEnergy;

                        if(isOnPeak(e.DateTimeUpdate) && absEnergy*4 > maxDemandYesterday)
                        {
                            maxDemandYesterday = absEnergy*4;
                        }
                    }
                    else if(e.DateTimeUpdate >= tToday)
                    {
                        energyToday += absEnergy;

                        if(isOnPeak(e.DateTimeUpdate) && absEnergy*4 > maxDemandToday)
                        {
                            maxDemandToday = absEnergy*4;
                        }
                    }
                }
            }

            ret = {
                't_last_month': energyLastMonth, 
                't_this_month': energyThisMonth, 
                't_yesterday': energyYesterday, 
                't_today': energyToday, 
                'b_last_month': maxDemandLastMonth, 
                'b_this_month': maxDemandThisMonth, 
                'b_yesterday': maxDemandYesterday, 
                'b_today': maxDemandToday, 
            };
        }

        res.json(ret);
    });

    api.get('/dashboard/:year/:month/:day', async (req, res) => {
        let ret = [];

        if(MOCK)
        {
            for(let i=0; i<24; i++)
            {
                ret[i] = {
                            'category': String(i), 
                            'value1': Math.random() * 1000
                        };
            }
        }
        else
        {
            // calculate value and return
            for(let i=0; i<24; i++)
            {
                ret[i] = {
                            'category': String(i), 
                            'value1': 0
                        };
            }

            let year = req.params.year;
            let month = parseInt(req.params.month) - 1;
            let day = req.params.day;

            let startTime = new Date(year, month, day);
            let endTime = new Date(year, month, day, 23, 59, 59);

            let group = await db.group.findOne({
                where: {showDashboard: true}
            });

            var eData;
            let all = true;
            var snmKey = [];


            if(group !== null)
            {
                let members = await db.gmember.findAll({
                    where: {GroupID: group.id}
                });

                if(members !== null)
                {
                    for(let m of members)
                    {
                        let key = m.SiteID + '-' + m.NodeID + '-' + String(m.ModbusID);

                        snmKey.push(key);
                    }

                    all = false;
                }
            }

            if(all)
            {
                eData = await db.energy.findAll({
                    where: {
                        DateTimeUpdate: {
                            [Op.and]: {
                                [Op.gte]: startTime,
                                [Op.lt]: endTime
                            }
                        }
                    },
                    order: [
                        ['DateTimeUpdate', 'ASC']
                    ]
                });
            }
            else
            {
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
                    order: [
                        ['DateTimeUpdate', 'ASC']
                    ]
                });
            }

            let prevEnergy = 0;

            for(let e of eData)
            {
                if(prevEnergy == 0)
                {
                    prevEnergy = e.TotalkWh;
                    continue;
                }

                let absEnergy = e.TotalkWh - prevEnergy;
                prevEnergy = e.TotalkWh;

                let adjustedTime = new Date(e.DateTimeUpdate);
                adjustedTime.setMinutes(adjustedTime.getMinutes() - 1);

                let hour = adjustedTime.getHours();

                ret[hour].value1 += absEnergy;
            }
        }

        res.json(ret);
    });

    api.get('/dashboard/:year/:month', async (req, res) => {
        let ret = [];

        let year = req.params.year;
        let month = parseInt(req.params.month) - 1;

        let d = new Date(year, month+1, 0);
        let totalDays = d.getDate();

        if(MOCK)
        {
            for(let i=0; i<totalDays; i++)
            {
                ret[i] = {
                            'category': String(i+1), 
                            'value1': Math.random() * 1000
                        };
            }
        }
        else
        {
            // calculate value and return
            for(let i=0; i<totalDays; i++)
            {
                ret[i] = {
                            'category': String(i+1), 
                            'value1': 0
                        };
            }

            let startTime = new Date(year, month, 1);
            let endTime = new Date(year, month, totalDays, 23, 59, 59);

            let group = await db.group.findOne({
                where: {showDashboard: true}
            });

            var eData;
            let all = true;
            var snmKey = [];


            if(group !== null)
            {
                let members = await db.gmember.findAll({
                    where: {GroupID: group.id}
                });

                if(members !== null)
                {
                    for(let m of members)
                    {
                        let key = m.SiteID + '-' + m.NodeID + '-' + String(m.ModbusID);

                        snmKey.push(key);
                    }

                    all = false;
                }
            }

            if(all)
            {
                eData = await db.energy.findAll({
                    where: {
                        DateTimeUpdate: {
                            [Op.and]: {
                                [Op.gte]: startTime,
                                [Op.lt]: endTime
                            }
                        }
                    },
                    order: [
                        ['DateTimeUpdate', 'ASC']
                    ]
                });
            }
            else
            {
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
                    order: [
                        ['DateTimeUpdate', 'ASC']
                    ]
                });
            }

            let prevEnergy = 0;

            for(let e of eData)
            {
                if(prevEnergy == 0)
                {
                    prevEnergy = e.TotalkWh;
                    continue;
                }

                let absEnergy = e.TotalkWh - prevEnergy;
                prevEnergy = e.TotalkWh;

                let adjustedTime = new Date(e.DateTimeUpdate);
                adjustedTime.setMinutes(adjustedTime.getMinutes() - 1);

                let day = adjustedTime.getDate()-1;
                ret[day].value1 += absEnergy;
            }
        }

        res.json(ret);
    });

    api.get('/dashboard/:year', async (req, res) => {
        let ret = [];

        let year = req.params.year;

        if(MOCK)
        {
            for(let i=0; i<12; i++)
            {
                ret[i] = {
                            'category': String(i+1), 
                            'value1': Math.random() * 1000
                        };
            }
        }
        else
        {
            // calculate value and return
            for(let i=0; i<12; i++)
            {
                ret[i] = {
                            'category': String(i+1), 
                            'value1': 0
                        };
            }
            
            let startTime = new Date(year, 0, 1);
            let endTime = new Date(year, 11, 31, 59, 59, 59);

            let group = await db.group.findOne({
                where: {showDashboard: true}
            });

            var eData;
            let all = true;
            var snmKey = [];


            if(group !== null)
            {
                let members = await db.gmember.findAll({
                    where: {GroupID: group.id}
                });

                if(members !== null)
                {
                    for(let m of members)
                    {
                        let key = m.SiteID + '-' + m.NodeID + '-' + String(m.ModbusID);

                        snmKey.push(key);
                    }

                    all = false;
                }
            }

            if(all)
            {
                eData = await db.energy.findAll({
                    where: {
                        DateTimeUpdate: {
                            [Op.and]: {
                                [Op.gte]: startTime,
                                [Op.lt]: endTime
                            }
                        }
                    },
                    order: [
                        ['DateTimeUpdate', 'ASC']
                    ]
                });
            }
            else
            {
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
                    order: [
                        ['DateTimeUpdate', 'ASC']
                    ]
                });
            }

            let prevEnergy = 0;

            for(let e of eData)
            {
                if(prevEnergy == 0)
                {
                    prevEnergy = e.TotalkWh;
                    continue;
                }

                let absEnergy = e.TotalkWh - prevEnergy;
                prevEnergy = e.TotalkWh;

                let adjustedTime = new Date(e.DateTimeUpdate);
                adjustedTime.setMinutes(adjustedTime.getMinutes() - 1);

                let month = adjustedTime.getMonth();
                ret[month].value1 += absEnergy;
            }
        }
        

        res.json(ret);
    });

    api.get('/dashboard', async (req, res) => {
        let ret = [];

        if(MOCK)
        {
            for(let i=0; i<24; i++)
            {
                ret[i] = {
                            'category': String(i+1), 
                            'value1': Math.random() * 1000
                        };
            }
        }
        else
        {
            // calculate value and return
            let now = new Date();

            for(let i=0; i<24; i++)
            {
                ret[i] = {
                            'category': String(i+1), 
                            'value1': 0
                        };
            }
    
            let startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            let endTime = new Date(year, month, day, 0, 0, 0);

            let group = await db.group.findOne({
                where: {showDashboard: true}
            });

            var eData;
            let all = true;
            var snmKey = [];


            if(group !== null)
            {
                let members = await db.gmember.findAll({
                    where: {GroupID: group.id}
                });

                if(members !== null)
                {
                    for(let m of members)
                    {
                        let key = m.SiteID + '-' + m.NodeID + '-' + String(m.ModbusID);

                        snmKey.push(key);
                    }

                    all = false;
                }
            }

            if(all)
            {
                eData = await db.energy.findAll({
                    where: {
                        DateTimeUpdate: {
                            [Op.and]: {
                                [Op.gte]: startTime,
                                [Op.lt]: endTime
                            }
                        }
                    },
                    order: [
                        ['DateTimeUpdate', 'ASC']
                    ]
                });
            }
            else
            {
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
                    order: [
                        ['DateTimeUpdate', 'ASC']
                    ]
                });
            }

            let prevEnergy = 0;

            for(let e of eData)
            {
                if(prevEnergy == 0)
                {
                    prevEnergy = e.TotalkWh;
                    continue;
                }

                let absEnergy = e.TotalkWh - prevEnergy;
                prevEnergy = e.TotalkWh;

                let adjustedTime = new Date(e.DateTimeUpdate);
                adjustedTime.setMinutes(adjustedTime.getMinutes() - 1);

                let hour = adjustedTime.getHours()-1;
                ret[hour].value1 += absEnergy;
            }
        }
        

        res.json(ret);
    });

    /* Monitoring API */
    api.get('/group_meter_info', async (req, res) => {
        let ret = {
            group: [],
            meter: []
        }

        let initGroup = [];
        let groups = {};

        let groupInfo = await db.gmember.findAll();

        if(groupInfo !== null)
        {
            for(let g of groupInfo)
            {
                if(!(g.GroupID in initGroup))
                {
                    groups[g.GroupID] = {
                        id: g.GroupID,
                        name: group[g.GroupID].name,
                        parameter: [],
                        member: []
                    };

                    for(let i=0; i<pmap.length; i++)
                    {
                        groups[g.GroupID].parameter.push(
                            {
                                name: pmap[i].name + ' ' + pmap[i].unit,
                                display: group[g.GroupID].name + ' - ' + pmap[i].name + ' ' + pmap[i].unit,
                                selectedSeries: 'G_' + String(g.GroupID) + '-' + pmap[i].name
                            }
                        );
                    }
                }
                
                groups[g.GroupID].member.push({
                    name: blacknode[g.SerialNo].name,
                    SerialNo: g.SerialNo
                });
            }
        }

        let gKey = Object.keys(groups);

        for(let k of gKey)
        {
            ret.group.push(groups[k]);
        }

        let bnKey = Object.keys(blacknode);

        for(let sn of bnKey)
        {
            for(let i=0; i<blacknode[sn].meter_list.length; i++)
            {
                let obj = {
                    name: blacknode[sn].meter_list[i].name,
                    SerialNo: blacknode[sn].serial,
                    SiteID: blacknode[sn].siteid,
                    NodeID: blacknode[sn].nodeid,
                    ModbusID: i,
                    parameter: []
                };

                for(let j=0; j<pmap.length; j++)
                {
                    obj.parameter.push({
                        name: pmap[j].name + ' ' + pmap[j].unit,
                        display: blacknode[sn].meter_list[i].name + ' - ' + pmap[j].name + ' ' + pmap[j].unit,
                        selectedSeries: 'M_' + sn + '_' + blacknode[sn].siteid + '_' + blacknode[sn].nodeid + '_' + String(i) + '-' + pmap[j].name
                    });
                }

                ret.meter.push(obj);
            }
        }

        // let ret = {
        //     'group': [
        //         {
        //             'id': 1,
        //             'name': 'GroupA',
        //             'parameter': [
        //                 {
        //                     'name': 'V1',
        //                     'display': 'Group A - V1 (volt)',
        //                     'selectedSeries': 'G_1-V1'
        //                 },
        //                 {
        //                     'name': 'V2',
        //                     'display': 'Group A - V2 (volt)',
        //                     'selectedSeries': 'G_1-V2'
        //                 },
        //                 {
        //                     'name': 'V3',
        //                     'display': 'Group A - V3 (volt)',
        //                     'selectedSeries': 'G_1-V3'
        //                 },
        //             ],
        //             'member': [
        //                 {
        //                     'name': 'Office-1',
        //                     'SerialNo': 'BN1'
        //                 },
        //                 {
        //                     'name': 'Office-2',
        //                     'SerialNo': 'BN2'
        //                 }
        //             ]
        //         },
        //         {
        //             'id': 2,
        //             'name': 'GroupB',
        //             'parameter': [
        //                 {
        //                     'name': 'I1',
        //                     'display': 'Group B - I1 (Ampere)',
        //                     'selectedSeries': 'G_2-I1'
        //                 },
        //                 {
        //                     'name': 'I2',
        //                     'display': 'Group B - I2 (Ampere)',
        //                     'selectedSeries': 'G_2-I2'
        //                 },
        //                 {
        //                     'name': 'I3',
        //                     'display': 'Group B - I3 (Ampere)',
        //                     'selectedSeries': 'G_2-I3'
        //                 },
        //             ],
        //             'member': [
        //                 {
        //                     'name': 'Plant-1',
        //                     'SerialNo': 'BN3'
        //                 },
        //                 {
        //                     'name': 'Plant-2',
        //                     'SerialNo': 'BN4'
        //                 },
        //                 {
        //                     'name': 'Plant-3',
        //                     'SerialNo': 'BN5'
        //                 }
        //             ]
        //         }
        //     ],
        //     'meter': [
        //         {
        //             'name': 'Office-1',
        //             'SerialNo': 'BN1',
        //             'SiteID': 'SCG',
        //             'NodeID': 'Office',
        //             'ModbusID': 1,
        //             'parameter': [
        //                 {
        //                     'name': 'V1',
        //                     'display': 'Office-1 - V1 (Volt)',
        //                     'selectedSeries': 'M_BN1_SCG_Office_1-V1'
        //                 },
        //                 {
        //                     'name': 'V2',
        //                     'display': 'Office-1 - V2 (Volt)',
        //                     'selectedSeries': 'M_BN1_SCG_Office_1-V2'
        //                 },
        //                 {
        //                     'name': 'V3',
        //                     'display': 'Office-1 - V3 (Volt)',
        //                     'selectedSeries': 'M_BN1_SCG_Office_1-V3'
        //                 },
        //                 {
        //                     'name': 'I1',
        //                     'display': 'Office-1 - I1 (Ampere)',
        //                     'selectedSeries': 'M_BN1_SCG_Office_1-I1'
        //                 },
        //                 {
        //                     'name': 'I2',
        //                     'display': 'Office-1 - I2 (Ampere)',
        //                     'selectedSeries': 'M_BN1_SCG_Office_1-I2'
        //                 },
        //                 {
        //                     'name': 'I3',
        //                     'display': 'Office-1 - I3 (Ampere)',
        //                     'selectedSeries': 'M_BN1_SCG_Office_1-I3'
        //                 }
        //             ]
        //         },
        //         {
        //             'name': 'Office-2',
        //             'SerialNo': 'BN2',
        //             'SiteID': 'SCG',
        //             'NodeID': 'Office',
        //             'ModbusID': 2,
        //             'parameter': [
        //                 {
        //                     'name': 'V1',
        //                     'display': 'Office-2 - V1 (Volt)',
        //                     'selectedSeries': 'M_BN2_SCG_Office_2-V1'
        //                 },
        //                 {
        //                     'name': 'V2',
        //                     'display': 'Office-2 - V2 (Volt)',
        //                     'selectedSeries': 'M_BN2_SCG_Office_2-V2'
        //                 },
        //                 {
        //                     'name': 'V3',
        //                     'display': 'Office-2 - V3 (Volt)',
        //                     'selectedSeries': 'M_BN2_SCG_Office_2-V3'
        //                 },
        //                 {
        //                     'name': 'I1',
        //                     'display': 'Office-2 - I1 (Ampere)',
        //                     'selectedSeries': 'M_BN2_SCG_Office_2-I1'
        //                 },
        //                 {
        //                     'name': 'I2',
        //                     'display': 'Office-2 - I2 (Ampere)',
        //                     'selectedSeries': 'M_BN2_SCG_Office_2-I2'
        //                 },
        //                 {
        //                     'name': 'I3',
        //                     'display': 'Office-2 - I3 (Ampere)',
        //                     'selectedSeries': 'M_BN2_SCG_Office_2-I3'
        //                 }
        //             ]
        //         },
        //         {
        //             'name': 'Plant-1',
        //             'SerialNo': 'BN3',
        //             'SiteID': 'SCG',
        //             'NodeID': 'Plant',
        //             'ModbusID': 1,
        //             'parameter': [
        //                 {
        //                     'name': 'V1',
        //                     'display': 'Plant-1 - V1 (Volt)',
        //                     'selectedSeries': 'M_BN3_SCG_Plant_1-V1'
        //                 },
        //                 {
        //                     'name': 'V2',
        //                     'display': 'Plant-1 - V2 (Volt)',
        //                     'selectedSeries': 'M_BN3_SCG_Plant_1-V2'
        //                 },
        //                 {
        //                     'name': 'V3',
        //                     'display': 'Plant-1 - V3 (Volt)',
        //                     'selectedSeries': 'M_BN3_SCG_Plant_1-V3'
        //                 },
        //                 {
        //                     'name': 'I1',
        //                     'display': 'Plant-1 - I1 (Ampere)',
        //                     'selectedSeries': 'M_BN3_SCG_Plant_1-I1'
        //                 },
        //                 {
        //                     'name': 'I2',
        //                     'display': 'Plant-1 - I2 (Ampere)',
        //                     'selectedSeries': 'M_BN3_SCG_Plant_1-I2'
        //                 },
        //                 {
        //                     'name': 'I3',
        //                     'display': 'Plant-1 - I3 (Ampere)',
        //                     'selectedSeries': 'M_BN3_SCG_Plant_1-I3'
        //                 }
        //             ]
        //         },
        //         {
        //             'name': 'Plant-2',
        //             'SerialNo': 'BN4',
        //             'SiteID': 'SCG',
        //             'NodeID': 'Plant',
        //             'ModbusID': 2,
        //             'parameter': [
        //                 {
        //                     'name': 'V1',
        //                     'display': 'Plant-2 - V1 (Volt)',
        //                     'selectedSeries': 'M_BN4_SCG_Plant_2-V1'
        //                 },
        //                 {
        //                     'name': 'V2',
        //                     'display': 'Plant-2 - V2 (Volt)',
        //                     'selectedSeries': 'M_BN4_SCG_Plant_2-V2'
        //                 },
        //                 {
        //                     'name': 'V3',
        //                     'display': 'Plant-2 - V3 (Volt)',
        //                     'selectedSeries': 'M_BN4_SCG_Plant_2-V3'
        //                 },
        //                 {
        //                     'name': 'I1',
        //                     'display': 'Plant-2 - I1 (Ampere)',
        //                     'selectedSeries': 'M_BN4_SCG_Plant_2-I1'
        //                 },
        //                 {
        //                     'name': 'I2',
        //                     'display': 'Plant-2 - I2 (Ampere)',
        //                     'selectedSeries': 'M_BN4_SCG_Plant_2-I2'
        //                 },
        //                 {
        //                     'name': 'I3',
        //                     'display': 'Plant-2 - I3 (Ampere)',
        //                     'selectedSeries': 'M_BN4_SCG_Plant_2-I3'
        //                 }
        //             ]
        //         },
        //         {
        //             'name': 'Plant-3',
        //             'SerialNo': 'BN5',
        //             'SiteID': 'SCG',
        //             'NodeID': 'Plant',
        //             'ModbusID': 3,
        //             'parameter': [
        //                 {
        //                     'name': 'V1',
        //                     'display': 'Plant-3 - V1 (Volt)',
        //                     'selectedSeries': 'M_BN5_SCG_Plant_3-V1'
        //                 },
        //                 {
        //                     'name': 'V2',
        //                     'display': 'Plant-3 - V2 (Volt)',
        //                     'selectedSeries': 'M_BN5_SCG_Plant_3-V2'
        //                 },
        //                 {
        //                     'name': 'V3',
        //                     'display': 'Plant-3 - V3 (Volt)',
        //                     'selectedSeries': 'M_BN5_SCG_Plant_3-V3'
        //                 },
        //                 {
        //                     'name': 'I1',
        //                     'display': 'Plant-3 - I1 (Ampere)',
        //                     'selectedSeries': 'M_BN5_SCG_Plant_3-I1'
        //                 },
        //                 {
        //                     'name': 'I2',
        //                     'display': 'Plant-3 - I2 (Ampere)',
        //                     'selectedSeries': 'M_BN5_SCG_Plant_3-I2'
        //                 },
        //                 {
        //                     'name': 'I3',
        //                     'display': 'Plant-3 - I3 (Ampere)',
        //                     'selectedSeries': 'M_BN5_SCG_Plant_3-I3'
        //                 }
        //             ]
        //         },
        //     ]
        // };

        res.json(ret);
    });

    api.post('/rt_chart', (req, res) => {
        let ret = {};

        let p = req.body;

        for(let k in p)
        {
            // Get data and fill
            ret[p[k]] = {
                time: new Date(),
                value: Math.random() * 50 - 25
            };
        }

        res.json(ret);
    });

    api.get('/rt_chart', (req, res) => {
        let ret = [
            { value: "MDB-1.Active power L1..L3 (kW)", actual: 7.3398, min: 6.6700, max: 7.4341 },
            { value: "MDB-1.Cos-phi L1..L3", actual: 8.3998, min: 8.6700, max: 9.4941 },
            { value: "MDB-1.Active power L1 (kW)", actual: 5.998, min: 6.6700, max: 7.4941 },
            { value: "MDB-1.Active power L2 (kW)", actual: 5.3298, min: 8.8500, max: 9.4241 },
            { value: "MDB-1.Active power L3 (kW)", actual: 9.3098, min: 8.6500, max: 5.4041 },
        ];

        // calculate value and return

        res.json(ret);
    });

    api.get('/meter_data_table', (req, res) => {
        let ret = [];

        if(MOCK)
        {
            let total_params = Math.floor(Math.random() * 20);

            for(let i=0; i<total_params; i++)
            {
                ret[i] = {};

                ret[i]['parameter'] = 'Parameters ' + String(i);
                ret[i]['mdb1'] = (Math.random() * 1000).toFixed(2); 
                ret[i]['mdb2'] = (Math.random() * 1000).toFixed(2); 
                ret[i]['mdb3'] = (Math.random() * 1000).toFixed(2); 
                ret[i]['chiller1'] = (Math.random() * 1000).toFixed(2); 
                ret[i]['chiller2'] = (Math.random() * 1000).toFixed(2); 
            }
        }
        else
        {
            
            let now = new Date();
            // let keys = Object.keys(lastUpdateData);
    
            // for(let i=0; i<40; i++)
            // {
            //     ret[i] = {};
    
            //     ret[i]['parameter'] = pmap[i];
                
            //     for(let k of keys)
            //     {
            //         // Do not show stale data
            //         if(now.getTime() - lastUpdateData[k].DateTimeUpdate.getTime() < 60*1000)
            //         {
            //             let modbusid = parseInt(lastUpdateData[k].ModbusID);
            //             let sn = lastUpdateData[k].SerialNo;

            //             ret[i][blacknode[sn].meter_list[modbusid].name] = lastUpdateData[k][pmap[i]];
            //         }
            //     }
            // }

            let sn = Object.keys(blacknode);

            for(let i=0; i<pmap.length; i++)
            {
                ret[i] = {};
                ret[i]['parameter'] = pmap[i].name + ' ' + pmap[i].unit;

                for(let s of sn)
                {
                    for(let j=0; j<blacknode[s].meter_list.length; j++)
                    {
                        let k = s + "-" + String(j);

                        if(lastUpdateData[k] && lastUpdateData[k].DateTimeUpdate && now.getTime() - lastUpdateData[k].DateTimeUpdate.getTime() < 60*1000)
                        {
                            ret[i][blacknode[s].meter_list[j].name] = lastUpdateData[k][pmap[i].name];
                        }
                        else
                        {
                            ret[i][blacknode[s].meter_list[j].name] = -1;
                        }
                    }
                }
            }
        }

        res.json(ret);
    });

    api.get('/node_monitor', (req, res) => {
        let ret = {};

        let status_list = ['on', 'off', 'error', 'setup'];
        let keys = Object.keys(blacknode);

        if(MOCK)
        {
            let total_nodes = Math.floor(Math.random() * 20);

            for(let i=0; i<total_nodes; i++)
            {
                let total_meters = Math.floor(Math.random() * 30);
                let node_name = 'Node ' + String(i);

                ret[node_name] = {
                    'id': i,
                    'location': 'Room ' + String(i),
                    'status': status_list[Math.floor(Math.random() * 3)],
                    'meter_list': []
                };

                for(let j=0; j<total_meters; j++)
                {
                    ret[node_name].meter_list[j] = {
                        'id': j,
                        'address': j*10,
                        'name': 'MDB-' + String(j),
                        'status': status_list[Math.floor(Math.random() * 3)]
                    }
                }
            }
        }
        else
        {
            // calculate value and return
            for(let k of keys)
            {
                let bn = blacknode[k];

                ret[bn.serial] = {
                    'id': 'Node ' + String(bn.nodeid),
                    'location': bn.name,
                    'status': bn.status,
                    'maxmeter': bn.maxmeter,
                    'meter_list': []
                };

                for(let i=0; i<bn.maxmeter; i++)
                {
                    ret[bn.serial].meter_list[i] = {
                        'id': i+1,
                        'address': bn.meter_list[i].id,
                        'name': bn.meter_list[i].name,
                        'status': bn.meter_list[i].status,
                    };
                }
            }
        }
        
        res.json(ret);
    });

    api.get('/meter_list', (req, res) => {
        let ret = {};
        let keys = Object.keys(blacknode);

        for(let k of keys)
        {
            for(let i=0; i<blacknode[k].meter_list.length; i++)
            {
                ret[k+'-'+String(i)] = {value: blacknode[k].meter_list[i].name + " (" + k + "-" + String(i + 1) + ")"};
            }
            
        }

        res.json(ret);
    });

    api.get('/phasor_graph/:m', (req, res) => {
        let arr = req.params.m.split("-");
        let sn = arr[0];
        let modbusid = parseInt(arr[1]) - 1;
        let snid = sn + "-" + String(modbusid);
        let now = new Date();

        let pf1 = 0;
        let pf2 = 0;
        let pf3 = 0;

        if(lastUpdateTime && lastUpdateTime[snid] && now.getTime() - lastUpdateTime[snid].getTime() < 60*1000)
        {
            pf1 = lastUpdateData[snid].PF1;
            pf2 = lastUpdateData[snid].PF2;
            pf3 = lastUpdateData[snid].PF3;
        }
        else
        {
            pf1 = 0;
            pf2 = 0;
            pf3 = 0;
        }

        let ret = {
            i1: 180/Math.PI*Math.acos(pf1),
            i2: 180/Math.PI*Math.acos(pf2) + 120,
            i3: 180/Math.PI*Math.acos(pf3) + 240
        };

        // calculate value and return

        res.json(ret);
    });

    // Management Section
    api.get('/backup_impro', (req, res) => {
        if(paths && paths['DB_CFG_PATH'])
        {
            res.setHeader('Content-disposition', 'attachment; filename=db.info');
            res.setHeader('Content-type', 'application/json');

            var filestream = createReadStream(paths['DB_CFG_PATH']);
            filestream.pipe(res);
        }
    });

    api.post('/backup_impro', (req, res) => {
        if(paths && paths['DB_CFG_PATH'])
        {
            try{
                JSON.parse(req.files.file.data.toString());

                writeFile(paths['DB_CFG_PATH'], req.files.file.data, {flag: 'w'});

                loadDBCFG();
                syncDB();

                res.send('SUCCESS');
            } catch(e) {
                res.send('Not a JSON file');
            }
            

        }
        else
        {
            res.send('Paths is not configured.');
        }

    });

    api.get('/backup_bn', (req, res) => {
        if(paths && paths['BN_CFG_PATH'])
        {
            res.setHeader('Content-disposition', 'attachment; filename=blacknode.info');
            res.setHeader('Content-type', 'application/json');

            var filestream = createReadStream(paths['BN_CFG_PATH']);
            filestream.pipe(res);
        }
    });

    api.post('/backup_bn', (req, res) => {
        if(paths && paths['BN_CFG_PATH'])
        {
            try{
                JSON.parse(req.files.file.data.toString());

                writeFile(paths['BN_CFG_PATH'], req.files.file.data, {flag: 'w'});

                loadBNInfoFromLocal(paths['BN_CFG_PATH']);

                res.send('SUCCESS');
            } catch(e) {
                res.send('Not a JSON file');
            }
            

        }
        else
        {
            res.send('Paths is not configured.');
        }

    });

    api.get('/group', async (_req, res) => {
        res.json(group);
    });

    api.get('/meter', async (_req, res) => {
        let ret = [];

        let sn = Object.keys(blacknode);

        for(let s of sn)
        {
            for(let i=0; i<blacknode[s].meter_list.length; i++)
            {
                ret.push({
                    sn: s,
                    siteid: blacknode[s].siteid,
                    nodeid: blacknode[s].nodeid,
                    modbusid: i+1,
                    name: blacknode[s].meter_list[i].name,

                });
            }
        }

        res.json(ret);
    });

    api.post('/update_group', async (req, res) => {
        let id = req.body.id;
        let name = req.body.name;

        try{
            await db.group.update({
                name: name,
            }, {
                where: {id: id}
            }); 

            loadGroup();

            res.send("SUCCESS");
        } catch(err) {
            res.send("Cannot create group.");
        }
    });

    api.get('/create_group/:name', async (req, res) => {
        try{
            await db.group.create({name: req.params.name, showDashboard: false}); 

            loadGroup();

            res.send("SUCCESS");
        } catch(err) {
            console.log(err);
            res.send("Cannot create group.");
        }
    });

    api.get('/delete_group/:id', async (req, res) => {
        try{
            await db.gmember.destroy({
                where: {GroupID: parseInt(req.params.id)}
            });

            await db.group.destroy({
                where: {id: parseInt(req.params.id)}
            }); 

            loadGroup();

            res.send("SUCCESS");
        } catch(err) {
            res.send("Cannot delete group.");
        }
    });

    api.post('/update_member', async (req, res) => {
        let groupid = req.body.id;
        let member = req.body.member;

        try{
            await db.gmember.destroy({
                where: {GroupID: groupid}
            });

            await db.gmember.bulkCreate(member);

            loadGroup();
            res.send("SUCCESS");
        } catch (err) {
            res.send("Cannot update group members");
        }
    });

    api.get('/set_dashboard/:group', async (req, res) => {
        let id = parseInt(req.params.group);

        try{
            await db.group.update({showDashboard: false }, {
                where: {
                    id: {
                        [Op.not]: id
                    }
                }
            });

            await db.group.update({showDashboard: true }, {
                where: { id: id }
            });

            loadGroup();

            res.send("SUCCESS");
        } catch(err) {
            console.log("Cannot save dashboard configuration.");

            res.send("Cannot save dashboard configuration.");
        }
    });

    api.get('/unset_dashboard/:group', async (req, res) => {
        let id = parseInt(req.params.group);

        try{
            await db.group.update({showDashboard: false }, {
                where: { id: id }
            });

            loadGroup();

            res.send("SUCCESS");
        } catch(err) {
            console.log("Cannot save dashboard configuration.");

            res.send("Cannot save dashboard configuration.");
        }
    });

    api_server = api.listen(8888, () => {
        console.log('API Server is running at 8888.');
    });
}