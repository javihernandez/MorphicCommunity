<!-- Link to the download page -->
<template>
  <b-card class="downloadCard" title="Download Morphic">
    <p>
      If you haven't downloaded and installed the Morphic app, you can now download Morphic to your computer(s).
      Morphic works on Windows 10 (v2004 or newer) and macOS (10.14 Mojave or newer).<br/>
      If your computer has one of these operating systems - the download for that OS will show up below. (If you don't know what
      version you have you can try to install Morphic. It will tell you if your computer does not qualify.
    </p>

    <div v-if="osNotSupported">
      Your current device does not appear to be compatible with Morphic. To run Morphic, you will need to run it on a
      computer with Windows 10 or Mac (Mojave or better). Try updating your operating system. Both Windows and macOS
      have free updates to new versions.
    </div>
    <div v-else class="d-flex flex-column align-items-center">
      <b-link v-if="isMac || !osKnown"
              :href="externalLinks.downloadMac"

              class="btn btn-lg btn-primary m-3"
      >Download Morphic for Mac</b-link>
      <b-link v-if="isWindows || !osKnown"
              :href="externalLinks.downloadWin"

              class="btn btn-lg btn-primary m-3"
      >Download Morphic for Windows</b-link>
    </div>

    <p>
    After downloading Morphic, you will need to install it on your computer.
    </p>

    <h3>Need help?</h3>
    <p>
    If you need help downloading or installing Morphic, try contacting the person who invited you. They might be able to
    help walk you through the steps. Their contact information is in the Morphic invitation email you got earlier.
    </p>

    <b-link :href="externalLinks.download">Support link with all available Morphic version downloads</b-link>.


  </b-card>
</template>

<style lang="scss">

body:not(.isMobile) #ConfirmEmailDialog {
  pointer-events: none;
  & > * {
    pointer-events: auto;
  }
}

.downloadCard {
  width: fit-content;
  max-width: 780px;
  margin: 5em auto;
}

</style>

<script>


import { CONFIG } from "@/config/config";

export default {
    name: "Download",
    components: {},
    data() {
        return {
            /** @type {Boolean} */
            isWindows: false,
            /** @type {Boolean} */
            isMac: false,
            /** @type {String?} */
            osVersion: null,
            /** @type {Boolean?} */
            osNotSupported: null
        };
    },
    props: {
    },
    async mounted() {
        this.loaded = false;
        this.detectOS();
        this.loaded = true;
    },
    computed: {
        /**
         * Determines if the OS is known.
         * @return {Boolean} true if the OS is either Windows or Mac (and not both).
         */
        osKnown: function () {
            return !!(this.isWindows ^ this.isMac);
        },
        forceOS: function () {
            return this.$route.query.os;
        }
    },
    methods: {
        detectOS: function () {
            // Containing Mac or Win should be enough.
            const platform = this.forceOS || navigator.platform;
            this.isMac = !!platform.match(/Mac/i);
            this.isWindows = !!platform.match(/Win/i);

            // Check the version
            if (this.osKnown) {
                let minVer;
                if (this.isMac) {
                    const m = navigator.userAgent.match(/OS X (1[0-9._]+)/);
                    this.osVersion = m && m[1].replace(/_/g, ".");
                    minVer = CONFIG.MAC_VERSION;
                } else if (this.isWindows) {
                    const m = navigator.userAgent.match(/Windows NT ([1-9][0-9._]*)/);
                    this.osVersion = m && m[1];
                    minVer = CONFIG.WIN_VERSION;
                }

                if (minVer) {
                    this.osNotSupported = this.osVersion && parseFloat(this.osVersion) < minVer;
                }
            } else {
                // Consumer devices that are definitely unsupported (chrome, ipad, iphone, android)
                if (navigator.userAgent.match(/^Mozilla\/5.0 \([^)]*\b(CrOS|iP(hone|ad)|Android)\b/)) {
                    this.osNotSupported = true;
                }
            }
            console.log(navigator.platform, navigator.userAgent);
        }
    }
};
</script>
