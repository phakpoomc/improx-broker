import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
var api = {
    /*
    เพิ่มพวก Backend code ที่นี่ 
  */

    testIPC: (): string => {
        return 'success from ipc'
    },
    removeCB: (): void => {
        console.log('Calling removeCB')
        console.log(ipcRenderer.removeAllListeners('update-bn'))
        console.log(ipcRenderer.removeAllListeners('last-message'))
    }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.

if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
        contextBridge.exposeInMainWorld('mainprocess', {
            send: (channel, data) => {
                let validChannels = ['authenticate', 'logout', 'registerCB']

                if (validChannels.includes(channel)) {
                    ipcRenderer.send(channel, data)
                }
            },
            getBN: (callback) => ipcRenderer.on('update-bn', (_event, value) => callback(value)),
            getMessage: (callback) =>
                ipcRenderer.on('last-message', (_event, value) => callback(value)),
            isAuthenticated: () => ipcRenderer.invoke('auth:isAuthenticated'),
            getUsername: () => ipcRenderer.invoke('auth:getUsername'),
            getCFG: (key) => ipcRenderer.invoke('data:getBlacknodeCFG', key),
            getCFGFile: () => ipcRenderer.invoke('data:getCFGFile'),
            getBNFile: () => ipcRenderer.invoke('data:getBNFile'),
            setCFGFile: (data) => ipcRenderer.invoke('data:setCFGFile', data),
            setBNFile: (data) => ipcRenderer.invoke('data:setBNFile', data),
            getDBCFG: () => ipcRenderer.invoke('data:getDatabaseCFG'),
            setDBCFG: (dbCFG) => ipcRenderer.invoke('data:setDatabaseCFG', dbCFG),
            getAPICFG: () => ipcRenderer.invoke('data:getAPICFG'),
            setAPICFG: (apiCFG) => ipcRenderer.invoke('data:setAPICFG', apiCFG),
            getBrokerCFG: () => ipcRenderer.invoke('data:getBrokerCFG'),
            setBrokerCFG: (brokerCFG) => ipcRenderer.invoke('data:setBrokerCFG', brokerCFG),
            clearMessage: () => ipcRenderer.invoke('data:clearMessage'),
            isBNCBRegistered: () => ipcRenderer.invoke('handler:isBlacknodeCallbackRegistered'),
            updateBN: (bnCFG, sn) => ipcRenderer.invoke('cmd:updateBN', bnCFG, sn),
            resetBN: (bn_name) => ipcRenderer.invoke('cmd:resetBN', bn_name),
            removeBN: (bn_name) => ipcRenderer.invoke('cmd:removeBN', bn_name)
        })
    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI
    // @ts-ignore (define in dts)
    window.api = api
}
