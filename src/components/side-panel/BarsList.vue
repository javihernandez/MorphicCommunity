<!-- A list of bars, either for a single member or all shared bars -->
<template>
  <div class="barsList">
    <ul class="list-unstyled"
        :aria-label="ariaLabel || $t('BarsList.bars_aria-label', {name: member.displayName})"
    >
      <li v-for="(bar, index) in orderedBars" :key="bar.id"
          :class="{ active: bar.id === activeBarId }"
      >
        <b-link
                :to="getBarEditRoute(bar)"
                :ref="'bar' + index"
                class="barLink"
        >{{ bar.name === "Default" ? $t('BarsList.default-bar') : bar.name }}
        </b-link>
      </li>
    </ul>
    <div>
      <b-button v-bind="buttonAttrs"
                variant="morphic-blue"
                @click="$emit('newbar', member)"
                class="addNew"
                v-if="showAddButton"
                :aria-label="$t('BarsList.new-bar_button_aria-label', {name: member.displayName})"
                v-t="'BarsList.new-bar_button'" />
      <em v-if="!anyBars" class="d-block">You have no MorphicBars of your own yet.</em>
    </div>
  </div>
</template>

<style lang="scss" scoped>
</style>

<script>
import * as Bar from "@/utils/bar";

export default {
    name: "BarsList",
    props: {
        /** @type {Array<BarDetails>} */
        bars: Array,
        activeBarId: String,
        /** @type {CommunityMember} */
        member: Object,
        // variant attribute for buttons
        buttonAttrs: Object,
        ariaLabel: String
    },
    methods: {
        getBarEditRoute: function (bar) {
            return this.member
                ? Bar.getUserBarEditRoute(bar.id, this.member)
                : Bar.getBarEditRoute(bar);
        },

        /**
         * Get the bars belonging to the current member, or all shared bars.
         * @return {Array<BarDetails>} The bars
         */
        getBars: function () {
            let bars;
            if (this.member) {
                bars = Bar.getMemberBars(this.bars, this.member);
            } else {
                bars = this.bars.filter(b => b.is_shared);
            }

            return bars.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });
        }
    },
    computed: {
        /** @return {Array<BarDetails>} The bars to list */
        orderedBars() {
            return this.getBars();
        },
        showAddButton() {
            return this.member && this.orderedBars.length < this.CONFIG.MAX_BARS;
        },
        anyBars: function () {
            return this.getBars().length > 0;
        }
    },
    data() {
        return {
        };
    }
};
</script>
