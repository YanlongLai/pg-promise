'use strict';

var $npm = {
    pg: require('pg'),
    minify: require('pg-minify'),
    adapter: require('./adapter'),
    result: require('./result'),
    promise: require('./promise'),
    formatting: require('./formatting'),
    queryFile: require('./queryFile'),
    errors: require('./errors'),
    utils: require('./utils'),
    mode: require('./txMode')
};

/**
 * Advanced access layer to node-postgres via $[Promises/A+]
 * @author Vitaly Tomilov
 * @module pg-promise
 *
 * @param {Object} [options]
 * Library Initialization Options.
 *
 * @param {Boolean} [options.pgFormatting=false]
 * Redirects query formatting to PG.
 *
 * @param {Object|Function} [options.promiseLib=Promise]
 * Override for the default promise library.
 *
 * @param {Boolean} [options.noLocking=false]
 * Prevents protocol locking.
 *
 * By default, the library locks its protocol to read-only access, as a fool-proof mechanism.
 * Specifically for the extend event this serves as a protection against overriding existing
 * properties or trying to set them at the wrong time.
 *
 * If this provision gets in the way of using a mock-up framework for your tests, you can force
 * the library to deactivate most of the locks by setting `noLocking` = `true` within the options.
 *
 * @param {Boolean} [options.capSQL=false]
 * Capitalizes all generated SQL commands.
 *
 * By default, all internal SQL within the library is generated using the low case.
 * If, however, you want all SQL to be capitalized instead, set `capSQL` = `true`.
 *
 * This is purely a cosmetic feature.
 *
 * @param {Function} [options.connect]
 * Event {@link event:connect connect} handler.
 *
 * @param {Function} [options.disconnect]
 * Event {@link event:disconnect disconnect} handler.
 *
 * @param {Function} [options.query]
 * Event {@link event:query query} handler.
 *
 * @param {Function} [options.receive]
 * Event {@link event:receive receive} handler.
 *
 * @param {Function} [options.task]
 * Event {@link event:task task} handler.
 *
 * @param {Function} [options.transact]
 * Event {@link event:transact transact} handler.
 *
 * @param {Function} [options.error]
 * Event {@link event:error error} handler.
 *
 * @param {Function} [options.extend]
 * Event {@link event:extend extend} handler.
 *
 * @example
 *
 * var options = {
 *   // Initialization Options
 * };
 *
 * var pgp = require('pg-promise')(options);
 *
 */
function $main(options) {

    var invalidInit;
    if (!$npm.utils.isNull(options)) {
        if (typeof options === 'string') {
            // Check for invalid initialization: it must not be a connection string.
            var pg = require.cache[require.resolve('pg')];
            var pgCS = pg.require('pg-connection-string');
            var cn = pgCS.parse(options);
            invalidInit = cn && cn.database !== options;
        }
        if (typeof options === 'object') {
            // Check for invalid initialization: it must not be a connection object.
            invalidInit = 'host' in options || 'database' in options;
        } else {
            if (!invalidInit) {
                throw new TypeError("Invalid initialization options.");
            }
        }
    }
    if (invalidInit) {
        // The most common mistake in using the library - trying to pass in a database
        // connection object or string as the library's initialization object.
        //
        // Steps for using the library:
        //
        // 1. Initialize the library:
        //     var pgp = require('pg-promise')(/*initialization options*/);
        // 2. Create a database object:
        //     var db = pgp(connection);
        //
        // If you skip the first step, you will get this error.
        throw new TypeError("Invalid library initialization: must initialize the library before creating a database object.");
    }

    $npm.promise(options ? options.promiseLib : null);

    var Database = require('./database')($npm.promise.p);

    var inst = function (cn) {
        var t = typeof cn;
        if (cn && (t === 'string' || t === 'object')) {
            return new Database(cn, options);
        }
        // cannot access a database without connection details;
        throw new TypeError("Invalid connection details.");
    };

    $npm.utils.addProperties(inst, rootNameSpace);
    $npm.utils.lock(inst);

    return inst;
}

var rootNameSpace = {

    /**
     * Terminates pg library (call it when exiting the application).
     * @member {Function} end
     * @readonly
     */
    end: function () {
        $npm.pg.end();
    },

    /**
     * Namespace for the type conversion helpers.
     * @member {formatting} as
     * @readonly
     */
    as: $npm.formatting.as,

    /**
     * Instance of the $[PG] library that's used.
     * @member {external:PG} pg
     * @readonly
     */
    pg: $npm.pg,

    /**
     * Instance of the $[pg-minify] library that's used.
     * @member {external:pg-minify} minify
     * @readonly
     */
    minify: $npm.minify,

    /**
     * Query Result Mask.
     * @member {queryResult} queryResult
     * @readonly
     */
    queryResult: $npm.result,

    /**
     * QueryResultError type.
     * @member {QueryResultError} QueryResultError
     * @readonly
     */
    QueryResultError: $npm.errors.QueryResultError,

    /**
     * PromiseAdapter type.
     * @member {PromiseAdapter} PromiseAdapter
     * @readonly
     */
    PromiseAdapter: $npm.adapter,

    /**
     * QueryFile type.
     * @member {QueryFile} QueryFile
     * @readonly
     */
    QueryFile: $npm.queryFile,

    /**
     * Transaction Mode namespace.
     * @member {txMode} txMode
     * @readonly
     */
    txMode: $npm.mode
};

$npm.utils.lock(rootNameSpace.as, true);
$npm.utils.lock(rootNameSpace.txMode, true);
$npm.utils.lock(rootNameSpace.PromiseAdapter, true);
$npm.utils.lock(rootNameSpace.QueryFile, true);
$npm.utils.lock(rootNameSpace.QueryResultError, true);
$npm.utils.lock(rootNameSpace.queryResult, true);

$npm.utils.addProperties($main, rootNameSpace);

module.exports = $main;

/**
 * @external Promise
 * @see https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise
 */

/**
 * @external PG
 * @see https://github.com/brianc/node-postgres/blob/master/lib/index.js#L8
 */

/**
 * @external Client
 * @see https://github.com/brianc/node-postgres/blob/master/lib/client.js#L12
 */

/**
 * @external pg-minify
 * @see https://github.com/vitaly-t/pg-minify
 */
