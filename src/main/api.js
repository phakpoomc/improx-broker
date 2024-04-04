import express from 'express';
import cors from 'cors';
// import { last } from './global.js';

export const api = express();
api.use(cors());

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
api.get('/meter_data_table', (req, res) => {
    let ret = [];

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

    // calculate value and return

    res.json(ret);
});

api.get('/node_monitor', (req, res) => {
    let ret = {};

    let status_list = ['on', 'off', 'error'];

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