import Aedes from 'aedes'
import { createServer as wsCreateServer } from 'aedes-server-factory'
import { blacknode, loadBNInfoFromLocal, writeFile, last, lastUpdateTime, lastUpdateData, db } from './global.js';

export var aedesInst; 
export var httpServer; 

const WS_PORT = 8884

export function startMQTT(BN_CFG_PATH)
{
  aedesInst = new Aedes()
  httpServer = wsCreateServer(aedesInst/*, {ws: true}*/)

  loadBNInfoFromLocal(BN_CFG_PATH);

  aedesInst.on('clientDisconnect', function(client) {
    for(let sn of Object.keys(blacknode))
    {
      if(blacknode[sn].clientid == client.id)
      {
        blacknode[sn].status = 'off';
        blacknode[sn].last_update = new Date();
      }
    }

    writeFile(BN_CFG_PATH, JSON.stringify(blacknode), {flag: 'w'});
  });

  aedesInst.on('clientError', function(client, _err) {
    for(let sn of Object.keys(blacknode))
    {
      if(blacknode[sn].clientid == client.id)
      {
        blacknode[sn].status = 'error';
        blacknode[sn].last_update = new Date();
      }
    }

    writeFile(BN_CFG_PATH, JSON.stringify(blacknode), {flag: 'w'});
  });

  aedesInst.on('publish', function(pkt, _client) {
    //console.log(_client);

    const data_re = /^(DATABASE|REALTIME)\/(.*?)\/(.*?)\/(.*?)\/(\d*)$/;
    const cfg_re = /^CFG\/([^\/]*)$/;

    let cfg_m = pkt.topic.match(cfg_re);
    let data_m = pkt.topic.match(data_re);

    if(cfg_m)
    {
      // Configuration topic

      let sn = cfg_m[1];
      let cmd = pkt.payload.toString();

      // console.log('SN: ', sn, cfg_m);

      if(cmd == 'request_config')
      {
        if(!blacknode.hasOwnProperty(sn))
        {
          let obj = {
            'name': 'undefined',
            'clientid': _client.id,
            'mqtt': 'undefined',
            'clientip': '0.0.0.0',
            'period': 15,
            'serial': sn,
            'siteid': 'undefined',
            'nodeid': 'undefined',
            'meter_list': [],
            'status': 'setup',
            'last_update': new Date()
          }

          for(let i=0; i<30; i++)
          {
            let initMeter = {
              id: i+1,
              name: 'undefined',
              type: 0,
              status: 'off',
              last_update: new Date()
            }

            obj.meter_list.push(initMeter);
          }

          blacknode[sn] = obj;
        }
        else
        {
          blacknode[sn].last_update = new Date();
          blacknode[sn].status = 'setup';
          blacknode[sn].clientid = _client.id;
        }

        writeFile(BN_CFG_PATH, JSON.stringify(blacknode), {flag: 'w'});

        last['message'] = 'Blacknode ' + sn + ' connected. Please initialize the blacknode.';
        last['time'] = new Date();
        last['status'] = 'success';
      }
      else if(cmd == 'ack_config')
      {
        if(!blacknode.hasOwnProperty(sn))
        {
            last['message'] = 'Please first press "request config" button on Blacknode ' + sn + '.';
            last['time'] = new Date();
            last['status'] = 'error';

            return;
        }

        blacknode[sn].last_update = new Date();
        blacknode[sn].status = 'on';
        blacknode[sn].clientid = _client.id;

        writeFile(BN_CFG_PATH, JSON.stringify(blacknode), {flag: 'w'});

        last['message'] = 'Blacknode ' + sn + ' is successfully configured.';
        last['time'] = new Date();
        last['status'] = 'success';
      }
    }
    else if(data_m)
    {
      // Data topic

      // console.log(data_m);
      let dtype = data_m[1];
      let sn = data_m[2];
      let siteid = data_m[3];
      let nodeid = data_m[4];
      let modbusid = parseInt(data_m[5])-1;

      if(blacknode.hasOwnProperty(sn))
      {
        if(blacknode[sn].status == 'setup')
        {
          last['message'] = 'Received data from blacknode ' + sn + ' that is not initilized. Ignored.';
          last['time'] = new Date();
          last['status'] = 'error';
          console.log('Received data from a blacknode that is not initilized. Ignored.');
        }
        else
        {
          blacknode[sn].last_update = new Date();
          blacknode[sn].status = 'on';
          blacknode[sn].clientid = _client.id;

          blacknode[sn].meter_list[modbusid].last_update = blacknode[sn].last_update;
          blacknode[sn].meter_list[modbusid].status = 'on';
        }
        
      }
      else
      {
        last['message'] = 'Received data from blacknode ' + sn + ' that is not initilized. Ignored.';
        last['time'] = new Date();
        last['status'] = 'error';
        console.log('Received data from a blacknode that is not initilized. Ignored.');
      }

      if(dtype == 'DATABASE')
      {
        const pkt_re = /^t=(\d{4})-(\d{2})-(\d{2})\+(\d{2}):(\d{2}):(\d{2})&d=(.*)$/;

        let d = pkt.payload.toString().match(pkt_re);

        if(d)
        {
          // Payload pattern matched.

          let dt = new Date(d[1], parseInt(d[2]) - 1, d[3], d[4], d[5], d[6]);
          let e = d[7].split("|");

          if(e.length == 40)
          {
            if(db.energy == null)
            {
              last['message'] = 'Received MQTT packet(s) but the database is not initialized.';
              last['time'] = new Date();
              last['status'] = 'error';

              aedesInst.publish({cmd: 'publish', qos: 2, dup: false, retain: false, topic: 'LOG/DATABASE/' + sn + "/" + siteid + "/" + nodeid + "/" + String(modbusid+1), 'payload': "ERROR: database"}, function() {});
              return;
            }

            try{
              db.energy.create({
                SerialNo: sn,
                SiteID: siteid,
                NodeID: nodeid,
                ModbusID: String(modbusid),
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
                kWdemand: parseFloat(e[39]),
              });

              
              aedesInst.publish({cmd: 'publish', qos: 2, dup: false, retain: false, topic: 'LOG/DATABASE/' + sn + "/" + siteid + "/" + nodeid + "/" + String(modbusid+1), 'payload': "OK"}, function() {});
            }
            catch(err){
              aedesInst.publish({cmd: 'publish', qos: 2, dup: false, retain: false, topic: 'LOG/DATABASE/' + sn + "/" + siteid + "/" + nodeid + "/" + String(modbusid+1), 'payload': "ERROR: database"}, function() {});
              console.log(err);
            }
          }
          else
          {
            aedesInst.publish({cmd: 'publish', qos: 2, dup: false, retain: false, topic: 'LOG/DATABASE/' + sn + "/" + siteid + "/" + nodeid + "/" + String(modbusid+1), 'payload': "ERROR: parameter"}, function() {});
          }
        }
        else
        {
          aedesInst.publish({cmd: 'publish', qos: 2, dup: false, retain: false, topic: 'LOG/DATABASE/' + sn + "/" + siteid + "/" + nodeid + "/" + String(modbusid+1), 'payload': "ERROR: time"}, function() {});
        }
      }
      else if(dtype == 'REALTIME')
      {

        const pkt_re = /^t=(\d{4})-(\d{2})-(\d{2})\+(\d{2}):(\d{2}):(\d{2})&d=(.*)$/;

        let d = pkt.payload.toString().match(pkt_re);

        if(d)
        {
          // Payload pattern matched.

          let dt = new Date(d[1], parseInt(d[2]) - 1, d[3], d[4], d[5], d[6]);
          let e = d[7].split("|");

          if(e.length == 40)
          {
            // Avoid updating too often
            let first = false;

            if(!(sn in lastUpdateTime))
            {
              lastUpdateTime[sn] = new Date();
              lastUpdateData[sn] = {};

              first = true;
            }

            let now = new Date();

            if(first || now.getTime() - lastUpdateTime[sn].getTime() > 5000)
            {
              // Update object if last update is more than 5 secs away, ignore otherwise
              lastUpdateTime[sn] = now;

              Object.assign(lastUpdateData[sn], {
                SerialNo: sn,
                SiteID: siteid,
                NodeID: nodeid,
                ModbusID: String(modbusid),
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
                kWdemand: parseFloat(e[39]),
              });
            }
          }
        }
      }
    }
    else
    {
      // Invalid topic
    }

    // console.log(pkt.topic, pkt.payload.toString(), client);
  });
  
  httpServer.listen(WS_PORT, function () {
    console.log('websocket server listening on port ', WS_PORT)
  })
}