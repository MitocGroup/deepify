#!/usr/bin/env node

/**
 * Created by AlexanderC on 6/21/16.
 *
 * DO NOT USE IT!
 */

'use strict';

module.exports = function() {
  let path = require('path');
  let fse = require('fs-extra');
  let fs = require('fs');
  let inquirer = require('inquirer');
  let Config = require('deep-package-manager').Replication_Config;
  let EnvConfigLoader = require('deep-package-manager').Replication_EnvConfigLoader;
  let FileWalker = require('deep-package-manager').Helpers_FileWalker;

  let domain = this.opts.locate('domain-name').value;
  let blueEnv = this.opts.locate('blue-env').value;
  let greenEnv = this.opts.locate('green-env').value;

  blueEnv = blueEnv ? Config.parseEnvString(blueEnv) : null;
  greenEnv = greenEnv ? Config.parseEnvString(greenEnv) : null;

  let configFile = path.join(process.cwd(), Config.DEFAULT_FILENAME);
  let configFileExists = fs.existsSync(configFile);

  (configFileExists ? cb => cb() : prepareEnvs)(() => {
    let defaultConfig = {
      domain: domain,
      environments: {
        blue: blueEnv,
        green: greenEnv,
      },
    };

    if (!configFileExists) {
      fse.outputJsonSync(configFile, Config.generate(defaultConfig), {spaces: 2});
    }

    let config = Config.createFromJsonFile(configFile);

    (new EnvConfigLoader(config, process.cwd())).load()
      .catch(error => {
        console.error(error, error.stack);
        this.exit(1);
      })
      .then(envProvisioningConfig => {
        console.log('envProvisioningConfig', envProvisioningConfig);//TODO:remove
      });
  });

  function prepareEnvs(cb) {
    if (blueEnv && greenEnv) {
      return cb();
    }

    let provisioningFiles = getProvisionDumpFiles().map(f => path.basename(f));

    if (provisioningFiles.length <= 0) {
      return cb();
    }

    let questions = [];

    if (!blueEnv) {
      questions.push({
        type: 'list',
        name: 'blue',
        message: 'Select the config you\'d like to use for Blue environment: ',
        choices: provisioningFiles,
      });
    }

    if (!greenEnv) {
      questions.push({
        type: 'list',
        name: 'green',
        message: 'Select the config you\'d like to use for Green environment: ',
        choices: provisioningFiles,
      });
    }

    inquirer.prompt(questions).then(answers => {
      if (answers.hasOwnProperty('blue')) {
        blueEnv = Config.parseProvisionConfigFilename(answers.blue);
      }

      if (answers.hasOwnProperty('green')) {
        greenEnv = Config.parseProvisionConfigFilename(answers.green);
      }

      cb();
    });
  }

  function getProvisionDumpFiles() {
    return (new FileWalker()).walk(
      process.cwd(),
      f => /^\.[a-z0-9]+\.[a-z]+\.provisioning\.json$/i.test(path.basename(f))
    );
  }
};
