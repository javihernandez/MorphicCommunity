<!-- A dialog to add a new member -->
<template>
  <TwoColumnDialog
          :id="dialogId"
          :title="$t('NewMember.title')"

          :ok-title="$t('NewMemberDialog.add_button')"
          :cancel-title="$t('NewMemberDialog.cancel_button')"

          @ok="$emit('ok', $event)"
          @show="onShow"

          :form-data="newMember"

          :v="$v"
  >
    <template #info-heading>
      {{ $t('NewMemberDialog.steps_heading') }}
    </template>

    <template #info>
      <p id="ManagerSteps" v-t="'NewMemberDialog.manager-steps'" />

      <ol aria-labelledby="ManagerSteps">
        <li v-for="(item, index) in $t('NewMemberDialog.manager-steps_list')"
            :key="index"
        >{{ item }}</li>
      </ol>

      <p v-t="'NewMemberDialog.steps-info'" />

      <p id="MemberSteps" v-t="'NewMemberDialog.member-steps'" />
      <ol aria-labelledby="MemberSteps">
        <li v-for="(item, index) in $t('NewMemberDialog.member-steps_list')"
            :key="index"
        >{{ item }}</li>
      </ol>

      <p v-t="'NewMemberDialog.member-steps_info'" />
    </template>

    <template #form>
      <p v-t="'NewMemberDialog.lead'" />

      <p v-if="billingPlan && community">
            <span v-if="community.member_limit && community.member_limit > 0 && community.member_limit < 0xffff"
            >{{ $t('NewMemberDialog.member-plan-limit', {limit: community.member_limit, plan:billingPlan.sizeName}) }}</span>
      </p>

      <ValidatedInput id="name"
                      class="pt-4"
                      :label="$t('NewMemberDialog.name_label')"
                      :validation="$v.newMember.name"
                      :errors="{ unique: $t('NewMemberDialog.name-duplicate_error') }"
      />

    </template>

  </TwoColumnDialog>

</template>

<style lang="scss">

</style>

<script>

import {dialogMixin} from "@/mixins/dialog.js";
import ValidatedInput from "@/components/ValidatedInput";
import { required } from "vuelidate/lib/validators";
import { membersMixin } from "@/mixins/members";
import { getCurrentPlan } from "@/utils/billing";
import TwoColumnDialog from "@/components/dialogs/TwoColumnDialog";

export default {
    name: "NewMemberDialog",
    components: {TwoColumnDialog, ValidatedInput},
    mixins: [dialogMixin, membersMixin],
    props: {
        /** @type {Array<BarDetails>} */
        bars: Array,
        /** @type {Array<CommunityMember>} */
        members: Array,
        /** @type {Community} */
        community: null,
        id: String
    },
    data: function () {
        return {
            loaded: false,
            dialogId: this.id || "NewMemberDialog",
            newMember: {
                name: ""
            },
            /** @type {BillingPlan} */
            billingPlan: null,
            errorAlert: false,
            errorMessage: null,
            errorMessageTitle: null
        };
    },
    validations: {
        newMember: {
            name: {
                required: required,
                unique: function (value) {
                    return !this.memberCheckDuplicate(value);
                }
            }
        }
    },
    computed: {},
    mounted() {
    },

    methods: {
        onShow: function () {
            this.newMember = { name: "" };

            getCurrentPlan(this.communityId).then(async plan => {
                await this.asyncTimer(1000);
                this.billingPlan = plan;
            });

            this.$v.$reset();
        }
    }
};
</script>
