/**
 * Mix-in for accessibility helpers.
 * @type {Component}
 */
export const a11yMixin = {
    methods: {
        /**
         * Provides mnemonic support for dropdowns.
         * @param {VueComponent} dropdown The drop-down component.
         */
        a11yDropdownMnemonics: function (dropdown) {
            if (dropdown.a11yDropdownMnemonics) {
                return;
            }

            /**
             * Starting at a given index, find the first item that begins with the text, then wrap to the start.
             * @param {Array<HTMLElement>} items The list of items.
             * @param {String} text The text to find.
             * @param {Number} startIndex The index from which to start.
             * @return {HTMLElement?} The item found.
             */
            function findNext(items, text, startIndex = 0) {
                const match = (item) => item.innerText.toLowerCase().startsWith(text);

                for (let index = startIndex; index < items.length; index++) {
                    if (match(items[index])) {
                        return items[index];
                    }
                }
                for (let index = 0; index < startIndex; index++) {
                    if (match(items[index])) {
                        return items[index];
                    }
                }

                return undefined;
            }

            // Focus the first item, if there's nothing focused already
            dropdown.$on("shown", function (e) {
                const hasSelection = dropdown.$el.querySelector("ul.dropdown-menu .dropdown-item:focus");
                if (!hasSelection) {
                    dropdown.focusItem(0, dropdown.getItems());
                }
            });

            const elem = dropdown.$el.querySelector("ul.dropdown-menu");

            elem.addEventListener("keydown", (event) => {
                if (event.ctrlKey || event.altKey || event.key.length !== 1) {
                    return;
                }
                const timeout = 5000;
                const lastTime = dropdown.mnemonics_lastTime;
                dropdown.mnemonics_lastTime = event.timeStamp;

                /** @type {Array<HTMLElement>} */
                const items = dropdown.getItems();
                const selectedIndex = items.indexOf(event.target);

                // Reset the search string if after the timeout, or the selection has changed since last time.
                if (dropdown.mnemonics_text === undefined ||
                    !lastTime || event.timeStamp - lastTime > timeout ||
                    selectedIndex !== dropdown.mnemonics_last) {
                    dropdown.mnemonics_text = "";
                }

                // Append the key character to the search string.
                const key = event.key.toLowerCase();
                dropdown.mnemonics_text += key;

                // Find the next matching item.
                let found = findNext(items, dropdown.mnemonics_text, selectedIndex);
                if (!found) {
                    found = findNext(items, key, selectedIndex + 1);
                    if (found) {
                        dropdown.mnemonics_text = key;
                    }
                }

                if (found) {
                    const index = items.indexOf(found);
                    dropdown.focusItem(index, items);
                    dropdown.mnemonics_last = index;
                } else {
                    dropdown.mnemonics_last = selectedIndex;
                }

            });
        },

        /**
         * Make a drop-down support focus wrapping.
         *
         * @param {BDropdown} dropdown The b-dropdown component.
         */
        a11yWrapDropdown: function (dropdown) {
            if (dropdown.focusNext.orig) {
                return;
            }
            const orig = dropdown.focusNext;

            dropdown.focusNext = (event, up) => {
                const items = dropdown.getItems();
                const index = items.indexOf(event.target);

                // When attempting to move beyond the limit, wrap the next focus by faking the selected item to the
                // one after/before the item at other end, and change the direction, before calling the real
                // focusNext().
                let newTarget;
                if (up && index === 0) {
                    newTarget = items[items.length - 2];
                } else if (!up && index >= items.length - 1) {
                    newTarget = items[1];
                }

                if (newTarget) {
                    // Create a dummy event object - this is all focusNext() requires.
                    const e = {
                        target: newTarget,
                        stopPropagation() {
                            event.stopPropagation();
                        },
                        preventDefault() {
                            event.preventDefault();
                        }
                    };
                    dropdown.focusNext.orig(e, !up);
                } else {
                    dropdown.focusNext.orig(event, up);
                }
            };

            dropdown.focusNext.orig = orig;
        }
    }
};
