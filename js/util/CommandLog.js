import _Error from 'isotropic-error';
import Bunyan from 'bunyan';
import make from 'isotropic-make';
import r from 'rethinkdb';
import uuid from 'uuid/v4';

const log = Bunyan.createLogger({
        name: 'jinx-command-log'
    }),
    _CommandLogger = make({
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

        destroy () {
            if (this._initializing) {
                this._destroy = true;
                return;
            }

            delete this._beginTime;
            delete this._earlyCommands;
            delete this._rethinkDbConnection;
        },

        _command (commandObject) {
            this._commandLogTable.insert(commandObject).run(this._rethinkDbConnection).catch(error => {
                log.error({
                    error: _Error({
                        details: commandObject,
                        error,
                        message: 'Error inserting command'
                    })
                }, 'Error inserting command');
            });

            return this;
        },

        _init (config) {
            const beginTime = config.beginTime || new Date(),
                me = this,
                rethinkDbConfiguration = config.rethinkDbConfiguration,

                db = r.db(rethinkDbConfiguration.database),
                commandLogTable = db.table('commandLog');

            r.connect(rethinkDbConfiguration.host).then(connection => {
                me._rethinkDbConnection = connection;
                me._rethinkDbConfiguration = rethinkDbConfiguration;
                me._id = config.id;

                me._earlyCommands.forEach(earlyCommand => {
                    earlyCommand.id = earlyCommand.id || uuid();
                    me._command(earlyCommand);
                });

                delete me._earlyCommands;

                me._initializing = false;

                if (me._destroy) {
                    me.destroy();
                }
            }).catch(error => {
                log.error({
                    error: _Error({
                        details: rethinkDbConfiguration,
                        error,
                        message: 'Error connecting to RethinkDB'
                    })
                }, 'Error connecting to RethinkDB');
            });

            me._initializing = true;

            me._beginTime = beginTime;
            me._commandLogTable = commandLogTable;
            me._earlyCommands = [];
            me._pid = config.pid || process.pid;

            return me;
        }
    }, {
        _sanitizeValue (value) {
            const sanitizedMapper = value => _CommandLogger._sanitizeValue(value);

            switch (typeof value) {
                case 'boolean':
                case 'number':
                case 'string':
                    return value;

                case 'object':
                    if (!value) {
                        return value;
                    }

                    if (value instanceof Date) {
                        return value;
                    }

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

                    if (value instanceof Set) {
                        return Array.from(value).map(sanitizedMapper);
                    }

                    if (Array.isArray(value)) {
                        return value.map(sanitizedMapper);
                    }

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
