<template>
  <b-modal id="modalEditGeneric"
           ref="EditDialog"
           v-bind="dialogAttrs"
           @ok="okClicked" @hide="onHide" @cancel="closeDialog(false)"  @close="closeDialog(false)"
           size="lg"
           :title="dialogTitle">

    <template v-if="!isLite" #modal-footer="{ok, cancel, hide}" >
        <b-button v-if="showDeleteButton" @click="hide('remove')" variant="outline-danger" style="position: absolute; left: 0; margin-left: 20px"><b-icon icon="trash"/>Remove</b-button>
        <b-button @click="cancel()" variant="secondary">Cancel</b-button>
        <b-button @click="ok()"
                  variant="primary"
                  :disabled="button && button.data.isPlaceholder"
        >Save</b-button>
    </template>

    <div v-if="button">
      <b-form>
        <b-row>
          <b-col :md="isLite || 6">
            <!-- The button fields -->
            <div>
              <b-form-group v-if="isLite"
              >
                <b-button v-if="showDeleteButton" variant="invert-danger"
                          @click="editDialog.hide('remove');">Remove Button</b-button>

              </b-form-group>

              <b-form-group v-if="showRelated"
                            :label="buttonGroup.editItemField"
                            label-for="barItem_selectOther"
                            >

                <div class="relatedSelection">

                  <b-dropdown v-if="buttonGroup.allowReselection || wasPlaceholder"
                              variant="light"
                              ref="RelatedDropdown"
                              id="relatedDropdown"
                              menu-class=""
                              boundary="viewport"
                              @show="relatedDropdown(true)"
                              @hidden="relatedDropdown(false)"
                              @shown="relatedDropdownFocusSelected()"
                  >
                    <template #button-content>
                      <template v-if="!button.data.isPlaceholder">
                        <b-img v-if="relatedButtons[button.data.buttonKey].configuration.image_url"
                               :src="getIconUrl(relatedButtons[button.data.buttonKey].configuration.image_url)"
                               aria-hidden="true"
                               alt="" />
                        {{
                          relatedButtons[button.data.buttonKey].data.catalogLabel || relatedButtons[button.data.buttonKey].configuration.label
                        }}
                      </template>
                      <template v-else>
                        {{selectionText}}
                      </template>
                    </template>


                    <template v-for="(item, buttonKey) in relatedButtons">

                      <b-dropdown-item-button v-if="!item.data.isPlaceholder"
                                              :key="buttonKey"
                                              @click="setButton(item)"
                                              :class="{ selected: buttonKey === button.data.buttonKey }"
                      >
                      <b-img v-if="item.configuration.image_url" :src="getIconUrl(item.configuration.image_url)"
                             aria-hidden="true"
                             alt="" />{{ item.data.catalogLabel || item.configuration.label }}
                      </b-dropdown-item-button>
                  </template>

                  </b-dropdown>
                  <template v-else>
                    <b-img v-if="relatedButtons[button.data.buttonKey].configuration.image_url" :src="getIconUrl(relatedButtons[button.data.buttonKey].configuration.image_url)" :alt="relatedButtons[button.data.buttonKey].configuration.label + ' logo'" />
                    {{
                      relatedButtons[button.data.buttonKey].data.catalogLabel || relatedButtons[button.data.buttonKey].configuration.label
                    }}
                  </template>
                </div>

              </b-form-group>

              <BarItemFields v-if="!!button"
                             :bar-item="button"
                             :autofocus="!showRelated && !button.data.isPlaceholder"/>

              <b-form-group v-if="isLite"
                            label="Color for button"
                            label-for="barItem_color">
                <b-form-select id="barItem_color" v-model="button.configuration.color" :options="colorOptions" />

              </b-form-group>

              <b-form-group v-if="isLite"
                            label="Position"
                            label-for="barItem_position">
                <b-form-select id="barItem_position" v-model="selectedPosition" :options="positionOptions" />
              </b-form-group>

              <div v-if="!isLite"
                   class="secondaryFields bg-silver rounded"
              >

                <!-- colour selection -->
                <b-form-group label="Color for button">
                  <b-form-radio-group id="ColorSelection"
                                      class="colorSelection"
                                      v-model="button.configuration.color"
                                      plain>
                    <b-form-radio v-for="(hex, name) in colors"
                                  :key="name"
                                  :value="hex"
                                  class="customRadio colorRadio" :aria-labelledby="`${name}_label`">
                      <span class="screenReader" :id="`${name}_label`">{{name}}</span>
                      <div class="colorBlock" :style="'background-color: ' + hex + ';'" />
                    </b-form-radio>
                  </b-form-radio-group>
                </b-form-group>

                <!-- icon selection -->
                <div class="buttonIcons" aria-live="polite">
                  <div class="actionButtons">
                    <b-button variant="primary"
                              size="sm"
                              :disabled="!selectedIcon && !showImages"
                              @click="selectedIcon = null, showImages = false">Remove button image</b-button>
                    <b-button variant="primary"
                              size="sm"
                              :disabled="showImages"
                              @click="showImages = true">{{ selectedIcon ? "Change button image" : "Add button image"}}</b-button>
                  </div>

                  <b-form-group v-if="showImages"
                                label="Image for button"
                                label-for="ImageSelection">
                    <b-form-radio-group id="ImageSelection"
                                        class="imageSelection"
                                        v-model="selectedIcon"
                                        plain>
                      <b-form-radio v-for="(filename, icon) in listedIcons" xxv-if="icon !== '$favicon' || buttonFavicon"
                                    :key="icon"
                                    :value="icon"
                                    class="customRadio iconRadio">
                        <div>
                          <span v-if="icon === ''">No image</span>
                          <b-img v-else-if="icon === '$favicon'" :src="filename"/>
                          <b-img v-else :src="getIconUrl(icon)"/>
                        </div>
                      </b-form-radio>

                    </b-form-radio-group>
                  </b-form-group>

                </div>
              </div>
            </div>
          </b-col>

          <b-col v-if="!isLite" md="6">
            <div class="sticky-top bg-silver rounded p-3  d-flex flex-column align-items-center">
              <p class="">This is the button you are making</p>
              <p class="" style="margin-top: 4em; order: 1">{{ button.configuration.description }}</p>
              <div class="barPreview rounded">
                <div class="previewHolder" :aria-description="'Preview of button with ' + (selectedIcon ? 'image' : 'no image') ">
                  <PreviewItem :item="button" disabled />
                </div>
              </div>
            </div>
          </b-col>
        </b-row>
      </b-form>
    </div>
  </b-modal>

</template>

<style lang="scss">

@import "~@/styles/bootstrap-util";

.relatedSelection {
  .dropdown-menu {
    max-height: 400px;
    overflow-y: auto;
    position: fixed !important;
  }
  img {
    margin-right: 0.5em;
    width: 32px;
    height: 32px;
  }
}

.relatedLink, ul.relatedButtons > li {
  position: relative;
  display: inline-block;
  margin-left: 30px;

  &.selected a {
    border-radius: 5px;
  }

  a {
    width: auto !important;
    display: inline-block !important;
    padding: 3px;
  }

  .imageWrapper {
    // Position the icon to the left, and remove it from the flow.
    display: inline-block;
    position: relative;
    left: -25px;
    width: 0;
    overflow: visible;

    img {
      transition: all 0.2s ease-in-out;
      max-width: 20px;
      width: 20px;
    }
  }

  a:hover {
    .imageWrapper img {
      transform: scale(1.5);
    }
  }

  &.noImage {
    img {
      display: none;
    }
  }
}

ul.relatedButtons {
  padding-left: 30px;
  list-style: none;

  li {
    width: calc(50% - 30px);
    margin-left: 0;
    margin-right: 30px;
  }
}

.secondaryFields {
  padding: 1em;
  margin: 0 -0.5em;

  & > .form-group > label {
    margin-left: -0.25em;
  }

  .colorSelection {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    justify-items: center;

    background-color: white;
    padding: 0.5em 0.25em;
  }

  .customRadio {
    display: inline;

    label {
      cursor: pointer;
      border: 3px solid transparent;
      padding: 2px;
    }

    input:checked + label {
      border-color: green;
    }

    input:focus-visible + label {
      border-style: dashed;
    }

    &.colorRadio {
      margin: 5px 0;

      label {
        width: 2.5em;
        height: 2.5em;

        .colorBlock {
          width: 100%;
          height: 100%;
        }
      }
    }

    &.iconRadio {
      margin: 5px 5px;

      label {
        width: 5.5em;
        height: 5.5em;


        & > * {
          position: relative;
          width: 100%;
          height: 100%;

          border: 1px solid black;
          border-radius: 100%;
          & > * {
            position: absolute;
            width: 60%;
            max-height: 60%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);

            font-size: 14px;
            text-align: center;
          }
        }
      }
    }
  }

  .buttonIcons {
    .actionButtons {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1em;
    }

    .imageSelection {
      display: flex;
      flex-wrap: wrap;
      align-items: center;

      background-color: white;
    }
  }
}

#modalEditGeneric {
  padding: .5rem 1rem 0 0;
  border-bottom: none;
}

</style>

<script>
import PreviewItem from "@/components/dashboard/PreviewItem";
import {
    allButtons,
    buttonCatalog,
    colors,
    defaultIcons,
    groupedButtons,
    groupedIcons,
    icons
} from "@/utils/constants";
import * as params from "@/utils/params";
import * as Bar from "@/utils/bar";
import BarItemFields from "@/components/editor/BarItemFields";
import { CONFIG } from "@/config/config";
import { dialogMixin } from "@/mixins/dialog.js";
import { a11yMixin } from "@/mixins/a11y";

export default {
    name: "EditButtonDialog",
    props: {
        /** @type {BarDetails} */
        bar: Object
    },

    mixins: [dialogMixin, a11yMixin],

    components: {
        BarItemFields,
        PreviewItem
    },

    data() {
        return {
            /**
             * The item selected in the parent editor
             * @type {BarItem}
             */
            selectedItem: null,
            /**
             * The copy of the item currently being edited.
             * @type {BarItem}
             */
            button: null,

            dialogClosed: null,

            colors: colors,
            groupedButtons: groupedButtons,
            /** @type {ButtonCatalog} Button catalog. */
            buttonCatalog: buttonCatalog,
            /** @type {ButtonCatalogItem} The group in the catalog for this button */
            buttonGroup: undefined,

            dialogTitle: "Edit button",

            // url for the favicon, if available
            buttonFavicon: null,
            /**
             * favicon availability for sites, which have already been checked
             * @type {Object<String,Bool>}
             */
            knownFavicons: {},

            // The key of the selected icon
            selectedIcon: null,

            fieldChanged: 0,

            relatedDropdownStyle: null,

            /** @type {Boolean} true if the bar item was a placeholder when it was opened */
            wasPlaceholder: false,

            selectedPosition: null,
            originalPosition: null,

            // true to show the images, even if there is no image selected
            showImages: false

        };
    },

    computed: {
        editDialog: function () { return this.$refs.EditDialog; },
        document: function () {
            return document;
        },
        /**
         * Gets the icons to be shown in the list.
         * @return {Object<String,String>} The icons to list.
         */
        listedIcons: function () {
            const defaultIcon = defaultIcons[this.button.data.buttonKey];
            const iconKeys = [];

            if (this.button.configuration.subkind === "make" && this.button.data.parameters.url !== undefined) {
                // For custom url buttons, see if there's a pre-defined button for this site
                const host = this.getHost(this.button.configuration.url).replace(/^www\./, "");
                /** @type {BarItem} */
                const other = Object.values(allButtons).find(b => {
                    return b.configuration.url && host === this.getHost(b.configuration.url).replace(/^www\./, "");
                });

                if (other && other.configuration.image_url && !other.configuration.image_url.includes("/")) {
                    iconKeys.push(other.configuration.image_url);
                }
            }

            // Get the icons of the same category.
            const subkind = this.button.configuration.relatedSubkind || this.button.configuration.subkind;
            var group = subkind && groupedIcons[subkind];
            if (!group && this.button.configuration.subkind.startsWith("local-")) {
                group = groupedIcons[group.substr(6)];
            }

            if (group) {
                iconKeys.push.apply(iconKeys, group);
            }

            // Add the generic icons
            iconKeys.push.apply(iconKeys, groupedIcons.generic);

            const togo = {};

            // Add a placeholder for no image
            togo[""] = "";

            if (this.buttonFavicon) {
                togo.$favicon = this.buttonFavicon;
            }

            if (defaultIcon) {
                togo[defaultIcon] = icons[defaultIcon];
            }

            iconKeys.forEach(key => {
                togo[key] = icons[key];
            });

            return togo;
        },

        /**
         * All buttons in the same category.
         * @return {Object<String,BarItem>} The buttons to list
         */
        relatedButtons: function () {
            return this.buttonCatalog[this.button.configuration.subkind].items;
        },

        showRelated: function () {
            return this.buttonGroup.related &&
                Object.values(this.relatedButtons).filter(item => !item.data.isPlaceholder).length > 1;
        },

        /**
         * Determines if the delete button should be shown.
         * @return {Boolean} true to show the delete button.
         */
        showDeleteButton: function () {
            return !this.button.data.isNew;
        },

        /**
         * Get the text for the site/app drop-down if nothing is selected
         * @return {String} The text to display on the drop-down.
         */
        selectionText: function () {
            let text;
            if (this.buttonGroup.selectionText) {
                text = this.buttonGroup.selectionText;
            } else {
                switch (this.button.kind || this.buttonGroup.kind) {
                case "link":
                    text = "Choose a site";
                    break;
                case "application":
                    text = "Choose an application";
                    break;
                default:
                    text = "Choose an action";
                    break;
                }
            }
            return text;
        },

        /**
         * Lite mode: Gets the options for the positions.
         * @return {Array<Object>} options for the position select element.
         */
        positionOptions: function () {
            const options = [];

            const total = this.bar.items.length;
            for (let i = 0; i < total; i++) {
                options.push({
                    value: i,
                    text: `Button position ${i + 1} of ${total}`
                });
            }

            return options;
        },

        /**
         * Lite mode: Gets the options for the colours.
         * @return {Array<Object>} options for the colour select element.
         */
        colorOptions: function () {
            const options = [];

            let found = false;
            Object.keys(this.colors).forEach(color => {
                const hex = this.colors[color];

                if (hex === this.button.configuration.color) {
                    found = true;
                }

                options.push({
                    value: hex,
                    text: this.$t(`EditButtonDialog.color.${color}`)
                });
            });

            // If the button has another colour (if a custom colour selection is implemented), add it to the list.
            if (!found) {
                options.push({
                    value: this.button.configuration.color,
                    text: this.$t("EditButtonDialog.color.other")
                });
            }

            return options;
        }
    },

    methods: {
        changeIcon: function (icon) {
            this.button.configuration.favicon = (icon === "$favicon");

            if (this.button.configuration.favicon) {
                this.getFavicon().then(url => {
                    this.button.configuration.image_url = url;
                });
            } else {
                this.button.configuration.image_url = icon;
            }

            this.selectedIcon = icon;
        },

        /**
         * Called when the OK button is clicked, to apply the changes.
         * @param {Event} e The event object.
         */
        okClicked: function (e) {
            e.preventDefault();
            this.closeDialog(true);
        },

        /**
         * The dialog hide event.
         * @param {Event} e The event object.
         */
        onHide: function (e) {
            if (e.trigger === "remove") {
                // The "Remove button" button was clicked.
                this.removeButton();
                // removeButton() will close the dialog, if required.
                e.preventDefault();
            } else if (e.trigger === "esc") {
                this.closeDialog(false);
            }
        },
        /**
         * Closes the dialog.
         * @param {Boolean} applyChanges true to apply the changes.
         */
        closeDialog: function (applyChanges) {

            let promise;
            if (applyChanges) {
                promise = params.checkForProblems(this.button).then(() => {
                    if (params.hasProblem(this.button)) {
                        return this.showProblems().then(value => value || "cancel");
                    }
                });
            } else {
                promise = Promise.resolve();
            }

            promise.then((value) => {
                if (value !== "cancel") {
                    if (applyChanges) {
                        Object.assign(this.selectedItem, JSON.parse(JSON.stringify(this.button)));
                        if (this.selectedItem.data.isPlaceholder && !this.button.data.isPlaceholder) {
                            delete this.selectedItem.data.isPlaceholder;
                        }

                        if (this.isLite && this.selectedPosition !== this.originalPosition) {
                            var removed = this.bar.items.splice(this.originalPosition, 1);
                            this.bar.items.splice(this.selectedPosition, 0, removed[0]);
                        }
                    }

                    this.$bvModal.hide("modalEditGeneric");
                    this.dialogClosed(applyChanges || this.selectedItem.deleted);
                }
            });
        },

        relatedDropdown: function (shown) {

            if (this.relatedDropdownStyle) {
                this.relatedDropdownStyle.remove();
                this.relatedDropdownStyle = null;
            }

            if (shown) {
                this.relatedDropdownStyle = document.createElement("style");
                document.head.appendChild(this.relatedDropdownStyle);

                const button = document.querySelector("#relatedDropdown > .btn");
                const rect = button.getBoundingClientRect();
                const styleSheet = this.relatedDropdownStyle.sheet;
                styleSheet.insertRule(`#relatedDropdown .dropdown-menu { left: ${rect.left}px !important; top: ${rect.bottom}px !important; transform: unset !important }`);
            }
        },

        /**
         * Focus the selected item on the drop-down.
         */
        relatedDropdownFocusSelected: function () {
            const selected = document.querySelector("#relatedDropdown .dropdown-menu .selected .dropdown-item");
            if (selected) {
                selected.focus();
            }
        },

        /**
         * Shows a message of problems.
         * @return {Promise<Boolean>} true to continue with saving.
         */
        showProblems: function () {
            return this.showConfirm("This button still has some problems.", ["Continue", "Go back"]);
        },
        /**
         * Shows the dialog, editing the selected item.
         * @param {BarItem} selectedItem The item to edit.
         * @return {Promise<Boolean>} Resolves when the dialog is closed, value indicating if the item was updated.
         */
        showDialog: function (selectedItem) {
            this.selectedItem = selectedItem;
            this.button = JSON.parse(JSON.stringify(this.selectedItem));
            this.wasPlaceholder = this.button.data.isPlaceholder;

            this.buttonGroup = buttonCatalog[this.button.configuration.subkind];
            this.dialogTitle = this.buttonGroup.editTitle;

            if (this.isLite) {
                this.originalPosition = this.bar.items.findIndex(item => item.id === this.selectedItem.id);
                this.selectedPosition = this.originalPosition;
            }

            this.selectedIcon = this.button.configuration.favicon ? "$favicon" : this.button.configuration.image_url;
            this.showImages = false;

            this.fixFavicon();
            this.$bvModal.show("modalEditGeneric");

            setTimeout(() => {
                this.a11yWrapDropdown(this.$refs.RelatedDropdown);
                this.a11yDropdownMnemonics(this.$refs.RelatedDropdown);

                // The drop-down doesn't support autofocus.
                if (this.showRelated && this.button.data.isPlaceholder) {
                    document.querySelector("#relatedDropdown button").focus();
                }
            }, 10);

            return new Promise((resolve) => {
                this.dialogClosed = resolve;
            });
        },

        /**
         * When a button in the related items drop-down tab is clicked, apply its content to the button being edited.
         * @param {BarItem} button The button in the catalog.
         */
        setButton: function (button) {
            this.button = JSON.parse(JSON.stringify(button));
            this.button.id = this.generateId(this.button);
            delete this.button.data.catalogItem;
            delete this.button.data.catalogLabel;
            delete this.button.is_primary;
            params.setInitial(this.button);
        },

        /**
         * Removes this button from the bar.
         */
        removeButton: function () {
            this.showConfirm("Do you want to remove this item from the bar?", null, `Delete the '${this.selectedItem.configuration.label}' button`, {dangerous: true}).then(result => {
                if (result) {
                    Bar.removeItem(this.selectedItem, this.bar);
                    this.selectedItem.deleted = true;
                    this.closeDialog(false);
                    this.showMessage("Button removed");
                }
            });
        },

        fixFavicon: async function () {
            this.buttonFavicon = !CONFIG.DISABLE_FAVICONS && this.button.configuration.url && await this.getFavicon(this.button.configuration.url);
            // fix the image url, if it's a favicon
            if (this.button.configuration.favicon && this.button.configuration.url) {
                this.button.configuration.image_url = this.buttonFavicon;
            }
        },

        /**
         * Gets the favicon for the given url, after checking it is available.
         *
         * @param {String} url The url
         * @return {Promise<null|String>} Resolves with the favicon url.
         */
        getFavicon: async function (url) {
            let togo;

            if (!CONFIG.DISABLE_FAVICONS) {
                const lastCheck = this.knownFavicons[url];
                if (lastCheck === undefined) {
                    const host = this.getHost(url);

                    if (host) {
                        const imageUrl = `https://icons.duckduckgo.com/ip2/${host}.ico`;
                        // Check the url before trying to load it.
                        const result = await params.checkUrl(imageUrl);
                        togo = result.isProblem ? null : imageUrl;
                    }

                    this.knownFavicons[url] = togo;
                } else {
                    togo = lastCheck;
                }
            }
            return togo;
        },

        /**
         * Gets the host portion of a url.
         * @param {String} url The url.
         * @return {String} The host portion of the url.
         */
        getHost: function (url) {
            const getHost = /(.*?:\/\/)?([^/:]+)/;
            const m = url && getHost.exec(url);
            return m && m[2];
        }
    },
    watch: {
        button: {
            handler: function (newValue, oldValue) {
                params.applyParameters(this.button);

                this.fieldChanged = Math.random();

                if (this.button.configuration.url) {
                    // Update the favicon (delay the check for when the user is typing in the url).
                    if (this.faviconTimer) {
                        clearTimeout(this.faviconTimer);
                    }

                    if (this.knownFavicons[this.button.configuration.url] === undefined) {
                        this.faviconTimer = setTimeout(() => this.fixFavicon(), 1000);
                    } else {
                        this.fixFavicon();
                    }
                } else {
                    this.buttonFavicon = null;
                }
            },
            deep: true
        },
        selectedIcon: function (newValue) {
            this.changeIcon(newValue);
        }
    }
};
</script>
