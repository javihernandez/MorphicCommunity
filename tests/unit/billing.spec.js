/**
 * Tests for /src/utils/billingService.js
 */
import { getPlans, getSavings } from "@/utils/billing";
import * as billingService from "@/services/billingService";

describe("Billing Test", () => {
    test("Get Plans", () => {
        const plans = [
            {
                id: "basic-1-month",
                active: true,
                default: true,
                member_limit: 5,
                months: 1,
                price: 600,
                currency: "USD",
                stripe: {
                    price_id: "price_1HEhXfFNS9zyw2T7YKMUaXSj"
                },
                price_text: "$6",
                monthly_price_text: "$6"
            }
        ];
        const response = {
            data: { plans },
            status: 200
        };
        const result = {
            "basic-1-month": {
                active: true,
                currency: "USD",
                default: true,
                id: "basic-1-month",
                listed: true,
                member_limit: 5,
                monthly_price_text: "$6",
                months: 1,
                name: "Standard Monthly",
                price: 600,
                price_text: "$6",
                size: "basic",
                sizeName: "Standard",
                stripe: {
                    price_id: "price_1HEhXfFNS9zyw2T7YKMUaXSj"
                }
            }
        };
        billingService.getCommunityPlans = jest.fn().mockImplementation(() => Promise.resolve(response));
        return getPlans().then((data) => {
            expect(data).toStrictEqual(result);
        });
    });

    test("Get Savings", () => {
        const plan = {
            id: "basic-1-month",
            active: true,
            default: true,
            member_limit: 5,
            months: 1,
            price: 600,
            currency: "USD",
            stripe: {
                price_id: "price_1HEhXfFNS9zyw2T7YKMUaXSj"
            },
            price_text: "$6",
            monthly_price_text: "$6"
        };
        const savings = getSavings(plan);
        console.log(savings);
    });
});
