// ==UserScript==
// @name         Wikimedia: external wikilink generator
// @namespace    https://andrybak.dev
// @version      7
// @description  Adds a portlet link to copy an external wikilink to the clipboard.
// @author       Andrei Rybak
// @license      MIT
// @match        https://*.wikipedia.org/wiki/*
// @match        https://*.wikipedia.org/w/index.php?title=*
// @match        https://en.wiktionary.org/wiki/*
// @match        https://en.wikisource.org/wiki/*
// @match        https://commons.wikimedia.org/wiki/*
// @match        https://commons.wikimedia.org/w/index.php?title=*
// @match        https://www.mediawiki.org/wiki/*
// @icon         https://wikipedia.org/favicon.ico
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

/* globals mw */

(function() {
	'use strict';

	const USERSCRIPT_NAME = 'ExtWikGen';
	const VERSION = '2';
	const LOG_PREFIX = `[${USERSCRIPT_NAME} v${VERSION}]:`;

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

	function notify(notificationMessage) {
		mw.notify(notificationMessage, {
			title: USERSCRIPT_NAME
		});
	}

	function interwikiPrefix(languageCode, website) {
		if (languageCode === 'commons') {
			return 'commons';
		}
		if (languageCode === 'en') {
			return website;
		}
		if (languageCode === 'www' && website === 'mediawiki') {
			return 'mw';
		}
		return website + ':' + languageCode;
	}

	function maybeItalics(original) {
		const nodes = Array.from(document.getElementById('firstHeading').childNodes);
		const hasItalics = nodes.some(n => {
			if (n.nodeName == 'I') {
				return true;
			}
			return Array.from(n.childNodes).some(subNode => subNode.nodeName == 'I');
		});
		if (hasItalics) {
			return "''" + original + "''";
		}
		return original;
	}

	function externalWikilink(pagename) {
		const parts = document.location.hostname.match(/([a-z]*)[.]([a-z]*)([.][a-z]*)/);
		const language = parts[1];
		const website = parts[2];
		const prefix = interwikiPrefix(language, website);
		const maybeHash = document.location.hash;
		pagename = pagename.replaceAll('_', ' ');
		return maybeItalics(`[[${prefix}:${pagename}${maybeHash}|${pagename}]]`);
	}

	function handleCopyEvent(copyEvent, wikitext) {
		copyEvent.stopPropagation();
		copyEvent.preventDefault();
		const clipboardData = copyEvent.clipboardData || window.clipboardData;
		clipboardData.setData('text/plain', wikitext);
		/*
		 * See file `ve.ce.MWWikitextSurface.js` in repository
		 * https://github.com/wikimedia/mediawiki-extensions-VisualEditor
		 */
		clipboardData.setData('text/x-wiki', wikitext);
	}

	function runPortlet() {
		const wikitext = externalWikilink(mw.config.get('wgPageName'));
		const handler = e => handleCopyEvent(e, wikitext);
		document.addEventListener('copy', handler);
		document.execCommand('copy');
		document.removeEventListener('copy', handler);
		const code = document.createElement('code');
		code.appendChild(document.createTextNode(wikitext));
		const notification = document.createElement('span');
		notification.appendChild(document.createTextNode("Copied "));
		notification.appendChild(code);
		notification.appendChild(document.createTextNode(" to the clipboard"));
		notify(notification);
	}

	/*
	 * Infrastructure to ensure the script can run.
	 */
	function wait(message) {
		info(message, 'Waiting...');
		setTimeout(lazyExternalWikilinkGenerator, 200);
	}

	function lazyExternalWikilinkGenerator() {
		if (!mw) {
			wait('Global mw has not loaded yet.');
			return;
		}
		if (!mw.config) {
			wait('mw.config has not loaded yet');
			return;
		}
		const namespaceId = mw.config.get('wgNamespaceNumber');
		if (namespaceId == -1) {
			info('Special page. Aborting.');
			return;
		}
		if (!mw.loader || !mw.loader.using) {
			wait('Function mw.loader.using is no loaded yet.');
			return;
		}
		debug('Loading...');
		mw.loader.using(
			['mediawiki.util'],
			() => {
				const link = mw.util.addPortletLink('p-cactions', '#', "External wikilink", 'ca-unsigned-generator', "Copy an external wikilink to this page");
				if (!link) {
					info('Cannot create portlet link (mw.util.addPortletLink). Assuming unsupported skin. Aborting.');
					return;
				}
				link.onclick = event => {
					mw.loader.using('mediawiki.api', runPortlet);
				};
			},
			(e) => {
				error('Cannot add portlet link', e);
			}
		);
	}

	if (document.readyState !== 'loading') {
		debug('document.readyState =', document.readyState);
		lazyExternalWikilinkGenerator();
	} else {
		warn('Cannot load yet. Setting up a listener...');
		document.addEventListener('DOMContentLoaded', lazyExternalWikilinkGenerator);
	}
})();
