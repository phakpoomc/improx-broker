<script setup>

import Navbar from "../layout/Navbar.vue";
import { ref } from 'vue'

var dt = new Date();
const user = ref();

user.value = await window.mainprocess.getUsername();


const last = ref();

let cbRegistered = await window.mainprocess.isBNCBRegistered();
const bn = ref();

if (!cbRegistered) {
  window.mainprocess.getBN((data) => {
    bn.value = data
  });

  window.mainprocess.getMessage((data) => {
    last.value = data
  });

  window.mainprocess.send('registerCB', '')
}
else {
  window.api.removeCB();

  window.mainprocess.getBN((data) => {
    bn.value = data
  });

  window.mainprocess.getMessage((data) => {
    last.value = data
  });

  window.mainprocess.send('registerCB', '')
}

function remove(key) {
  window.mainprocess.removeBN(key);
}

function clearMessage()
{
  window.mainprocess.clearMessage();
}

</script>

<template>
  <Navbar>
    <template #body>   
      <div class='container'>
        <div class='row'>
          <template v-for="b in bn">
            <div class='col-4 mt-2'>
              <div class="card">
                <div class="card-header">
                  <b class="align-middle"> {{ b.name }} </b>
                  <a class="link-opacity-100 text-secondary float-end" @click="remove(b.serial)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
                      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                    </svg>
                    <!-- <button type="button" class="btn btn-danger" @click="remove(b.name)"> Remove </button> -->
                  </a>
                </div>
                <div class="card-body">
                  <!-- <h5 class="card-title"> ข้อมูล </h5> -->
                  <!-- <p class="card-text">ClientID: {{ b.clientid }} </p> -->
                  <p class="card-text">SerialNo: {{ b.serial }} </p>
                  <p class="card-text">SiteID: {{ b.siteid }} </p>
                  <p class="card-text">NodeID: {{ b.nodeid }} </p>
                  <p class="card-text" v-if="b.status === 'on'">
                    Status: <span class="text-success fw-bold"> {{ b.status }} </span>
                  </p>
                  <p class="card-text" v-else-if="b.status === 'error'">
                    Status: <span class="text-danger fw-bold"> {{ b.status }} </span>
                  </p>
                  <p class="card-text" v-else>
                    Status: <span class="text-muted fw-bold"> {{ b.status }} </span>
                  </p>
                  <p class="card-text">Last: {{ b.last_update.toLocaleString().replace('T', ' || ') }}</p>
                  <div v-if="b.status === 'on' || b.status === 'setup'" class="d-flex justify-content-between">
                    <router-link :to="'/black_node_edit/' + b.serial" type='button'
                      class="btn btn-primary float-end">Connect</router-link>
                    <!-- <button type="button" class="btn btn-danger" @click="remove(b.name)"> Remove </button> -->
                  </div>
                  <div v-else class="d-flex justify-content-between">
                    <router-link :to="'/black_node_edit/' + b.serial" type='button'
                      class="btn btn-secondary float-end disabled">Connect</router-link>
                    <!-- <button type="button" class="btn btn-danger" @click="remove(b.name)"> Remove </button> -->
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

    </template>

    <template #username>
      {{ user }}
    </template>


    <template #datetime>
      Datetime {{ dt.toLocaleString() }}
      <br>
      <router-link :to="'/sql_edit'" type='button'
                      class="btn btn-outline-secondary float-end mt-3">Edit DB Connection</router-link>

    </template>
      
      <template #message>
      <div v-if="last && last.message != '' && last.status == 'success'" class="alert alert-success alert-dismissible fade show" role="alert" style="position: fixed; bottom: 5px; left: 2%; width: 96%;">
        <strong> {{ last.status }}!</strong> {{ last.message }}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" @click="clearMessage()"></button>
      </div>
      <div v-if="last && last.message != '' && last.status == 'error'" class="alert alert-danger alert-dismissible fade show" role="alert" style="position: fixed; bottom: 5px; left: 2%; width: 96%;">
        <strong> {{ last.status }}!</strong> {{ last.message }}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" @click="clearMessage()"></button>
      </div>
    </template>
    
  </Navbar>
</template>

<style lang="css">
@import '../assets/css/bootstrap.css';
</style>
