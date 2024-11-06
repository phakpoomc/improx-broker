<script setup>
import Navbar from '../layout/Navbar.vue'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()

const user = ref()

user.value = await window.mainprocess.getUsername()

const bnCFG = ref()
const apiCFG = ref()
const brokerCFG = ref()

bnCFG.value = await window.mainprocess.getDBCFG()

var dialect
var autorun

if (bnCFG.value) {
    dialect = bnCFG.value.dialect
} else {
    bnCFG.value = {
        username: '',
        password: '',
        dbname: '',
        dialect: '',
        host: '',
        port: ''
    }
}

apiCFG.value = await window.mainprocess.getAPICFG()

let db_choices = [
    { value: 'mysql', text: 'MySQL' },
    { value: 'sqlite', text: 'SQLite' },
    { value: 'postgres', text: 'Postgres' },
    { value: 'mssql', text: 'MSSQL' },
    { value: 'mariadb', text: 'MariaDB' }
]

brokerCFG.value = await window.mainprocess.getBrokerCFG()
console.log(brokerCFG.value)
if (brokerCFG.value) {
    autorun = brokerCFG.value.autorun ? 'Enable' : 'Disable'
} else {
    autorun = 'Disable'
}

function save() {
    let host = document.getElementById('host').value
    let port = document.getElementById('port').value
    let dialect = document.getElementById('dialect').value
    let dbname = document.getElementById('dbname').value
    let username = document.getElementById('username').value
    let password = document.getElementById('password').value

    let obj = {
        host: host,
        port: port,
        dialect: dialect,
        dbname: dbname,
        username: username,
        password: password
    }

    console.log(obj)

    window.mainprocess.setDBCFG(obj)

    router.push('/sql_edit')
}

function saveAPI() {
    let protocol = document.getElementById('api-protocol').value
    let host = document.getElementById('api-host').value
    let port = document.getElementById('api-port').value
    let key = document.getElementById('api-key').value

    let obj = {
        protocol: protocol,
        host: host,
        port: port,
        key: key
    }

    window.mainprocess.setAPICFG(obj)
    router.push('/sql_edit')
}

function saveBroker() {
    let weblocalport = document.getElementById('web-local-port').value
    let apilocalport = document.getElementById('api-local-port').value
    let mqttlocalport = document.getElementById('mqtt-local-port').value
    let autorunEnabled = document.getElementById('autorun').value
    let cors = document.getElementById('cors').value

    let obj = {
        webport: weblocalport,
        apiport: apilocalport,
        mqttport: mqttlocalport,
        autorun: autorunEnabled == 'Enable' ? true : false,
        cors: cors
    }

    window.mainprocess.setBrokerCFG(obj)
    router.push('/sql_edit')
}

async function exportCFG() {
    let data = await window.mainprocess.getCFGFile()
    let binaryData = []
    binaryData.push(data)

    let file = window.URL.createObjectURL(new Blob(binaryData, { type: 'application/json' }))
    let filelink = document.createElement('a')
    filelink.href = file
    filelink.download = 'meta.info'
    filelink.click()

    router.push('/sql_edit')
}

function importCFG() {
    let cfg = document.getElementById('import-cfg')

    cfg.addEventListener('change', async (evt) => {
        let reader = new FileReader()

        reader.onload = async function () {
            await window.mainprocess.setCFGFile(reader.result)
        }

        reader.readAsText(evt.target.files[0])

        router.push('/')
    })

    cfg.click()
}

async function exportBN() {
    let data = await window.mainprocess.getBNFile()
    let binaryData = []
    binaryData.push(data)

    let file = window.URL.createObjectURL(new Blob(binaryData, { type: 'application/json' }))
    let filelink = document.createElement('a')
    filelink.href = file
    filelink.download = 'blacknode.info'
    filelink.click()

    router.push('/sql_edit')
}

function importBN() {
    let cfg = document.getElementById('import-bn')

    cfg.addEventListener('change', async (evt) => {
        let reader = new FileReader()

        reader.onload = async function () {
            await window.mainprocess.setBNFile(reader.result)
        }

        reader.readAsText(evt.target.files[0])

        router.push('/')
    })

    cfg.click()
}
</script>

<template>
    <Navbar>
        <template #body>
            <div class="row">
                <div class="col-12">
                    <div class="h2 mb-4">
                        Database Config

                        <input
                            type="file"
                            class="form-control"
                            name="import-bn"
                            id="import-bn"
                            hidden
                        />
                        <div
                            class="btn btn-secondary float-end me-1"
                            style="border-radius: 50px"
                            @click="importBN()"
                        >
                            Import BN
                        </div>

                        <div
                            class="btn btn-secondary float-end me-1"
                            style="border-radius: 50px"
                            @click="exportBN()"
                        >
                            Export BN
                        </div>

                        <input
                            type="file"
                            class="form-control"
                            name="import-cfg"
                            id="import-cfg"
                            hidden
                        />
                        <div
                            class="btn btn-secondary float-end me-1"
                            style="border-radius: 50px"
                            @click="importCFG()"
                        >
                            Import CFG
                        </div>

                        <div
                            class="btn btn-secondary float-end me-1"
                            style="border-radius: 50px"
                            @click="exportCFG()"
                        >
                            Export CFG
                        </div>
                    </div>
                </div>
            </div>
            <div class="card card-body bg-light border-light mb-4">
                <div class="row mb-4">
                    <div class="col-4">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="host">Host</label>
                            <input
                                id="host"
                                type="text"
                                class="form-control"
                                name="host"
                                :value="bnCFG.host"
                                required
                                autofocus
                            />
                        </div>
                    </div>
                    <div class="col-2">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="port">Port</label>
                            <input
                                id="port"
                                type="text"
                                class="form-control"
                                name="port"
                                :value="bnCFG.port"
                                required
                            />
                        </div>
                    </div>
                    <div class="col-2">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="dialect">Dialect</label>
                            <select
                                v-model="dialect"
                                id="dialect"
                                name="dialect"
                                class="form-select"
                                aria-label="Default select example"
                                required
                            >
                                <option v-for="choice in db_choices" :value="choice.value">
                                    {{ choice.text }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="dbname">Database Name</label>
                            <input
                                id="dbname"
                                type="text"
                                class="form-control"
                                name="dbname"
                                :value="bnCFG.dbname"
                                required
                                autofocus
                            />
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="username">Username</label>
                            <input
                                id="username"
                                type="text"
                                class="form-control"
                                name="username"
                                :value="bnCFG.username"
                                required
                                autofocus
                            />
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="password">Password</label>
                            <input
                                id="password"
                                type="text"
                                class="form-control"
                                name="password"
                                :value="bnCFG.password"
                                required
                                autofocus
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-3">
                <div class="col-12 d-flex justify-content-end">
                    <button class="btn btn-secondary ms-2" @click="save()">Save</button>
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <div class="h2 mb-4">API Config</div>
                </div>
            </div>
            <div class="card card-body bg-light border-light mb-4">
                <div class="row mb-4">
                    <div class="col-2">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="protocol">Protocol</label>
                            <input
                                id="api-protocol"
                                type="text"
                                class="form-control"
                                name="protocol"
                                :value="apiCFG.protocol"
                                required
                                autofocus
                            />
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="host">Host</label>
                            <input
                                id="api-host"
                                type="text"
                                class="form-control"
                                name="host"
                                :value="apiCFG.host"
                                required
                                autofocus
                            />
                        </div>
                    </div>
                    <div class="col-2">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="port">Port</label>
                            <input
                                id="api-port"
                                type="text"
                                class="form-control"
                                name="api-port"
                                :value="apiCFG.port"
                                required
                            />
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="key">Key</label>
                            <input
                                id="api-key"
                                type="text"
                                class="form-control"
                                name="api-key"
                                :value="apiCFG.key"
                                required
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-3">
                <div class="col-12 d-flex justify-content-end">
                    <button class="btn btn-secondary ms-2" @click="saveAPI()">Save</button>
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <div class="h2 mb-4">Broker Config</div>
                </div>
            </div>
            <div class="card card-body bg-light border-light mb-4">
                <div class="row mb-4">
                    <div class="col-3">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="web-local-port"
                                >Web Local Port</label
                            >
                            <input
                                id="web-local-port"
                                type="text"
                                class="form-control"
                                :value="brokerCFG.webport"
                                autofocus
                            />
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="api-local-port">
                                API Local Port
                            </label>
                            <input
                                id="api-local-port"
                                type="text"
                                class="form-control"
                                :value="brokerCFG.apiport"
                            />
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="mqtt-local-port">
                                MQTT Local Port
                            </label>
                            <input
                                id="mqtt-local-port"
                                type="text"
                                class="form-control"
                                :value="brokerCFG.mqttport"
                            />
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="autorun">Autorun</label>
                            <select
                                v-model="autorun"
                                id="autorun"
                                name="autorun"
                                class="form-select"
                                aria-label="Autorun?"
                            >
                                <option value="Disable">Disable</option>
                                <option value="Enable">Enable</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-12">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="cors"> CORS Origin </label>
                            <input
                                id="cors"
                                type="text"
                                class="form-control"
                                :value="brokerCFG.cors"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-3">
                <div class="col-12 d-flex justify-content-end">
                    <button class="btn btn-secondary ms-2" @click="saveBroker()">Save</button>
                </div>
            </div>
        </template>

        <template #username>
            {{ user }}
        </template>
    </Navbar>
</template>

<style lang="css">
@import '../assets/css/bootstrap.css';
</style>
