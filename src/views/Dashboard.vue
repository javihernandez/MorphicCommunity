<template>
  <div>
      <b-alert :show="billingInfo && billingInfo.trial_end_days > 0" variant="warning" dismissible style="margin: auto">You have {{ billingInfo && billingInfo.trial_end_days }} days left of your free trial. <b-link to="/billing/plans">Click here to purchase</b-link></b-alert>
      <b-alert :show="billingInfo && billingInfo.trial_end_days < 0" variant="danger"  style="margin: auto">Your free trial has expired <b-link to="/billing/plans">Click here to purchase</b-link></b-alert>
    <div class="dashboardContent">
      <div class="sidePanelColumn">
        <SidePanel :community="community" :bars="barsList" :members="membersList" ref="SidePanel" @reload="loadData()" />
      </div>
      <template v-if="!isLite">
        <div class="col-4">
          <div v-if="membersList.length > 0" class="info-box pt-3 pb-3 pl-5">
            <h1 class="h3">Welcome to Morphic</h1>
            <!-- hints -->
            <div>
              <p class="text-left small">
                (<b-link @click="hintsSwitch" v-text="showHideHintsText"></b-link>)
              </p>
            </div>

            <div id="hints" v-if="showHints" aria-hidden="true">
              <div v-if="!hasOwnBar"
                   point-to="#MyMorphicBars .addNew"
                   v-t="'Dashboard.hints.new-bar'" />
              <div v-else point-to=".barsList .barLink"
                   v-t="'Dashboard.hints.edit-bar'" />

              <div v-if="membersList.length === 1"
                   point-to="#MembersList .addNewMember">
                {{ $t('Dashboard.hints.create-member') }}
                <ul class="mt-2 list-unstyled">
                  <li v-for="(item, index) in $t('Dashboard.hints.create-member_instructions')"
                      :key="index">{{ item }}</li>
                </ul>
              </div>
              <div v-else-if="membersList.length > 1"
                   point-to="#MembersList:not(.hasExpanded) ul li:first-child .expander"
                   v-t="'Dashboard.hints.other-bars'"/>
            </div>
            <div v-else>
              <p class="text-left small">Get started by clicking an item in the green menu to the left</p>
            </div>
          </div>
          <div v-else id="welcome">
            <div class="text-center pt-5 pb-5 bg-silver rounded">
              <b-spinner variant="success" label="..."></b-spinner><br><br>
              Loading data, please wait...
            </div>
          </div>
        </div>
        <div class="col-5 videos">
          <div v-for="(video) in videos"
               :key="video.id"
               @click="playVideo(video)"
               class="videoLink">

            <b-aspect :aspect="video.thumbRatio || '854:480'" class="videoPreview">
              <img :src="video.thumb || `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`"
                   class=""
                   alt=""
              />

              <b-iconstack class="playOverlay">
                <b-icon icon="circle-fill" class="playOutline mouseOver" scale="1.1" />
                <b-icon icon="play-circle-fill" class="mouseOut"/>
                <b-icon icon="play-circle-fill" class="mouseOver"/>

              </b-iconstack>
            </b-aspect>

            <b-button :id="`PlayVideo-${video.id}`"
                      class="videoCaption"
                      variant="link"
            >
              <span v-html="video.caption"/>
              {{video.length && `(${video.length})`}}
            </b-button>

          </div>

          <b-modal id="TutorialDialog"
                   :title="playingVideo && playingVideo.title"
                   size="lg"
                   hide-footer
                   @shown="$refs.Tutorial.start()"
              >
            <Tutorial ref="Tutorial" :tutorial-id="playingVideo && playingVideo.tutorial"
                      @done="$bvModal.hide('TutorialDialog');"/>
          </b-modal>

          <b-modal :id="'VideoDialog'"
                   dialog-class="videoDialog"
                   :title="playingVideo && playingVideo.caption"
                   ok-only
                   button-size="sm"
                   ok-title="Close"
                   centered
          >

            <div style="min-width: 1050px !important;">
              <b-aspect aspect="854:480"
                        class="videoWrapper"
              >
                <iframe v-if="playingVideo"
                        id="ytplayer" class="player" type="text/html"
                        :src="`https://www.youtube.com/embed/${playingVideo.id}?modestbranding=1&autoplay=1`"
                        allowfullscreen
                        frameborder="0"></iframe>
              </b-aspect>
            </div>
          </b-modal>


        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss">
  $primary-color: #002957;
  $secondary-color: #84c661;

  .dashboardContent {
    display: flex;
    position: relative;

    .sidePanelColumn {
      width: 15em;
      min-width: 16.66%;
    }
  }

  .videos {
    padding-top: 6em;

    & > * {
      margin-left: 2em;
    }

    .videoLink {
      width: 50%;
      position: relative;
      cursor: pointer;
      margin-bottom: 2em;

      .videoPreview {
        position: relative;
        img {
          width: 100%;
          position: absolute;
          border: 9px solid #999;
          padding: 3px;
        }
      }

      .videoCaption {
        margin-top: 10px;
        font-size: 0.8em;
        color: black;
      }

      .playOverlay {
        position: absolute;

        height: 40%;
        width: 40%;

        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);

      }

      .mouseOver, &:hover .mouseOut {
        display: none;
      }

      &:hover {
        .btn-link {
          text-decoration: underline;
        }
        .mouseOver {
          display: unset;
        }

        .playOverlay {
          color: midnightblue;
        }
      }

      .playOverlay {
        color: #666;
        .playOutline {
          color: white;
        }
      }
    }
  }

  .videoDialog {
    margin: 0.5rem auto !important;
    max-width: unset !important;
    width: max-content !important;
    .videoWrapper {
      .player {
        width: 100%;
        height: 100%;
      }
    }


    .modal-header {
      padding: 0.2rem 1rem;
    }
    .modal-body, .modal-footer {
      padding: 5px;
    }
  }

  h1 {
    font-weight: bold !important;
  }
  .info-box {
    h5 {
      color: $primary-color;
    }
  }

  .gettingStarted {
    position: relative;
    margin-bottom: 1em;
    text-decoration: underline;
    font-size: 1.1em;
    .b-icon {
      position: absolute;
      right: 100%;
      height: 100%;
    }
  }

  #hints {
    font-family: 'Coming Soon', sans-serif;
    font-weight: 600;
    width: 20em;

    & > * {
      padding-left: 0.3em;
      position: absolute;
      transition: opacity 0.35s;
      opacity: 0;
      &.show {
        opacity: 1;
      }
    }
  }
</style>

<script>
import * as ArrowLine from "arrow-line";
import SidePanel from "@/components/side-panel/SidePanel";
import {
    getCommunity,
    getCommunityBars,
    getCommunityMembers
} from "@/services/communityService";
import * as billingService from "@/services/billingService";
import Tutorial from "@/components/dashboard/Tutorial";

export default {
    name: "Dashboard",
    components: {
        Tutorial,
        SidePanel
    },
    data() {
        return {
            // data
            barsList: [],
            community: {},
            membersList: [],
            barPreviewData: {},
            showHints: true,
            showHideHintsText: "Hide hints",
            arrows: [],
            barsHintCss: {},
            billingInfo: null,
            sidePanel: null,
            hintTimer: null,

            playingVideo: null
        };
    },
    computed: {
        videos: function () {
            return [
                {
                    tutorial: "getting-started",
                    caption: this.$t("Tutorial.getting-started.link"),
                    title: this.$t("Tutorial.getting-started.title"),
                    thumb: "/img/tutorial-thumb.png",
                    thumbRatio: "756:474"
                },
                {
                    id: "7bhdSFOiJjk",
                    caption: "Making a custom MorphicBar - Basics",
                    length: "4:24"
                }
            ];
        },
        hasOwnBar: function () {
            /** @type {CommunityMember} */
            const currentMember = this.membersList.find(m => m.isCurrent);
            return currentMember?.bar_ids?.length;
        }
    },
    mounted: function () {
        this.loadData();
        // This is required to re-draw the arrows, sorry :P
        const that = this;
        this.$nextTick(function () {
            window.addEventListener("resize", function () { that.$forceUpdate(); });
        });
        this.loadBilling();
    },
    beforeDestroy: function () {
        this.cleanUpArrows();
    },
    updated() {
        this.cleanUpArrows();
        // TODO: Find a better way to detect whether the hints are displayed
        if (this.showHints && !this.isLite) {
            this.createArrows();
        }
    },
    methods: {
        loadData: function () {
            return new Promise((resolve, reject) => {
                if (!this.$route.params.community && !this.communityId) {
                    this.$store.dispatch("userCommunities", this.userId)
                        .then((communities) => {
                            // We ensure this.community has all the required fields - not only the id
                            getCommunity(communities[0].id).then((community) => {
                                this.community = community.data;
                                this.loadBars();
                                resolve();
                            });
                        })
                        .catch(err => {
                            reject(err);
                        });
                } else if (this.$route.params.community) {
                    this.community = this.$route.params.community;
                    this.$store.dispatch("activeCommunity", this.community.id)
                        .then(() => {
                            this.loadBars();
                            resolve();
                        })
                        .catch(err => {
                            reject(err);
                        });
                } else {
                    getCommunity(this.communityId)
                        .then((community) => {
                            this.community = community.data;
                            this.loadBars();
                            resolve();
                        })
                        .catch(err => {
                            reject(err);
                        });
                }
            });
        },
        loadBars: function () {
            getCommunityBars(this.community.id)
                .then(resp => {
                    const bars = resp.data.bars;
                    getCommunityMembers(this.communityId)
                        .then((resp) => {
                            this.barsList = bars;
                            this.membersList = resp.data.members;
                        })
                        .catch(err => {
                            console.error(err);
                        });
                })
                .catch(err => {
                    console.error(err);
                });
        },
        hintsSwitch: function () {
            this.showHints = !this.showHints;
            this.showHideHintsText = this.showHints ? "Hide hints" : "Show hints";
        },
        createArrows: function () {
            this.sidePanel = document.querySelector("#SidePanel");
            const hints = this.$el.querySelectorAll("#hints > *");

            hints.forEach(hint => {
                const getTarget = () => document.querySelector(hint.getAttribute("point-to"));
                const target = getTarget();
                const targetRect = target && target.getBoundingClientRect();

                // Check if the target is hidden
                const off = targetRect && (targetRect.y <= 0 || targetRect.width === 0 || targetRect.height === 0);

                if (!hint || !target || off) {
                    if (hint) {
                        hint.classList.remove("show");
                    }
                    this.arrows.push({getTarget});
                } else {
                    hint.classList.add("show");

                    const hintRect = hint.getBoundingClientRect();
                    const sourceRect = {
                        x: hintRect.x,
                        y: targetRect.y
                    };

                    hint.style.top = `${sourceRect.y - this.sidePanel.getBoundingClientRect().y}px`;

                    const arrow = {
                        getTarget: getTarget,
                        hint: hint,
                        targetRect: targetRect,

                        sourcePoint: {
                            x: sourceRect.x - 1,
                            y: sourceRect.y + 10 + window.scrollY
                        },
                        targetPoint: {
                            x: targetRect.x + targetRect.width + 5,
                            y: targetRect.y + targetRect.height / 2 + 2 + window.scrollY
                        }
                    };

                    arrow.arrowLine = new ArrowLine(arrow.sourcePoint, arrow.targetPoint, {
                        curvature: 0.5,
                        forceDirection: "horizontal"
                    });

                    this.arrows.push(arrow);
                }
            });
            this.hintTimer = setTimeout(this.checkHints, 1500);
        },
        checkHints: function () {
            try {
                const changed = this.arrows.some(arrow => {
                    const newRect = arrow.getTarget()?.getBoundingClientRect();
                    return (!newRect !== !arrow.hint) || newRect?.y !== arrow.targetRect?.y;
                });

                if (changed) {
                    this.cleanUpArrows();
                    this.createArrows();
                }
            } finally {
                this.hintTimer = setTimeout(this.checkHints, 1500);
            }
        },
        cleanUpArrows: function () {
            this.arrows.forEach(arrow => {
                if (arrow.arrowLine) {
                    arrow.arrowLine.remove();
                }
            });
            this.arrows = [];
            if (this.hintTimer) {
                clearTimeout(this.hintTimer);
                this.hintTimer = null;
            }
        },
        loadBilling: function () {
            return billingService.getBillingInfo(this.communityId).then((info) => {
                this.billingInfo = info.data;
            });
        },
        playVideo: function (video) {
            if (video.url) {
                window.location = video.url;
            } else {
                this.playingVideo = video;
                // Show in the next tick, to allow the dialog content to load.
                this.$nextTick(() => {
                    if (video.tutorial) {
                        this.$bvModal.show("TutorialDialog");
                    } else {
                        this.$bvModal.show("VideoDialog");
                    }
                });
            }
        }
    }
};
</script>
