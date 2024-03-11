<script setup>

import Navbar from "../layout/Navbar.vue";
import { ref } from 'vue'

var dt = new Date();
const user = ref();

user.value = await window.mainprocess.getUsername();

let cbRegistered = await window.mainprocess.isBNCBRegistered();
const bn = ref();

if(!cbRegistered)
{
  window.mainprocess.getBN((data) => {
    console.log('Received: ', data)

    bn.value = data
  });

  window.mainprocess.send('registerCB', '')
}
else
{
  window.api.removeCB();

  window.mainprocess.getBN((data) => {
    console.log('Received: ', data)

    bn.value = data
  });

  window.mainprocess.send('registerCB', '')
}

console.log(window.mainprocess);

function remove(key)
{
  console.log('Remove: ', key);
  window.mainprocess.removeBN(key);
}

</script>

<template>
  <Navbar>
    <template #body>
      <div class='container'>
        <div class='row'>
          <template v-for="b in bn">
            <div class='col-3 mt-2'>

              <input type='hidden' name='siteid' value='siteid'>
              <input type='hidden' name='host' value='sitehost'>
              <input type='hidden' name='port' value='siteport'>

              
              <div class="card">
                <div class="card-header">
                  <b> {{ b.name }} </b>
                </div>
                <div class="card-body">
                  <!-- <h5 class="card-title"> ข้อมูล </h5> -->
                  <!-- <p class="card-text">ClientID: {{ b.clientid }} </p> -->
                  <p class="card-text">SiteID: {{ b.siteid }} </p>
                  <p class="card-text">NodeID: {{  b.nodeid }} </p>
                  <p class="card-text" v-if="b.status === 'on'">
                    Status: <span class="text-success fw-bold"> {{ b.status }} </span> 
                  </p>
                  <p class="card-text" v-else-if="b.status === 'error'">
                    Status: <span class="text-danger fw-bold"> {{ b.status }} </span> 
                  </p>
                  <p class="card-text" v-else>
                    Status: <span class="text-muted fw-bold"> {{ b.status }} </span> 
                  </p>
                  <p class="card-text">Last: {{ b.last_update.toLocaleString() }}</p>
                  <router-link :to="'/black_node_edit/' + b.name" type='button' class="btn btn-primary">Connect</router-link>
                  <button type="button" class="btn btn-danger" @click="remove(b.name)"> Remove </button>
                  <!-- <button type='button' class="btn btn-secondary" data-bs-id="siteid"
                    data-bs-host="sitehost" data-bs-port="siteport" data-bs-toggle="modal"
                    data-bs-target="#addEditModal">Edit</button>
                </div> -->
              </div>
            </div>
            </div>
        </template>
        </div>
      </div>

      <!-- <div class="modal fade" id="addEditModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="exampleModalLabel">Edit</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>


              <div class="modal-body">
                <div class="row">
                  <div class="col-12">

                    <input type="hidden" name="siteid" id="siteid" value="">
                    <div class="mb-3">
                      <label for="host" class="form-label">Host</label>
                      <input class="form-control" type="text" name="host" id="host" placeholder="192.168.1.1"
                        aria-label="Host Name" required>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="mb-3">
                      <label for="Location">Port</label>
                      <input placeholder='1337' class="form-control" name="port" aria-label="Port" id="port" required>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="mb-3">
                      <label for="type">Type</label>
                      <select class="form-select" name="type" aria-label="type" id="type" required>
                        <option value="ws" selected> ws </option>

                      </select>
                    </div>
                  </div>

                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-primary">Connect</button>
                <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Cancel</button>

              </div>

          </div>
        </div>
      </div> -->
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
