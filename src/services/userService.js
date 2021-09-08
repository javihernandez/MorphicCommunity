import { HTTP } from "@/services/index";

export function login(user) {
    const auth = {
        username: user.email,
        password: user.password
    };
    return HTTP.post("/v1/auth/username", auth, {action: "login"});
}

export function register(user) {
    const auth = {
        username: user.email,
        password: user.password,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName
    };
    return HTTP.post("/v1/register/username", auth);
}

export function resetPassword(body) {
    return HTTP.post("/v1/auth/username/password_reset/request", body, {action: "reset password"});
}

export function getUser(userId) {
    return HTTP.get(`/v1/users/${userId}`, {action: "get user details"}).then(r => r.data);
}
export function confirmEmail(userId, token) {
    return HTTP.post(`/v1/users/${userId}/verify_email/${token}`, {}, {action: "confirm email"});
}
export function resendEmailConfirmation(userId) {
    return HTTP.post(`/v1/users/${userId}/resend_verification`, {}, {action: "resend email confirmation"});
}


/**
 * Gets the details of an invitation.
 * @see https://github.com/raisingthefloor/morphic-api-server/blob/master/Documentation/API.md#v1invitationsid
 * @param {String} invitationId The invitation ID.
 * @return {Promise<AxiosResponse<Invitation>>} Response.
 */
export function getInvitation(invitationId) {
    return HTTP.get(`/v1/invitations/${invitationId}`, {action: "get invitation details"}).then(resp => {
        return resp?.data && {
            communityId: resp.data.community.id,
            communityName: resp.data.community.name,
            invitationId: invitationId,
            email: resp.data.email,
            name: `${resp.data.first_name || ""} ${resp.data.last_name || ""}`.trim()
        };
    });
}
