<script setup>

  import Navbar from "../layout/Navbar.vue";
  import { useRoute } from 'vue-router';

  const route = useRoute();

  console.log('Param: ', route.params);

</script>
<template>
    <Navbar />  
    Meter Data page
    <br />
    [CONTENT HERE]
</template>

<style lang="css">
    @import '../assets/css/bootstrap.css';
</style>
