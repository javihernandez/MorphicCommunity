<template>
  <div id="preview-holder" class="desktop mt-3" @click="$emit('click', $event)">
    <drop mode="cut" class="dragToDelete desktop-portion">
      <template v-slot:drag-image="">
        <img src="/img/trash.svg" style="height: 100px; width: 100px; margin-left: -50px; margin-top: -50px" />
      </template>

      <div class="bar-label-container">
        <div class="bar-label">
          <strong class="bar-name" aria-label="Bar name">{{barDetails.name}}</strong>
          <span v-if="memberDetails" class="bar-owner" aria-label="Bar owner">{{memberDetails.displayName}}</span>
          <small class="bar-tip">Tip: To customize a button on the bar, click on it.</small>
        </div>
      </div>

      <!-- Show a hint pointing to the bar, for new bars -->
      <div v-if="!isChanged && barDetails.items && barDetails.items.length === 0" class="hint-box">
        <Arrow point-to=".hint-box .arrowTo" :options="{
                sourcePosition: 'middleRight',
                destinationPosition: 'bottomRight',
                thickness: 1,
                endpoint: {type: 'arrowHead'}
        }"/>
        <span class="arrowTo" />
        <p>This is an empty MorphicBar.</p>
        Click or drag a button from the Button Catalog (on the right) to add it to the bar.
      </div>

      <!-- Bar item problems -->
      <div class="desktop-alerts">
        <b-alert v-for="(error) in barWarnings"
                 :key="error.key"
                 show
                 variant="warning"
        >
          <div @mouseenter="highlight(true, error.item, error.duplicates)"
               @mouseleave="highlight(false, error.item, error.duplicates)"
               @click="showEditDialog(error.item)"
               :title="error.details"
          >

            <b-icon-exclamation-triangle-fill v-if="!error.level || error.level === 'error'" variant="danger" />
            <b-icon-info-circle-fill v-if="error.level === 'warn'" variant="info" />
            &nbsp;

            <!-- Duplicated labels -->
            <template
                    v-if="error.type === 'duplicate' && error.item.configuration.label === error.duplicates[0].configuration.label">
              <BarItemLink :bar-item="error.item"
                           @click="showEditDialog(error.item)"
                           @mouseover="highlight(false, error.item)"
                           @mouseleave="highlight(true, error.item)"
              />
              is duplicated.
            </template>

            <!-- Duplicated actions -->
            <template v-else-if="error.type === 'duplicate'">
              <BarItemLink :bar-item="error.item"
                           @click="showEditDialog(error.item)"
                           @mouseover="highlight(false, error.item)"
                           @mouseleave="highlight(true, error.item)"
              />

              performs the same action as
              <BarItemLink :bar-item="error.duplicates[0]"
                           @click="showEditDialog(error.duplicates[0])"
                           @mouseenter="highlight(false, error.duplicates)"
                           @mouseleave="highlight(true, error.duplicates)"
              />
            </template>

            <!-- Generic problem -->
            <template v-else>
              <BarItemLink :bar-item="error.item"
                           @click="showEditDialog(error.item)"
              />
              :
              {{ error.message }}
            </template>

          </div>
        </b-alert>
      </div>
    </drop>

    <!-- Buttons Bar -->
    <div id="preview-bar">
      <div class="barPreviewEditor" ref="myref">
        <drop-list :items="barDetails.items"
                   :class="openDrawer && 'showDrawer'"
                   class="buttonsList draggable-area"
                   @insert="dropToBar"
                   @reorder="dragReorder">
          <template v-slot:item="{item}">
            <drag :key="item.id"
                  @dragstart="setDragInProgress(true)"
                  @dragend="setDragInProgress(false)"
                  @click="showEditDialog(item, $event)"
                  @cut="removeButton(item, barDetails.items)"
                  class="buttonDragger">
              <div :key="item.id"
                   :class="{
                     previewHolder: true,
                     newItem: item.data.isNew
                   }"
                   :ref="buttonRef(item)"
              >
                <PreviewItem :item="item" />
              </div>
            </drag>
          </template>
          <template v-slot:feedback="{data}">
            <div class="item feedback button-feedback" :key="data.id"></div>
          </template>
        </drop-list>
      </div>
      <div class="logoHolder" aria-hidden="true">
        <b-img src="/img/logo-color.svg" alt=""/>
      </div>
      <div class="openDrawerIconHolder" aria-hidden="true">
        <span @click="openDrawer = !openDrawer" class="">
          <b-icon :icon="openDrawer ? 'arrow-right-circle-fill' : 'arrow-left-circle-fill'"></b-icon>
        </span>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import "~@/styles/variables";

#preview-holder.desktop {
  width: 100%;
  height: 600px;
  position: relative;
  display: flex;

  //noinspection CssUnknownTarget
  background: url(/img/background-editor.png);

  margin-top: 0 !important;

  .desktop-portion {
    display: flex;
    flex-grow: 1;
    flex-direction: column;
    position: relative;

    .bar-label-container {
      flex-grow: 1;
      text-align: center;
      .bar-label {
        display: inline-block;
        position: relative;

        top: 25%;


        margin: 0.5rem;
        padding: 1rem;
        font-size: 18px;

        border-radius: 1rem;
        background-color: #CCE5FD;


        .bar-name, .bar-owner, .bar-tip {
          display: block;
        }
        .bar-tip {
          margin-top: 1em;
          width: 15em;
        }
      }
    }
  }


  .hint-box {
    width: 20em;
    right: 0;
    margin: 1em 3em 0 0;
    position: absolute;
    .arrowStart {
      float: right;
      margin-top: 1em;
    }
    .arrowTo {
      position: absolute;
      right: -4.5em;
      top: 0.5em;
    }
  }

  .desktop-alerts {
    display: flex;
    justify-content: flex-end;
    flex-direction: column;

    .alert {
      width: fit-content;
      padding: 0;

      & > div {
        padding: 5px;
      }

      margin: 0 5px 10px 5px;

      transition: box-shadow 0.2s ease;
      cursor: pointer;

      &:hover {
        box-shadow: 2px 2px 2px 2px rgba(0, 0, 0, 0.4);
      }

      svg {
        margin: 0 0.2em;
      }

    }
  }

  .preview-bar {
    padding-bottom: 5rem;
  }

  #preview-bar {
    // This sets the scale of the bar items.
    // All the sizes are measured in pixels, but converted to ems at a font-size of 14px.
    font-size: 12px;

    $bar-width: 120px;

    border: 1px solid #002957;
    background: white;
    // vertical line separating bar from drawer
    background-image: linear-gradient(#000, #000);
    background-size: 1px 100%;
    background-repeat: no-repeat;
    background-position: right em($bar-width) bottom 0px;

    display: flex;
    justify-content: center;
    align-content: center;

    // flex columns don't expand the container, so rotate the text flow here, and make the buttonList flex-direction to row
    writing-mode: vertical-rl;

    .barPreviewEditor {
      min-width: em($bar-width);
      flex-grow: 1;

      .buttonsList {
        height: 100%;

        display: inline-flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: flex-start;
        align-content: flex-start;

        // Hide the drawer by limiting the width
        &:not(.showDrawer) {
          width: em($bar-width) !important;
          overflow: hidden;
        }

        & > div {
          min-width: 50px;
        }

        .newItem {
          opacity: 0.4;
        }

        // Place-holder for dropping a new button.
        .button-feedback, .feedback {
          display: block;
          background-color: #e5f4ed;
          border: 2px dashed rgb(16 141 74);
          height: em(50px);
          min-width: em(95px);
          margin-left: em(10px);
          margin-right: em(10px);
          border-radius: em(10px);
          margin-top: em(10px);

          &.clickDropSpot {
            margin-top: 0px;
          }
        }
      }

      .buttonDragger {
        writing-mode: horizontal-tb;
        margin: em(10px) em(10px) 0 em(10px);
      }
    }

    .logoHolder {
      writing-mode: initial;
      text-align: center;
      width: em($bar-width);
      padding: em(15px) 0 em(15px) 0;

      img {
        width: em(48px);
        height: em(48px);
      }
    }

    .openDrawerIconHolder {
      cursor: pointer;
      position: absolute;
      right: em($bar-width);
      bottom: 25px;

      & > span {
        cursor: pointer;
      }

      .b-icon {
        font-size: 2em;
        background: black;
        color: white;
        border-radius: 100%;
        border: 1px solid black;
      }
    }
  }

  #preview-bar, #preview-drawer {
    .buttonCatalogEntry {
      .active {
        background-color: transparent;
        border: 0;
        width: initial;

        .buttons {
          button.withImage {
            display: none;
          }

          display: flex;
          justify-content: space-around;
          align-items: flex-end;
        }

        h3, div.description, div.help {
          display: none;
        }
      }
    }
  }
}

</style>

<script>
import { Drag, Drop, DropList } from "vue-easy-dnd";
import BarItemLink from "@/components/editor/BarItemLink";
import PreviewItem from "@/components/dashboard/PreviewItem";
import Arrow from "@/components/Arrow";
import * as Bar from "@/utils/bar";

export default {
    name: "DesktopBarEditor",
    components: {
        Arrow,
        BarItemLink,
        PreviewItem,
        Drag,
        Drop,
        DropList
    },
    props: {
        /** @type {BarDetails} */
        barDetails: {},
        /** @type {CommunityMember} */
        memberDetails: {},
        isChanged: Boolean
    },
    data() {
        return {
            openDrawer: true,
            dragInProgress: false
        };
    },
    computed: {
        barWarnings: function () {
            Bar.checkBar(this.barDetails);
            return this.barDetails.errors;
        }
    },
    methods: {
        /**
         * Returns the ref id for a button.
         * @param {BarItem} button The button
         * @return {String} The ref id.
         */
        buttonRef: function (button) {
            return "button_" + button.id;
        },

        /**
         * Highlight some buttons
         * @param {Boolean} value true to highlight
         * @param {Array<BarItem>} buttons The buttons to highlight
         */
        highlight(value, buttons) {
            for (let a = 1; a < arguments.length; a++) {
                this.makeArray(arguments[a]).forEach(button => {
                    const preview = this.$refs[this.buttonRef(button)];
                    if (preview) {
                        preview.classList.toggle("highlight", !!value);
                    }
                });
            }
        },
        dropToBar: function (event, noImage) {
            this.$emit("item-dropped", {
                item: event.data,
                noImage: noImage || event.type === "catalogButtonNoImage",
                index: event.index
            });
            return true;
        },
        dragReorder: function (event) {
            event.apply(this.barDetails.items);
            this.onBarChanged();
        },

        // used to avoid bug where a "click" event is triggered at end of drag
        setDragInProgress: function (newValue) {
            this.dragInProgress = newValue;
        },

        /**
         * Shows the edit button dialog.
         * @param {BarItem} [item] The item to edit.
         */
        showEditDialog: function (item) {
            if (!this.dragInProgress) {
                this.$emit("edit-item", item);
            }
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

