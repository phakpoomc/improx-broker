<script setup></script>

<template>
    <section>
        <div class="container-fluid">
            <div class="row d-flex justify-content-center align-items-center">
                <div
                    class="col-md-6 cover-banner d-none d-sm-flex justify-content-center align-items-center"
                >
                    <img src="/src/assets/img/black_node_logo_256-01.png" class="logo-inbn" style="width: 400px;"/>
                </div>
                <div class="col-12 col-md-6">
                    <div class="card-body p-3 p-md-4 p-xl-5">
                        <div class="row">
                            <div class="col-12 mb-4">
                                <div class="mb-4">
                                    <h2>
                                        <b>Login</b>
                                    </h2>
                                </div>
                            </div>
                        </div>
                        <form action="/" method="">
                            <div class="row gy-3 gy-md-4 overflow-hidden">
                                <div class="col-12">
                                    <label for="username" class="form-label">Username </label>
                                    <input
                                        type="text"
                                        class="form-control"
                                        name="username"
                                        id="username"
                                        placeholder="Email / Username"
                                    />
                                </div>
                                <div class="col-12">
                                    <label for="password" class="form-label">Password </label>
                                    <input
                                        type="password"
                                        class="form-control"
                                        name="password"
                                        id="password"
                                        value=""
                                    />
                                </div>
                                <!-- <div class="col-12 d-flex justify-content-between">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="" name="remember_me" id="remember_me">
                    <label class="form-check-label text-secondary" for="remember_me">
                      Remember me
                    </label>
                  </div>
                  <div class="d-flex gap-2 gap-md-4 flex-column flex-md-row justify-content-md-end">
                    <a href="#!" class="link-secondary text-decoration-none">Forgot password?</a>
                  </div>
                </div> -->
                                <div class="col-12">
                                    <div class="d-grid">
                                        <router-link
                                            router-link
                                            to="/"
                                            class="btn bsb-btn-xl btn-secondary"
                                            type="submit"
                                            onclick="window.mainprocess.send('authenticate', JSON.stringify({'username': document.getElementById('username').value, 'password': document.getElementById('password').value}))"
                                            >Log in</router-link
                                        >
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- <div class="container">
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
                <span class="input-group-text" id="addon-wrapping"><svg xmlns="http://www.w3.org/2000/svg" width="20"
                    height="20" fill="currentColor" class="bi bi-person-fill" viewBox="0 0 16 16">
                    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
                  </svg></span>
                <input type="text" class="form-control" id="username">
              </div>
            </div>
            <div class="mb-3">
              <div class="input-group flex-nowrap">
                <span class="input-group-text" id="addon-wrapping"><svg xmlns="http://www.w3.org/2000/svg" width="20"
                    height="20" fill="currentColor" class="bi bi-key-fill" viewBox="0 0 16 16">
                    <path
                      d="M3.5 11.5a3.5 3.5 0 1 1 3.163-5H14L15.5 8 14 9.5l-1-1-1 1-1-1-1 1-1-1-1 1H6.663a3.5 3.5 0 0 1-3.163 2M2.5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
                  </svg></span>
                <input type="password" class="form-control" id="password">
              </div>
            </div>
            <div class="d-flex align-items-center justify-content-center mb-3">
              <router-link to="/" type="button" class="col-12 btn btn-primary"
                onclick="window.mainprocess.send('authenticate', JSON.stringify({'username': document.getElementById('username').value, 'password': document.getElementById('password').value}))">
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
  </div> -->
</template>

<style lang="css">
@import '../assets/css/bootstrap.css';
@import '../assets/css/style.css';
</style>
