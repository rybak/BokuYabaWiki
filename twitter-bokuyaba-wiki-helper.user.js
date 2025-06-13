// ==UserScript==
// @name         Twitter: BokuYaba wiki helper
// @namespace    https://andrybak.dev
// @version      6
// @description  Helps with JWB editing on BokuYaba wiki
// @author       Andrei Rybak
// @license      MIT
// @match        https://x.com/*
// @icon         https://abs.twimg.com/favicons/twitter.2.ico
// @require      https://cdn.jsdelivr.net/gh/rybak/userscript-libs@e86c722f2c9cc2a96298c8511028f15c45180185/waitForElement.js
// @grant        none
// ==/UserScript==

/*
 * Copyright (c) 2024-2025 Andrei Rybak
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

/* jshint esversion: 6 */
/* globals waitForElement */

(function() {
	'use strict';

	const TIMESTAMP_SELECTOR = 'article time';
	const USERSCRIPT_CONTAINER_ID = 'BokuYabaWikiHelper';

	function createUserscriptContainer() {
		const div = document.createElement('div');
		div.id = USERSCRIPT_CONTAINER_ID;
		div.style.padding = '0 2rem';
		div.style.zIndex = 1000;
		div.style.right = '1rem';
		div.style.position = 'absolute';
		div.style.top = '1rem';
		div.style.maxWidth = '45rem';
		document.body.append(div);
	}

	function createCopypasteBlock(text) {
		console.info(text);
		const pre = document.createElement('pre');
		pre.append(text);

		const container = document.getElementById(USERSCRIPT_CONTAINER_ID);
		container.append(document.createElement('hr'));
		container.append(pre);
	}

	function createAnnoucementTweetCopypasteBlock() {
		const url = 'https://twitter.com' + document.location.pathname;
		const wikitext = `==Notes==\n* [${url} Announcement tweet]`;
		createCopypasteBlock(wikitext);
	}

	const shortMonthToLongMonth = {
		'Jan': 'January',
		'Feb': 'February',
		'Mar': 'March',
		'Apr': 'April',
		'May': 'May',
		'Jun': 'June',
		'Jul': 'July',
		'Aug': 'August',
		'Sep': 'September',
		'Oct': 'October',
		'Nov': 'November',
		'Dec': 'December',
	};

	function englishOrdinalSuffix(n) {
		if (n === 11 || n === 12 || n === 13) {
			return 'th';
		}
		const mod10 = n % 10;
		if (mod10 === 1) {
			return 'st';
		}
		if (mod10 === 2) {
			return 'nd';
		}
		if (mod10 === 3) {
			return 'rd';
		}
		return 'th';
	}

	function expandDateOfTweet() {
		return waitForElement(TIMESTAMP_SELECTOR).then(timeElement => {
			const original = timeElement.innerText;
			const parts = original.split(" ");
			const shortMonth = parts[3];
			const dayOfMonth = parseInt(parts[4].split(",")[0]);
			const newText = [
				...parts.slice(0, 3),
				shortMonthToLongMonth[shortMonth],
				dayOfMonth + englishOrdinalSuffix(dayOfMonth) + ",",
				parts[5]
			].join(" ");
			timeElement.innerText = newText;
		});
	}

	function createCiteTweetCopypasteBlock() {
		const parts = document.location.pathname.split('/');
		const user = parts[1];
		const number = parts[3];
		waitForElement('section > h1 + div article [data-testid="tweetText"], ' +
					   'section > h1 + div article [data-testid="tweetPhoto"]').then(tweetTextElement => {
			const title = tweetTextElement.innerText;
			const citeTweet = `{{Cite tweet |user=${user} |number=${number}
|title=${title}
|translation=
}}`;
			createCopypasteBlock(`<ref>${citeTweet}</ref>`);
			createCopypasteBlock(`It was released with the teaser text ""<ref>${citeTweet}</ref>`);
		});
	}

	const USERNAMES = new Set([
		'lovely_pig328',
		'boku__yaba',
		'pig_man1209',
		'bokuyaba_anime',
		'haika_nanasaka'
	]);

	if (document.location.pathname.includes('/status/')) {
		const username = document.location.pathname.match(/[/]([^/]+)[/]/)[1];
		if (USERNAMES.has(username)) {
			createUserscriptContainer();
			createAnnoucementTweetCopypasteBlock();
			createCiteTweetCopypasteBlock();
			// expandDateOfTweet();
		}
	}
})();
