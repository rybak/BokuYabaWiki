// ==UserScript==
// @name         BokuYaba Wiki: extras overhaul helper
// @namespace    https://andrybak.dev
// @version      4
// @description  Helps with https://bokuyaba.fandom.com/wiki/User:Andrybak/Extras_overhaul
// @author       Andrei Rybak
// @license      MIT
// @match        https://bokuyaba.fandom.com/wiki/Extra_*?action=edit
// @match        https://bokuyaba.fandom.com/wiki/Extra_*?action=submit
// @match        https://bokuyaba.fandom.com/wiki/Chapter_*?diff=prev&oldid=*
// @icon         https://static.wikia.nocookie.net/bokuyaba/images/4/4a/Site-favicon.ico/revision/latest?cb=20230615121844
// @grant        none
// ==/UserScript==

/*
 * Copyright (c) 2025-2026 Andrei Rybak
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* globals mw, $ */

(function() {
	'use strict';

	const LOG_PREFIX = '[BokuYaba: extras overhaul]';
	const USERSCRIPT_OUTPUT_ID = 'BokuYabaExtrasOverhaul';

	function error(...toLog) {
		console.error(LOG_PREFIX, ...toLog);
	}

	function warn(...toLog) {
		console.warn(LOG_PREFIX, ...toLog);
	}

	function info(...toLog) {
		console.info(LOG_PREFIX, ...toLog);
	}

	function debug(...toLog) {
		console.debug(LOG_PREFIX, ...toLog);
	}

	function showWikitextAboveBodyContent(wikitext) {
		info(wikitext);
		const wikitextInput = document.createElement('input');
		wikitextInput.id = USERSCRIPT_OUTPUT_ID;
		wikitextInput.value = wikitext;
		wikitextInput.style.fontFamily = 'monospace';
		wikitextInput.setAttribute('size', wikitext.length);

		const copyButton = document.createElement('button');
		copyButton.textContent = "Copy edit summary";
		copyButton.style.padding = '0.5em';
		copyButton.style.cursor = 'pointer';
		copyButton.style.marginLeft = '0.5em';
		copyButton.onclick = () => {
			document.getElementById(USERSCRIPT_OUTPUT_ID).select();
			document.execCommand('copy');
		};

		const container = document.createElement('div');
		container.appendChild(document.createTextNode("Edit summary: "));
		container.appendChild(wikitextInput);
		container.appendChild(copyButton);
		/*const preview = createPreview(wikitext);
		container.appendChild(preview);*/
		// document.getElementById('bodyContent').prepend(container);
		mw.util.addSubtitle(container)
	}

	function joinEnglish(parts) {
		if (parts.length === 0) {
			return 'unknown';
		}
		if (parts.length === 1) {
			return parts[0];
		}
		if (parts.length === 2) {
			return `${parts[0]} and ${parts[1]}`;
		}
		return parts.slice(0, parts.length - 1).join(", ") + ', and ' + parts[parts.length - 1];
	}

	function uniqueReversed(a) {
		const unique = new Set();
		const ordered = [];
		for (const s of a) {
			debug(typeof(s) + " :: " + s);
			if (unique.has(s)) {
				continue;
			}
			unique.add(s);
			ordered.push(s);
		}
		return ordered.reverse();
	}

	async function mergeFromEditSummary() {
		const pagename = mw.config.get('wgPageName').replaceAll('_', ' ');
		const intervalQuery = {
			action: 'query',
			prop: 'revisions',
			rvlimit: 50, // should be enough for our purposes
			rvprop: 'ids|user',
			rvslots: 'main',
			formatversion: 2, // v2 has nicer field names in responses
			titles: pagename,
		};
		const mwApi = new mw.Api();
		const response = await mwApi.get(intervalQuery);
		info(response.query.pages[0].revisions);
		const lastRevisionId = response.query.pages[0].revisions[0].revid;
		info('Loaded.');
		const users = uniqueReversed(response.query.pages[0].revisions.map(r => r.user));
		const usersStr = joinEnglish(users);
		const editSummary = `/* Twitter extras */ [[User:Andrybak/Extras overhaul|Extras overhaul]]: merge from [[${pagename}]] ([[Special:Permalink/${lastRevisionId}]]), written by ${usersStr}. See [[Special:History/${pagename}]] for full attribution. Add wikilinks, [[Template:Cite tweet]]; copyedit.`;
		showWikitextAboveBodyContent(editSummary);
	}

	async function mergeToEditSummary() {
		const pagename = mw.config.get('wgPageName').replaceAll('_', ' ');
		const oldid = mw.util.getParamValue('oldid');
		const editSummary = `[[User:Andrybak/Extras overhaul|Extras overhaul]]: merge to [[${pagename}#Twitter extras]] – [[Special:Diff/${oldid}]]`;
		showWikitextAboveBodyContent(editSummary);
	}

	async function main() {
		if (mw.config.get('wgPageName').startsWith('Extra')) {
			mergeFromEditSummary();
			return;
		}
		if (mw.config.get('wgPageName').startsWith('Chapter')) {
			mergeToEditSummary();
			return;
		}
	}

	async function waitForLoading(loader, callback, time) {
		if (loader() == undefined) {
			setTimeout(() => waitForLoading(loader, callback), time == undefined ? 100 : Math.min(time * 1.5, 5000));
			return;
		}
		await callback();
	}

	waitForLoading(() => mw && mw.config && mw.loader && mw.loader.using, () => {
		info('Loading...');
		mw.loader.using(['mediawiki.util'], main);
	});
})();
