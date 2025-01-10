const { parentPort, workerData } = require('worker_threads');
import { Op } from 'sequelize';
import { db } from './global.js';

(async () => {
    try {
        // Fetch data using Sequelize
        let lastTime = workerData;
        let currTime = new Date(lastTime);
        currTime.setDate(currTime.getDate() + 1);

        cached = {};
        let prevEnergy = {}
        let prevTime = {}

        let now = new Date()

        let tLastMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0))
        let tThisMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0))
        let tYesterday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0))
        let tToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0))
        let tTomorrow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0))


        var eData = await db.energy.findAll({
            where: {
                DateTimeUpdate: {
                    [Op.and]: {
                        [Op.gte]: lastTime,
                        [Op.lte]: currTime
                    }
                }
            },
            order: [['DateTimeUpdate', 'ASC'], ['id', 'asc']]
        })

        for (let e of eData) {
            if(!cached.hasOwnProperty(e.snmKey))
            {
                cached[e.snmKey] = {
                    energyLastMonth: 0,
                    energyThisMonth: 0,
                    energyYesterday: 0,
                    energyToday: 0,
                    maxDemandLastMonth: {},
                    maxDemandThisMonth: {},
                    maxDemandYesterday: {},
                    maxDemandToday: {},
                    prevEnergy: 0,
                    prevTime: null
                }
            }

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
                prevEnergy[e.snmKey] = energy
                prevTime[e.snmKey] = e.DateTimeUpdate
                continue
            }
    
            let adjustedTime = new Date(Date.UTC(e.DateTimeUpdate.getUTCFullYear(), e.DateTimeUpdate.getUTCMonth(), e.DateTimeUpdate.getUTCDate(), e.DateTimeUpdate.getUTCHours(), e.DateTimeUpdate.getUTCMinutes()))
            // adjustedTime.setUTCMinutes(adjustedTime.getUTCMinutes() - 1)
            let tKey = adjustedTime.getUTCFullYear() + '-' + (adjustedTime.getUTCMonth()+1) + '-' + adjustedTime.getUTCDate() + '-' + adjustedTime.getUTCHours() + '-' + adjustedTime.getUTCMinutes()

            let absEnergy = (energy - prevEnergy[e.snmKey])
    
            prevEnergy[e.snmKey] = energy

            cached[e.snmKey].prevEnergy = energy;
            cached[e.snmKey].prevTime = e.DateTimeUpdate;

            let gap = ((e.DateTimeUpdate - prevTime[e.snmKey])/1000/60)/60

            let d = absEnergy/gap;
    
            if (e.DateTimeUpdate >= tLastMonth && e.DateTimeUpdate <= tThisMonth) {
                // Last month
                if(prevTime[e.snmKey] >= tLastMonth && prevTime[e.snmKey] <= tThisMonth)
                {
                    cached[e.snmKey].energyLastMonth += absEnergy
    
                    // if (isOnPeak(e.DateTimeUpdate)) {
                    //     cached[e.snmKey].maxDemandLastMonth[tKey] = d;
                    // }
                }
            } else {
                // This month
                if(prevTime[e.snmKey] >= tThisMonth && prevTime[e.snmKey] <= tTomorrow)
                {
                    cached[e.snmKey].energyThisMonth += absEnergy
    
                    // if (isOnPeak(e.DateTimeUpdate)) {
                    //     if(d > cached[e.snmKey].maxDemandThisMonth)
                    //     {
                    //         cached[e.snmKey].maxDemandThisMonth[tKey] = d;
                    //     }
                    // }
    
                    if (e.DateTimeUpdate >= tYesterday && e.DateTimeUpdate <= tToday) {
                        // Yesterday
                        if(prevTime[e.snmKey] >= tYesterday && prevTime[e.snmKey] <= tTomorrow)
                        {
                            cached[e.snmKey].energyYesterday += absEnergy
    
                            // if (isOnPeak(e.DateTimeUpdate)) {
                            //     if(d > cached[e.snmKey].maxDemandYesterday)
                            //     {
                            //         cached[e.snmKey].maxDemandYesterday[tKey] = d;
                            //     }
                            // }
                        }
                        
                    } else if (e.DateTimeUpdate >= tToday && prevTime[e.snmKey] <= tTomorrow) {
                        cached[e.snmKey].energyToday += absEnergy
    
                        // if (isOnPeak(e.DateTimeUpdate)) {
                        //     if(d > cached[e.snmKey].maxDemandToday)
                        //     {
                        //         cached[e.snmKey].maxDemandToday[tKey] = d;
                        //     }
                        // }
                    }
                }
            }
    
            prevTime[e.snmKey] = e.DateTimeUpdate
        }

        // Return the result to the main thread
        parentPort.postMessage({ status: 'OK', cached: cached });
    } catch (error) {
        parentPort.postMessage({ status: 'error', cached:cached });
    } finally {
        // await sequelize.close();    
    }
  })();