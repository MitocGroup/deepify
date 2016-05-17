#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(parameter) {
  let RegistryConfig = require('../../lib.compiled/Registry/Config').Config;

  parameter = parameter || 'unknown';
  let newValue = this.opts.locate('set').value;
  let printAvailable = this.opts.locate('print').exists;
  let config = RegistryConfig.create().refresh(parameter);
  let resetDeepLog = () => this.constructor._logDriver.overrideJsConsole(false);

  if (printAvailable) {
    resetDeepLog();
    console.log(Object.keys((new RegistryConfig()).varsMapper.MAPPING).join(', '));
  } else if (newValue) {
    console.log(`Setting new value of parameter "${parameter}"`);

    config.add(parameter, newValue);

    try {
      config.persist();
    } catch (error) {
      console.error(`Failed to set new value of parameter "${parameter}": ${error}`);
      this.exit(1);
    }
  } else {
    if (!config.has(parameter)) {
      console.error(`Missing parameter "${parameter}" in config`);
      this.exit(1);
    }

    resetDeepLog();
    console.log(config.read(parameter));
  }
};
