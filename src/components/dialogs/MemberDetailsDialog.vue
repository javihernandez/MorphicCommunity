<template>
  <b-modal :id="dialogId"
           dialog-class="memberDetailsDialog"
           ok-only
           ok-title="Close"
           @show="loaded = false"
           @shown="dialogShown()"
           @hidden="dialogClosed()"
           xv-if="memberDetails && memberDetails.id"
  >
    <InviteMemberDialog id="MemberDetailsDialog-inviteMemberDialog" :member="memberDetails" :members="members" />

    <template #modal-title>
      <b-icon-person-circle /> Settings for {{ memberDetails.displayName }}
    </template>

    <b-overlay :show="!loaded">
      <b-container fluid>
        <b-row>
          <b-col cols="7" >
              <ValidatedInput label="Name"
                              :validation="$v.name"
                              :errors="{ unique: 'There is already a member with this name.' }"
              />
          </b-col>

          <b-col cols="5" class="p-0">
            <div class="buttons">
              <b-button size="sm"
                        variant="invert-morphic-blue"
                        v-b-modal="'MemberDetailsDialog-inviteMemberDialog'"
                        v-t="memberDetails.status === 'invited' ? 'MemberDetails.re-invite_button' : 'MemberDetails.invite_button'"
              />

              <b-button size="sm"
                        variant="invert-danger"
                        @click="deleteMember()"
                        v-t="'MemberDetails.delete-member_button'"
              />
            </div>
          </b-col>
        </b-row>
      </b-container>
    </b-overlay>

  </b-modal>
</template>

<style lang="scss">

.memberDetailsDialog {
  .modal-body {
    .buttons {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;

      width: fit-content;
      margin-left: auto;

      .btn {
        margin: 0.5em 0;
      }
    }
  }
}

</style>

<script>
import InviteMemberDialog from "@/components/dialogs/InviteMemberDialog";
import { membersMixin } from "@/mixins/members.js";
import ValidatedInput from "@/components/ValidatedInput";
import { validationMixin } from "vuelidate";
import { required } from "vuelidate/lib/validators";

export default {
    name: "MemberDetailsDialog",
    components: {ValidatedInput, InviteMemberDialog},
    mixins: [membersMixin, validationMixin],
    props: {
        /** @type {CommunityMember} */
        memberDetails: Object,
        /** @type {Array<CommunityMember>} All members */
        members: Array,
        /** @type {GUID} */
        activeMemberId: null,
        id: String
    },
    data: function () {
        return {
            /** @type {String} The current name of the user. */
            name: null,
            /** @type {String} The name of the user when the dialog was opened. */
            originalName: null,
            isLoaded: false
        };
    },
    validations: {
        name: {
            required: required,
            unique: function (value) {
                return !this.memberCheckDuplicate(value, this.memberDetails);
            }
        }
    },
    computed: {
        dialogId: function () {
            return this.id || "MemberDetailsDialog";
        },
        loaded: {
            get: function () {
                return this.isLoaded;
            },
            set: function (newValue) {
                document.querySelectorAll(`#${this.dialogId} .modal-body input, #${this.dialogId} .modal-body button`).forEach(el => {
                    el.toggleAttribute("disabled", !newValue);
                });
                this.isLoaded = newValue;
            }
        }
    },
    methods: {
        /** Called when the dialog is shown. */
        dialogShown: async function () {
            this.loaded = false;

            await this.memberReload(this.memberDetails);
            this.originalName = (this.name = this.memberDetails.fullName);

            this.loaded = true;
        },

        /** Called when the dialog is dismissed. */
        dialogClosed: function () {
            if (this.name !== this.originalName) {
                this.memberRename(this.memberDetails, this.memberDetails.first_name);
            }
            this.$emit("close");
        },

        closeDialog: function () {
            this.$bvModal.hide(this.dialogId);
        },

        deleteMember: function () {
            const keepRoute = this.activeMemberId !== this.memberDetails.id;
            this.memberDelete(this.memberDetails, false, keepRoute).then(() => this.closeDialog());
        }
    },
    watch: {
        name: function (newValue) {
            if (newValue !== this.memberDetails.fullName) {
                this.memberDetails.first_name = (newValue === "") ? this.originalName : newValue;
                this.memberDetails.last_name = null;
            }
        }
    }
};
</script>
