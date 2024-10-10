<script setup>
import Navbar from '../layout/Navbar.vue'
import { useRoute, useRouter } from 'vue-router'
import { ref } from 'vue'

const route = useRoute()
const router = useRouter()

const user = ref()

user.value = await window.mainprocess.getUsername()

const bnCFG = ref()

bnCFG.value = await window.mainprocess.getCFG(route.params.id)

console.log('CFG: ', bnCFG.value)

console.log('Param: ', route.params.id)

var period = bnCFG.value.period

let period_choices = [
    { value: '1', text: '1 Minute' },
    { value: '5', text: '5 Minutes' },
    { value: '10', text: '10 Minutes' },
    { value: '15', text: '15 Minutes' },
    { value: '30', text: '30 Minutes' }
]

function save(sendack) {
    let bnName = document.getElementById('bn-name').value
    let period = document.getElementById('period').value
    let mqtt = document.getElementById('mqtt').value
    let clientip = document.getElementById('clientip').value
    let siteid = document.getElementById('siteid').value
    let nodeid = document.getElementById('nodeid').value
    let maxmeter = document.getElementById('maxmeter').value
    let subnet = document.getElementById('subnet').value
    let gateway = document.getElementById('gateway').value
    let dns = document.getElementById('dns').value

    let meters_info = []

    for (let i = 1; i <= Math.min(maxmeter, bnCFG.value.maxmeter); i++) {
        let mname = document.getElementById('meter-' + String(i) + '-name').value
        let mtype = document.getElementById('meter-' + String(i) + '-type').value

        let mobj = {
            name: mname,
            type: mtype
        }

        meters_info.push(mobj)
    }

    let obj = {
        name: bnName,
        period: period,
        mqtt: mqtt,
        clientip: clientip,
        siteid: siteid.replaceAll(/[^\w\d\(\)-]/g, ''),
        nodeid: nodeid.replaceAll(/[^\w\d\(\)-]/g, ''),
        maxmeter: maxmeter,
        subnet: subnet,
        gateway: gateway,
        dns: dns,
        meter_list: meters_info,
        sendack: sendack
    }

    window.mainprocess.updateBN(obj, route.params.id)

    router.go()
}

function reset(key) {
    window.mainprocess.resetBN(key)
    console.log(key)
    router.push('/')
}

var nodes = [
    { name: 'Node 01', status: 'online' },
    { name: 'Node 02', status: 'offline' },
    { name: 'Node 03', status: 'offline' },
    { name: 'Node 04', status: 'online' }
]
</script>

<template>
    <Navbar>
        <template #body>
            <div class="row">
                <div class="col-12">
                    <div class="h2 mb-4">Config</div>
                </div>
            </div>
            <div class="card card-body bg-light border-light mb-4">
                <div class="row mb-4">
                    <div class="col-3">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="bn-sn">Serial Number</label>
                            <input
                                id="bn-sn"
                                type="text"
                                class="form-control"
                                name="bn-sn"
                                :value="bnCFG.serial"
                                disabled
                            />
                        </div>

                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="metercount">Period</label>
                            <select
                                v-model="period"
                                id="period"
                                name="period"
                                class="form-select"
                                aria-label="Default select example"
                                required
                            >
                                <option v-for="choice in period_choices" :value="choice.value">
                                    {{ choice.text }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="bn-name">Blacknode Name</label>
                            <input
                                id="bn-name"
                                type="text"
                                class="form-control"
                                name="bn-name"
                                :value="bnCFG.name"
                                required
                                autofocus
                            />
                        </div>
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="mqtt"> MQTT Connection </label>
                            <input
                                id="mqtt"
                                type="text"
                                class="form-control"
                                name="mqtt"
                                :value="bnCFG.mqtt"
                                required
                            />
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="siteid">Site ID</label>
                            <input
                                id="siteid"
                                type="text"
                                class="form-control"
                                name="siteid"
                                :value="bnCFG.siteid"
                                required
                                autofocus
                            />
                        </div>

                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="clientip">Client IP</label>
                            <input
                                id="clientip"
                                type="text"
                                class="form-control"
                                name="clientip"
                                :value="bnCFG.clientip"
                                required
                            />
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="nodeid">Node ID</label>
                            <input
                                id="nodeid"
                                type="text"
                                class="form-control"
                                name="nodeid"
                                :value="bnCFG.nodeid"
                                required
                                autofocus
                            />
                        </div>

                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="bn-lastupdate">Last Update</label>
                            <input
                                id="bn-lastupdate"
                                type="text"
                                class="form-control"
                                name="bn-lastupdate"
                                :value="bnCFG.last_update.toLocaleString()"
                                disabled
                            />
                        </div>
                    </div>

                    <div class="col-3">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="maxmeter">Read Meter</label>
                            <input
                                id="maxmeter"
                                type="text"
                                class="form-control"
                                name="maxmeter"
                                :value="bnCFG.maxmeter"
                                required
                                autofocus
                            />
                        </div>
                    </div>

                    <div class="col-3">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="subnet">Subnet</label>
                            <input
                                id="subnet"
                                type="text"
                                class="form-control"
                                name="subnet"
                                :value="bnCFG.subnet"
                                required
                                autofocus
                            />
                        </div>
                    </div>

                    <div class="col-3">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="gateway"> Gateway </label>
                            <input
                                id="gateway"
                                type="text"
                                class="form-control"
                                name="gateway"
                                :value="bnCFG.gateway"
                                required
                                autofocus
                            />
                        </div>
                    </div>

                    <div class="col-3">
                        <div class="setting-input mb-2">
                            <label class="mb-2 text-muted" for="dns">DNS</label>
                            <input
                                id="dns"
                                type="text"
                                class="form-control"
                                name="dns"
                                :value="bnCFG.dns"
                                required
                                autofocus
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- <div class="card card-body bg-light border-light mb-4">
        <div class="row">
          <div class="col-12 h5">
            Node Member Status
          </div>
          <div class="col-12 d-flex justify-content-start">
            <div v-for="(node, index) in nodes" :key="index" class="node-member d-flex me-4">
              <div class="node-name">
                {{ node.name }}
              </div>
              <div :class="['node-status', node.status === 'online' ? 'text-success' : 'text-danger', 'ms-2']">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                  class="bi bi-circle-fill" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="8" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div> -->

            <div class="row">
                <div class="col-12 overflow-auto" style="min-height: 200px; max-height: 400px">
                    <table id="meter-table" class="table table-striped">
                        <thead class="table-dark">
                            <tr>
                                <th style="text-align: center">ID</th>
                                <th>Meter Name</th>
                                <th>Meter Type</th>
                                <th style="text-align: center">Status</th>
                                <th>Last Update</th>
                            </tr>
                        </thead>
                        <tbody class="">
                            <template v-for="m in bnCFG.meter_list">
                                <tr>
                                    <td class="align-middle" style="text-align: center">
                                        {{ m.id }}
                                    </td>
                                    <td>
                                        <input
                                            :id="'meter-' + m.id + '-name'"
                                            type="text"
                                            class="form-control border-1 mt-1 mb-1"
                                            :name="'meter-' + m.id + '-name'"
                                            :value="m.name"
                                            required
                                            autofocus
                                        />
                                    </td>
                                    <td>
                                        <input
                                            :id="'meter-' + m.id + '-type'"
                                            type="text"
                                            class="form-control border-1 mt-1 mb-1"
                                            :name="'meter-' + m.id + '-type'"
                                            :value="m.type"
                                            required
                                            autofocus
                                        />
                                    </td>
                                    <td class="align-middle" style="text-align: center">
                                        <!-- {{ m.status }} -->
                                        <div
                                            :class="[
                                                'node-status',
                                                m.status === 'on' ? 'text-success' : 'text-danger'
                                            ]"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                fill="currentColor"
                                                class="bi bi-circle-fill"
                                                viewBox="0 0 16 16"
                                            >
                                                <circle cx="8" cy="8" r="8" />
                                            </svg>
                                        </div>
                                    </td>
                                    <td class="align-middle">
                                        {{ m.last_update.toLocaleString() }}
                                    </td>
                                    <!-- </template> -->
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="row mt-3">
                <div class="col-12 d-flex justify-content-end">
                    <button class="btn btn-secondary ms-2" @click="save(false)">Save</button>
                    <button class="btn btn-secondary ms-2" @click="save(true)">Save and Send ACK</button>
                    <button class="btn btn-secondary ms-2" @click="reset(route.params.id)">
                        Reboot
                    </button>
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
