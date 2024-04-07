import express from 'express';
import cors from 'cors';
import { lastUpdateData, blacknode } from './global.js';

export const api = express();
api.use(cors());
api.use(express.json());
api.use(express.urlencoded({extended: true}));

/* Dashboard API */

api.get('/dashboard_card', (req, res) => {
    let ret = {
        't_last_month': Math.floor(Math.random() * 1000), //0,
        't_this_month': Math.floor(Math.random() * 1000), //0,
        't_yesterday': Math.floor(Math.random() * 1000), //0,
        't_today': Math.floor(Math.random() * 1000), //0,
        'b_last_month': Math.floor(Math.random() * 1000), //0,
        'b_this_month': Math.floor(Math.random() * 1000), //0,
        'b_yesterday': Math.floor(Math.random() * 1000), //0,
        'b_today': Math.floor(Math.random() * 1000), //0,
    };

    // calculate value and return

    res.json(ret);
});

api.get('/dashboard/:year/:month/:day', (req, res) => {
    let ret = [];

    let year = req.params.year;
    let month = req.params.month;
    let day = req.params.day;

    for(let i=0; i<24; i++)
    {
        ret[i] = {
                    'category': String(i+1), 
                    'value1': Math.floor(Math.random() * 1000)
                };
    }

    // calculate value and return

    res.json(ret);
});

api.get('/dashboard/:year/:month', (req, res) => {
    let ret = [];

    let year = req.params.year;
    let month = req.params.month;

    let d = new Date(year, month, 0);
    let totalDays = d.getDate();

    for(let i=0; i<totalDays; i++)
    {
        ret[i] = {
                    'category': String(i+1), 
                    'value1': Math.floor(Math.random() * 1000)
                };
    }

    // calculate value and return

    res.json(ret);
});

api.get('/dashboard/:year', (req, res) => {
    let ret = [];

    let year = req.params.year;

    for(let i=0; i<12; i++)
    {
        ret[i] = {
                    'category': String(i+1), 
                    'value1': Math.floor(Math.random() * 1000)
                };
    }

    // calculate value and return

    res.json(ret);
});

api.get('/dashboard', (req, res) => {
    let ret = [];

    let d = new Date();

    let year = d.getFullYear();
    let month = d.getMonth() + 1;
    let day = d.getDate();

    for(let i=0; i<24; i++)
    {
        ret[i] = {
                    'category': String(i+1), 
                    'value1': Math.floor(Math.random() * 1000)
                };
    }

    // calculate value and return

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

    // await db.energy.findAll({
    //     group: ['SiteID', 'NodeID', 'ModbusID'],
    //     order: [['DateTimeUpdate', 'DESC']]
    // });

    // REAL
    // let keys = Object.keys(lastUpdateData);
    // let now = new Date();

    // for(let i=0; i<40; i++)
    // {
    //     ret[i] = {};

    //     ret[i]['parameter'] = pmap[i];
        
    //     for(let k of keys)
    //     {
    //         // Do not show stale data
    //         if(now.getTime() - lastUpdateData[k].DateTimeUpdate.getTime() < 3600000)
    //         {
    //             ret[i][lastUpdateData[k].SerialNo] = lastUpdateData[k][pmap[i]];
    //         }
    //     }
    // }

    
    // MOCK
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

    res.json(ret);
});

api.get('/node_monitor', (req, res) => {
    let ret = {};

    let status_list = ['on', 'off', 'error'];
    let keys = Object.keys(blacknode);

    console.log(blacknode);
    // REAL
    // for(let k of keys)
    // {
    //     let bn = blacknode[k];

    //     ret[bn.serial] = {
    //         'id': 'Node ' + String(bn.nodeid),
    //         'location': bn.name,
    //         'status': bn.status,
    //         'meter_list': []
    //     };

    //     for(let i=0; i<30; i++)
    //     {
    //         ret[bn.serial].meter_list[i] = {
    //             'id': i+1,
    //             'address': bn.meter_list[i].id,
    //             'name': bn.meter_list[i].name,
    //             'status': bn.meter_list[i].status,
    //         };
    //     }
    // }

    // MOCK
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

    // calculate value and return

    res.json(ret);
});