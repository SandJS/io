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

exports = module.exports =
SandGrain.extend({
  name: 'io',

  construct: function() {
    this.super();

    this.defaultConfig = require('./default');
    this.io = null;
    this.paths = {};
    this.version = require('../package').version;
  },

  /**
   * Initialize IO module
   *
   * @param config
   * @returns {IO}
   */
  init: function(config, done) {
    this.super(config);

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
  },

  shutdown: function(done) {
    this.log('Shutting down...');
    this.io.httpServer.close(done);
  },

  /**
   * Setup io Routes
   */
  setup: function() {
    var path = sand.appPath + this.config.path;
    var files = require('require-all')({
      dirname: path,
      filter: /(\w+)\.js/
    });

    for (var file in files) {
      if (files.hasOwnProperty(file)) {
        this.registerIO(files[file]);
      }
    }
  },

  /**
   * Registers functions to IO
   *
   * @param options
   */
  registerIO: function(options) {
    var io = this.io;
    if (options.path) {
      // Register namespace
      this.log('Registering ' + options.path);
      io = this.io.of(options.path);
      this.paths[options.path] = io;
    }

    for (key in options) {
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
  },

  /**
   * Logs starting of IO
   */
  logStart: function() {
    if (!this.config.useExistingHTTP) {
      this.log('Listening on ' + this.config.port);
    }
  }
});