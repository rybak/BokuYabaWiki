// ==UserScript==
// @name         Twitter: BokuYaba wiki helper
// @namespace    https://andrybak.dev
// @version      25
// @description  Helps with adding Twitter citations on BokuYaba wiki
// @author       Andrei Rybak
// @license      MIT
// @match        https://x.com/*
// @match        https://web.archive.org/*
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
	const CITATION_BLOCK_ID = 'BokuYabaWikiHelperCitation';

	const LOG_PREFIX = '[BokuYaba Wiki]';

	function info(...toLog) {
		console.info(LOG_PREFIX, ...toLog);
	}
	function warn(...toLog) {
		console.warn(LOG_PREFIX, ...toLog);
	}
	function error(...toLog) {
		console.error(LOG_PREFIX, ...toLog);
	}

	function createUserscriptContainer() {
		const div = document.createElement('div');
		div.id = USERSCRIPT_CONTAINER_ID;
		div.style.padding = '0 2rem';
		div.style.zIndex = 1000;
		div.style.right = '1rem';
		div.style.position = 'absolute';
		div.style.top = '1rem';
		div.style.maxWidth = '45rem';
		return div;
	}

	function createCopyElement(tagName, copyText, textSupplier) {
		const elem = document.createElement(tagName);
		elem.classList.add('r-sdzlij', 'r-3pj75a');
		elem.style.color = 'white';
		elem.style.backgroundColor = 'black';
		elem.style.border = '1px white solid';
		elem.style.padding = '0.5em 1em';
		elem.href = '#';
		elem.appendChild(document.createTextNode(copyText));
		elem.onclick = e => {
			e.preventDefault();
			try {
				navigator.clipboard.writeText(textSupplier());
			} catch (e) {
				error('navigator.clipboard is not supported:', e)
			}
		};
		return elem;
	}

	function createCopyButton(buttonText, textSupplier) {
		return createCopyElement('button', buttonText, textSupplier);
	}

	function createCopypasteBlock(text) {
		info(text);
		const pre = document.createElement('pre');
		pre.append(text);
		return pre;
	}

	function appendToUserscriptContainer(...children) {
		const container = document.getElementById(USERSCRIPT_CONTAINER_ID);
		container.append(document.createElement('hr'));
		container.append(...children);
	}

	function appendUrlCopypasteBlock() {
		const url = 'https://twitter.com' + document.location.pathname;
		appendToUserscriptContainer(
			createCopypasteBlock(url),
			createCopyButton('Copy', () => url)
		);
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

	function escapeSpecialCharacters(wikitext) {
		return wikitext.replaceAll('#', '{{Hashtag}}').replaceAll('|', '{{!}}');
	}

	function cleanUpJapanese(title) {
		return title.replaceAll("【更新】", "")
			.replace(/\n続き→?(.|\n)*$/m, "")
			.replaceAll('\n', '\u3000')
			.replaceAll(/\u3000+/g, '\u3000');
	}

	function cleanUpEnglish(translation) {
		const titleMistranslations = [
			"My Dangerous Girlfriend",
			"My Dangerous Girl",
			"My Dangerous Heart",
			"My Dangerous Man",
			"My Dangerous Wife",
			"My Heart is Crazy",
			"My Heart Yabai",
			"My Heart's Bad Guy",
			"The Bad Guy in My Heart",
			"The Dangerous One in My Heart",
			"The Dangerous Thing in My Heart"
		];
		for (const mistranslation of titleMistranslations) {
			translation = translation.replaceAll(mistranslation, "The Dangers in My Heart");
		}
		return translation
			.replaceAll("#僕ヤバ", "#BokuYaba") // stays untranslated in hashtags
			.replaceAll("[Update] ", "");
	}

	function formatCiteTweet(user, number, title, translation) {
		title = cleanUpJapanese(title);
		const originalLength = title.length;
		title = escapeSpecialCharacters(title);
		translation = cleanUpEnglish(translation);
		translation = escapeSpecialCharacters(translation);
		if (originalLength < 15) {
			return `{{Cite tweet
|user=${user} |number=${number} |title=${title} |translation=${translation}
}}`;
		}
		return `{{Cite tweet
|user=${user} |number=${number}
|title=${title}
|translation=${translation}
}}`;
	}

	function extractTweetText(tweetTextElement) {
		/*
		 * .innerText for <span>s
		 * .alt for emojis which are <img> tags
		 */
		return Array.from(tweetTextElement.childNodes)
			.map(n => ((n.innerText || "") + (n.alt || "")))
			.join("");
	}

	function appendCiteTweetCopypasteBlock(translation) {
		let container = document.getElementById(CITATION_BLOCK_ID);
		if (container == null) {
			container = document.createElement('div');
			container.id = CITATION_BLOCK_ID;
			appendToUserscriptContainer(container);
		}
		const parts = document.location.pathname.split('/');
		const user = parts[1];
		const number = parts[3];
		waitForElement('section > h1 + div article [data-testid="tweetText"], ' +
					   'section > h1 + div article [data-testid="tweetPhoto"]').then(tweetTextElement => {
			const title = extractTweetText(tweetTextElement);
			const citeTweet = formatCiteTweet(user, number, title, translation);
			const refCiteTweet = `<ref>${citeTweet}</ref>`;
			const teaserTranslation = "The latest episode of the adolescent romantic comedy \"The Dangers in My Heart\" has been updated. ";
			const teaserRefCite = formatCiteTweet(user, number, title, teaserTranslation)
			const teaserText = ` It was released with the teaser text "".<ref>${teaserRefCite}</ref>`;
			container.replaceChildren(
				createCopypasteBlock(refCiteTweet),
				createCopyButton('Copy ref', () => refCiteTweet),
				document.createElement('hr'),
				createCopypasteBlock(teaserText),
				createCopyButton('Copy teaser', () => teaserText)
			);
		});
	}

	function clickTranslate() {
		waitForElement('section > h1 + div article [data-testid="tweetText"] + button').then(translateButton => {
			translateButton.click();
			waitForElement('[aria-label="Hide translated post"]').then(hideTranslation => {
				waitForElement('article .css-175oi2r.r-14gqq1x').then(translationDiv => {
					const translation = translationDiv.querySelector('[data-testid="tweetText"]').innerText;
					appendCiteTweetCopypasteBlock(translation);
				});
			});
		});
	}

	function twitter() {
		info('Loading for Twitter...');
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
				document.body.append(createUserscriptContainer());
				appendUrlCopypasteBlock();
				appendCiteTweetCopypasteBlock("");
				// expandDateOfTweet();

				// Commented out because Google Translate is gone, and Grok's buttons are different.
				// We don't want Grok's translation anyway, because they are bad.
				// clickTranslate();
			} else {
				info('https://vxtwitter.com' + document.location.pathname);
			}
		}
	}

	function waybackMachine() {
		info('Loading for the Wayback Machine...');
		const button = createCopyButton('Copy cite params', () => {
			const shortDate = document.location.pathname.slice(5, 5+8);
			const date = shortDate.slice(0, 4) + '-' + shortDate.slice(4, 6) + '-' + shortDate.slice(6, 8);
			const params = `
|archive-url=${document.location.href}
|archive-date=${date}`
			return params;
		});
		button.style.zIndex = 10000;
		button.style.position = 'fixed';
		button.style.bottom = '5rem';
		button.style.left = '5rem';
		setTimeout(() => {
			document.body.append(button);
		}, 1000);
	}

	if (document.location.hostname == 'x.com') {
		twitter();
		return;
	}
	if (document.location.hostname == 'web.archive.org') {
		waybackMachine();
		return;
	}
})();
