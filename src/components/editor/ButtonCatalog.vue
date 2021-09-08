<template>
  <div id="ButtonCatalog"
       class="fill-height bg-silver" :class="{
                noResults: searchState === 'noResults',
                gotResults: searchState === 'gotResults',
                searchResults: !!searchState
               }">

    <h3 id="ButtonCatalogHeader">Button Catalog</h3>
    <div id="CatalogDescription">
      <span v-if="isLite">Click on a button name to configure and add to MorphicBar</span>
      <span v-else>Click or Drag name (below) to add button to the bar</span>
    </div>

    <!-- search -->
    <b-input-group id="search-group" class="catalogSearch" size="sm">
      <b-form-input type="search" placeholder="Search buttons" v-model="searchText" aria-label="Search the button catalog"/>
      <b-input-group-append>
        <b-button variant="outline-secondary" aria-label="Search" @click="searchButtonClick">
          <b-icon-search/>
        </b-button>
      </b-input-group-append>
    </b-input-group>

    <div ref="SearchResultSummary" class="screenReader" aria-live="polite" aria-atomic="true" >{{ resultSummary }}</div>

    <drop class="cut" mode="cut">
      <template v-slot:drag-image="">
        <img src="/img/trash.svg" style="height: 100px; width: 100px; margin-left: -50px; margin-top: -50px"/>
      </template>
      <ul v-for="(catalog, isSearchResult) in [buttonCatalog, searchResult]"
          :key="isSearchResult"
          aria-describedby="CatalogDescription"
          aria-labelledby="ButtonCatalogHeader"
          class="buttonCatalogListing linkList list-unstyled"
          :class="{ searchResults: isSearchResult}">

        <li v-if="isSearchResult && searchResult && searchResult.itemsFound.hidden">
          <small>No buttons where found while searching for '<code>{{searchText}}</code>'</small>
        </li>
        <template v-for="(buttonGroup, subkind) in catalog">
          <li v-if="!buttonGroup.hidden"
              :key="subkind"
              :ref="`catalogGroup_${subkind}`"
              class="catalogGroup"
              :class="{
                        hasSecondary: buttonGroup.hasSecondary,
                        showSecondary: alwaysShowSecondaryItems || secondaryItemsShown[subkind],
                        searchResult: buttonGroup.isSearchResult
                    }">

            <h4 v-if="buttonGroup.title">{{buttonGroup.title}}</h4>

            <ul class="buttonCatalogEntries"
                :aria-label="buttonGroup.isSearchResult && 'Search results'">
              <template v-for="(button, buttonId) in buttonGroup.items">
                <li v-if="!(button.data.isExpander && alwaysShowSecondaryItems)"
                    :key="button.data.buttonKey"
                    class="buttonCatalogEntry"
                    :class="{
                              noImage: !button.configuration.image_url && !button.data.isExpander,
                              secondaryItem: !button.is_primary,
                              expander: button.data.isExpander
                          }"
                    :style="{order: button.searchResult && button.searchResult.order}"
                    :aria-details="button.configuration.description"
                    :ref="'catalog_' + buttonId"
                >
                  <!-- Render each button as draggable -->
                  <drag :data="button" type="catalogButtonWithImage" :disabled="isLite">
                    <!-- Define looks when dragged -->
                    <template v-slot:drag-image>
                      <PreviewItem :item="button" disabled :noImage="false" />
                    </template>

                    <b-button variant="link"
                              @click="onItemSelected(button, $event.altKey)"
                              :style="'color: ' + (button.configuration.color || colors.blue) + ';'"
                              class="buttonCatalogEntry nonExpandedCatalogEntry">
                      <div class="imageWrapper" :class="{expanderIcon:button.data.isExpander}" aria-hidden="true">
                        <b-iconstack v-if="button.data.isExpander">
                          <b-icon stacked icon="circle-fill"/>
                          <b-icon stacked icon="caret-right-fill"
                                  scale="0.9"
                                  class="text-white"/>
                        </b-iconstack>

                        <b-img v-else-if="button.configuration.image_url"
                               :src="getIconUrl(button.configuration.image_url)" alt=""/>
                      </div>
                      <span v-html="getCatalogItemLabel(button, buttonGroup.searchWords)" />
                    </b-button>

                  </drag>
                </li>
              </template>
            </ul>
          </li>
        </template>
      </ul>
    </drop>
  </div>
</template>

<style lang="scss">

#ButtonCatalog {
  padding: 0.5rem;

  h2 {
    font-size: 18px;
    margin-bottom: 0.1em;
  }
  #CatalogDescription {
    font-size: 15px;
    margin-bottom: 0.5em;
  }

  .catalogSearch {
  }

  img:before {
    content: " ";
  }

  // Hide the listing if search is used
  &.searchResults {
    .buttonCatalogListing:not(.searchResults) {
      display: none;
    }
  }

  &:not(.searchResults) {
    .buttonCatalogListing.searchResults {
      display: none;
    }
  }

  .buttonCatalogListing {
    padding: 0.5rem;

    overflow-y: scroll;
    max-height: 630px;

    h3 {
      font-size: 1.30rem;
      margin-bottom: 6px;
      margin-top: 0;
      font-weight: bold;
    }

    .catalogGroup {
      margin-bottom: 1em;

      // Hide secondary items.
      &:not(.showSecondary, .searchResult) {
        .secondaryItem {
          display: none;
        }
      }

      &.showSecondary {
        .expanderIcon > * {
          transform: rotate(90deg) !important;
        }
      }

      .buttonCatalogEntries {
        display: flex;
        flex-direction: column;
        padding-left: 30px;
        list-style: none;

        .buttonCatalogEntry {
          position: relative;

          // show the primary items first
          &:not(.secondaryItem) {
            order: 0;
          }

          &.expander {
            order: 1;
          }

          &.secondaryItem {
            order: 2;
          }

          .imageWrapper {
            // Position the icon to the left, and remove it from the flow.
            display: inline-block;
            position: relative;
            left: -23px;
            width: 0;
            overflow: visible;

            & > * {
              transition: all 0.2s ease-in-out;
            }
          }

          .buttonsCatalogLink {
            text-align: left;

            &:hover {
              .imageWrapper > * {
                transform: scale(1.5);
              }
            }
          }

          &.noImage {
            img {
              display: none;
            }
          }
        }
      }
    }

    .buttonCatalogEntry {
      width: 100%;
      display: block;

      img, svg {
        max-width: 16px;
        width: 16px;
        display: inline-block;
      }
    }
  }
}

body.isLite #ButtonCatalog .buttonCatalogListing {
  overflow-y: auto;
  max-height: none;
}


</style>

<script>
import PreviewItem from "@/components/dashboard/PreviewItem";
import { Drag, Drop } from "vue-easy-dnd";
import { allButtons, buttonCatalog, colors } from "@/utils/constants";
import * as search from "@/utils/search";

export default {
    name: "ButtonCatalog",
    components: {
        PreviewItem,
        Drag,
        Drop
    },
    props: {
        buttonCatalog: {}
    },
    data() {
        return {
            colors: colors,

            /**
             * Catalog search text
             * @type {String}
             */
            searchText: "",
            /** null, "gotResults" or "noResults" */
            searchState: null,
            showSearchResults: false,

            /** @type {ButtonCatalog} */
            searchResult: false,
            searchResultCount: undefined,
            resultSummary: null,

            /**
             * The display of secondary items in each catalog group.
             * @type {Object<String,Boolean>}
             */
            secondaryItemsShown: Object.keys(buttonCatalog).reduce((map, key) => {
                map[key] = false;
                return map;
            }, {})
        };
    },
    computed: {
        alwaysShowSecondaryItems: function () {
            return this.focusMode;
        }
    },
    methods: {
        onItemSelected: function (item, noImage) {
            this.$emit("item-selected", {
                item: item,
                noImage: !!noImage
            });
        },

        /**
         * Returns the label for an item in the catalog.
         * @param {BarItem} button The button
         * @param {Array<String>} [searchWords] The words from the search, to highlight.
         * @return {String} Label for the item, as raw HTML.
         */
        getCatalogItemLabel: function (button, searchWords) {
            const label = button.data.catalogLabel || button.configuration.label;
            // escape any html
            const escaped = new Option(label).innerHTML;

            let html;
            if (searchWords && searchWords.length > 0) {
                const highlight = new RegExp(searchWords.join("|"), "gi");
                html = escaped.replace(highlight, "<b>$&</b>");
            } else {
                html = escaped;
            }

            return html;
        },
        searchCatalog() {
            if (this.searchText.length > 0) {
                const queryWords = this.searchText.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim().split(/\s+/g);
                // Only the top 20 - they are slow to render.
                const results = search.catalogSearch(queryWords)
                    .sort((a, b) => a.order - b.order)
                    .slice(0, 20);

                /** @type {ButtonCatalogItem} */
                const groups = {
                    itemsFound: {
                        isSearchResult: true,
                        searchWords: queryWords,
                        hasSecondary: false,
                        items: {},
                        hidden: results.length === 0
                    }
                };

                // Make a catalog group for the results.
                results.forEach(result => {
                    /** @type {BarItem} */
                    if (result.buttonKey) {
                        const item = JSON.parse(JSON.stringify(allButtons[result.buttonKey]));
                        item.searchResult = result;

                        groups.itemsFound.items[result.buttonKey] = item;
                    } else if (result.groupKey) {
                        groups[result.groupKey] = JSON.parse(JSON.stringify(buttonCatalog[result.groupKey]));
                    }
                });

                this.searchResult = groups;
                this.searchState = results.length > 0 ? "gotResults" : "noResults";
                this.searchResultCount = results.length;
            } else {
                this.searchState = null;
                this.searchResult = null;
                this.searchResultCount = undefined;
            }
        },
        searchButtonClick() {
            if (this.searchResultCount === undefined) {
                this.resultSummary = "";
            } else {
                this.resultSummary = this.$tc("ButtonCatalog.search-result-summary", this.searchResultCount);
            }
        },

        /**
         * Toggles the catalog items under the "Other" - causes the secondary items to show/hide.
         * @param {String} subkind The catalog group id.
         * @param {Boolean} [show] true/false to show/hide, omit to toggle.
         */
        showSecondaryItems: function (subkind, show) {
            if (show === undefined) {
                this.secondaryItemsShown[subkind] = !this.secondaryItemsShown[subkind];
            } else {
                this.secondaryItemsShown[subkind] = show;
            }
        }

    },
    watch: {
        searchText: function () {
            this.searchCatalog();
        }
    }
};
</script>
