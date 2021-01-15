import { HTTP } from "@/services/index";

/**
 * @typedef {String} GUID
 */

/**
 * Get a list of communities the user belongs to.
 * @see https://github.com/raisingthefloor/morphic-api-server/blob/master/Documentation/API.md#v1usersidcommunities
 * @param {GUID} userId The user ID.
 * @return {Promise<AxiosResponse<Any>>} Response
 */
export function getUserCommunities(userId) {
    return HTTP.get(`/v1/users/${userId}/communities`);
}

/**
 * Creates a new community.
 * @see https://github.com/raisingthefloor/morphic-api-server/blob/master/Documentation/API.md#v1communities
 * @param {String} name Community name.
 * @return {Promise<AxiosResponse<Any>>} Response.
 */
export function createNewCommunity(name) {
    const data = {
        name: name
    };
    return HTTP.post("/v1/communities", data);
}

/**
 * Gets a community details.
 * @see https://github.com/raisingthefloor/morphic-api-server/blob/master/Documentation/API.md#v1communitiesid
 * @param {GUID} communityId The community ID.
 * @return {Promise<AxiosResponse<Any>>} Response
 */
export function getCommunity(communityId) {
    return HTTP.get(`/v1/communities/${communityId}`);
}

/**
 * Delete a community.
 * @see https://github.com/raisingthefloor/morphic-api-server/blob/master/Documentation/API.md#delete
 * @param {GUID} communityId The community ID.
 * @return {Promise<AxiosResponse<Any>>} Response
 */
export function deleteUserCommunity(communityId) {
    return HTTP.delete(`/v1/communities/${communityId}`);
}

/**
 * Gets the bars in a community.
 * @see https://github.com/raisingthefloor/morphic-api-server/blob/master/Documentation/API.md#v1communitiesidbars
 * @param {GUID} communityId The community ID.
 * @return {Promise<AxiosResponse<Any>>} Response
 */
export function getCommunityBars(communityId) {
    return HTTP.get(`/v1/communities/${communityId}/bars`);
}

/**
 * Creates a community bar.
 * @see https://github.com/raisingthefloor/morphic-api-server/blob/master/Documentation/API.md#post-13
 * @param {GUID} communityId The community ID.
 * @param {BarDetails} data The bar.
 * @return {Promise<AxiosResponse<Any>>} Response
 */
export function createCommunityBar(communityId, data) {
    return HTTP.post(`/v1/communities/${communityId}/bars`, fixBar(data));
}

/**
 * Gets a community bar.
 * @see https://github.com/raisingthefloor/morphic-api-server/blob/master/Documentation/API.md#v1communitiescidbarsid
 * @param {GUID} communityId The community ID.
 * @param {GUID} barId The bar ID.
 * @return {Promise<AxiosResponse<Any>>} Response
 */
export function getCommunityBar(communityId, barId) {
    return HTTP.get(`/v1/communities/${communityId}/bars/${barId}`);
}

/**
 * Saves a community bar.
 * @see https://github.com/raisingthefloor/morphic-api-server/blob/master/Documentation/API.md#put-4
 * @param {GUID} communityId The community ID.
 * @param {GUID} barId The bar ID.
 * @param {BarDetails} barDetails The bar.
 * @return {Promise<AxiosResponse<Any>>} Response
 */
export function saveCommunityBar(communityId, barId, barDetails) {
    return HTTP.put(`/v1/communities/${communityId}/bars/${barId}`, fixBar(barDetails));
}

/**
 * Updates a community bar.
 * (appears to be a duplicate of saveCommunityBar)
 * @see https://github.com/raisingthefloor/morphic-api-server/blob/master/Documentation/API.md#put-4
 * @param {GUID} communityId The community ID.
 * @param {GUID} barId The bar ID.
 * @param {BarDetails} bar The bar.
 * @return {Promise<AxiosResponse<Any>>} Response
 */
export function updateCommunityBar(communityId, barId, bar) {
    return HTTP.put(`/v1/communities/${communityId}/bars/${barId}`, fixBar(bar));
}

/**
 * Deletes a community bar.
 * @see https://github.com/raisingthefloor/morphic-api-server/blob/master/Documentation/API.md#delete-2
 * @param {GUID} communityId The community ID.
 * @param {GUID} barId The bar ID.
 * @return {Promise<AxiosResponse<Any>>} Response
 */
export function deleteCommunityBar(communityId, barId) {
    return HTTP.delete(`/v1/communities/${communityId}/bars/${barId}`);
}

export function getCommunityMembers(communityId) {
    return HTTP.get(`/v1/communities/${communityId}/members`);
}

export function addCommunityMember(communityId, member) {
    return HTTP.post(`/v1/communities/${communityId}/members`, member);
}

export function getCommunityMember(communityId, memberId) {
    return HTTP.get(`/v1/communities/${communityId}/members/${memberId}`);
}

export function updateCommunityMember(communityId, memberId, member) {
    return HTTP.put(`/v1/communities/${communityId}/members/${memberId}`, member);
}

export function deleteCommunityMember(communityId, memberId) {
    return HTTP.delete(`/v1/communities/${communityId}/members/${memberId}`);
}

export function inviteCommunityMember(communityId, memberId, email) {
    return HTTP.post(`/v1/communities/${communityId}/invitations`, { member_id: memberId, email: email });
}

/**
 * Performs some tweaks to the bar before it gets stored.
 * @param {BarDetails} bar The bar.
 * @return {BarDetails} The bar.
 */
function fixBar(bar) {
    bar.items.forEach(item => {
        item.is_primary = !!item.is_primary;
        if (item.kind === "application") {
            // For application items, remove the exe or default - only 1 is needed.
            if (item.configuration.default) {
                delete item.configuration.exe;
            } else {
                delete item.configuration.default;
            }
        }
    });
    return bar;
}
