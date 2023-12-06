/*
 * Copyright (C) 2023  Yomitan Authors
 * Copyright (C) 2021-2022  Yomichan Authors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

(async () => {
    // Reentrant check
    // @ts-expect-error - Checking a property to the global object
    if (self.googleDocsAccessibilitySetup) { return; }
    // @ts-expect-error - Adding a property to the global object
    self.googleDocsAccessibilitySetup = true;

    /**
     * @template [TReturn=unknown]
     * @param {string} action
     * @param {import('core').SerializableObject} params
     * @returns {Promise<TReturn>}
     */
    const invokeApi = (action, params) => {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({action, params}, (response) => {
                void chrome.runtime.lastError;
                if (typeof response !== 'object' || response === null) {
                    reject(new Error('Unexpected response'));
                } else if (typeof response.error !== 'undefined') {
                    reject(new Error('Invalid response'));
                } else {
                    resolve(response.result);
                }
            });
        });
    };

    const optionsContext = {depth: 0, url: location.href};
    /** @type {import('api').OptionsGetResult} */
    let options;
    try {
        options = await invokeApi('optionsGet', {optionsContext});
    } catch (e) {
        return;
    }

    if (!options.accessibility.forceGoogleDocsHtmlRendering) { return; }

    // The extension ID below is on an allow-list that is used on the Google Docs webpage.
    /* eslint-disable */
    // @ts-expect-error : Adding a property to the global object
    const inject = () => { window._docs_annotate_canvas_by_ext = 'ogmnaimimemjmbakcfefmnahgdfhfami'; };
    /* eslint-enable */

    let parent = document.head;
    if (parent === null) {
        parent = document.documentElement;
        if (parent === null) { return; }
    }
    const script = document.createElement('script');
    script.textContent = `(${inject.toString()})();`;
    parent.appendChild(script);
    parent.removeChild(script);
})();
