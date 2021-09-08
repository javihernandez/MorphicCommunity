
import * as communityService from "@/services/communityService";
import { MESSAGES } from "@/utils/constants";
import { deleteCommunityBar } from "@/services/communityService";
import { resendEmailConfirmation } from "@/services/userService";

/**
 * Mix-in for member management related things.
 * @type {Component}
 */
export const membersMixin = {
    methods: {
        /**
         * Deletes a member (from the community).
         * @param {CommunityMember} member The member to delete.
         * @param {Boolean} force Force the operation, without confirming with the user.
         * @param {Boolean} keepRoute Keep the current route, and don't redirect to the home page.
         * @return {Promise<Boolean>} Resolves with true if the member was deleted.
         */
        memberDelete: async function (member, force, keepRoute) {
            const confirmed = force ||
                await this.showConfirm(
                    this.$t("members.delete.confirm", {member: member.displayName}),
                    [
                        this.$t("members.delete.apply_button", {member: member.displayName}),
                        this.$t("members.delete.cancel_button")
                    ],
                    this.$t("members.delete.title"),
                    {
                        dangerous: true
                    });

            const req = confirmed && communityService.deleteCommunityMember(this.communityId, member.id);
            return req && this.requestToBool(req, MESSAGES.successfulMemberDelete).then(success => {
                if (!keepRoute) {
                    this.$router.push("/");
                }
            });
        },

        /**
         * Reloads a member's data.
         * @param {CommunityMember} member The member (gets updated).
         * @return {Promise<CommunityMember>} Resolves with the new data.
         */
        memberReload: async function (member) {
            return communityService.getCommunityMember(this.communityId, member.id).then(getResponse => {
                Object.assign(member, getResponse.data);
                return getResponse.data;
            });
        },

        /**
         * Updates some of a member's details to the API service.
         *
         * The member's data is first refreshed, so stale information is not re-added. The member object passed
         * gets updated with the fresh data, and with the new data if successful.
         *
         * @param {CommunityMember} member The member to update.
         * @param {CommunityMember} newData Contains only the new values to update.
         * @return {Promise<AxiosResponse>} Resolves with the response data.
         */
        memberUpdate: async function (member, newData) {
            // Update the user's latest information
            const latest = this.memberReload(member);

            // Set the new values, and update.
            Object.assign(latest, newData);
            return communityService.updateCommunityMember(this.communityId, member.id, member).then(updateResponse => {
                // Add the new data to the member object.
                Object.assign(member, newData);
                return updateResponse;
            });
        },

        /**
         * Changes a member's role.
         * @param {CommunityMember} member The member.
         * @param {"member"|"manager"} newRole The member's new role.
         * @param {Boolean} force Force the operation, without confirming with the user.
         * @return {Promise<Boolean>} Resolves with true if the member's role was changed.
         */
        memberChangeRole: async function (member, newRole, force) {
            const confirmed = force ||
                await this.showConfirm(
                    this.$t("members.changeRole.confirm", {member: member.displayName, role: newRole}),
                    [
                        this.$t("members.changeRole.apply_button", {role: newRole}),
                        this.$t("members.changeRole.cancel_button")
                    ],
                    this.$t("members.changeRole.title"));

            const req = confirmed && this.memberUpdate(member, {role: newRole});

            return req && this.requestToBool(req, MESSAGES.successfulRoleChange);
        },

        /**
         * Adds a bar to a member
         * @param {BarDetails} bar The bar to add.
         * @param {CommunityMember} member The member to own the bar.
         * @return {Promise} Resolves when complete.
         */
        memberAddBar: function (bar, member) {
            return this.memberUpdateBar(bar, member, true);
        },

        /**
         * Removes a bar from a member
         * @param {BarDetails} bar The bar to add.
         * @param {CommunityMember} member The member to own the bar.
         * @param {Boolean} deleteBar Delete the bar (will fail if other members still own the bar).
         * @param {Boolean} force Force the operation, without confirming with the user.
         * @return {Promise} Resolves when complete.
         */
        memberRemoveBar: async function (bar, member, deleteBar, force) {
            const confirmed = force ||
                await this.showConfirm(
                    this.$t("members.removeBar.confirm"),
                    [this.$t("members.removeBar.apply_button"), this.$t("members.removeBar.cancel_button")],
                    bar.name,
                    {
                        dangerous: true
                    });

            var togo;
            if (confirmed) {
                const updateResult = this.memberUpdateBar(bar, member, false);
                if (deleteBar) {
                    await updateResult;
                    togo = deleteCommunityBar(this.communityId, this.$route.query.barId).then((resp) => {
                        this.showMessage(MESSAGES.successfulBarDelete);
                        return true;
                    });

                } else {
                    togo = updateResult;
                }
            }
            return togo;
        },

        /**
         * Associate or disassociate a bar with a member.
         * @param {BarDetails} bar The bar.
         * @param {CommunityMember} member The member to own the bar.
         * @param {Boolean} add true to associate the bar with the member, false to remove.
         * @return {Promise} Resolves when complete.
         */
        memberUpdateBar: async function (bar, member, add) {
            // Reload the member data
            const memberResponse = communityService.getCommunityMember(this.communityId, member.id);
            Object.assign(member, memberResponse.data);

            if (add) {
                if (!member.bar_ids.includes(bar.id)) {
                    member.bar_ids.push(bar.id);
                }
            } else {
                const index = member.bar_ids.indexOf(bar.id);
                member.bar_ids.splice(index, 1);
            }

            return await communityService.updateCommunityMember(this.communityId, member.id, member);
        },

        /**
         * Invites a member to enjoy fruits of morphic.
         * @param {CommunityMember} member The chosen member.
         * @param {String} invitationEmail The email address.
         * @param {String} message Additional text for the invitation email.
         * @return {Promise} Resolves when complete.
         */
        memberInvite: async function (member, invitationEmail, message) {
            try {
                await communityService.inviteCommunityMember(this.communityId, member.id, invitationEmail, message);
            } catch (err) {
                if (err.response?.data?.error === "email_verification_required") {
                    err.handled = true;
                    const resend = !await this.showConfirm("Until you have confirmed your own email address, you are unable to invite other members.", ["OK", "Resend confirmation email"]);
                    if (resend) {
                        await resendEmailConfirmation(this.userId);
                    }
                }
                throw err;
            }
            member.state = "invited";
            return true;
        },

        /**
         * Renames a member
         * @param {CommunityMember} member The member.
         * @param {String} newName The new name.
         * @return {Promise} Resolves when complete.
         */
        memberRename: function (member, newName) {
            const response = this.memberUpdate(member, { first_name: newName, last_name: null });
            return this.requestToBool(response, MESSAGES.successfulMemberRename);
        },

        /**
         * Checks if a name has already been taken.
         * @param {String} name The name to check.
         * @param {CommunityMember} ignore A member to ignore (for use when renaming a member).
         * @return {Boolean} true if there is already a member with the given name.
         */
        memberCheckDuplicate: function (name, ignore) {
            return this.members.some(m => {
                return m.fullName === name && (!ignore || m.id !== ignore.id);
            });
        }

    }
};
