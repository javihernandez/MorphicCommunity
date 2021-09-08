<template>
  <div id="SidePanel">
    <div class="panelSection">
      <div class="accountName">{{ community.name }}</div>
      <!-- temporarily removed
      <div class="accountInfo">
        <b-link :to="{ name: 'MyCommunity'}" ><b-icon icon="gear-fill" />{{ $t('SidePanel.account-settings_link') }}</b-link>
      </div>
      -->

      <!-- member's own bars -->
      <div class="panelDetails" >
        <div class="header">
          <h2 id="OwnBarsHeading" v-t="'SidePanel.own-bars_heading'" />
        </div>
        <div>
          <BarsList ref="BarsList"
                    :button-attrs="buttonAttrs"
                    id="MyMorphicBars"
                    :bars="bars"
                    :activeBarId="activeBarId"
                    :member="currentMember"
                    @newbar="newBar(currentMember)"
          />
        </div>
      </div>
    </div>

    <!-- managed members -->
    <div v-if="isManager" class="panelSection">
      <h2 id="OtherBarsHeading" v-t="'SidePanel.other-bars_heading'" />
      <MembersList ref="MembersList"
                   id="MembersList"
                   :button-attrs="buttonAttrs"
                   :members="members"
                   :community="community"
                   :activeBarId="activeBarId"
                   :bars="bars"
                   :activeMemberId="activeMemberId"
                   :expandedMembers="expandedMembers"
                   @newbar="newBar($event)"
                   @addMember="showModalDialog('NewMemberDialog')"
                   @memberDetails="showMemberDetails($event)"
                   aria-labelledby="OtherBarsHeading"
      />
    </div>

    <!-- hiding group bars for now -->
    <div v-if="false" class="panelSection">
      <!-- group bars -->
      <h2 v-t="'SidePanel.group-bars_heading'" />
      <BarsList ref="BarsList"
                :bars="bars"
                :activeBarId="activeBarId"
                @newBar="newBar()"
      />
    </div>

    <MemberDetailsDialog v-if="memberDetails" id="SidePanelMemberDetailsDialog"
                         :member-details="memberDetails"
                         :members="members"
                         :active-member-id="activeMemberId"
                         @close="reloadAll()"
    />

    <NewMemberDialog id="NewMemberDialog"
                     :bars="bars"
                     :members="members"
                     :community="community"
                     @ok="$event.promise = addMember($event.data.name)"
    />

    <b-modal  id="NewMemberConfirm"
              ok-only
    >
      <template #modal-title>Person added: {{ newestMember && newestMember.displayName }}</template>
      <p id="NewMemberNextSteps">Next steps:</p>
      <ol aria-labelledby="NewMemberNextSteps">
        <li>Add buttons to the person's bar.</li>
        <li>Save the bar (when it's done).</li>
        <li>Invite the person.</li>
      </ol>
    </b-modal>
  </div>
</template>

<style lang="scss">
  @import "~@/styles/_bootstrap-util.scss";

  #SidePanel {
    font-size: 1rem;
    padding-top: 0.5em;

    h2, h3, h4, h5 {
      font-weight: bold;
      font-size: 1em;
      margin: 1em 0 0.5em 0;
    }

    .accountName {
      margin-top: 0;
      font-size: 1.5em;
      font-weight: bold;
    }

    .accountInfo {
        margin-bottom: 1em;
    }

    h2 {
      margin-top: 3em;
    }

    h2, h3, h4 {
      margin: 4px 2px;
    }

  }

  $indent: 0.1em;

  // non-mobile
  body:not(.isLite) #SidePanel {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    flex-wrap: nowrap;

    & > *:last-child {
      flex-grow: 1;
    }

    min-height: 600px;

    padding-left: 1px;

    .btn-link, a {
      color: inherit;
      text-decoration: underline;
    }

    .panelSection {

      background-color: $morphic-green-color;
      color: white;
      padding: 0.5em;
      margin-bottom: 0.5em;
    }

  }

  #SidePanel {

    .buttonRow {
      button:first-child {
        margin-right: 1em;
      }

      button {
        font-size: 80%;
      }
    }

    $panelDetailsCollapsed-color: #BFDFD0;
    $panelDetails-color: white;

    * {
      transition-duration: 0.35s;
      transition-property: background-color, color, transform, opacity, height;
    }

    $detailsPadding: 0.5em;

    .panelSection {
      border-radius: 8px;

      .panelDetails {

        position: relative;

        margin-top: 0.5em;
        padding: $detailsPadding 0;
        border-radius: 8px;

        font-size: 0.95em;

        & > :not(.unpadded) {
          padding: 0 $detailsPadding;
        }

        background-color: $panelDetails-color;
        &.expandable:not(.expanded) {
          background-color: $panelDetailsCollapsed-color;
        }

        color: black;
        .btn-link, a {
          color: $morphic-blue-color;
          text-decoration: underline;
        }


        .btn-none {
          padding: 0;
        }
        .btn:not(.btn-none) {
          margin-top: 0.5em;
        }

        &.active {
          background-color: lighten($panelDetails-color, 7%);
        }

        &.expanded {
          .header .expander {
            // Turn the icon around
            svg {
              transform: rotate(180deg) scale(1.2);
            }
          }
        }

        .whenExpanded {
          transition-property: opacity;
          opacity: 0;
          filter: none;
        }
        &.expanded .whenExpanded {
          opacity: 1;
        }

        &:not(.expanded):not(.anim) {
          .whenExpanded {
            // Move out the way so it can't get clicked
            position: absolute !important;
            overflow: hidden;
            width: 0;
            height: 0;
            clip: rect(1px, 1px, 1px, 1px);
          }
        }

        .header {
          display: flex;
          flex-basis: 0;
          cursor: pointer;

          & > :first-child {
            flex-grow: 1;
          }

          .expander {
          }

          .memberName {
            margin: 0;
            padding: 0.3em 0.1em;
          }

          .expander {
            margin-left: 0.6em;
            order: 5;

            // make the icon round
            & > svg {
              clip-path: circle(50% at center);
              transform: scale(1.2);
            }
          }
        }

        overflow: hidden;

        .barsList {
          background-color: inherit;
          margin: 0.3em (-$detailsPadding);

          &.border-top {
            margin-top: 0.5em;
            padding-top: 3px;
            border-top-color: black !important;
          }

          & > :not(ul) {
            padding: 0 $detailsPadding;
          }

          ul {
            margin-bottom: 0.2em;
            font-size: 1.1em;

            li {
              padding: 0.2em $detailsPadding;
              margin-bottom: 0.1em;

              line-height: 1.3em;

              &:hover {
                background-color: $list-group-hover-bg;
              }
              &.active {
                background-color: $primary-color;

                .barLink {
                  color: white !important;
                }
              }
              a {
                display: block;
              }
            }
          }
        }
      }
    }
  }

  // Mobile overrides
  body.isLite #SidePanel {
    font-size: 1.2rem;
    padding: 1em;
    //noinspection CssUnknownTarget
    background: unset;
    .accountName {
      font-size: 1.1em;
      font-weight: normal;
    }

    h2, h3, h4, h5 {
      font-weight: bold;
      font-size: 1.1em;
    }
    h3 {
      margin-top: 1em;
    }

    li > a {
      display: block;
    }

    .expander-background {
      color: $link-color-darker;
    }

    .panelDetails {
      padding: 0.5em;
      margin-right: 0;;
      &:nth-child(even) {
        background-color: #e0f1d7 !important;
      }
      &:nth-child(odd) {
        background-color: #bfdfd0 !important;
      }

      .header .btn {
        transform: scale(1.5);
        margin-left: 2em;
      }
    }

    button:not(.btn-link, .btn-none) {
      padding-left: 1.5em;
      padding-right: 1.5em;
    }

  }

  #MembersList > div:last-child {
    margin-top: 0.5em;
  }
</style>

<script>

import MembersList from "@/components/side-panel/MembersList";
import BarsList from "@/components/side-panel/BarsList";
import * as Bar from "@/utils/bar";
import * as communityService from "@/services/communityService";
import { membersMixin } from "@/mixins/members.js";
import MemberDetailsDialog from "@/components/dialogs/MemberDetailsDialog";
import { dialogMixin } from "@/mixins/dialog";
import NewMemberDialog from "@/components/dialogs/NewMemberDialog";

export default {
    name: "SidePanel",
    components: {
        NewMemberDialog,
        MemberDetailsDialog,
        MembersList,
        BarsList
    },
    mixins: [membersMixin, dialogMixin],
    props: {
        /** @type {Community} */
        community: Object,
        /**
         * All bars in the community
         * @type {Array<BarDetails>}
         */
        bars: Array,
        /** @type {Array<CommunityMember>} */
        members: Array,
        activeBarId: String,
        activeMemberId: String
    },
    mounted() {
    },
    data() {
        return {
            /** @type {CommunityMember} The member that was just added */
            newestMember: null,
            /** @type {CommunityMember} The member to show the details' dialog for. */
            memberDetails: {}
        };
    },
    computed: {
        /**
         * Get the bars owned by the current user.
         * @return {Array<BarDetails>} The bars owned by the member.
         */
        memberBars() {
            return Bar.getMemberBars(this.bars, this.currentMember);
        },
        hasOwnBar() {
            return this.memberBars.length > 0;
        },
        /**
         * @return {CommunityMember} The current member
         */
        currentMember() {
            return this.members.find(m => m.isCurrent) || {};
        },
        isManager() {
            return this.currentMember.role === "manager";
        },
        expandedMembers() {
            return this.makeArray(this.newestMember && this.newestMember.id);
        },
        buttonAttrs() {
            return this.isLite
                ? {
                    variant: "secondary",
                    size: "md"
                }
                : {
                    variant: "primary",
                    size: "sm"
                };
        }
    },
    methods: {
        reloadAll() {
            this.$emit("reload");
        },

        /**
         * Called when a component fires the newbar event.
         * @param {CommunityMember} [member] The member this bar belongs to (omit for a shared bar).
         * @param {String} [name] The name of the bar.
         * @return {Promise<BarDetails>} Resolves when the new bar has been created.
         */
        newBar(member, name) {
            return this.createBar(member, name).then(bar => {
                this.showMessage("New bar created");

                const route = Bar.getUserBarEditRoute(bar.id, member);
                this.$router.push(route);

                return bar;
            });
        },

        /**
         * Creates a new bar
         * @param {CommunityMember} [member] The member this bar belongs to (omit for a shared bar).
         * @param {String} [name] The name of the bar.
         * @return {Promise<BarDetails>} Resolves when the new bar has been created.
         */
        async createBar(member, name) {
            const barName = name || (member.isCurrent ? "My MorphicBar" : `Bar for ${member.fullName}`);

            const existingNames = this.bars.filter(b => member.bar_ids.includes(b.id)).map(b => b.name);
            let suffixNumber = 2;
            let newBarName = barName;
            while (existingNames.includes(newBarName)) {
                newBarName = `${barName} (${suffixNumber})`;
                suffixNumber++;
            }

            const bar = Bar.newBar(!member, newBarName);

            const createResponse = await communityService.createCommunityBar(this.communityId, bar);
            bar.id = createResponse.data.bar.id;

            if (member) {
                await this.memberAddBar(bar, member);
            }

            return bar;
        },

        /**
         * Adds a new member, and creates a new bar for them.
         * @param {String} name The new member's name.
         * @return {Promise<CommunityMember>} Resolves with the community member.
         */
        async addMember(name) {
            // create the new member
            const addResult = await communityService.addCommunityMember(this.communityId, {
                first_name: name,
                last_name: ""
            });

            /** @type {CommunityMember} */
            const member = addResult.data.member;

            // Create a new bar for the member
            const bar = await this.createBar(member);

            this.newestMember = member;
            this.reloadAll();

            this.showModalDialog("NewMemberConfirm").then(() => {
                this.showMessage("New member added");
                const route = Bar.getUserBarEditRoute(bar.id, member);
                this.$router.push(route);
            });


            return member;
        },
        /**
         * Shows the member details dialog.
         * @param {CommunityMember }member The member.
         */
        showMemberDetails(member) {
            this.memberDetails = member;
            this.$nextTick(() => this.$bvModal.show("SidePanelMemberDetailsDialog"));
        }
    }
};
</script>
