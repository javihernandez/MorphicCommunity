import Vue from "vue";
import VueRouter from "vue-router";
import store from "@/store";

// General Marketing, Login and Register Components
import Home from "@/views/Home.vue";
import Registration from "@/views/Registration";

import ResetPassword from "@/views/ResetPassword.vue";

import MyCommunity from "@/views/MyCommunity.vue";
import MyCommunities from "@/views/MyCommunities.vue";

import Plans from "@/views/billing/Plans.vue";
import BillingDetails from "@/views/billing/BillingDetails.vue";
import NoSubscription from "@/views/billing/NoSubscription.vue";

import EarlyReleaseProgram from "@/views/billing/EarlyReleaseProgram.vue";

// Dashboard Components
import Dashboard from "@/views/Dashboard.vue";
import MorphicBarPreconfigured from "@/views/MorphicBarPreconfigured.vue";
import MorphicBarEditor from "@/views/MorphicBarEditor.vue";

import RegistrationInvite from "@/views/RegistrationInvite";
import ConfirmEmail from "@/views/email/ConfirmEmail.vue";

// Email call-backs
import AcceptInvite from "@/views/email/AcceptInvite.vue";

import Download from "@/views/Download";

Vue.use(VueRouter);

/**
 * Meta-data for a route.
 *
 * All pages require authentication, unless explicitly stated otherwise with the `public` field.
 *
 * @typedef {Object} RouteMeta
 * @property {String} title The page title.
 * @property {String} heading The page heading (if different to the title).
 * @property {Boolean} noHeading Do not render the heading.
 * @property {Boolean} showHeading Do not show the heading.
 *
 * @property {Boolean|"only"} public true if this page can be accessed without authentication. "only" if it can only
 *  be accessed without authentication (authenticated users are redirected away).
 * @property {Boolean} noAccount true if an authenticated user with no account can access.
 * @property {Array<String>} roles Array of roles which can access the page.
 * @property {Boolean} redirect true if this is not a real page, just used to redirect to another (hides routing errors).
 * @property {"manager"|"member"} userHome The role for which this page is the home page.
 * @property {Boolean} home true if this the home page ("/").
 */

/**
 * @typedef {RouteRecord} AppRouteRecord
 * @property {RouteMeta} meta Extra route data
 */

/**
 * @type {Array<AppRouteRecord>}
 */
const routes = [
    {
        // Redirects to /login or /dashboard (or whatever the user's home page is)
        path: "/",
        name: "Home",
        meta: {
            home: true,
            public: true,
            redirect: true
        }
    },
    {
        path: "/login",
        name: "Login",
        component: Home,
        meta: {
            title: "Sign in to Morphic",
            noHeading: true,
            public: "only"
        }
    },
    {
        path: "/session-timed-out",
        name: "Home-session-timed-out",
        component: Home,
        props: { messageId: "sessionTimedOut" },
        meta: {
            title: "Home",
            public: "only"
        }
    },
    {
        path: "/my-community",
        name: "MyCommunity",
        component: MyCommunity,
        meta: {
            title: "My Community",
            showHeading: true
        }
    },
    {
        path: "/my-communities",
        name: "MyCommunities",
        component: MyCommunities,
        meta: {
            title: "My Groups"
        }
    },
    {
        path: "/billing/plans",
        name: "Plans",
        component: Plans,
        meta: {
            title: "Plans"
        }
    },
    {
        path: "/billing/no-subscription",
        name: "NoSubscription",
        component: NoSubscription,
        meta: {
            title: "No Subscription",
            showHeading: true,
            noAccount: true
        }
    },
    {
        path: "/member-message",
        name: "NonManager",
        component: NoSubscription,
        meta: {
            title: "Not a manger",
            showHeading: true,
            noAccount: true,
            roles: ["member"],
            userHome: "member"
        }
    },
    {
        path: "/early-release-program",
        name: "EarlyReleaseProgram",
        component: EarlyReleaseProgram,
        meta: {
            title: "MorphicBar Early Release Program",
            showHeading: true,
            public: true
        }
    },
    {
        path: "/early-release-program/join",
        name: "EarlyReleaseProgram.Join",
        component: EarlyReleaseProgram,
        meta: {
            title: "MorphicBar Early Release Program",
            noAccount: true
        }
    },
    {
        path: "/billing/details",
        name: "BillingDetails",
        component: BillingDetails,
        meta: {
            title: "Billing"
        }
    },
    {
        path: "/reset-password",
        name: "Reset Password",
        component: ResetPassword,
        meta: {
            title: "Reset Password",
            public: "only"
        }
    },

    // Dashboard mockups, needs to be properly renamed and re-arranged when starting to implement the API
    {
        path: "/dashboard",
        name: "Dashboard",
        component: Dashboard,
        meta: {
            title: "Home: MorphicBar Customization Tool",
            roles: ["manager"],
            userHome: "manager"
        }
    },
    {
        path: "/dashboard/morphicbar-preconfigured",
        name: "MorphicBar Preconfigured",
        component: MorphicBarPreconfigured,
        meta: {
            title: "Pick a bar",
            roles: ["manager"]
        }
    },
    {
        path: "/dashboard/morphicbar-editor/",
        name: "MorphicBar Editor",
        component: MorphicBarEditor,
        props: route => ({ catalogView: !!route.query.catalogView }),
        meta: {
            title: "MorphicBar Editor",
            hideHeading: true,
            isEditorPage: true,
            roles: ["manager"]
        }
    },
    {
        path: "/register",
        name: "Register",
        component: Registration,
        meta: {
            title: "Register",
            public: "only"
        }
    },
    {
        path: "/register/invite",
        name: "Register",
        component: RegistrationInvite,
        meta: {
            title: "Register",
            public: "only"
        }
    },
    {
        // Confirming email - from the registration page.
        path: "/confirm-email/registered",
        name: "ConfirmEmail.Registered",
        component: ConfirmEmail,
        props: {
            registered: true
        },
        meta: {
            title: "Confirm your email address"
        }
    },
    {
        // Confirming email - after sign-in.
        path: "/confirm-email/sign-in",
        name: "ConfirmEmail.SignIn",
        component: ConfirmEmail,
        props: {
            signIn: true
        },
        meta: {
            title: "Confirm your email address"
        }
    },
    {
        path: "/download",
        name: "Download",
        component: Download,
        props: {
        },
        meta: {
            title: "Download Morphic"
        }
    },
    {
        // Download page, when coming from the invitation flow.
        path: "/download/invited",
        name: "Download.Invited",
        component: Download,
        props: {
            invited: true
        },
        meta: {
            title: "Download Morphic"
        }
    },
    // Email call-backs
    {
        path: "/invite/:action/:id/:page",
        name: "Email.Invite",
        component: AcceptInvite,
        props: true,
        meta: {
            title: "Invitation to Morphic",
            public: true
        }
    },
    {
        path: "/confirm-email/:confirmUserId/:token",
        name: "Email.Confirm",
        component: ConfirmEmail,
        props: true,
        meta: {
            title: "Confirm email address",
            public: true
        }
    }
];

const router = new VueRouter({
    routes
});

/**
 * Gets the route to the home page for the current user, depending on their role.
 * @return {AppRouteRecord} The route.
 */
function getUserHomeRoute() {
    let route;

    if (store.getters.homePage) {
        route = store.getters.homePage;
    } else {
        route = routes.find(r => r.meta.userHome === store.getters.role);
    }

    return route;
}

const homeRoute = {name: "Home"};

router.beforeEach((to, from, next) => {
    // Merge the route meta data
    /** @type {RouteMeta} */
    const meta = to.matched.reduce((obj, cur) => Object.assign(obj, cur.meta), {});

    if (store.getters.isLoggedIn) {
        // Refresh the user's community info. This will also check if the current session token is still active.
        store.dispatch("userCommunities", store.getters.userId).then(() => {
            // re-check the page, to see if the user should still view it.
            const newRoute = checkPageAccess(meta, to);
            return newRoute && router.replace(newRoute);
        }).catch(() => undefined);
    }

    let redirect;

    if (meta.home) {
        // the home page, /
        if (store.getters.isLoggedIn) {
            if (store.getters.beforeLoginPage) {
                // redirect back to the page visited before login
                redirect = store.getters.beforeLoginPage;
                store.commit("beforeLoginPage", undefined);
            } else if (!store.getters.hasAccount) {
                // no account - tell them to get one.
                redirect = {name: "NoSubscription"};
            } else {
                // redirect to the auth home page
                redirect = getUserHomeRoute();
            }
        } else {
            // show the login form
            redirect = {name: "Login"};
        }
    } else {
        const result = checkPageAccess(meta, to);
        if (result) {
            redirect = result;
        }
    }

    next(redirect);
});

/**
 * Determine if a page can be viewed by the current user.
 * @param {RouteMeta} meta Metadata for the route.
 * @param {Route} to The destination route.
 * @return {String|Object} undefined if the page can be viewed, otherwise another route to use.
 */
function checkPageAccess(meta, to) {
    let result;
    if (!meta.public && !store.getters.isLoggedIn) {
        // User needs to be authenticated for this page.
        store.commit("beforeLoginPage", to.fullPath);
        result = {name: "Login"};
    } else if (meta.public === "only" && store.getters.isLoggedIn) {
        // Authenticated users can't access this page.
        result = false;
    } else if (!meta.public && !meta.noAccount && !store.getters.hasAccount) {
        // only account holders can access this page
        result = false;
    } else if (meta.roles && !meta.roles.includes(store.getters.role)) {
        // role is not in the list of accepted roles.
        result = false;
    }

    return result === false ? homeRoute : result;
}

// Make the router not report navigation failures, due to redirecting from / to a different page.
const routerPush = VueRouter.prototype.push;
VueRouter.prototype.push = function push(location, onComplete, onAbort) {
    let result;
    if (onComplete || onAbort) {
        result = routerPush.call(this, location, onComplete, onAbort);
    } else {
        result = routerPush.call(this, location).catch(reason => {
            // Resolve navigation failures to the home page.
            const ignore = VueRouter.isNavigationFailure(reason) && reason.to?.meta?.redirect;
            return ignore
                ? reason
                : Promise.reject(reason);
        });
    }

    return result;
};

router.afterEach((to) => {
    Vue.nextTick(() => {
        document.title = to.meta.title;
    });
});

export default router;
