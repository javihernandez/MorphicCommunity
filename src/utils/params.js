/*

Some bar items require extra information. A field in the button configuration object can have a named placeholder
in the text (like $value or `${value}`).

These placeholders are extracted from the fields, the name being a key in the `allParameters` object.
These are then used to create input fields in the editor dialog.

*/

/**
 * The parameters of a bar item.
 * @typedef {Array<ParameterInfo>|Object<String,ParameterInfo>} ItemParameters
 */

/**
 * A parameter.
 * @typedef {Object} ParameterInfo
 * @property {Any} initial The initial value.
 * @property {"text"|"select"|"checkbox"} type The type of field.
 * @property {String} label Text displayed with the input field.
 * @property {Array<Object>} selectOptions A list of items for a select field (type="select").
 * @property {Array<String>} values Array containing the values of the parameter, depending on the checkbox state.
 * @property {String} attrs The HTML attributes for the input element.
 * @property {changedFunc} [onChange] A function called when the value has changed.
 * @property {isEnabledFunc} [isApplicable] A function, returning true if the field should be shown.
 * @property {isEnabledFunc} [isEnabled] A function, returning true if the field should be enabled.
 * @property {Object<String,String>} validation The validation rules. Key is the key in {@link validators}, value is the message.
 * @property {Object<String,Object>} checks The checks. Key is the key in {@link checks}.
 */

/**
 * Callback for isApplicable or isEnabled
 * @callback isEnabledFunc
 * @param {BarItem} item The bar item being checked.
 */

/**
 * Validation function
 * @callback validationFunc
 * @param {String} value The value to validate.
 * @return {Boolean} true if the value is valid.
 */

/**
 * Function that checks for problems.
 * @callback checkFunc
 * @param {String} value The value to check.
 * @param {BarItem} barItem The bar item being checked.
 * @param {String} paramKey The parameter key.
 * @return {Promise<CheckResult>} Resolves when complete.
 */

/**
 * Callback for when a value has changed.
 * @callback changedFunc
 * @param {BarItem} item The bar item being checked.
 * @param {String} value The new value
 */


import axios from "axios";
import { HTTP } from "@/services";
import * as constants from "@/utils/constants";
import i18n from "@/i18n/i18n";

/**
 *
 * @type {Object<String,ParameterInfo>}
 */
export const allParameters = {
    label: {
        // This is used automatically by all items.
        label: "Text on the button",
        validation: {
            required: "Button label is required."
        }
    },
    url: {
        label: "The site to open",
        attrs: {
            autocomplete: "url",
            type: "url"
        },
        validation: {
            required: "Site link is required.",
            url: "This isn't a valid url."
        },
        checks: {
            urlWorking: {}
        }
    },
    skypeNoCall: {
        type: "checkbox",
        label: "Open Skype App without starting a call",
        onChange: (button, value) => {
            button.kind = value ? "application" : "link";
        }
    },
    skypeId: {
        label: "Skype ID of who to call",
        isEnabled: (button) => !button.data.parameters.skypeNoCall,
        validation: {
            required: "Skype ID of who to call needs to be entered"
        }
    },
    skypeAction: {
        type: "select",
        label: "Type of call",
        initial: "call",
        isEnabled: (button) => !!button.data.parameters.skypeId && !button.data.parameters.skypeNoCall,
        selectOptions: [
            { value: "?call", text: "Voice" },
            { value: "?call&video=true", text: "Video" },
            { value: "?chat", text: "Chat" }
        ]
    },
    defaultApp: {
        type: "select",
        label: "App",
        initial: null,
        selectOptions: [
            { value: undefined, text: "Custom application"}
        ],
        validation: {
            defaultAppRequired: "An App needs to be chosen"
        }
    },
    exe: {
        label: "Executable",
        isApplicable: (button) => !button.data.parameters.defaultApp && button.data.parameters.defaultApp !== "",
        validation: {
            required: "The executable file is required."
        }
    },
    zoomUrl: {
        label: "Meeting link",
        validation: {
            required: "Zoom meeting link has not been provided.",
            url: "Zoom meeting link is not valid url.",
            zoomUrl: "This url does not look like a zoom meeting link."
        },
        checks: {
            urlWorking: {}
        }
    }
};

// Add the default apps to the default app drop-down
for (const [key, app] of Object.entries(constants.defaultApps)) {
    allParameters.defaultApp.selectOptions.push({
        value: key,
        text: app.title
    });
};


/**
 * Validation routines, referred to by the keys of a parameters `validation` object in `allParameters`.
 *
 * @type {Object<String,validationFunc>}
 */
const validators = {
    /**
     * Checks if a field has a value.
     * @param {String} value The field value to check.
     * @return {Boolean} true if the field has a value.
     */
    required(value) {
        return value && value !== "";
    },
    /**
     * Checks if the defaultApp field has a value.
     * @param {String} value The defaultApp field value to check.
     * @return {Boolean} true if the field has a value.
     */
    defaultAppRequired(value) {
        return value !== "";
    },

    /**
     * Checks if the value is a URL, with or without the protocol prefix.
     * @param {String} value The field value to check.
     * @return {Boolean} true if the value is a valid url.
     */
    url(value) {
        let u;
        let result;

        try {
            u = new URL(value);
            result = (u.protocol === "https:" || u.protocol === "http:");
        } catch (_) {
            if (value.startsWith("https://") || value.startsWith("http://")) {
                result = false;
            } else {
                result = validators.url(`http://${value}`);
            }
        }

        return result;
    },
    /**
     * Checks if the value looks like a zoom meeting url.
     *
     * This just makes sure it's a valid url, and it the hostname ends with zoom.us
     *
     * @param {String} value The value.
     * @return {Boolean} true if the value looks like a zoom meeting link.
     */
    zoomUrl(value) {
        let result;
        try {
            const url = new URL(value);
            result = url.hostname.match(/(^|[^.]\.)zoom\.us$/i);
        } catch {
            // re-try with the protocol, if it's not there
            if (value.startsWith("https://") || value.startsWith("http://")) {
                result = false;
            } else {
                result = validators.zoomUrl(`https://${value}`);
            }
        }

        return result;

    }
};

/**
 * Similar to validators, but may take longer and are performs asynchronously.
 * @type {Object<String,checkFunc>}
 */
const checks = {
    urlWorking: (value, barItem, paramKey) => checkUrl(value)
};

/**
 * Returns a function which will return the given constant value.
 * @param {Any} result The constant value.
 * @return {Function} A function which returns `result`.
 */
function constantFunction(result) {
    return function () {
        return result;
    };
}

Object.values(allParameters).forEach(
    /**
     * Fix the parameter details so the isApplicable and isEnabled functions exist.
     * @param {ParameterInfo} paramInfo The parameter.
     */
    (paramInfo) => {
        if (typeof(paramInfo.isApplicable) !== "function") {
            paramInfo.isApplicable = constantFunction(paramInfo.isApplicable === undefined ? true : paramInfo.isApplicable);
        }
        if (typeof(paramInfo.isEnabled) !== "function") {
            paramInfo.isEnabled = constantFunction(paramInfo.isEnabled === undefined ? true : paramInfo.isEnabled);
        }

        if (!paramInfo.type) {
            paramInfo.type = "text";
        }
    });

const origFieldPrefix = "_orig_";

/**
 * Prepares the parameter information on a button, during initial load.
 * @param {BarItem} button The button.
 */
export function prepareBarItem(button) {
    /** @type {ItemParameters} */
    const params = {};
    const paramFields = [];

    // Always allow the label field to be edited.
    const initialLabel = button.configuration.label;
    button.configuration.label = "$label";

    Object.keys(button.configuration).forEach(key => {
        const value = button.configuration[key];
        if (key !== "image_url" && containsParameter(value)) {
            // Create an original copy of the field (the field will be over-written by the expanded string)
            button.configuration[`${origFieldPrefix}${key}`] = value;

            // Extract the parameters
            getParameterNames(value).forEach(paramKey => {
                var paramInfo = allParameters[paramKey];
                if (!paramInfo) {
                    // This parameter is unknown
                    paramInfo = (allParameters[paramKey] = {
                        label: paramKey
                    });
                }
                params[paramKey] = paramInfo.initial || button.configuration[`$${paramKey}`] || "";
            });

            paramFields.push(key);
        }
    });

    if (params.label !== undefined) {
        // Set the value of the label to what it already was.
        delete params.label; // Delete it, so it's at the bottom of the dialog.
        params.label = initialLabel;
    }

    button.data.paramFields = paramFields;
    button.data.parameters = params;

    setInitial(button);
}

/**
 * Set the initial values of the parameters.
 *
 * @param {BarItem} button The button.
 */
export function setInitial(button) {
    Object.keys(button.data.parameters).forEach(paramKey => {
        const initialValue = allParameters[paramKey].initial;
        if (initialValue !== undefined) {
            button.data.parameters[paramKey] = initialValue;
        }
    });

    applyParameters(button);
}

/**
 * Apply the parameter values to the button fields. Call whenever a value in the button's parameters object has changed.
 *
 * @param {BarItem} button The bar item.
 */
export function applyParameters(button) {
    const params = button.data.parameters;

    if (button.data.paramFields) {
        button.data.paramFields.forEach(key => {
            button.configuration[key] = replaceParameters(params, button.configuration[`${origFieldPrefix}${key}`]);
        });
    }

    button.data.hasError = validate(button) ? undefined : true;
}

// Matches all `${name1}`, `${name1?v1:v2}` or `$name2` in a string.
const matchExpanders = /\$\{(?<name1>[^}:]+)(?<ternary>\?(?<v1>[^}:]*):(?<v2>[^}:]*))?\}|\$(?<name2>\w+)/g;

/**
 * Gets the parameter expanders in a string.
 *
 * @param {String} input The string to examine.
 * @return {Array<String>} The parameter names.
 */
function getParameterNames(input) {
    const paramNames = [];
    var matches = [];

    // Get all matches upfront, otherwise the recursive call will reset the lastIndex of the regex.
    var match;
    while ((match = matchExpanders.exec(input))) {
        matches.push(match);
    }

    matches.forEach(match => {
        paramNames.push(match.groups.name1 || match.groups.name2);

        if (match.groups.ternary) {
            paramNames.push.apply(paramNames, getParameterNames(match.groups.v1));
            paramNames.push.apply(paramNames, getParameterNames(match.groups.v2));
        }
    });

    return paramNames;
}

/**
 * Replaces the parameter expanders with the appropriate value.
 * @param {ItemParameters} params The parameter data.
 * @param {String} input The string to work on.
 * @return {String} The input string, with the parameter expanders replaced with their value.
 */
function replaceParameters(params, input) {
    return input.replace(matchExpanders, (match, name1, ternary, v1, v2, name2) => {
        var name = name1 || name2;
        const value = params[name] || "";

        let togo;
        if (ternary) {
            togo = value ? replaceParameters(params, v1) : replaceParameters(params, v2);
        } else {
            togo = value;
        }

        return togo;

    });
}

/**
 * Determines if `value` contains a parameter expander.
 * @param {String} value The string to check.
 * @return {Boolean} true if the string contains a parameter expander
 */
function containsParameter(value) {
    return typeof(value) === "string" && value.includes("$");
}

/**
 * Validates all parameters of a button.
 * @param {BarItem} button The button.
 * @return {Boolean} true if valid.
 */
function validate(button) {
    return button.data.isPlaceholder || Object.keys(button.data.parameters).every((paramKey) => {
        return !getValidationError(button, paramKey);
    });
}

/**
 * Validate a parameter field in the button edit dialog.
 * @param {BarItem} button The button.
 * @param {String} [paramKey] The parameter key, or omit to check all parameters until the first failure.
 * @return {String} The validation error message (or null if valid)
 */
export function getValidationError(button, paramKey) {
    let errorMessage;

    if (button.data.isPlaceholder) {
        // If the button is still a place-holder, such as the site not being selected for a social-media button)
        const catalog = constants.buttonCatalog[button.configuration.subkind];
        errorMessage = catalog.selectionError;

        if (!errorMessage) {
            switch (button.kind || catalog.kind) {
            case "link":
                errorMessage = i18n.t("Errors.validation.link-missing");
                break;
            case "application":
                errorMessage = i18n.t("Errors.validation.app-missing");
                break;
            default:
                errorMessage = i18n.t("Errors.validation.field-missing", {name: catalog.editItemField});
                break;
            }
        }
    } else if (paramKey === undefined) {
        Object.keys(button.data.parameters).every((paramKey) => {
            errorMessage = getValidationError(button, paramKey);
            return !errorMessage;
        });
    } else {
        const paramInfo = allParameters[paramKey];
        const value = button.data.parameters[paramKey];

        const validate = paramInfo.isApplicable(button) && paramInfo.isEnabled(button);

        if (validate && paramInfo.validation) {
            Object.keys(paramInfo.validation).every(key => {
                const validator = validators[key];
                var ok = false;
                if (validator) {
                    if (typeof(validator) === "function") {
                        ok = validator(value, button);
                    } else if (validator instanceof RegExp) {
                        ok = validator.test(value);
                    }
                }

                if (!ok) {
                    var v = paramInfo.validation[key];
                    errorMessage = (typeof(v) === "string") ? v : v.message || "error";
                }
                return ok;
            });
        }
    }
    return errorMessage;
}

/**
 * Determines if a parameter has any checks.
 * @param {String} paramKey The parameter key.
 * @return {Boolean} true if the parameter requires checks.
 */
export function hasChecks(paramKey) {
    return allParameters[paramKey].checks && Object.keys(allParameters[paramKey].checks).length > 0;
}

/**
 * Gets a for a parameter on a button, if it has a problem.
 * @param {BarItem} button The button.
 * @param {String} paramKey The parameter key.
 * @return {ItemProblem} The problem, if it has one.
 */
/**
 * Determines if a parameter already has a problem.
 * @param {BarItem} button The button.
 * @param {String} [paramKey] The parameter key. Omit to check all parameters.
 * @return {Boolean} true if the parameter has a problem.
 */
export function hasProblem(button, paramKey) {
    let result;
    if (paramKey) {
        result = !!getProblem(button, paramKey);
    } else {
        result = button.data.problems && Object.values(button.data.problems).find(p => p.isProblem);
    }

    return result;
}

/**
 * Gets a for a parameter on a button, if it has a problem.
 * @param {BarItem} button The button.
 * @param {String} paramKey The parameter key.
 * @return {ItemProblem} The problem, if it has one.
 */
export function getProblem(button, paramKey) {
    return button.data.problems &&
        Object.values(button.data.problems).find(p => p.isProblem && p.paramKey === paramKey);
}


/**
 * The value a `checkFunc` will resolve with.
 *
 * @typedef {Object} CheckResult
 * @property {Boolean} isProblem true if this object is an {@link ItemProblem}.
 * @property {String} value The value that was checked.
 * @property {String} [newValue] A new value to set, if any.
 */

/**
 * @typedef {CheckResult} ItemProblem
 * // Returned by the checker function:
 * @property {Boolean} isProblem Always true.
 * @property {Boolean} warning true to warn, false if it's bad.
 * @property {String} alert Short message for the user.
 * @property {String} message Message for the user.
 * @property {String} details More info, for the user.
 * // set in checkForProblems:
 * @property {String} paramKey The parameter.
 * @property {String} checkKey The check key name.
 */

/**
 * Checks a bar item's parameter for problems. This type of check is similar to validation, but it takes longer
 * and is performed asynchronously.
 *
 * @param {BarItem} button The button to check
 * @param {String} paramKey The parameter to check (omit to check all).
 * @param {Boolean} live true if the value is being checked as the user types (don't fix any parameter values).
 * @return {Promise<ItemProblem|ItemProblem[]>} Resolves when done.
 */
export function checkForProblems(button, paramKey, live) {
    let work;

    if (!button.data.problems) {
        /** @type {Object<String,ItemProblem>} */
        button.data.problems = {};
    }

    if (paramKey) {
        const paramInfo = allParameters[paramKey];

        const value = button.data.parameters[paramKey];
        if (paramInfo.checks) {
            work = Object.keys(paramInfo.checks).map(key => {
                const problemKey = `${paramKey}_${key}`;

                let checkPromise;
                const lastCheck = button.data.problems[problemKey];

                if (lastCheck && lastCheck.value === value) {
                    // Checking the same value as last time - return the same result.
                    checkPromise = Promise.resolve(lastCheck);
                } else if (lastCheck && lastCheck.checking) {
                    // Already in a check
                    if (lastCheck.checkingValue === value) {
                        // This is a check on the same value, wait for that one.
                        checkPromise = lastCheck.checking;
                    } else {
                        // Cancel the last check
                        lastCheck.checking.cancel && lastCheck.checking.cancel();
                        lastCheck.checking.cancelled = true;
                        delete lastCheck.checking;
                    }
                }

                if (!checkPromise) {
                    // Perform the check.
                    const checkFunc = checks[key];
                    if (checkFunc) {
                        checkPromise = checkFunc(value, button, paramKey);
                    } else {
                        checkPromise = Promise.reject(new Error(`No check function named ${key}`));
                    }

                    // Add the promise to the problem, so if another check is going to be made before this check
                    // is over (and the value hasn't changed), it can wait on this one instead.
                    button.data.problems[problemKey] = Object.assign({}, button.data.problems[problemKey], {
                        checkingValue: value,
                        checking: checkPromise
                    });
                }

                return (lastCheck && lastCheck.checking) || checkPromise.then(checkResult => {
                    if (!checkPromise.cancelled) {
                        // Store the result
                        button.data.problems[problemKey] = checkResult;
                        if (checkResult) {
                            checkResult.value = value;
                            if (checkResult.isProblem) {
                                checkResult.paramKey = paramKey;
                                checkResult.checkKey = key;
                            } else if (checkResult.newValue) {
                                checkResult.value = checkResult.newValue;
                                if (!live) {
                                    button.data.parameters[paramKey] = checkResult.newValue;
                                }
                            }
                        }
                    }
                    return checkResult;
                });
            });
        }
    } else {
        work = Object.keys(button.data.parameters).map(key => checkForProblems(button, key, live));
    }

    return work && work.length > 0
        ? Promise.all(work)
        : Promise.resolve();
};

/**
 * Checks if a url is working.
 * @param {String} urlToCheck The url
 * @param {Number} [timeout] milliseconds to wait [default: 10000].
 * @return {Promise<CheckResult>} Resolves when done.
 */
export async function checkUrl(urlToCheck = "", timeout = 10000) {
    let togo;
    const url = urlToCheck.trim();

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        // Try https
        const httpsUrl = "https://" + url;
        const httpsResult = await checkUrl(httpsUrl, timeout);
        let goodUrl;
        if (httpsResult.isProblem) {
            // Try http
            const httpUrl = "http://" + url;
            const httpResult = await checkUrl(httpUrl, Math.min(3000, timeout));
            if (httpResult.isProblem) {
                togo = httpsResult;
            } else {
                goodUrl = httpUrl;
            }
        } else {
            goodUrl = httpsUrl;
        }

        if (goodUrl) {
            togo = {
                newValue: goodUrl
            };
        }
    } else {
        let urlParsed;
        let error;

        try {
            urlParsed = new URL(url);
            if (!urlParsed || (urlParsed.protocol !== "https:" && urlParsed.protocol !== "http:")) {
                error = "Link is not a website address";
            }
        } catch {
            error = "Link does not look valid";
        }

        if (error) {
            togo = Promise.resolve({
                isProblem: true,
                alert: "Broken link",
                message: error
            });
        } else {
            const cancelSource = axios.CancelToken.source();

            let requestUrl;
            let client;

            // Use the API service for http requests - the browser will be unable to access http links
            // from a https page.
            const useApi = true; // Always using the api - CORS will not allow other urls to respond
            if (useApi) {
                const u = encodeURIComponent(urlParsed.toString());
                requestUrl = `/v1/validate/link/${u}`;
                client = HTTP;
            } else {
                requestUrl = urlParsed.toString();
                client = axios.create({
                    baseURL: requestUrl
                });
            }

            // HEAD the url, to see if it works.
            /** @type {AxiosRequestConfig} */
            const req = {
                url: requestUrl,
                maxRedirects: 5,
                timeout: timeout,
                cancelToken: cancelSource.token
            };

            togo = client.head(requestUrl, req).then(value => {
                return {
                    newValue: url !== urlToCheck ? url : undefined
                };
            }).catch(reason => {
                reason.handled = true;
                return {
                    isProblem: true,
                    warn: !!reason.response,
                    alert: "Broken link",
                    message: "This link does not appear to work.",
                    details: `Unable access "${url}: ${reason.message}".`
                };
            });
            togo.cancelSource = cancelSource;
            togo.cancel = cancelSource.cancel;
        }
    }

    return togo;
}

// Set up the parameters for the buttons
Object.values(constants.allButtons).forEach(prepareBarItem);
