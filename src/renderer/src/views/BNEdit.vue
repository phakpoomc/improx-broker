<script setup>

import Navbar from "../layout/Navbar.vue";
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue'

const route = useRoute();
const router = useRouter();

const user = ref();

user.value = await window.mainprocess.getUsername();

var dt = new Date();

const bnCFG = ref();

bnCFG.value = await window.mainprocess.getCFG(route.params.id);

console.log('CFG: ', bnCFG.value);

console.log('Param: ', route.params.id);

function save()
{
  let bnName = document.getElementById('bn-name').value;
  let siteid = document.getElementById('siteid').value;
  let nodeid = document.getElementById('nodeid').value;
  let meter_names = [];

  for(let i=0; i<30; i++)
  {
    let m = document.getElementById('meter-'+String(i)).value;

    meter_names.push(m);
  }
  
  let obj = {
    'bn_name': bnName,
    'siteid': siteid,
    'nodeid': nodeid,
    'meter_names': meter_names
  };

  window.mainprocess.updateBN(obj);

  router.go();
}

function reset(key)
{
  window.mainprocess.resetBN(key);
  console.log(key);
  router.push('/');
}
</script>

<template>
  <Navbar>
    <template #body>
      <div class="row mb-4">
        <div class="col-3">
          <div class="setting-input mb-2">
            <label class="mb-2 text-muted" for="bn-name">Blacknode Name</label>
            <input id="bn-name" type="text" class="form-control" name="bn-name" :value="bnCFG.name" required autofocus>
          </div>
          <div class="setting-input mb-2">
            <label class="mb-2 text-muted" for="bn-sn">Serial Number</label>
            <input id="bn-sn" type="text" class="form-control" name="bn-sn" :value="bnCFG.serial" disabled>
          </div>
        </div>
        <div class="col-3">
          <div class="setting-input mb-2">
            <label class="mb-2 text-muted" for="siteid">Site ID</label>
            <input id="siteid" type="text" class="form-control" name="siteid" :value="bnCFG.siteid" required autofocus>
          </div>
          <div class="setting-input mb-2">
            <label class="mb-2 text-muted" for="nodeid">Node ID</label>
            <input id="nodeid" type="text" class="form-control" name="nodeid" :value="bnCFG.nodeid" required autofocus>
          </div>
        </div>
        <div class="col-3">
          <div class="setting-input mb-2">
            <label class="mb-2 text-muted" for="meteron"># Meter On</label>
            <input id="meteron" type="text" class="form-control" name="meteron" :value="bnCFG.meteron" disabled>
          </div>
          <div class="setting-input mb-2">
            <label class="mb-2 text-muted" for="meteroff"># Meter Off</label>
            <input id="meteroff" type="text" class="form-control" name="meteroff" :value="bnCFG.meteroff" disabled>
          </div>
        </div>
        <div class="col-3">
          <div class="setting-input mb-2">
            <label class="mb-2 text-muted" for="metercount"># Total Meter</label>
            <input id="metercount" type="text" class="form-control" name="metercount" :value="bnCFG.metercount"
            disabled>
          </div>
          <div class="setting-input mb-2">
            <label class="mb-2 text-muted" for="bn-lastupdate">Last Update</label>
            <input id="bn-lastupdate" type="text" class="form-control" name="bn-lastupdate" :value="bnCFG.last_update.toLocaleString()"
            disabled>
          </div>
        </div>
        <div class="col d-flex justify-content-end">
          <button class="btn btn-success" @click="save()">
            Save
          </button>
          <button class="btn btn-danger" @click="reset(route.params.id)">
            Reboot
          </button>
        </div>
      </div>
      <div class="row">
        <div class="col-7 ">
          <table id='meter-table' class="table table-bordered">
            <tr>
              <th style="text-align: center">
                ID
              </th>
              <th>
                Meter Name
              </th>
              <th style="text-align: center">
                Status
              </th>
              <th>
                Last Update
              </th>
            </tr>
            <template v-for="m in bnCFG.meter_list">
              <tr>
                
                <template v-if="m.name === 'undefined'">
                  <td style="text-align: center"> {{ m.id }}</td>
                  <td>
                    <input :id="'meter-'+m.id" type="text" class="form-control border-1 mt-1 mb-1" :name="'meter-'+m.id" value="" disabled>
                  </td>
                  <td style="text-align: center"> N/A </td>
                  <td></td>
                </template>
                <template v-else>
                  <td style="text-align: center"> {{ m.id }}</td>
                  <td>
                    <input :id="'meter-'+m.id" type="text" class="form-control border-1 mt-1 mb-1" :name="'meter-'+m.id" :value="m.name" required autofocus>
                  </td>
                  <td style="text-align: center"> {{ m.status }}</td>
                  <td> {{ m.last_update.toLocaleString() }}</td>
                </template>
                
                
              </tr>
              
            </template>
          </table>
        </div>
        <div class="col-4">
          <h4>User Manage</h4>
          <div class="mb-3">
            <div class="input-group flex-nowrap">
              <span class="input-group-text" id="addon-wrapping">Admin</span>
              <input type="text" class="form-control" id="username" name="username">
            </div>
          </div>
          <div class="mb-3">
            <div class="input-group flex-nowrap">
              <span class="input-group-text" id="addon-wrapping">Password</span>
              <input type="text" class="form-control" id="password" name="password">
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #username>
      {{ user }}
    </template>


    <template #datetime>
      Datetime {{ dt.toLocaleString() }}
    </template>
  </Navbar>

</template>

<style lang="css">
@import '../assets/css/bootstrap.css';
</style>
