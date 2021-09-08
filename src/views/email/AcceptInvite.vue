<!-- Accepts or Declines an invitation - invitation emails link to this page -->
<template>
  <div>
    <div v-if="!loaded" v-t="'Invite.loading'" />
    <div v-else-if="invalid || declined || accepted">
      <b-card class="inviteMessageBox"
              :title="$t('Invite.message_title')"
      >
        <p>
        <span v-if="invalid" v-t="'Invite.message-invalid'" />
        <span v-else-if="declined" v-t="'Invite.message-declined'" />
        <span v-else-if="accepted" v-t="'Invite.message-accepted'" />
        </p>
        <template #footer>
          <b-button v-if="isLoggedIn" variant="primary" to="/" class="alignRight pl-4 pr-4" v-t="'General.ok_button'" />
          <div v-else class="d-flex justify-content-around">
            <b-button variant="primary" :href="externalLinks.morphicHome" v-t="'Invite.home-page_button'" />
            <b-button variant="primary" to="/"><b-icon icon="box-arrow-in-right"/>{{ $t('Invite.sign-in_button') }}</b-button>
          </div>
        </template>
      </b-card>
    </div>
    <div v-else style="height: calc(100vh - 90px)" >
      <TwoColumnDialog
              id="AcceptInviteDialog"
              visible="visible"
              no-close
              hide-backdrop
              no-fade

              dialog-class="acceptInviteDialog"

              :title="register ? $t('Invite.dialog-register_title') : $t('Invite.dialog-sign-in_title')"

              :ok-title="register ? $t('Invite.ok-register_button') : $t('Invite.ok-sign-in_button')"
              :cancel-title="$t('Invite.cancel_button')"

              @ok="$event.promise = acceptInvite()"
              @hide.prevent="confirmDecline"
              @shown="dialogShown"
      >
        <template #form>

          <div ref="FormContent" aria-live="polite" aria-atomic="true">
            <template v-if="register">
              <p v-t="'Invite.register-form-lead'" />

              <UserRegistration ref="UserRegistration"
                                no-buttons
                                stay-on-page
                                existing-account-button
                                :initial-email="invitation.email"
                                :email-description="$t('Invite.register-email_description')"
                                @existing-account="changeContent(false)"
              />
            </template>
            <template v-else>
              <p v-t="'Invite.sign-in-form-lead'" />

              <UserLogin ref="UserLogin"
                         form-only
                         link-events
                         :initial-email="invitation.email"
                         @reset-password="showMessage('reset')"
                         @create-account="changeContent(true)"
              />

              <div class="mb-4 mt-4 text-center">
                <b-button variant="link" @click="changeContent(true)" v-t="'Invite.sign-in-register_link'" />
              </div>

            </template>
          </div>
        </template>


        <template #info-heading v-t="'Invite.info_heading'" />

        <template #info>
          <p v-t="'Invite.info-p1'" />
          <p v-t="'Invite.info-p2'" />
          <p>
            <b-link :href="externalLinks.learnMore" v-t="'Invite.info-learn-more_link'" />
          </p>
        </template>

      </TwoColumnDialog>
    </div>
  </div>
</template>

<style lang="scss">
.acceptInviteDialog {
  .dialog-info {
    padding-left: 2em;
    padding-right: 2em;
  }
}


.inviteMessageBox {
  max-width: 400px;
  margin: 5em auto;
}

body:not(.isMobile) #AcceptInviteDialog {
  pointer-events: none;
  & > * {
    pointer-events: auto;
  }
}
</style>

<script>

import TwoColumnDialog from "@/components/dialogs/TwoColumnDialog";
import UserRegistration from "@/components/UserRegistration";
import { getInvitation } from "@/services/userService";
import UserLogin from "@/components/UserLogin";
import { acceptCommunityMemberInvite } from "@/services/communityService";


export default {
    name: "AcceptInvite",
    components: {UserLogin, UserRegistration, TwoColumnDialog},
    data() {
        return {
            loaded: false,
            errorAlert: false,
            errorMessage: null,

            /** @type {Invitation} */
            invitation: {},

            /** @type {"invalid"|"declined"|"accepted"} */
            state: null,

            /** @type {Boolean} true to show the registration form, otherwise show sign-in. */
            register: this.page === "register"
        };
    },
    props: {
        /** @type {"accept"|"reject"|"report"} */
        action: String,
        id: String,
        page: String
    },
    async mounted() {
        this.loaded = false;
        this.invitation = await getInvitation(this.id).catch(err => {
            if (err.response?.status === 404) {
                this.state = "invalid";
                err.handled = true;
            }
        });
        this.loaded = true;
    },
    computed: {
        accepted: function () {
            return this.state === "accepted";
        },
        declined: function () {
            return this.state === "declined";
        },
        invalid: function () {
            return this.state === "invalid";
        },
        formComponent: function () {
            return this.register ? this.$refs.UserRegistration : this.$refs.UserLogin;
        }
    },
    methods: {
        /**
         * Changes the content of the form, between registration and sign-in.
         * @param {Boolean} register show the registration form.
         */
        changeContent: function (register) {
            if (register !== this.register) {
                this.$refs.FormContent.classList.add("fade");
            }
            setTimeout(() => {
                this.register = register;
                this.$refs.FormContent.classList.remove("fade");
            }, 200);
        },

        /**
         * Called when the dialog has been shown.
         */
        dialogShown: function () {
            if (this.action === "reject") {
                this.confirmDecline();
            }
        },

        /**
         * Present a confirmation dialog, then decline the invite.
         * @return {Promise} Resolves when done.
         */
        confirmDecline: async function () {
            if (!this.state) {
                const confirm = await this.showConfirm(
                    this.$t("Invite.confirm-decline_message"),
                    [this.$t("Invite.confirm-decline-yes_button"), this.$t("Invite.confirm-decline-no_button")],
                    this.$t("Invite.confirm-decline_title"),
                    {dangerous: true});

                if (confirm) {
                    this.state = "declined";
                }
            }
        },

        /**
         * Accepts the invite.
         * @return {Promise} Resolves when done.
         */
        acceptInvite: async function () {
            const success = await this.formComponent.onSubmit(true);
            if (success) {
                await acceptCommunityMemberInvite(this.invitation.communityId, this.invitation.invitationId);

                // Go to email confirmation
                this.$router.push({name: "ConfirmEmail.Registered"});
            }
            return success;
        }
    }
};
</script>
