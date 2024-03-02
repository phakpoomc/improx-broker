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
                  <span class="input-group-text" id="addon-wrapping"><i class="fa-solid fa-user"></i></span>
                  <input type="text" class="form-control" id="username">
                </div>
              </div>
              <div class="mb-3">
                <div class="input-group flex-nowrap">
                  <span class="input-group-text" id="addon-wrapping"><i class="fa-solid fa-lock"></i></span>
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
