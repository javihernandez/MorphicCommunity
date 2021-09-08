<template>
  <b-link class="previewItem" id="previewItemButton"
          :class="[buttonClass, {broken: hasError}]"
          :disabled="disabled"
          v-b-tooltip="{title: 'This button has an issue. Click for more information', placement: 'left', variant: 'warning', disabled: !hasError}"
           :to="linkTo"
          @click="$emit('click', {data: item})"
  >

    <!-- Simplified button (no text and small size) -->
    <template v-if="buttonClass === 'simplified'">
      <div v-if="item.data.visual && item.data.visual.type === 'multiButton'" class="multiButton">
        <div class="buttons" style="margin-top: 5px;">
          <span v-for="(button, index) in item.data.visual.buttons" v-bind:key="index"
                  class="rounded multiButton"
                  :style="'background: ' + defaultColor"
                  v-bind:class="{ 'extraBig': item.data.visual.extraBig}">
          </span>
        </div>
      </div>
      <div v-else-if="noImage" class="noImage" :style="'background: ' + defaultColor">
      </div>
      <div v-else class="regular" :style="'background: ' + defaultColor">
        <div class="imageContainer" :style="'border-color: ' + defaultColor">
          <b-img :src="getIconUrl(item.configuration.image_url)" alt="" />
        </div>
      </div>
    </template>

    <!-- Multibutton rendering -->
    <template v-else-if="buttonClass === 'multiButton'">
      <label>{{ item.configuration.label }}</label>
      <div class="buttons">
        <button v-for="(button, index) in item.data.visual.buttons" v-bind:key="index"
                :style="'background: ' + defaultColor + '; background-color: ' + (item.configuration.color || defaultColor) + ';'"
                v-bind:class="{ 'extraBig': item.data.visual.extraBig}"
                tabindex="-1">
          {{ button }}
        </button>
      </div>
    </template>

    <!-- Normal button with/without image -->
    <template v-else>
      <div v-if="item.configuration.image_url && !noImage"
           :style="'border-color: ' + (item.configuration.color || defaultColor) + '; color: ' + (item.configuration.color || defaultColor) + ';'"
           class="iconHolder">
        <b-img :src="getIconUrl(item.configuration.image_url)" alt="" />
      </div>
      <b :style="'background-color: ' + (item.configuration.color || defaultColor) + ';'"
         v-bind:class="{ withImage: !noImage && item.configuration.image_url }">{{ item.configuration.label }}</b>
    </template>

    <img v-if="hasError" id="warningIcon" class="errorIcon" src="/img/warning.svg" alt="This item has a problem."  />

  </b-link>
</template>

<style lang="scss">
  @import "~@/styles/variables";

  .previewItem.simplified {
    display: flex;
    justify-content: center;

    .noImage {
      height: 37px;
      border-radius: 9px;
      width: 75px;
    }

    .regular {
      height: 37px;
      border-radius: 9px;
      width: 75px;
      margin-top: calc(50px/3);
      position: relative;

      .imageContainer {
        width: 38px;
        height: 38px;
        margin-top: -17px;
        margin-left: auto;
        margin-right: auto;
        background: white;
        border-radius: 100%;
        border-width: 2px;
        border-style: solid;
        z-index: 10;
        position: absolute;
        left: 17px;
        display: flex;
        justify-content: center;
        align-items: center;

        img {
          height: 23px;
          width: 23px;
        }
      }
    }

    .multiButton {
      border: none;
      min-height: 37px;
      min-width: 37px;
      margin: 0.05rem 0.05rem 0.05rem 0.05rem;
    }
  }

  .previewHolder {
    b, button {
      transition: box-shadow 0.5s ease;
    }
    &.highlight .previewItem > b, &.highlight .buttons button  {
      box-shadow: 0 0 5px 5px red;
    }
  }

  // A bar item.
  .previewItem {
    display: inline-block;
    text-align: center;
    position: relative;
    width: em(100px);
    background: none;
    border: none;
    color: white;
    padding: 0;


    cursor: pointer;

    &:hover {
      text-decoration: none;
      color: white;
    }


    &.standardButton {
      $icon-size: em(66px);
      b {
        padding: em(10px);
        border-radius: em(10px);
        display: block;

        &.withImage {
          padding-top: ($icon-size / 3);
        }
      }

      .iconHolder {
        width: $icon-size;
        height: $icon-size;
        margin-bottom: (-$icon-size / 3);
        margin-left: auto;
        margin-right: auto;
        background: white;
        border-radius: 100%;
        border: 2px solid silver;
        z-index: 10;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;

        img {
          height: $icon-size * 0.6;
          width: $icon-size * 0.6;
        }
      }
    }

    &.multiButton {
      label {
        color: black;
        margin-bottom: em(3px);
      }

      .buttons {
        display: flex;

        button:not(:last-child) {
          margin-right: em(5px);
        }

        button {
          border: none;
          flex-grow: 1;
          padding: em(5px) !important;
          color: white;
          font-weight: bold;

          &.extraBig {
            font-size: em(18px);
            line-height: em(16px);
          }
        }
      }
    }

    .errorIcon { display: none; }
  }

  #preview-bar .previewItem {
    &.broken {
      .errorIcon {
        width: 35px;
        height: 35px;
        display: inline-block;
        position: absolute;
        bottom: -10px;
        right: -10px;
      }

      opacity: 0.8;
    }
  }
</style>

<script>

import { colors, icons } from "@/utils/constants";
import * as params from "@/utils/params";

export default {
    name: "PreviewItem",
    props: {
        /** @type {BarItem} */
        item: Object,
        simplified: Boolean,
        noImage: Boolean,
        to: Object,
        disabled: Boolean
    },
    data() {
        return {
            colors: colors,
            defaultColor: colors.blue,
            icons: icons
        };
    },
    methods: {
        addToBar: function (item, event) {
            if (this.simplified) {
                this.$emit("addToBarFromPreview", {
                    data: item,
                    type: event.srcElement._prevClass === "noImage" ? "catalogButtonNoImage" : "catalogButtonWithImage"
                });
            }
        }
    },
    computed: {
        linkTo: function () {
            return this.to || undefined;
        },
        hasError: function () {
            /** @type {BarItem} */
            var item = this.item;
            return (item.data.hasError && !item.data.catalogItem) || params.hasProblem(item);
        },
        /**
         * Determines how the item is displayed.
         * @return {String} "simplified", "multiButton", "standardButton"
         */
        buttonClass: function () {
            /** @type {BarItem} */
            var item = this.item;

            if (this.simplified) {
                return "simplified";
            } else if (item.data.visual && item.data.visual.type === "multiButton") {
                return "multiButton";
            } else {
                return "standardButton";
            }
        }
    }
};
</script>
