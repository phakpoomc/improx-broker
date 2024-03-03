<script setup>

</script>

<template>
  <div class="container">
    <div class="row justify-content-sm-center">
      <div class="col-xxl-7 col-xl-8 col-lg-8 col-md-8 col-sm-9">
        <div class="text-center my-5 fs-1 fw-bold">
          BLACK NODE
        </div>
        <div class="card">
          <div class="card-header">
            <h1 class="fs-4 card-title fw-bold text-center">Login</h1>
          </div>
          <div class="card-body p-3">
            <p class="text-secondary">please login with email/username and password below.</p>
            
              <div class="mb-3">
                <div class="input-group flex-nowrap">
                  <span class="input-group-text" id="addon-wrapping"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-person-fill" viewBox="0 0 16 16">
  <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
</svg></span>
                  <input type="text" class="form-control" id="username">
                </div>
              </div>
              <div class="mb-3">
                <div class="input-group flex-nowrap">
                  <span class="input-group-text" id="addon-wrapping"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-key-fill" viewBox="0 0 16 16">
  <path d="M3.5 11.5a3.5 3.5 0 1 1 3.163-5H14L15.5 8 14 9.5l-1-1-1 1-1-1-1 1-1-1-1 1H6.663a3.5 3.5 0 0 1-3.163 2M2.5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
</svg></span>
                  <input type="password" class="form-control" id="password">
                </div>
              </div>

              <div class="d-flex align-items-center justify-content-center mb-3">
                <router-link to="/" type="button" class="col-12 btn btn-primary" onclick="window.mainprocess.send('authenticate', JSON.stringify({'username': document.getElementById('username').value, 'password': document.getElementById('password').value}))">
                  Login
                </router-link>
              </div>


          </div>
        </div>
        <div class="text-center mt-5 text-muted">
          &copy; IM Solution
        </div>
      </div>
    </div>
  </div>

</template>



<style lang="css">
@import '../assets/css/bootstrap.css';
</style>
