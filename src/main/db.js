import { Sequelize, DataTypes } from 'sequelize';
import { last, db, db_cfg } from './global.js';

export async function syncDB()
{
    if(db_cfg['dbname'] && db_cfg['dbname'] != '' && db_cfg['host'] && db_cfg['host'] != '' && db_cfg['port'] && db_cfg['port'] != '' && db_cfg['dialect'] && db_cfg['dialect'] != '')
    {
        const sequelize = new Sequelize(
        db_cfg['dbname'], 
        db_cfg['username'], 
        db_cfg['password'], 
        {
        host: db_cfg['host'], 
        port: db_cfg['port'],
        dialect: db_cfg['dialect'], 
        define: {
            timestamps: false 
        },
        dialectOptions: {
            useUTC: false
        },
        timezone: '+07:00',
        logging: false
        });
    
        sequelize.authenticate().then(() => {
            console.log('DB Connected');
        }).catch(err => {
            db.energy = null;
            db.group = null;
            db.gmember = null;
            db.alarm = null;

            last['message'] = 'Cannot connect to database.';
            last['time'] = new Date();
            last['status'] = 'error';
            console.log("Cannot connect to DB: ", err);

            return;
        });
    
        db.energy = sequelize.define(
            'energy',
            {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id' },
                SerialNo: { type: DataTypes.STRING, field: 'SerialNo' },
                SiteID: { type: DataTypes.STRING, field: 'SiteID' },
                NodeID: { type: DataTypes.STRING, field: 'NodeID' },
                ModbusID: { type: DataTypes.STRING, field: 'ModbusID' },
                snmKey: { type: DataTypes.STRING, field: 'snmKey' },
                DateTimeUpdate: { type: DataTypes.DATE, field: 'DateTimeUpdate'},
                Import_kWh: { type: DataTypes.DOUBLE, field: 'Import_kWh'},
                Export_kWh: { type: DataTypes.DOUBLE, field: 'Export_kWh'},
                TotalkWh: { type: DataTypes.DOUBLE, field: 'Total_kWh'},
                Total_kvarh: { type: DataTypes.FLOAT, field: 'Total_kvarh'},
                Ind_kvarh: { type: DataTypes.FLOAT, field: 'Ind_kvarh'},
                Cap_kvarh: { type: DataTypes.FLOAT, field: 'Cap_kvarh'},
                kVAh: { type: DataTypes.FLOAT, field: 'kVAh'},
                V1: { type: DataTypes.FLOAT, field: 'V1'},
                V2: { type: DataTypes.FLOAT, field: 'V2'},
                V3: { type: DataTypes.FLOAT, field: 'V3'},
                V12: { type: DataTypes.FLOAT, field: 'V12'},
                V23: { type: DataTypes.FLOAT, field: 'V23'},
                V31: { type: DataTypes.FLOAT, field: 'V31'},
                I1: { type: DataTypes.FLOAT, field: 'I1'},
                I2: { type: DataTypes.FLOAT, field: 'I2'},
                I3: { type: DataTypes.FLOAT, field: 'I3'},
                P1: { type: DataTypes.FLOAT, field: 'P1'},
                P2: { type: DataTypes.FLOAT, field: 'P2'},
                P3: { type: DataTypes.FLOAT, field: 'P3'},
                P_Sum: { type: DataTypes.FLOAT, field: 'P_Sum'},
                Q1: { type: DataTypes.FLOAT, field: 'Q1'},
                Q2: { type: DataTypes.FLOAT, field: 'Q2'},
                Q3: { type: DataTypes.FLOAT, field: 'Q3'},
                Q_Sum: { type: DataTypes.FLOAT, field: 'Q_Sum'},
                S1: { type: DataTypes.FLOAT, field: 'S1'},
                S2: { type: DataTypes.FLOAT, field: 'S2'},
                S3: { type: DataTypes.FLOAT, field: 'S3'},
                S_Sum: { type: DataTypes.FLOAT, field: 'S_Sum'},
                PF1: { type: DataTypes.FLOAT, field: 'PF1'},
                PF2: { type: DataTypes.FLOAT, field: 'PF2'},
                PF3: { type: DataTypes.FLOAT, field: 'PF3'},
                PF_Sum: { type: DataTypes.FLOAT, field: 'PF_Sum'},
                THD_U1: { type: DataTypes.FLOAT, field: 'THD_U1'},
                THD_U2: { type: DataTypes.FLOAT, field: 'THD_U2'},
                THD_U3: { type: DataTypes.FLOAT, field: 'THD_U3'},
                THD_I1: { type: DataTypes.FLOAT, field: 'THD_I1'},
                THD_I2: { type: DataTypes.FLOAT, field: 'THD_I2'},
                THD_I3: { type: DataTypes.FLOAT, field: 'THD_I3'},
                Frequency: { type: DataTypes.FLOAT, field: 'Frequency'},
                kWdemand: { type: DataTypes.DOUBLE, field: 'kWdemand'},
            },
            {
                tableName: 'energy' 
            }
        );

        db.group = sequelize.define(
            'group',
            {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id' },
                name: { type: DataTypes.STRING, field: 'name' },
                showDashboard: { type: DataTypes.BOOLEAN, field: 'showDashboard' }
            },
            {
                tableName: 'group' 
            }
        );

        db.gmember = sequelize.define(
            'gmember',
            {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id' },
                GroupID: { type: DataTypes.INTEGER, field: 'GroupID' },
                SerialNo: { type: DataTypes.STRING, field: 'SerialNo' },
                SiteID: { type: DataTypes.STRING, field: 'SiteID' },
                NodeID: { type: DataTypes.STRING, field: 'NodeID' },
                ModbusID: { type: DataTypes.STRING, field: 'ModbusID' },
                multiplier: { type: DataTypes.DOUBLE, field: 'multiplier'}
            },
            {
                tableName: 'gmember' 
            }
        );

        db.alarm = sequelize.define(
            'alarm',
            {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id' },
                SerialNo: { type: DataTypes.STRING, field: 'SerialNo' },
                SiteID: { type: DataTypes.STRING, field: 'SiteID' },
                NodeID: { type: DataTypes.STRING, field: 'NodeID' },
                ModbusID: { type: DataTypes.STRING, field: 'ModbusID' },
                snmKey: { type: DataTypes.STRING, field: 'snmKey' },
                DateTime: { type: DataTypes.DATE, field: 'DateTime'},
                type: { type: DataTypes.STRING, field: 'type' },
                status: { type: DataTypes.STRING, field: 'status'}
            },
            {
                tableName: 'alarm' 
            }
        );
    
        try{
            await sequelize.sync();
            last['message'] = 'Database table synced.';
            last['time'] = new Date();
            last['status'] = 'success';
            console.log('Table synced');

            return;
        }
        catch(err) {
            db.energy = null;
            db.group = null;
            db.gmember = null;
            db.alarm = null;

            last['message'] = 'Cannot sync database table.';
            last['time'] = new Date();
            last['status'] = 'error';
            console.log('Cannot sync table: ', err);

            return;
        }
    }
    else
    {
        db.energy = null;
        db.group = null;
        db.gmember = null;
        db.alarm = null;

        last['message'] = 'Database is not set up.';
        last['time'] = new Date();
        last['status'] = 'error';
        console.log('Database is not set up.');

        return;
    }
}
