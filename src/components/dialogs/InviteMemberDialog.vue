<!-- A dialog used to invite a member -->
<template>
  <TwoColumnDialog
          :id="dialogId"
          dialog-class="inviteMemberDialog"

          :title="$t('InviteMemberDialog.invite-member_title', {name: member && member.displayName})"

          :ok-title="$t('InviteMemberDialog.invite_button')"
          :cancel-title="$t('InviteMemberDialog.cancel_button')"

          @ok="$event.promise = memberInvite(member, inviteForm.email, inviteForm.phone)"
          @show="onShow"

          :v="$v"

          :form-data="inviteForm"
  >
    <template #info-heading>{{ $t('InviteMemberDialog.steps_heading') }}</template>

    <template #info>
      <p id="InviteSteps" v-t="'InviteMemberDialog.steps-lead'" />

      <ol aria-labelledby="InviteSteps">
        <li v-for="(item, index) in $t('InviteMemberDialog.steps_list')"
            :key="index"
        >{{ item }}</li>

      </ol>

      <p v-t="'InviteMemberDialog.steps-info'" />

      <p v-t="'InviteMemberDialog.email-copy'" />

    </template>

    <template #form>

      <p v-t="'InviteMemberDialog.form-lead'" />

      <ValidatedInput id="name"
                      class="pt-4"
                      :label="$t('InviteMemberDialog.email_label')"
                      required="required"
                      :validation="$v.inviteForm.email"
      />

      <div class="fromSection rounded-lg pt-2 pl-2 pr-4 mb-5">
        <h6 id="From" v-t="'InviteMemberDialog.from_heading'" />

        <div aria-labelledby="From">
          <div id="Name" :aria-label="$t('InviteMemberDialog.from-name_aria-label')">{{currentMember.displayName}}</div>
          <div id="Email" :aria-label="$t('InviteMemberDialog.from-email_aria-label')">{{userEmail}}</div>
        </div>

        <ValidatedInput id="phone"
                        class="pt-4"
                        :label="$t('InviteMemberDialog.phone_label')"
                        :description="$t('InviteMemberDialog.phone_description')"
                        :validation="$v.inviteForm.phone"
        />

      </div>

    </template>

  </TwoColumnDialog>


</template>

<style lang="scss">
.inviteMemberDialog {
  .fromSection {
    background-color: #e0f1d7;
    padding-left: 0;
    & > :not(:first-child) {
      margin-left: 1em;
    }

    #From {
      color: inherit;
      font-size: 1.3em;
    }

    #Name {
      font-weight: bold;
    }

  }
}
</style>

<script>

import { membersMixin } from "@/mixins/members";
import TwoColumnDialog from "@/components/dialogs/TwoColumnDialog";
import ValidatedInput from "@/components/ValidatedInput";
import { required, email } from "vuelidate/lib/validators";

function initialForm() {
    return {
        email: "",
        phone: ""
    };
}

export default {
    name: "InviteMemberDialog",
    components: {TwoColumnDialog, ValidatedInput},
    mixins: [membersMixin],
    props: {
        /** @type {CommunityMember} The member to invite */
        member: Object,
        /** @type {Array<CommunityMember>} The members list */
        members: Array,
        id: String
    },
    data: function () {
        return {
            inviteForm: initialForm(),
            dialogId: this.id || "InviteMemberDialog"
        };
    },
    validations: {
        inviteForm: {
            email: {
                email,
                required
            },
            phone: {}
        }
    },
    computed: {
        /**
         * @return {CommunityMember} The current member
         */
        currentMember() {
            return this.members.find(m => m.isCurrent) || {};
        },
        /**
         * @return {String} The user's email address.
         */
        userEmail() {
            return this.$store.getters.email;
        }
    },
    methods: {
        onShow: function () {
            this.inviteForm = initialForm();
            this.$v.$reset();
        }
    }
};
</script>
