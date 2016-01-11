
var Checkpoints = require('../lib/checkpoints');
var assert = require('assert');

/**
 * Mocked XMHLHttpRequest, for mocking ajax-requests.
 */
var MockedXMLHttpRequest = function() {

    this.onreadystatechange = undefined;
    this.uri = undefined;

    this.responseText = '';
    this.readyState = 4;
    this.status     = 200;

    this.open = function(uri) {
        this.uri = uri;
    };

    this.send = function() {
        setTimeout(this.onreadystatechange.bind(this), 200);
    }

};

describe('Checkpoints', function() {
    describe('addEvents', function () {
        it('should add single strings and arrays to events', function () {

            var cp = new Checkpoints();
            cp.addEvents('event1');
            cp.addEvents('event2');
            cp.addEvents(['event3', 'events4']);

            assert(JSON.stringify(cp.events), '["event1","event2","event3","event4"]');

        });

        it('should run a callback on completion', function (done) {

            var doneCallback;

            var cp = new Checkpoints(function() {
                doneCallback();
            });

            cp.addEvents(['event1', 'event2']);
            cp.markComplete('event1');

            // assign doneCallback prior to desired completion-step.
            doneCallback = done;
            cp.markComplete('event2');

        });

    });

    describe('onProgress', function () {

        it('should be called for each completed event', function (done) {

            var completed = 0;

            var callback = function(result) {

                if (result.state !== 'completed') {
                    throw Error('Invalid state');
                }

                if (completed !== 4) {
                    throw Error('Invalid completed count: ' + completed);
                }

                done();
            }

            var progress = function(event, index, count) {
                completed++;
            }

            var cp = new Checkpoints(callback);
            cp.onProgress(progress.bind(this));
            cp.addEvents(['event1', 'event2', 'event3', 'event4']);
            cp.execute();

            cp.markComplete('event1');
            cp.markComplete('event2');
            cp.markComplete('event3');
            cp.markComplete('event4');

        });

    });


    describe('execute', function () {

        it('should run a callback after a specified timeout', function (done) {

            var startTime = (new Date()).getTime();
            var callback  = function() {

                var endTime = (new Date()).getTime();

                if (endTime - startTime < 1000) {
                    throw Error('Timeout not reached.');
                }

                done();
            };

            var cp = new Checkpoints(callback, 1000);

            cp.execute();

        });

    });

    describe('addAssets', function () {

        before(function() {
            global.oldXMLHttpRequest = global.XMLHttpRequest;
            global.XMLHttpRequest = MockedXMLHttpRequest;
        });

        after(function() {
            global.XMLHttpRequest = global.oldXMLHttpRequest;
        });

        it('should run a callback after an asset is loaded', function (done) {

            var oldXMLHttpRequest = XMLHttpRequest;
            XMLHttpRequest = MockedXMLHttpRequest;

            var callback = function(result) {

                if (result.state !== 'completed') {
                    throw Error('Invalid state');
                }
                done();
            }

            var cp = new Checkpoints(callback);

            cp.addAssets(['http://domain.tld/some/image.jpg']);
            cp.addAssets(['http://domain.tld/someother/stylesheet.css']);
            cp.execute();

        });

    });
});
