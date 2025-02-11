<template>
    <footer class="page-footer">
    <div class="wrapper footer_top">
      <div id="footer_text">
        <p>This site is not affiliated with the FAA, or any governing aviation body. All content contained herein is approved only for use on the VATSIM network.</p>
        <p>This site works best in Google Chrome, Mozilla Firefox, and Microsoft Edge.</p>
        <p>If you are still using Internet Explorer, move on.</p>
      </div>
      <img :src="`https://zauartcc.sfo3.digitaloceanspaces.com/${folderPrefix}/site-logo/Footer-Logo.png`" alt="" draggable="false" height="115">
    </div>
    <div class="footer-copyright">
      <div class="wrapper">
        <div class="text-lg font-bold copyright-text">Copyright &copy; <span id="full_year"></span> Chicago ARTCC</div>
        <div class="hide-on-small-only">•</div>
        <!-- Made with ♥ and (╯°□°）╯︵ ┻━┻ by Alexandra Robison and Daan Janssen. -->
        <div><router-link to="/privacy-policy" class="white-text">Privacy Policy</router-link></div>
        <div class="hide-on-small-only">•</div>
        <div><span ref="zulu_time">{{ footerTime }}</span></div>
        <div class="hide-on-small-only">•</div>
        <p class="footer_notice">Open source on <a href="https://github.com/vzauartcc" class="white-text" target="_blank" rel="noopener noreferrer">GitHub</a></p>
      </div>
    </div>
    </footer>
</template>

<script>

export default {
  data() {
    return {
      folderPrefix: window.env.VITE_FOLDER_PREFIX, // ✅ Now it's available inside the component
    };
  },
  mounted () {
    M.Modal.init(document.querySelectorAll('.modal'), {
      preventScrolling: false
    });

    this.$nextTick(() => {
      document.getElementById("full_year").innerHTML = new Date().getFullYear();
    });

  }
};
</script>

<style scoped lang="scss">
p {
  margin: 0;

  .bold {
    font-weight: 700;
  }
}

body .page-footer {
  padding: 0;

  .footer-copyright {
    display: block;
    font-size: .8rem;

    .wrapper {
      display: flex;

      div {
        margin-right: .8em;
      }
    }
  }
}

.wrapper {
  padding: 1em;
}
.footer_top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

#footer_text, .footer-copyright {
  padding: 0!important;
  min-height: 20px!important;
}

#footer_text {
  margin-right: 1em;
  line-height: 16px;

  p + p {
    margin-top: 0.4em;
  }
}


@media screen and (max-width: 575px) {
  body .page-footer .footer-copyright .wrapper {
    flex-direction: column;
    align-items: center;
  }
}

</style>
