<script setup>

import Navbar from "../layout/Navbar.vue";
import { useRouter } from 'vue-router';
import { ref } from 'vue'

const router = useRouter();

const user = ref();

user.value = await window.mainprocess.getUsername();

var dt = new Date();

const bnCFG = ref();
const apiCFG = ref();

bnCFG.value = await window.mainprocess.getDBCFG();
var dialect = bnCFG.value.dialect;

apiCFG.value = await window.mainprocess.getAPICFG();

let db_choices = [{value: 'mysql', text: 'MySQL'},
                  {value: 'sqlite', text: 'SQLite'},
                  {value: 'postgres', text: 'Postgres'},
                  {value: 'mssql', text: 'MSSQL'},
                  {value: 'mariadb', text: 'MariaDB'},]

function save() {
  let host = document.getElementById('host').value;
  let port = document.getElementById('port').value;
  let dialect = document.getElementById('dialect').value;
  let dbname = document.getElementById('dbname').value
  let username = document.getElementById('username').value;
  let password = document.getElementById('password').value;

  let obj = {
    'host': host,
    'port': port,
    'dialect': dialect,
    'dbname': dbname,
    'username': username,
    'password': password
  };

  console.log(obj);

  window.mainprocess.setDBCFG(obj);

  router.push('/');
}

function saveAPI()
{
  let protocol = document.getElementById('protocol').value;
  let port = document.getElementById('api-port').value;
  let key = document.getElementById('api-key').value;

  let obj = {
    'protocol': protocol,
    'port': port,
    'key': key
  };

  window.mainprocess.setAPICFG(obj);
  router.push('/');
}

</script>

<template>
  <Navbar>
    <template #body>
      <div class="row">
        <div class="col-12">
          <div class="h2 mb-4">
            Database Config
          </div>
        </div>
      </div>
      <div class="card card-body bg-light border-light mb-4">
        <div class="row mb-4">
          <div class="col-4">
            <div class="setting-input mb-2">
              <label class="mb-2 text-muted" for="host">Host</label>
              <input id="host" type="text" class="form-control" name="host" :value="bnCFG.host" required
                autofocus>
            </div>
          </div>
          <div class="col-2">
            <div class="setting-input mb-2">
              <label class="mb-2 text-muted" for="port">Port</label>
              <input id="port" type="text" class="form-control" name="port" :value="bnCFG.port" required>
            </div>
          </div>
          <div class="col-2">
            <div class="setting-input mb-2">
              <label class="mb-2 text-muted" for="dialect">Dialect</label>
              <select v-model="dialect" id="dialect" name="dialect" class="form-select" aria-label="Default select example" required>
                <option v-for="choice in db_choices" :value="choice.value">{{ choice.text }}</option>
              </select>
      
            </div>
          </div>
          <div class="col-4">
            <div class="setting-input mb-2">
              <label class="mb-2 text-muted" for="dbname">Database Name</label>
              <input id="dbname" type="text" class="form-control" name="dbname" :value="bnCFG.dbname" required
                autofocus>
            </div>
          </div>
          <div class="col-6">
            <div class="setting-input mb-2">
              <label class="mb-2 text-muted" for="username">Username</label>
              <input id="username" type="text" class="form-control" name="username" :value="bnCFG.username" required
                autofocus>
            </div>
          </div>
          <div class="col-6">
            <div class="setting-input mb-2">
              <label class="mb-2 text-muted" for="password">Password</label>
              <input id="password" type="text" class="form-control" name="password" :value="bnCFG.password" required
                autofocus>
            </div>
          </div>
        
        </div>
      </div>

      <div class="row mt-3">
        <div class="col-12 d-flex justify-content-end">
          <button class="btn btn-secondary ms-2" @click="save()">
            Save
          </button>
        </div>
      </div>

      <div class="row">
        <div class="col-12">
          <div class="h2 mb-4">
            API Config
          </div>
        </div>
      </div>
      <div class="card card-body bg-light border-light mb-4">
        <div class="row mb-4">
          <div class="col-4">
            <div class="setting-input mb-2">
              <label class="mb-2 text-muted" for="host">Protocol</label>
              <input id="protocol" type="text" class="form-control" name="protocol" :value="apiCFG.protocol" required
                autofocus>
            </div>
          </div>
          <div class="col-2">
            <div class="setting-input mb-2">
              <label class="mb-2 text-muted" for="port">Port</label>
              <input id="api-port" type="text" class="form-control" name="api-port" :value="apiCFG.port" required>
            </div>
          </div>
          <div class="col-6">
            <div class="setting-input mb-2">
              <label class="mb-2 text-muted" for="key">Key</label>
              <input id="api-key" type="text" class="form-control" name="api-key" :value="apiCFG.key" required>
            </div>
          </div>
        
        </div>
      </div>

      <div class="row mt-3">
        <div class="col-12 d-flex justify-content-end">
          <button class="btn btn-secondary ms-2" @click="saveAPI()">
            Save
          </button>
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
