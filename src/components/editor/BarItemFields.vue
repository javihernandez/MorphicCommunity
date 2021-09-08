<template>
<div>
  <template v-for="(value, paramKey, index) in barItem.data.parameters">
    <div v-if="allParameters[paramKey].isApplicable(barItem)"
         :key="paramKey"
         role="group" class="mb-3">
      <b-form-group :label="(allParameters[paramKey].type === 'checkbox') ? '' : allParameters[paramKey].label"
                    :label-for="'barItem_' + paramKey"
                    :class="{
                        checking: isChecking[paramKey] && validationStates[paramKey] === null
                    }">
        <template #invalid-feedback>
          {{validationErrors[paramKey]}}
        </template>

          <component :is="getFieldTag(allParameters[paramKey])"
                     :id="'barItem_' + paramKey"
                     :name="paramKey"
                     v-model="barItem.data.parameters[paramKey]"
                     :options="allParameters[paramKey].selectOptions"
                     :state="validationStates[paramKey]"
                     :autofocus="autofocus && !index"
                     :disabled="!allParameters[paramKey].isEnabled(barItem)"
                     :value="allParameters[paramKey].values && allParameters[paramKey].values[1]"
                     :unchecked-value="allParameters[paramKey].values && allParameters[paramKey].values[0]"
                     v-bind="allParameters[paramKey].attrs"
                     @blur="validate(paramKey)"
                     @input="allParameters[paramKey].onChange && allParameters[paramKey].onChange(barItem, $event)"
          >
            <template v-if="allParameters[paramKey].type === 'checkbox'">
              {{ allParameters[paramKey].label }}
            </template>
          </component>
      </b-form-group>
    </div>
  </template>
</div>
</template>

<style lang="scss">

@keyframes spinner {
  to {transform: rotate(360deg);}
}

.form-group.checking {
  label + div {
    position: relative;

    &:before {
      content: '';
      position: absolute;

      top: 50%;
      margin-top: -10px;
      right: calc(0.375em + 0.1875rem);

      width: 1.25em;
      height: 1.25em;

      border-radius: 50%;
      border: 2px solid #ddd;
      border-top-color: #000;
      animation: spinner 700ms linear infinite;
    }
  }
}
</style>

<script>

import * as params from "@/utils/params";

const componentMap = {
    text: "b-form-input",
    select: "b-form-select",
    checkbox: "b-form-checkbox"
};

export default {
    name: "BarItemFields",
    components: {},
    props: {
        /** @type {BarItem} */
        barItem: Object,
        // Focus the first field
        autofocus: Boolean
    },
    data() {
        return {
            allParameters: params.allParameters,
            /** @type {Object<String,Boolean?>} */
            validationStates: {},
            /** @type {Object<String,String>} */
            validationErrors: {},
            checkTimers: {},
            isChecking: {},
            lastValues: {},
            /** @type {Object<String,String>} */
            values: {}
        };
    },
    methods: {
        /**
         * Determines if validation is required for the given parameter.
         * @param {String} paramKey The parameter key.
         * @return {Boolean} true if the field should be validated.
         */
        validationRequired: function (paramKey) {
            const param = this.allParameters[paramKey];
            return param.type !== "checkbox" && param.isEnabled(this.barItem) && param.isApplicable(this.barItem);
        },

        /**
         * Gets the tag name for a field.
         * @param {ParameterInfo} paramInfo The parameter
         * @return {String} The HTML tag name.
         */
        getFieldTag: function (paramInfo) {
            return componentMap[paramInfo.type];
        },

        /**
         * A value has changed. Validate, then check for problems.
         *
         * @param {String} paramKey The parameter key.
         * @param {String} value The new value.
         */
        valueChanged: function (paramKey, value) {
            this.validate(paramKey, true);
        },

        /**
         * Validate, then check for problems.
         *
         * @param {String} paramKey The parameter key.
         * @param {Boolean} input True if the user is currently entering the value.
         */
        validate: function (paramKey, input) {
            if (this.validationRequired(paramKey)) {
                // Validate the value
                const error = params.getValidationError(this.barItem, paramKey);

                if (error) {
                    this.validationStates[paramKey] = false;
                    this.validationErrors[paramKey] = error;
                } else if (params.hasChecks(paramKey)) {
                    this.validationStates[paramKey] = null;

                    if (input) {
                        this.checkValueLater(paramKey);
                    } else {
                        this.checkValue(paramKey);
                    }
                } else {
                    this.validationStates[paramKey] = true;
                }
            } else {
                this.validationStates[paramKey] = null;
            }
        },

        /**
         * Checks a value for problems.
         * @param {String} paramKey The parameter key.
         * @param {Boolean} live true if this is a live check - while the user is typing.
         */
        checkValue: function (paramKey, live) {
            this.clearCheckTimer(paramKey);

            this.isChecking[paramKey] = true;
            params.checkForProblems(this.barItem, paramKey, live).then((result) => {
                this.isChecking[paramKey] = false;
                const problem = params.getProblem(this.barItem, paramKey);
                this.validationStates[paramKey] = !problem || !problem.isProblem;
                this.validationErrors[paramKey] = problem && problem.message;
                this.$forceUpdate();
            });
        },

        /**
         * Checks a value in a few seconds, so a check isn't performed on every keypress.
         * If a previous call to this is still waiting, it is cancelled.
         * @param {String} paramKey The parameter key.
         */
        checkValueLater: function (paramKey) {
            this.clearCheckTimer(paramKey);
            this.checkTimers[paramKey] = setTimeout(() => {
                this.checkValue(paramKey, true);
                delete this.checkTimers[paramKey];
            }, 2000);
        },

        /**
         * Clears a timer that's waiting to check a field.
         * @param {String} paramKey The parameter key. Omit to clear all.
         */
        clearCheckTimer: function (paramKey) {
            if (paramKey === undefined) {
                Object.values(this.checkTimers).forEach(clearTimeout);
                this.checkTimers = {};
            } else {
                const timer = this.checkTimers[paramKey];
                if (timer) {
                    clearTimeout(timer);
                    delete this.checkTimers[paramKey];
                }
            }
        }

    },
    mounted() {
        // Show any problems associated with the fields.
        this.barItem.data.paramFields.forEach(paramKey => {
            const problem = params.getProblem(this.barItem, paramKey);
            console.log(paramKey, problem);
            const err = problem && problem.message;
            this.validationErrors[paramKey] = err;
            this.validationStates[paramKey] = err ? false : null;
            this.isChecking[paramKey] = false;
        });
        this.$forceUpdate();
    },
    beforeDestroy() {
        this.clearCheckTimer();
    },
    watch: {
        "barItem.data.parameters": {
            deep: true,
            /**
             * When a field is changed
             */
            handler: function () {
                Object.keys(this.barItem.data.parameters).forEach(paramKey => {
                    const newValue = this.barItem.data.parameters[paramKey];
                    if (this.lastValues[paramKey] !== newValue) {
                        this.valueChanged(paramKey, newValue);
                        this.lastValues[paramKey] = newValue;
                    }
                });
            }
        }
    }
};
</script>
