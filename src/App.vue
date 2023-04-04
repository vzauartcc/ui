<template>
  <router-view v-if="hasQueryCompleted" />
  <div v-else id="loading">
    <div id="loading_box" class="z-depth-3">
      <img
        src="../src/assets/images/Discord_Logo_Two.png"
        alt=""
      />
      <h3>Please Wait...</h3>
      <h5>If stuck loading, please reload the page!</h5>
      <Spinner />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import Spinner from "@/components/Spinner.vue";

export default {
  async mounted() {
    await this.getUser();
  },
  components: {
    Spinner,
  },
  computed: {
    ...mapGetters("user", ["hasQueryCompleted"]),
  },
  methods: {
    ...mapActions("user", ["getUser"]),
  },
};
</script>

<style scoped lang="scss">
#loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

#loading_box {
  text-align: center;
  padding: 3em;

  img {
    height: 100px;
  }
}
</style>
