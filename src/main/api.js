import express from 'express';
import cors from 'cors';
import { Op } from 'sequelize';
import { lastUpdateData, blacknode, db } from './global.js';

export var api_server;

var MOCK = false;

function isOnPeak(dt)
{
    return true;
}

export function initAPI()
{
    const api = express();
    api.use(cors());
    api.use(express.json());
    api.use(express.urlencoded({extended: true}));

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

            let eData = await db.energy.findAll({
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

            let eData = await db.energy.findAll({
                where: {
                    DateTimeUpdate: {
                        [Op.and]: {
                            [Op.gte]: startTime,
                            [Op.lte]: endTime
                        }
                    }
                },
                order: [
                    ['DateTimeUpdate', 'ASC']
                ]
            });

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

            let eData = await db.energy.findAll({
                where: {
                    DateTimeUpdate: {
                        [Op.and]: {
                            [Op.gte]: startTime,
                            [Op.lte]: endTime
                        }
                    }
                },
                order: [
                    ['DateTimeUpdate', 'ASC']
                ]
            });

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

            let eData = await db.energy.findAll({
                where: {
                    DateTimeUpdate: {
                        [Op.and]: {
                            [Op.gte]: startTime,
                            [Op.lte]: endTime
                        }
                    }
                },
                order: [
                    ['DateTimeUpdate', 'ASC']
                ]
            });

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

            let eData = await db.energy.findAll({
                where: {
                    DateTimeUpdate: {
                        [Op.and]: {
                            [Op.gte]: startTime,
                            [Op.lte]: endTime
                        }
                    }
                },
                order: [
                    ['DateTimeUpdate', 'ASC']
                ]
            });

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
    api.post('/rt_chart', (req, res) => {
        let ret = {};

        let p = req.body;

        for(let k of p)
        {
            // Get data and fill
            ret[k] = {
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

        let pmap = [
            'Import_kWh',
            'Export_kWh',
            'TotalkWh',
            'Total_kvarh',
            'Ind_kvarh',
            'Cap_kvarh',
            'kVAh',
            'V1',
            'V2',
            'V3',
            'V12',
            'V23',
            'V31',
            'I1',
            'I2',
            'I3',
            'P1',
            'P2',
            'P3',
            'P_Sum',
            'Q1',
            'Q2',
            'Q3',
            'Q_Sum',
            'S1',
            'S2',
            'S3',
            'S_Sum',
            'PF1',
            'PF2',
            'PF3',
            'PF_Sum',
            'THD_U1',
            'THD_U2',
            'THD_U3',
            'THD_I1',
            'THD_I2',
            'THD_I3',
            'Frequency',
            'kWdemand',
        ];

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
            let keys = Object.keys(lastUpdateData);
            let now = new Date();
    
            for(let i=0; i<40; i++)
            {
                ret[i] = {};
    
                ret[i]['parameter'] = pmap[i];
                
                for(let k of keys)
                {
                    // Do not show stale data
                    if(now.getTime() - lastUpdateData[k].DateTimeUpdate.getTime() < 3600000)
                    {
                        ret[i][lastUpdateData[k].SerialNo] = lastUpdateData[k][pmap[i]];
                    }
                }
            }
        }

        res.json(ret);
    });

    api.get('/node_monitor', (req, res) => {
        let ret = {};

        let status_list = ['on', 'off', 'error'];
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
                    'meter_list': []
                };

                for(let i=0; i<30; i++)
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

    api.get('/phasor_graph', (req, res) => {
        let ret = {
            i1: Math.random() * 360,
            i2: Math.random() * 360,
            i3: Math.random() * 360
        };

        // calculate value and return

        res.json(ret);
    });

    api_server = api.listen(8888, () => {
        console.log('API Server is running at 8888.');
    });
}