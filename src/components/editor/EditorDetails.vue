<!-- The details displayed above the bar editor -->
<template>
  <b-container id="EditorDetails"
               class="p-0"
               :class="{ 'border-bottom': !isLite }"
               fluid="1">

    <TextInputDialog id="barNameDialog"
                     title="Rename Bar"
                     prompt="Enter the new name for the bar"
                     v-model="barDetails.name"
                     @ok="renameBar"
    />

    <template v-if="isLite">
<!--      <b-modal id="BarSettingsDialog"-->
<!--               hide-header-->
<!--               ok-only-->
<!--               ok-title="Close"-->
<!--      >-->
<!--        <BarSettings :bar-details="barDetails" is-dialog :member="memberDetails" @rename="showRenameBarDialog()"/>-->
<!--      </b-modal>-->
    </template>

    <b-row no-gutters>
      <!-- details and tabs -->
      <b-col fluid>
        <div id="BarDetails" :class="isLite && 'bg-silver rounded p-2'">
          <!-- Bar name -->
          <div class="bar-name">
            <h2>Bar: <span class="name">{{barName}}</span></h2>
            <!-- rename bar -->
            <span v-if="barDetails.name !== 'Default'" class="actions">
              <b-button variant="link" @click="showRenameBarDialog()">rename</b-button>
              <b-button variant="link" @click="deleteBar()" class="text-danger">delete</b-button>
            </span>

          </div>
          <div class="mb-1">
            <span class="lead">
              <template v-if="barMembers.length === 0">
                Shared bar
              </template>
              <template v-else-if="barMembers.length === 1">
                Person: <span class="name">{{ barMembers[0].displayName }}</span>
              </template>
              <template v-else>
                Person: <span class="name">{{ barMembers.length }} members</span>
              </template>
            </span>
          </div>
<!--          <div v-if="isLite" class="mb-2">-->
<!--            <b-link v-b-modal="'BarSettingsDialog'"><b-icon-gear-fill/>Settings for this MorphicBar</b-link>-->
<!--          </div>-->
        </div>

        <div v-if="!isLite" id="EditorTabs">

          <div class="editorTabs nav-tabs">

            <!-- Bar settings tab -->
<!--            <b-button variant="none" size="sm" class="tabButton nav-link" v-b-toggle="'settingsContent'">-->
<!--              <b-icon-gear-fill/>-->
<!--              Settings for this MorphicBar-->
<!--            </b-button>-->

<!--            <b-collapse id="settingsContent" class="tabContent" accordion="editorTabs">-->
<!--              <b-button aria-label="Close" class="close" v-b-toggle="'settingsContent'">×</b-button>-->

<!--              <BarSettings :bar-details="barDetails" :member="memberDetails" @rename="showRenameBarDialog()"/>-->
<!--            </b-collapse>-->
          </div>

        </div>
      </b-col>

      <b-col id="EditorActions" lg="fluid" xs="6" :class="isLite && 'ml-2 mr-2'">
        <b-button variant="secondary"
                  v-b-modal="'copyBarDialog'"
                  v-t="'EditorDetails.copy-bar_button'" />

        <b-button variant="secondary"
                  :disabled="!isChanged || newBar"
                  @click="revertBar"
                  v-t="'EditorDetails.revert-bar_button'" />

        <b-button variant="primary"
                  style="visibility: hidden"
                  disabled
                  v-t="'EditorDetails.try-it_button'" />

        <b-button variant="primary"
                  :disabled="!isChanged"
                  @click="saveBar"
                  v-t="'EditorDetails.save-bar_button'" />
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import TextInputDialog from "@/components/dialogs/TextInputDialog";
import * as Bar from "@/utils/bar";
import { getCommunityBar, updateCommunityBar } from "@/services/communityService";
import { membersMixin } from "@/mixins/members";

export default {
    name: "EditorDetails",
    components: {TextInputDialog},
    mixins: [membersMixin],
    props: {
        /** @type {BarDetails} */
        barDetails: Object,
        /** @type {Array<BarDetails>} */
        barsList: Array,
        /** The members who use this bar.
         * @type {Array<CommunityMember>} */
        barMembers: Array,
        isChanged: Boolean,
        memberDetails: Object,
        members: Object,
        newBar: Boolean
    },
    data() {
        return {
            barSettings: {}
        };
    },
    computed: {
        /**
         * @return {String} The bar title.
         */
        barName: function () {
            return Bar.getBarName(this.barDetails);
        },
        memberCount: function () {
            return this.members?.length || 0;
        }
    },
    methods: {
        /**
         * Shows the bar name dialog
         */
        showRenameBarDialog: function () {
            this.$bvModal.show("barNameDialog");
        },

        /**
         * Delete the bar.
         */
        deleteBar: async function () {
            const deleted = await this.memberRemoveBar(this.barDetails, this.memberDetails, true);
            if (deleted) {
                this.$router.push("/");
            }
        },

        /**
         * OK button on the bar name dialog clicked.
         * @param {TextInputOKEvent} event The event object.
         */
        renameBar: function (event) {
            // only saving the name - so, get the currently stored bar and change that.
            event.promise = getCommunityBar(this.communityId, this.barDetails.id).then(resp => {
                /** @type {BarDetails} */
                const bar = resp.data;
                bar.name = event.newValue;
                return updateCommunityBar(this.communityId, this.barDetails.id, bar).then(() => {
                    // Update the item in the full list, to reload it in the community manager component.
                    const listed = this.barsList.find(b => b.id === this.barDetails.id);
                    if (listed) {
                        listed.name = bar.name;
                    }
                    return true;
                });
            });
        },
        revertBar: function () {
            this.$emit("revert-bar");
        },
        saveBar: function () {
            this.$emit("save-bar");
        },
        closeTab: function () {
            const openTab = this.$el.querySelector(".tabContent.show");
            if (openTab) {
                this.$root.$emit("bv::toggle::collapse", openTab.id);
            }

        }
    }
};
</script>

<style lang="scss">
@import "~@/styles/bootstrap-util";

#BarDetails {
  min-width: 20em;
  flex-grow: 1;

  .name {
    font-weight: bold;
  }

  .bar-name {
    h2 {
      margin-bottom: 0;
      display: inline-block;
      font-weight: normal;
    }
    .actions .btn {
      margin-left: 1.5em;
    }
  }
  &.rounded {
    border-radius: 0.6rem !important;
  }
}


#EditorActions {
  display: grid;
  align-content: center;
  grid-template-columns: auto auto;

  column-gap: 0.5rem;
  row-gap: 0.5rem;

  margin: 0.5em auto 0.5em auto;

  .btn {
    font-size: 0.9rem;
    min-width: max-content;
  }
}

#EditorTabs {
  display: flex;
  align-items: center;

  .state-invited, .state-uninvited {
    color: $danger;
  }

  & > :not(:last-child) {
    margin-right: 1em;
  }

  .editorTabs {
    margin-bottom: -1px;

    .tabButton {
      display: inline-block;
      position: relative;
      z-index: $zindex-dropdown + 2;

      background-color: #fff;

      outline: unset;
      box-shadow: none;

      &:focus-visible {
        border-color: $gray-800;
      }
      &.not-collapsed {
        border-color: $border-color $border-color #fff;
      }
      border-bottom-color: $border-color;
    }

    .tabContent {
      background-color: white;
      position: absolute;

      z-index: $zindex-dropdown;

      max-width: 70%;
      min-width: 25rem;

      border: $border-width solid $border-color;
      border-radius: 0 3px 3px 3px;
      box-shadow: 3px 3px 5px 0 rgba(0, 0, 0, 0.5);

      &.show {
        z-index: $zindex-dropdown + 1;
      }

      & > div {
        margin-top: 0;
        padding: 0.3rem;
      }

    }
    .card {
      border: 0;
      .card-body {
        padding: 0.5rem;
      }
    }

  }

  .barSelection {
    width: unset !important;
  }

  .userInvitationStatusArea {
    flex-grow: 1;
    text-align: right;

    .dot {
      height: 13px;
      width: 13px;
      display: inline-block;
      border-radius: 50%;
      vertical-align: middle;

      &.active-state { background-color: #3bc03b; }
      &.invited-state { background-color: #f3c702; }
      &.uninvited-state { background-color: #f20202; }
    }

    .linkStyling {
      border: none;
      background: inherit;
      color: #069;
      cursor: pointer;
    }
  }
}

.tab-content .dialogCard .card-title {
  border-bottom: none !important;
  padding-bottom: 0;
  font-size: 1.1em;
}

</style>
