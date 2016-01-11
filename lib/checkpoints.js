/**
 * Waits until all checkpoints have been completed and triggers a callback for
 * the final completion.
 *
 * Example:
 * ```js
 *      var checkpoints = new Checkpoints(callback, 2000);
 *      checkpoints.addEvents(['event1', 'event2']);
 *      checkpoints.addAssets('http://www.domain.tld/some/image.jpg');
 *      checkpoints.execute();
 *      checkpoints.markComplete('event1');
 *      checkpoints.markComplete('event2');
 *      // image.jpg finished loading meanwhile
 *      // -> callback is triggered.
 * ```
 * @author Oliver Erdmann, <o.erdmann@finaldream.de>
 * @since 14.03.15
 */

'use strict';

var STATE_TIMEOUT   = 'timeout';
var STATE_COMPLETED = 'completed';

/**
 * Use `addEvents()` to provide event-names, call `execute()` to actually run
 * the module.
 *
 * @param {function} [onComplete]
 * @param {Number} [timeout] in msec, after which the callback is fired. Omit to disable the timeout.
 * @constructor
 */
var Checkpoints = function (onComplete, timeout) {

    this.timeoutId        = undefined;
    this.events           = [];
    this.timeout          = timeout;
    this.eventCount       = 0;
    this.progressCallback = undefined;
    this.completeCallback = onComplete;

    // Bind Scope
    this.didTimeout         = this.didTimeout.bind(this);
    this._handleAjaxSuccess = this._handleAjaxSuccess.bind(this);
    this.markComplete       = this.markComplete.bind(this);

};

/**
 * Sets a callback for completion.
 */
Checkpoints.prototype.onComplete = function (callback) {

    this.completeCallback = callback;

}

/**
 * Sets a callback for tracking progress.
 */
Checkpoints.prototype.onProgress = function (callback) {

    this.progressCallback = callback;

}

/**
 * Start capturing events and sets the timer, if defined.
 *
 * @chainable
 */
Checkpoints.prototype.execute = function () {

    if (typeof(this.timeout) !== 'undefined') {
        this.timeoutId = setTimeout(this.didTimeout, this.timeout);
    }

    return this;

}

/**
 * Adds a single or multiple events. Skips duplicates.
 *
 * @param {string|string[]} events One or multiple event names
 * @chainable
 */
Checkpoints.prototype.addEvents = function (events) {

    if (events.constructor !== Array) {
        events = [events];
    }

    for (var i = 0, l = events.length; i < l; i++) {
        if (this.events.indexOf(events[i]) === -1) {
            this.events.push(events[i]);
            this.eventCount++;
        }
    }

    return this;
};

/**
 * Marks a single checkpoint as complete.
 *
 * @param {String} name
 * @chainable
 */
Checkpoints.prototype.markComplete = function (name) {

    var index = this.events.indexOf(name);

    if (index === -1) {
        return;
    }

    this.events.splice(index, 1);

    if (this.progressCallback !== undefined) {
        this.progressCallback(name, this.events.length, this.eventCount);
    }

    if (this.events.length < 1) {
        this.didComplete(STATE_COMPLETED);
    }

    return this;

};


/**
 * Callback handler for the timeout.
 */
Checkpoints.prototype.didTimeout = function () {

    this.didComplete(STATE_TIMEOUT);

};


/**
 * Finishes the job and runs the callback.
 */
Checkpoints.prototype.didComplete = function (state) {

    this.events = [];
    clearTimeout(this.timeoutId);

    if (this.completeCallback === undefined) {
        return;
    }

    this.completeCallback({state: state});

};

/**
 * Preloads resources from provided URIs.
 * URIs are added to the events list and handled as such.
 *
 * @param {string|string[]} uris One or more URIs to preload.
 * @chainable
 */
Checkpoints.prototype.addAssets = function (uris) {

    if (!uris.length) {
        return this;
    }

    if (uris.constructor !== Array) {
        uris = [uris];
    }

    for (var i = 0, l = uris.length; i < l; i++) {
        var uri = uris[i];
        if (this.events.indexOf(uri) === -1) {
            this.addEvents(uri);
            this.ajaxGet(uri, this._handleAjaxSuccess);
        }
    }

    return this;

};

/**
 * Makes an AJAX GET request to a given URI. Returns with provided callbacks.
 *
 * @param {string} uri URI to request.
 * @param {function} [success] Success callback.
 * @param {function} [failed]  Failure callback.
 */
Checkpoints.prototype.ajaxGet = function (uri, success, failed) {

    var xmlhttp = new XMLHttpRequest(); // requires IE7+

    xmlhttp.onreadystatechange = function() {

        if (xmlhttp.readyState !== 4) {
            return;
        }

        if (success !== undefined && xmlhttp.status == 200) {
            success(uri, xmlhttp.responseText);
            return;
        }

        if (failed !== undefined && xmlhttp.status === 400) {
            failed(uri, xmlhttp.responseText);
            return;
        }

    }

    xmlhttp.open("GET", uri, true);
    xmlhttp.send();

}

/**
 * Handles AJAX success.
 *
 * @param {string} uri Request URI
 * @param {string} responseText
 */
Checkpoints.prototype._handleAjaxSuccess = function (uri, responseText) {

    this.markComplete(uri);

};


module.exports = Checkpoints;
