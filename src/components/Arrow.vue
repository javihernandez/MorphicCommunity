<!-- Draws an from this element, pointing to another -->
<template>
  <span v-bind="$attrs"
        :class="`arrowStart ${unique}`"/>
</template>

<script>
import * as ArrowLine from "arrow-line";

export default {
    name: "Arrow",
    props: {
        // The selector of the element to where the arrow points.
        pointTo: String,
        // Options for ArrowLine
        options: Object
    },
    data() {
        return {
            /** @type {ArrowLine} */
            arrowLine: null,
            unique: this.generateId("arrow")
        };
    },
    computed: {
    },
    updated() {
        this.createArrow();
    },
    mounted() {
        this.createArrow();
    },
    destroyed() {
        this.destroyArrow();
    },
    methods: {
        createArrow: function () {
            this.destroyArrow();

            const options = Object.assign({
                sourcePosition: "bottomRight",
                destinationPosition: "topLeft",
                forceDirection: "horizontal",
                curvature: 0.5
            }, this.options);

            this.arrowLine = new ArrowLine(`.${this.unique}`, this.pointTo, options);
        },
        destroyArrow: function () {
            if (this.arrowLine) {
                this.arrowLine.remove();
                this.arrowLine = null;
            }
        }
    }
};
</script>

