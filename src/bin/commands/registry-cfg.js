#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(parameter) {
  var RegistryConfig = require('../../lib.compiled/Registry/Config').Config;

  parameter = parameter || 'unknown';
  var newValue = this.opts.locate('set').value;
  var printAvailable = this.opts.locate('print').exists;
  var config = RegistryConfig.create().refresh(parameter);

  if (printAvailable) {
    resetDeepLog.bind(this)();
    console.log(Object.keys((new RegistryConfig()).varsMapper.MAPPING).join(', '));
  } else if (newValue) {
    console.log('Setting new value of parameter "' + parameter + '"');

    config.add(parameter, newValue);

    try {
      config.persist();
    } catch (error) {
      console.error('Failed to set new value of parameter "' + parameter + '": ' + error);
      this.exit(1);
    }
  } else {
    if (!config.has(parameter)) {
      console.error('Missing parameter "' + parameter + '" in config');
      this.exit(1);
    }

    resetDeepLog.bind(this)();
    console.log(config.read(parameter));
  }

  function resetDeepLog() {
    this.constructor._logDriver.overrideJsConsole(false);
  }
};
