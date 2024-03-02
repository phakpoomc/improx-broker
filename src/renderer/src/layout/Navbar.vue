

<template>
    <nav class="navbar navbar-expand-lg navbar-light" style="background-color: #e3f2fd;">
        <div class="container-fluid d-flex justify-content-between align-items-center">
            <div class="head-brand d-flex justify-content-between align-items-center">
                <router-link to="/" class="navbar-brand fs-4">Black Node</router-link>
                <router-link to="/" class="nav-link active">Config</router-link>
            </div>
            <div class="" id="navbarNavDropdown">
                <ul class="navbar-nav">
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink" role="button"
                            data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fa-solid fa-user"></i>
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
                        <div class="page h5 text-secondary">
                            IMBroker
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