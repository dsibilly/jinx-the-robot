/**
A database command logger.

Enables realtime logging of Jinx commands and replies to a RethinkDB
database.

@module util/CommandLog
*/
import _Error from 'isotropic-error';
import Bunyan from 'bunyan';
import make from 'isotropic-make';
import {
    v4 as uuid
} from 'uuid';

/**
@class CommandLogger
@constructor
@param {Object} config A configuration object
@param {Date} [config.beginTime]
@param {String} [config.id]
@param {Object} [config.logger]
@param {Number} config.pid
@param {Object} config.rethinkDbConfiguration
*/
const _CommandLogger = make({
    /**
    @method command
    @chainable
    @arg {String} command
    @arg {Object} commandData
    @arg {Object} config
    @arg {Date} [config.commandTime]
    @returns {CommandLogger} This CommandLogger instance
    */
    command (command, commandData, config) {
        config = config || {};

        const commandObject = {
            command,
            commandData: commandData ?
                _CommandLogger._sanitizeValue(commandData) :
                null,
            commandTime: config.commandTime || new Date(),
            id: uuid(),
            pid: this._pid
        };

        if (this._initializing) {
            this._earlyCommands.push(commandObject);
            return this;
        }

        return this._command(commandObject);
    },

    /**
        @method destroy
        @chainable
        @protected
        @returns {CommandLogger} This CommandLogger instance
        */
    destroy () {
        if (this._initializing) {
            this._destroy = true;
            return;
        }

        delete this._beginTime;
        delete this._earlyCommands;
        delete this._rethinkDbConnection;

        return this;
    },

    /**
        @method _command
        @chainable
        @arg {Object} commandObject
        @returns {CommandLogger} This CommandLogger instance
        */
    _command (commandObject) {
        this._log.info({
            details: commandObject
        }, commandObject.command);

        return this;
    },

    /**
        @method _init
        @chainable
        @arg {Object} config
        @returns {CommandLogger} This CommandLogger instance
        */
    _init (config) {
        const beginTime = config.beginTime || new Date(),
            me = this;

        me._initializing = true;

        me._log = config.logger ?
            config.logger.child({
                submodule: 'commandLog'
            }) :
            Bunyan.createLogger({
                name: 'jinx-command-log'
            });

        me._beginTime = beginTime;
        me._earlyCommands = [];
        me._pid = config.pid || process.pid;
        me._initializing = false;

        if (me._destroy) {
            return me.destroy();
        }

        return me;
    }
},
/**
CommandLog static properties and methods.
@static

@property {Function} _sanitizeValue Sanitize values for safe storage in database
*/
{
    /**
    @function _sanitizeValue
    @protected
    @static

    @arg {boolean|Number|Object|String} value
    @returns {boolean|Number|Object|String} A sanitized version of `value`
    */
    _sanitizeValue (value) {
        const sanitizedMapper = value => _CommandLogger._sanitizeValue(value);

        switch (typeof value) {
            case 'boolean':
            case 'number':
            case 'string':
                // These types need no sanitization
                return value;
            case 'object':
                if (!value) {
                    // If the object is falsey, it's fine
                    return value;
                }

                if (value instanceof Date) {
                    // If the object is a Date, it's fine
                    return value;
                }

                // If this is an Error object, serialize it to an object literal
                if (value instanceof Error || value instanceof _Error) {
                    return _CommandLogger._sanitizeValue({
                        code: value.code,
                        details: value.details,
                        message: value.message,
                        name: value.name,
                        signal: value.signal,
                        stack: value.stack
                    });
                }

                // If this is a Set, cast it to an Array and sanizite its contents
                if (value instanceof Set) {
                    return Array.from(value).map(sanitizedMapper);
                }

                // If this is an Array, sanitize it's contents
                if (Array.isArray(value)) {
                    return value.map(sanitizedMapper);
                }

                /*
                Otherwise iterate over all the Object's properties,
                sanitizing their values and serializing it to an
                object literal for storage.
                */
                return Object.keys(value).reduce((object, key) => {
                    const propertyValue = _CommandLogger._sanitizeValue(value[key]);

                    if (typeof propertyValue !== 'undefined') {
                        object[key] = propertyValue;
                    }

                    return object;
                }, {});
        }
    }
});

export default _CommandLogger;
