<template>
  <div class="  ">
    <div v-if="!community"></div>
    <div v-else>
      <TextInputDialog
              id="communityNameDialog"
              title="Rename group"
              prompt="Enter the new group name"
              v-model="community.name"
              @ok="updateCommunityName"
      />

      <b-container fluid="sm">
      <h2 class="communityName">
        {{ community.name }}
        <small>(<b-button variant="link" v-b-modal="'communityNameDialog'">Edit</b-button>)</small>
      </h2>
        <b-card v-if="plan" xno-body style="width: max-content; margin: 1em">
          <b-card-title>Plan: {{ plan.name }}</b-card-title>
          <b-card-sub-title>(up to {{plan.member_limit}} members)</b-card-sub-title>
          <b-list-group flush>
            <b-list-group-item>
              <p>Current membership: {{community.member_count}}</p>

              <b-button :to="{ name: 'Plans' }" variant="primary">Change Plan</b-button>
            </b-list-group-item>

            <b-list-group-item>
              <p>Plan renews on November 5, 2021</p>

              <b-button :to="{ name: 'BillingDetails' }" variant="primary">Billing Information</b-button>
            </b-list-group-item>
          </b-list-group>
        </b-card>

        <h3>Managers for this group</h3>
        Managers can see, remove, and invite members, make and edit Morphic Bars, pay and change subscription plans
        for the group, and remove other group members.

        <ul class="memberList">
          <li class="member" v-for="(member) in members"
              :key="member.id"
              :ref="'member_' + member.id"
              @click="toggleExpand(member)">
            <div class="memberIcon">
              <b-icon icon="person-circle"/>
            </div>
            <div class="memberContent">
              <b-link class="name" @click.self.stop="toggleExpand(member)">{{member.displayName}}</b-link>
              <div class="details">
                <span :tabindex="member.isCurrent ? -1 : undefined" :id="member.isCurrent ? 'RemoveMyself' : ''" @click.prevent.stop>
                  <b-button variant="link"
                              class="text-danger"
                              @click.prevent.stop="removeManager(member)"
                              :disabled="member.isCurrent"
                    >Remove as group manager</b-button>
                </span>
                <b-tooltip v-if="member.isCurrent"
                           target="RemoveMyself"
                           variant="warning"
                           placement="right"
                  >You cannot demote yourself.</b-tooltip>
              </div>
            </div>
          </li>
        </ul>

      </b-container>
    </div>
  </div>
</template>

<style lang="scss">
h1.communityName {
  small {
    font-size: small;
  }
  button {
    padding: 0;
  }
  &:hover button {
    opacity: 1;
  }
}

//@import "~bootstrap/scss/bootstrap";
@import "~@/styles/bootstrap-util";


.memberList {

  list-style: none;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding-inline-start: 0;

  .member {
    display: flex;
    align-items: flex-start;
    position: relative;
    padding: 0.5em;
    margin: 1px;
    width: fit-content;

    border-radius: 1em;


    & > * {
      display: inline-block;
    }

    .name {
      &:hover {
        text-decoration: none;
      }
    }

    .memberIcon {
      width: 1rem;
      margin-right: 0.5rem;
    }

    &:hover, &.expanded {
      background-color: $gray-200;
    }

    &:not(.expanded) {
      .details {
        visibility: hidden;
        height: 0;
      }
    }

    &.expanded {
      .name, .memberIcon  {
        font-size: larger;
      }
      .details {
        padding-top: 0.5em;
      }
    }
  }

  &:focus, .list-group-item:focus {
    outline: none;
  }

  &.active {
    background-color: inherit;
    color: inherit;
  }
}


</style>

<script>

import * as communityService from "@/services/communityService";
import * as billingService from "@/services/billingService";
import * as billing from "@/utils/billing";
import TextInputDialog from "@/components/dialogs/TextInputDialog";

export default {
    components: {TextInputDialog},
    data() {
        return {
            /** @type {Array<Community>} */
            communities: [],
            /** @type {Community} */
            community: null,
            /** @type {BillingInfo} */
            billingInfo: null,
            /** @type {BillingPlans} */
            plans: null,
            /** @type {Array<CommunityMember>} */
            members: [],
            /** @type {GUID} */
            selectedMember: null,
            expandedMembers: {}
        };
    },
    computed: {
        userId: function () { return this.$store.getters.userId; },
        /**
         * The current plan for the community.
         * @return {BillingPlan} The plan.
         */
        plan: function () {
            return this.plans && this.billingInfo ? this.plans[this.billingInfo.plan_id] : null;
        }
    },
    mounted() {
        communityService.getUserCommunities(this.userId)
            .then(resp => {
                this.communities = resp.data.communities;
            })
            .catch(err => {
                console.error(err);
            });
        this.loadCommunity();
        this.loadBilling();
        this.loadMembers();
    },
    methods: {
        /**
         * Loads the community details.
         * @return {Promise} Resolves when complete.
         */
        loadCommunity: function () {
            return communityService.getCommunity(this.communityId).then((community) => {
                this.community = community.data;
            });
        },

        /**
         * Loads the community members.
         * @return {Promise} Resolves when complete.
         */
        loadMembers: function () {
            return communityService.getCommunityMembers(this.communityId).then((memberResponse) => {
                var members = memberResponse.data.members;

                this.members = {};

                members.forEach(member => {
                    this.members[member.id] = member;
                });
            });
        },

        /**
         * Loads the community plan and billing details.
         * @return {Promise} Resolves when complete.
         */
        loadBilling: function () {
            return Promise.all([
                billingService.getBillingInfo(this.communityId).then((r) => {
                    this.billingInfo = r.data;
                }),
                billing.getPlans().then(plans => {
                    console.log(plans);
                    this.plans = plans;
                })
            ]);
        },

        /**
         * OK button on the community name dialog clicked.
         * @param {TextInputOKEvent} event The event object.
         */
        updateCommunityName: function (event) {
            event.promise =
                communityService.updateCommunity(this.communityId, event.newValue, this.community.default_bar_id)
                    .then(() => true);
        },

        deleteCommunity: function () {
            communityService.deleteUserCommunity(this.communityId)
                .then(resp => {
                    if (resp.status) {
                        const index = this.communities.map(item => item.id).indexOf(this.communityId);
                        this.communities.splice(index, 1);
                    }
                })
                .catch(err => {
                    console.error(err);
                });
        },

        /**
         * Toggles the detailed view of a member.
         * @param {CommunityMember} member The member.
         * @param {Boolean} [expand] true to expand, omit to toggle.
         */
        toggleExpand: function (member, expand) {
            /**
             * @type {HTMLElement}
             */
            const elem = this.$refs[`member_${member.id}`][0];
            elem.classList.toggle("expanded", expand);
        },

        /**
         * Removes a manager (making them a normal member).
         * @param {CommunityMember} member The community member.
         */
        removeManager: function (member) {

            if (!member.isCurrent) {
                const confirm = this.showConfirm(
                    `${member.fullName} will no longer be able to manage this community.`,
                    ["Remove", "Cancel"],
                    `Remove '${member.fullName}' as group manager`,
                    {
                        dangerous: true
                    });
                confirm.then(result => {
                    if (result) {
                        //
                    }
                });
            }
        }
    }
};
</script>
