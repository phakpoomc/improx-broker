<script setup>
    import { useRouter } from 'vue-router';

    const router = useRouter();

    function back()
    {
        router.back();
    }
</script>

<template>
    <nav class="navbar navbar-expand-lg navbar-light" style="background-color: #e3f2fd;">
        <div class="container-fluid d-flex justify-content-between align-items-center">
            <div class="head-brand d-flex justify-content-between align-items-center">
                <router-link to="/" class="navbar-brand fs-3">IM Broker</router-link>
                <router-link to="/" class="nav-link active">Home</router-link>
            </div>
            <div class="" id="navbarNavDropdown">
                <ul class="navbar-nav">
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink" role="button"
                            data-bs-toggle="dropdown" aria-expanded="false">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-person-fill" viewBox="0 0 16 16">
  <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
</svg>
                                <slot name="username"></slot>
                            
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdownMenuLink">
                            <li><router-link to="/login" class="button dropdown-item" onclick="window.mainprocess.send('logout', '')">Logout</router-link></li>
                        </ul>
                    </li>
                </ul>
            </div>

        </div>
    </nav>

    <div class="container-fluid">
        <div class="row">
            <div class="col py-3">
                <div class="row mb-3">
                    <div class="col d-flex justify-content-between">
                        <div class="btn h5 text-secondary" @click="back()">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-90deg-left" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M1.146 4.854a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 4H12.5A2.5 2.5 0 0 1 15 6.5v8a.5.5 0 0 1-1 0v-8A1.5 1.5 0 0 0 12.5 5H2.707l3.147 3.146a.5.5 0 1 1-.708.708z"/>
</svg>
                            Back
                        </div>
                        <div class="date-update">
                            <slot name="datetime"></slot>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col px-4">
                        <slot name="body"></slot>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>