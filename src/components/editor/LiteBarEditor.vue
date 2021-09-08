<template>
  <div id="LiteBarEditor">
    <div class="editorHeader">
      <div/>
      <div class="editorTitle">
        <h3>Buttons on the Bar</h3>
        Tip: To customize a button on the bar, click on it.
      </div>
      <div><b-button variant="secondary" @click="showCatalog()">Add a button</b-button></div>
    </div>

    <div class="bar">
      <ol class="barItems list-unstyled">
        <li v-for="(item, index) in barDetails.items"
             :key="item.id"
             class="previewHolder barItem">
          <span class="listNumber">{{index+1}}</span>
          <PreviewItem :item="item" @click="showEditDialog(item)" />
        </li>

      </ol>
    </div>

  </div>
</template>

<style lang="scss">

@import "~@/styles/bootstrap-util";


#LiteBarEditor {
  margin-top: 1.5em;
  // heading above the editor: 3 columns centered, middle at content size
  .editorHeader {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    align-items: flex-end;

    & > * {
      flex: 1 1 0;
      text-align: center;
      white-space: nowrap;
    }

    .editorTitle {
      flex-grow: 0;
    }

    // left and right columns wrap below the middle
    @include media-breakpoint-down(sm) {
      flex-wrap: wrap;
      .editorTitle {
        order: -1;
        flex-basis: 100%;
        white-space: unset;
      }
      & > :first-child {
        text-align: left;
      }
      & > :last-child {
        text-align: right;
      }
    }
  }

  .bar {
    border: $gray-400 solid 2px;
    border-radius: 1em;
    margin: 1em auto;
    width: fit-content;
    padding: 0.5em 3em;

  }

  .barItems {
    display: flex;
    flex-direction: column;
    align-items: center;

    .barItem {
      margin-top: 1em;
      position: relative;

      // Make the items centered without considering the item number.
      .listNumber {
        &::after {
          content: '.';
        }

        position: absolute;
        margin-bottom: 0.5em;
        margin-right: 1em;
        right: 100%;
        bottom: 0;

      }
    }
  }
}

.focusMode .previewItem:focus {
  outline: black dotted 2px;
  box-shadow: 0 0 0 5px lawngreen;
}

</style>

<script>

import PreviewItem from "@/components/dashboard/PreviewItem";

export default {
    name: "LiteBarEditor",
    components: {
        PreviewItem
    },
    props: {
        barDetails: {}
    },
    data() {
        return {
        };
    },
    methods: {

        /**
         * Tell the parent component to show the edit button dialog.
         * @param {BarItem} [item] The item to edit.
         */
        showEditDialog: function (item) {
            this.$emit("edit-item", item);
        },

        /**
         * Tell the parent component to show the button catalog.
         */
        showCatalog: function () {
            this.$emit("add-item");
        },

        removeButton: function (item, itemList) {
            const compareObjects = function (x, y) {
                for (const key in x) {
                    if (x[key] !== y[key]) {
                        return false;
                    } else {
                        if (x[key] instanceof Object && y[key] instanceof Object) {
                            if (compareObjects(x[key], y[key]) === false) {
                                return false;
                            }
                        }
                    }
                }
                return true;
            };
            const index = itemList.findIndex(x => compareObjects(x, item));
            itemList.splice(index, 1);
            this.onBarChanged();
        },

        onBarChanged: function () {
            this.$emit("bar-changed");
        }
    }
};

</script>
