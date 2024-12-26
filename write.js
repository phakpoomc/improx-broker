'use strict'

const mqtt = require('mqtt-packet')

// function write(client, packet, done) {
//   let error = null

//   // Check if the client is still valid and connected before proceeding
//   if (!client || client.errored) {
//     error = new Error('Client is not valid or has encountered an error')
//     setImmediate(done, error, client)
//     return
//   }

//   if (client.connecting || client.connected) {
//     try {
//       const result = mqtt.writeToStream(packet, client.conn)
//       if (!result && !client.errored) {
//         // Ensure the client is still valid and connected before adding a listener
//         if (client.conn && client.conn.listenerCount('drain') < 200) {
//           const drainHandler = () => {
//             // Ensure that the listener is removed in case the client disconnects
//             client.conn.removeListener('drain', drainHandler)
//             done()
//           }
//           client.conn.once('drain', drainHandler)
//         } else {
//           console.warn('Too many listeners on drain event')
//         }
//         return
//       }
//     } catch (e) {
//       error = new Error('Packet received not valid')
//     }
//   } else {
//     error = new Error('Connection closed')
//   }

//   setImmediate(done, error, client)
// }

// function write (client, packet, done) { 
//     let error = null 
//     if (client.connecting || client.connected) { 
//       try { 
//         const result = mqtt.writeToStream(packet, client.conn) 
//         if (!result && !client.errored) {
//           // BEGIN CHANGED CODE
//           const onClientError = () => {
//             client.conn.removeListener('drain', onDrain);
//             done()
//           }
//           const onDrain = () => {
//             client.removeListener('error', onClientError)
//             done()
//           }
//           client.conn.once('drain', onDrain)
//           client.once('error', onError) 
//           // END CHANGED CODE
//           return 
//         } 
//       } catch (e) { 
//         error = new Error('packet received not valid') 
//       } 
//     } else { 
//       error = new Error('connection closed') 
//     } 
   
//     setImmediate(done, error, client) 
//   } 

function write (client, packet, done) {
  let error = null
  if (client.connecting || client.connected) {
    try {
      const result = mqtt.writeToStream(packet, client.conn)
      if (!result && !client.errored) {
        client.conn.once('drain', done)
        client.conn.removeAllListeners('drain')
      }
    } catch (e) {
      error = new Error('packet received not valid')
    }
  } else {
    error = new Error('connection closed')
  }

  setImmediate(done, error, client)
}

module.exports = write

