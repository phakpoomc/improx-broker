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

var dialect;
var autorun;

if(bnCFG.value)
{
    dialect = bnCFG.value.dialect;
}
else
{
    bnCFG.value = {
        username: "",
        password: "",
        dbname: "",
        dialect: "",
        host: "",
        port: "",
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
if(brokerCFG.value)
{
    autorun = (brokerCFG.value.autorun) ? 'Enable' : 'Disable'
}
else
{
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
    let autorunEnabled = document.getElementById('autorun').value
    let cors = document.getElementById('cors').value

    let obj = {
        webport: weblocalport,
        apiport: apilocalport,
        autorun: (autorunEnabled == 'Enable') ? true : false,
        cors: cors
    }

    window.mainprocess.setBrokerCFG(obj)
    router.push('/sql_edit')
}
</script>

<template>
    <Navbar>
        <template #body>
            <div class="row">
                <div class="col-12">
                    <div class="h2 mb-4">Database Config</div>
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
                    <div class="col-4">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="web-local-port">Web Local Port</label>
                            <input
                                id="web-local-port"
                                type="text"
                                class="form-control"
                                :value="brokerCFG.webport"
                                autofocus
                            />
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="api-local-port"> API Local Port </label>
                            <input
                                id="api-local-port"
                                type="text"
                                class="form-control"
                                :value="brokerCFG.apiport"
                            />
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="autorun">Autorun</label>
                            <select
                                v-model="autorun"
                                id="autorun"
                                name="autorun"
                                class="form-select"
                                aria-label="Autorun?"
                            >
                                <option value='Disable'>
                                    Disable
                                </option>
                                <option value='Enable'>
                                    Enable
                                </option>
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
