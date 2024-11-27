<script setup>
import Navbar from '../layout/Navbar.vue'
import { ref } from 'vue'

const user = ref()

user.value = await window.mainprocess.getUsername()

var status_map = {
    on: 'Online',
    off: 'Offline',
    error: 'Equipment failure',
    setup: 'Setup'
}

const last = ref()

let cbRegistered = await window.mainprocess.isBNCBRegistered()
const bn = ref()

if (!cbRegistered) {
    window.mainprocess.getBN((data) => {
        bn.value = data
    })

    window.mainprocess.getMessage((data) => {
        last.value = data
    })

    window.mainprocess.send('registerCB', '')
} else {
    window.api.removeCB()

    window.mainprocess.getBN((data) => {
        bn.value = data
    })

    window.mainprocess.getMessage((data) => {
        last.value = data
    })

    window.mainprocess.send('registerCB', '')
}

var removeKey = null

function confirmRemove() {
    if(removeKey)
    {
        window.mainprocess.removeBN(removeKey)
    }
    
}

function remove(key) {
    removeKey = key
}

function clearMessage() {
    window.mainprocess.clearMessage()
}

function getStatusClasses(status) {
    return {
        'ms-2': true,
        status: true,
        'status-success': status === 'Online' || status === 'Setup',
        'status-danger': status === 'Offline',
        'status-warning': status === 'Equipment failure',
        'd-flex': true,
        'align-items-center': true
    }
}

function getIconClasses(status) {
    return {
        'fa-solid': true,
        'mx-2': true,
        'text-success': status === 'Online' || status === 'Setup',
        'text-danger': status === 'Offline',
        'text-warning': status === 'Equipment failure'
    }
}


</script>

<template>
    <Navbar>
        <template #body>
            <div class="modal fade" id="confirmDeleteModal" tabindex="-1" aria-labelledby="confirmDeleteModal" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="removeLabel">Blacknode Removal Confirmation</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        Do you want to remove the selected Blacknode?
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-danger" data-bs-dismiss="modal" @click="confirmRemove()">Remove</button>
                    </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <template v-for="b in bn">
                    <div class="col-4 mt-2">
                        <div class="card">
                            <div class="card-header">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    fill="currentColor"
                                    class="bi bi-laptop"
                                    viewBox="0 0 16 16"
                                >
                                    <path
                                        d="M13.5 3a.5.5 0 0 1 .5.5V11H2V3.5a.5.5 0 0 1 .5-.5zm-11-1A1.5 1.5 0 0 0 1 3.5V12h14V3.5A1.5 1.5 0 0 0 13.5 2zM0 12.5h16a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 12.5"
                                    />
                                </svg>
                                <b class="align-middle ms-1"> {{ b.name }} </b>
                                <a
                                    class="link-opacity-100 text-secondary float-end"
                                    data-bs-toggle="modal"
                                    data-bs-target="#confirmDeleteModal"
                                    @click="remove(b.serial)"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        fill="currentColor"
                                        class="bi bi-x"
                                        viewBox="0 0 16 16"
                                    >
                                        <path
                                            d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"
                                        />
                                    </svg>
                                    <!-- <button type="button" class="btn btn-danger" @click="remove(b.name)"> Remove </button> -->
                                </a>
                            </div>
                            <div class="card-body">
                                <!-- <h5 class="card-title"> ข้อมูล </h5> -->
                                <!-- <p class="card-text">ClientID: {{ b.clientid }} </p> -->
                                <p class="card-text"><b>SerialNo:</b> {{ b.serial }}</p>
                                <p class="card-text"><b>SiteID:</b> {{ b.siteid }}</p>
                                <p class="card-text"><b>NodeID:</b> {{ b.nodeid }}</p>
                                <p class="node-status d-flex mt-2"><b>Status</b>:
                                    <div :class="getStatusClasses(status_map[b.status])">
                                        <i
                                            v-if="b.status == 'on' || b.status == 'setup'"
                                            :class="getIconClasses(status_map[b.status])"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                fill="currentColor"
                                                class="bi bi-check-circle-fill"
                                                viewBox="0 0 16 16"
                                            >
                                                <path
                                                    d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"
                                                />
                                            </svg>
                                        </i>
                                        <i
                                            v-else-if="b.status == 'error'"
                                            :class="getIconClasses(status_map[b.status])"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                fill="currentColor"
                                                class="bi bi-exclamation-circle-fill"
                                                viewBox="0 0 16 16"
                                            >
                                                <path
                                                    d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4m.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2"
                                                />
                                            </svg>
                                        </i>
                                        <i v-else :class="getIconClasses(status_map[b.status])">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                fill="currentColor"
                                                class="bi bi-x-circle-fill"
                                                viewBox="0 0 16 16"
                                            >
                                                <path
                                                    d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z"
                                                />
                                            </svg>
                                        </i>
                                        <div class="text-status me-2">
                                            {{ status_map[b.status] }}
                                        </div>
                                    </div>
                                </p>
                                
                                <p class="card-text">
                                    <b>Last:</b>
                                    {{ new Date(b.last_update).toLocaleString() }}
                                </p>
                                <div
                                    v-if="b.status === 'on' || b.status === 'setup'"
                                    class="d-flex justify-content-between"
                                >
                                    <router-link
                                        :to="'/black_node_edit/' + b.serial"
                                        type="button"
                                        class="btn btn-primary float-end"
                                        >Connect</router-link
                                    >
                                </div>
                                <div v-else class="d-flex justify-content-between">
                                    <router-link
                                        :to="'/black_node_edit/' + b.serial"
                                        type="button"
                                        class="btn btn-secondary float-end"
                                        >Connect</router-link
                                    >
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </template>

        <template #username>
            {{ user }}
        </template>

        <template #datetime>
            <br />
            

            <router-link
                :to="'/sql_edit'"
                type="button"
                class="btn btn-outline-secondary float-end mt-3"
                >Edit Connection</router-link
            >
        </template>

        <template #message>
            <div
                v-if="last && last.message != '' && last.status == 'success'"
                class="alert alert-success alert-dismissible fade show"
                role="alert"
                style="z-index: 999; position: fixed; bottom: 5px; left: 2%; width: 96%"
            >
                <strong> {{ last.status }}!</strong> {{ last.message }}
                <button
                    type="button"
                    class="btn-close"
                    data-bs-dismiss="alert"
                    aria-label="Close"
                    @click="clearMessage()"
                ></button>
            </div>
            <div
                v-if="last && last.message != '' && last.status == 'error'"
                class="alert alert-danger alert-dismissible fade show"
                role="alert"
                style="z-index: 999; position: fixed; bottom: 5px; left: 2%; width: 96%"
            >
                <strong> {{ last.status }}!</strong> {{ last.message }}
                <button
                    type="button"
                    class="btn-close"
                    data-bs-dismiss="alert"
                    aria-label="Close"
                    @click="clearMessage()"
                ></button>
            </div>
        </template>
    </Navbar>
</template>

<style lang="css">
@import '../assets/css/bootstrap.css';
</style>
