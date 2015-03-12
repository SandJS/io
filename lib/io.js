"use strict";

/**
 * Module Dependencies
 */

var SandGrain = require('sand-grain');
var socketIO = require('socket.io');

/**
 * Initialize a new `Application`.
 *
 * @api public
 */
class IO extends SandGrain {
  constructor() {
    super();

    this.defaultConfig = require('./default');
    this.io = null;
    this.paths = {};
    this.version = require('../package').version;
    this.name = 'io';
    this.configName = this.name;
  }

  /**
   * Initialize IO module
   *
   * @param config
   * @param done
   *
   * @returns {IO}
   */
  init(config, done) {
    super.init(config);

    this.log('Initializing...');

    if (this.config.useExistingHTTP && typeof sand.http === 'undefined') {
      this.log('The IO Module requires the HTTP module to be loaded first');
      return this;
    }

    this.io = socketIO(this.config.useExistingHTTP ? sand.http.server : this.config.port);
    this.setup();
    this.logStart();

    done();

    return this;
  }

  shutdown(done) {
    this.log('Shutting down...');
    try {
      this.io.httpServer.close(done);
    } catch (e) {
      // Must already be shutting down
    }
  }

  /**
   * Setup io Routes
   */
  setup() {
    var ioRoutes = require(require('path').resolve(sand.appPath, this.config.routesFile));
    //var path = sand.appPath + this.config.path;
    //var files = require('require-all')({
    //  dirname: path,
    //  filter: /(\w+)\.js/
    //});

    for (let route in ioRoutes) {
      if (ioRoutes.hasOwnProperty(route)) {
        this.registerIO(ioRoutes[route]);
      }
    }
  }

  /**
   * Registers functions to IO
   *
   * @param options
   */
  registerIO(options) {
    var io = this.io;
    if (options.path) {
      // Register namespace
      this.log('Registering ' + options.path);
      io = this.io.of(options.path);
      this.paths[options.path] = io;
    }

    for (let key in options) {
      var option = options[key];
      if (typeof option === 'function') {
        var matches = key.match(/on(\w+)/);
        if (matches && typeof matches[1] === 'string') {
          io.on(matches[1].toLowerCase(), option);
        } else if (key === 'before') {
          io.use(option);
        }
      }
    }
  }

  /**
   * Logs starting of IO
   */
  logStart() {
    if (!this.config.useExistingHTTP) {
      this.log('Listening on ' + this.config.port);
    }
  }
}

module.exports = IO;