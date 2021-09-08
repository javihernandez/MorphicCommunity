import * as billingService from "@/services/billingService";

/**
 * Collection of billing plans, with the key being the plan ID.
 * @typedef {Object<String,BillingPlan>} BillingPlans
 */

/**
 * Billing plan
 * @typedef {Object} BillingPlan
 * @property {String} id The plan's unique ID.
 * @property {Number} member_limit The number of members allowed under the plan.
 * @property {Number} months The number of months in the plan's billing cycle.
 * @property {Number} price The price in the currency's smallest denomination (e.g., cent for USD).
 * @property {String} currency The currency of the price.
 * @property {String} price_text The price of the plan, for displaying.
 * @property {String} monthly_price_text The monthly price of the plan, for displaying.
 *
 * @property {String} name The name of the plan.
 * @property {String} sizeName The name of the plan, without the time period.
 * @property {String} size Plan size (basic, medium, large).
 * @property {Boolean} listed Displayed in the list of plans.
 * @property {String} savings_text Bulk-buy savings (if any).
 */

/**
 * Billing information
 * @typedef {Object} BillingInfo
 * @property {String} plan_id The community plan.
 * @property {Date} trial_end The date/time of the end of the trial period
 * @property {Number} trial_end_days Number of whole days until the end of the trial period.
 * @property {PaymentStatus} status Payment status.
 * @property {String} contact_member_id The ID of the member who is the billing contact.
 * @property {BillingCard} card The payment card.
 * @property {BillingPlan} [plan] The plan.
 */

/**
 * @typedef {"paid"|"past_due"|"canceled"|"closed"} PaymentStatus
 */

/**
 * @typedef {Object} BillingCard Partial details of a payment card.
 * @property {String} brand The brand of the card.
 * @property {String} last4 The last four digits of the card.
 */


export const PaymentStatus = {
    paid: {
        text: "All payments have been made (or still in trial)"
    },
    past_due: {
        text: "Payments have failed, but retries have not been exhausted"
    },
    canceled: {
        text: "User canceled their account, but it won't close until the end of the billing cycle"
    },
    closed: {
        text: "Account is closed due to user request or lack of payment"
    }
};


/**
 * All plans, cached.
 * @type {BillingPlans}
 */
var allPlans;

// Extra front-end information for the plans.
const planExtras = {
    "basic-1-month": {
        name: "Standard Monthly",
        sizeName: "Standard",
        size: "basic",
        listed: true
    },
    "basic-6-month": {
        name: "Standard Plan",
        sizeName: "Standard",
        size: "basic",
        listed: true
    },
    "midsize-1-month": {
        name: "Medium Monthly",
        sizeName: "Medium",
        size: "medium",
        listed: true
    },
    "midsize-6-month": {
        name: "Medium Plan",
        sizeName: "Medium",
        size: "medium",
        listed: true
    },
    "large-1-month": {
        name: "Large Monthly",
        sizeName: "Large",
        size: "large",
        listed: true
    },
    "large-6-month": {
        name: "Large Plan",
        sizeName: "Large",
        size: "large",
        listed: true
    },
    "enterprise-1": {
        name: "Enterprise",
        sizeName: "Enterprise",
        size: "enterprise"
    }
};

export const sizeNames = {
    basic: "Standard",
    medium: "Medium",
    large: "Large",
    enterprise: "Enterprise"
};

/**
 * Gets all available plans.
 * @return {Promise<BillingPlans>} Resolves with the available plans.
 */
export function getPlans() {
    var togo;
    if (allPlans) {
        togo = Promise.resolve(JSON.parse(JSON.stringify(allPlans)));
    } else {
        togo = billingService.getCommunityPlans().then(result => {
            allPlans = {};
            result.data.plans.forEach(plan => {
                allPlans[plan.id] = Object.assign({}, plan, planExtras[plan.id]);
            });
            // calculate any bulk-buy savings
            Object.values(allPlans).forEach(p => {
                const savings = getSavings(p);
                if (savings) {
                    p.savings_text = savings;
                }
            });

            return JSON.parse(JSON.stringify(allPlans));
        });
    }
    return togo;
}

/**
 * Gets the billing info (and plan details) for the community
 * @param {GUID} communityId The current community ID.
 * @return {Promise<BillingInfo>} Resolves when complete.
 */
export async function getCurrentPlan(communityId) {
    const [plans, billingInfo] = await Promise.all([
        getPlans(),
        billingService.getBillingInfo(communityId).then(resp => resp.data)
    ]);

    return plans[billingInfo.plan_id];
}

/**
 * Gets the bulk-buy savings of a plan.
 * @param {BillingPlan} plan The plan.
 * @return {String} The savings, currency formatted for display.
 */
export function getSavings(plan) {
    var togo;

    if (plan.currency !== "USD") {
        // no display of savings is better than an incorrect one.
    } else if (plan.months === 1) {
        // no savings for monthly plans
    } else {
        // Get the monthly plan of the same size as this one.
        /** @type {BillingPlan} */
        const monthly = Object.values(allPlans).find(p => p.months === 1 && p.size === plan.size);

        if (monthly) {
            const monthlyTotal = monthly.price * plan.months;
            const saving = monthlyTotal - plan.price;
            // Only display the saving if something is being saved
            if (saving > 0) {
                togo = `$${saving / 100}`;
            }
        }
    }
    return togo;
}
