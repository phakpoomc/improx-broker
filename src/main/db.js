import { Sequelize, DataTypes } from 'sequelize'
import { last, db, meta_cfg } from './global.js'
import bcrypt from 'bcrypt'


async function alterTable(sequelize) {
    const queryInterface = sequelize.getQueryInterface();
    // Check if the column exists
    const groupInfo = await queryInterface.describeTable('group');
    const gmemberInfo = await queryInterface.describeTable('gmember');

    if (!groupInfo.type) {
        // If the column doesn't exist, add it
        await queryInterface.addColumn('group', 'type', {
            type: DataTypes.STRING,
            allowNull: true
        });
        console.log("'type' column added to 'group' table");
    } else {
        console.log("'type' column already exists in 'group' table");
    }

    if (!gmemberInfo.line) {
        // If the column doesn't exist, add it
        await queryInterface.addColumn('gmember', 'line', {
            type: DataTypes.STRING,
            allowNull: true
        });
        console.log("'line' column added to 'gmember' table");
    } else {
        console.log("'line' column already exists in 'gmember' table");
    }

    if (!gmemberInfo.order_meter) {
        // If the column doesn't exist, add it
        await queryInterface.addColumn('gmember', 'order_meter', {
            type: DataTypes.STRING,
            allowNull: true
        });
        console.log("'order_meter' column added to 'gmember' table");
    } else {
        console.log("'order_meter' column already exists in 'gmember' table");
    }

    if (!gmemberInfo.is_consumption) {
        // If the column doesn't exist, add it
        await queryInterface.addColumn('gmember', 'is_consumption', {
            type: DataTypes.STRING,
            allowNull: true
        });
        console.log("'is_consumption' column added to 'gmember' table");
    } else {
        console.log("'is_consumption' column already exists in 'gmember' table");
    }
}


export async function syncDB() {
    if (
        meta_cfg.db['dbname'] &&
        meta_cfg.db['dbname'] != '' &&
        meta_cfg.db['host'] &&
        meta_cfg.db['host'] != '' &&
        meta_cfg.db['port'] &&
        meta_cfg.db['port'] != '' &&
        meta_cfg.db['dialect'] &&
        meta_cfg.db['dialect'] != ''
    ) {
        const sequelize = new Sequelize(meta_cfg.db['dbname'], meta_cfg.db['username'], meta_cfg.db['password'], {
            host: meta_cfg.db['host'],
            port: meta_cfg.db['port'],
            dialect: meta_cfg.db['dialect'],
            define: {
                timestamps: false
            },
            // dialectOptions: {
            //     useUTC: true
            // },
            // timezone: '+07:00',
            logging: false
        })

        sequelize
            .authenticate()
            .then(() => {
                console.log('DB Connected')
            })
            .catch((err) => {
                db.energy = null;
                db.group = null;
                db.gmember = null;
                db.alarm = null;
                db.holiday = null;
                db.user = null;
                db.userrole = null;
                db.feedmeter = null;

                last['message'] = 'Cannot connect to database.'
                last['time'] = new Date()
                last['status'] = 'error'
                console.log('Cannot connect to DB: ', err)

                return
            })

        db.energy = sequelize.define(
            'energy',
            {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id' },
                SerialNo: { type: DataTypes.STRING, field: 'SerialNo' },
                SiteID: { type: DataTypes.STRING, field: 'SiteID' },
                NodeID: { type: DataTypes.STRING, field: 'NodeID' },
                ModbusID: { type: DataTypes.STRING, field: 'ModbusID' },
                snmKey: { type: DataTypes.STRING, field: 'snmKey' },
                DateTimeUpdate: { type: DataTypes.DATE, field: 'DateTimeUpdate' },
                Import_kWh: { type: DataTypes.DOUBLE, field: 'Import_kWh' },
                Export_kWh: { type: DataTypes.DOUBLE, field: 'Export_kWh' },
                TotalkWh: { type: DataTypes.DOUBLE, field: 'Total_kWh' },
                Total_kvarh: { type: DataTypes.FLOAT, field: 'Total_kvarh' },
                Ind_kvarh: { type: DataTypes.FLOAT, field: 'Ind_kvarh' },
                Cap_kvarh: { type: DataTypes.FLOAT, field: 'Cap_kvarh' },
                kVAh: { type: DataTypes.FLOAT, field: 'kVAh' },
                V1: { type: DataTypes.FLOAT, field: 'V1' },
                V2: { type: DataTypes.FLOAT, field: 'V2' },
                V3: { type: DataTypes.FLOAT, field: 'V3' },
                V12: { type: DataTypes.FLOAT, field: 'V12' },
                V23: { type: DataTypes.FLOAT, field: 'V23' },
                V31: { type: DataTypes.FLOAT, field: 'V31' },
                I1: { type: DataTypes.FLOAT, field: 'I1' },
                I2: { type: DataTypes.FLOAT, field: 'I2' },
                I3: { type: DataTypes.FLOAT, field: 'I3' },
                P1: { type: DataTypes.FLOAT, field: 'P1' },
                P2: { type: DataTypes.FLOAT, field: 'P2' },
                P3: { type: DataTypes.FLOAT, field: 'P3' },
                P_Sum: { type: DataTypes.FLOAT, field: 'P_Sum' },
                Q1: { type: DataTypes.FLOAT, field: 'Q1' },
                Q2: { type: DataTypes.FLOAT, field: 'Q2' },
                Q3: { type: DataTypes.FLOAT, field: 'Q3' },
                Q_Sum: { type: DataTypes.FLOAT, field: 'Q_Sum' },
                S1: { type: DataTypes.FLOAT, field: 'S1' },
                S2: { type: DataTypes.FLOAT, field: 'S2' },
                S3: { type: DataTypes.FLOAT, field: 'S3' },
                S_Sum: { type: DataTypes.FLOAT, field: 'S_Sum' },
                PF1: { type: DataTypes.FLOAT, field: 'PF1' },
                PF2: { type: DataTypes.FLOAT, field: 'PF2' },
                PF3: { type: DataTypes.FLOAT, field: 'PF3' },
                PF_Sum: { type: DataTypes.FLOAT, field: 'PF_Sum' },
                THD_U1: { type: DataTypes.FLOAT, field: 'THD_U1' },
                THD_U2: { type: DataTypes.FLOAT, field: 'THD_U2' },
                THD_U3: { type: DataTypes.FLOAT, field: 'THD_U3' },
                THD_I1: { type: DataTypes.FLOAT, field: 'THD_I1' },
                THD_I2: { type: DataTypes.FLOAT, field: 'THD_I2' },
                THD_I3: { type: DataTypes.FLOAT, field: 'THD_I3' },
                Frequency: { type: DataTypes.FLOAT, field: 'Frequency' },
                // kWdemand: { type: DataTypes.DOUBLE, field: 'kWdemand' }
            },
            {
                tableName: 'energy'
            }
        )

        db.group = sequelize.define(
            'group',
            {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id' },
                name: { type: DataTypes.STRING, field: 'name' },
                type: { type: DataTypes.STRING, field: 'type' ,allowNull:true },
                showDashboard: { type: DataTypes.BOOLEAN, field: 'showDashboard' }
            },
            {
                tableName: 'group'
            }
        )

        db.gmember = sequelize.define(
            'gmember',
            {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id' },
                GroupID: { type: DataTypes.INTEGER, field: 'GroupID' },
                SerialNo: { type: DataTypes.STRING, field: 'SerialNo' },
                SiteID: { type: DataTypes.STRING, field: 'SiteID' },
                NodeID: { type: DataTypes.STRING, field: 'NodeID' },
                ModbusID: { type: DataTypes.STRING, field: 'ModbusID' },
                multiplier: { type: DataTypes.DOUBLE, field: 'multiplier' },
                line: { type: DataTypes.STRING, field: 'line' ,allowNull:true },
                order_meter: { type: DataTypes.STRING, field: 'order_meter' ,allowNull:true },
                is_consumption: { type: DataTypes.STRING, field: 'is_consumption' ,allowNull:true }
            },
            {
                tableName: 'gmember'
            }
        )

        db.alarm = sequelize.define(
            'alarm',
            {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id' },
                SerialNo: { type: DataTypes.STRING, field: 'SerialNo' },
                SiteID: { type: DataTypes.STRING, field: 'SiteID' },
                NodeID: { type: DataTypes.STRING, field: 'NodeID' },
                ModbusID: { type: DataTypes.STRING, field: 'ModbusID' },
                snmKey: { type: DataTypes.STRING, field: 'snmKey' },
                DateTime: { type: DataTypes.DATE, field: 'DateTime' },
                type: { type: DataTypes.STRING, field: 'type' },
                status: { type: DataTypes.STRING, field: 'status' }
            },
            {
                tableName: 'alarm'
            }
        )

        db.holiday = sequelize.define(
            'holiday',
            {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id' },
                DateTime: { type: DataTypes.DATE, field: 'DateTime' },
                name: { type: DataTypes.STRING, field: 'name' },
            },
            {
                tableName: 'holiday'
            }
        )

        db.user = sequelize.define(
            'user',
            {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id' },
                name: { type: DataTypes.STRING, field: 'name' },
                username: { type: DataTypes.STRING, field: 'username' },
                password: { type: DataTypes.STRING, field: 'password' },
                email: { type: DataTypes.STRING, field: 'email' },
                status: { type: DataTypes.STRING, field: 'status' },
                group: { type: DataTypes.INTEGER, field: 'group' },
                DateTime: { type: DataTypes.DATE, field: 'DateTime' }
            },
            {
                tableName: 'user'
            }
        )

        db.userrole = sequelize.define(
            'userrole',
            {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id' },
                userid: { type: DataTypes.INTEGER, field: 'userid' },
                role: { type: DataTypes.STRING, field: 'role' },
            },
            {
                tableName: 'userrole'
            }
        )

        db.feedmeter = sequelize.define(
            'feedmeter',
            {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id' },
                DateTime: { type: DataTypes.DATE, field: 'FeederDateTime' },
                name: { type: DataTypes.STRING, field: 'FeederMeterName' },
                value: { type: DataTypes.FLOAT, field: 'FeederMeterValue' },
            },
            {
                tableName: 'tblFeederMeter'
            }
        )

        await alterTable(sequelize);

        try {
            await sequelize.sync()
            last['message'] = 'Database table synced.'
            last['time'] = new Date()
            last['status'] = 'success'
            console.log('Table synced')

            let root = await db.user.findOne({
                where: {
                    username: 'improxroot'
                }
            })

            if(!root)
            {
                let u = await db.user.create({
                    name: 'ImproX Root',
                    username: 'improxroot',
                    password: await bcrypt.hash('improxpassword!', 3),
                    email: 'root@improx.com',
                    status: 'Confirmed',
                })

                await db.userrole.create({
                    userid: u.id,
                    role: 'owner'
                })

                await db.userrole.create({
                    userid: u.id,
                    role: 'admin'
                })
            }
            db.sequelize = sequelize;


            return
        } catch (err) {
            db.energy = null;
            db.group = null;
            db.gmember = null;
            db.alarm = null;
            db.holiday = null;
            db.user = null;
            db.userrole = null;
            db.feedmeter = null;

            last['message'] = 'Cannot sync database table.'
            last['time'] = new Date()
            last['status'] = 'error'
            console.log('Cannot sync table: ', err)

            return
        }
    } else {
        db.energy = null;
        db.group = null;
        db.gmember = null;
        db.alarm = null;
        db.holiday = null;
        db.user = null;
        db.userrole = null;
        db.feedmeter = null;

        last['message'] = 'Database is not set up.'
        last['time'] = new Date()
        last['status'] = 'error'
        console.log('Database is not set up.')

        return
    }
}
