#!/usr/bin/env node
/**
 * Created by AlexanderC on 6/19/15.
 */

'use strict';

module.exports = function(mainPath) {
  var path = require('path');
  var fs = require('fs');
  var os = require('os');
  var exec = require('child_process').exec;
  var mkdirp = require('mkdirp');
  var Property = require('../../lib.compiled/Property/Instance').Instance;
  var Config = require('../../lib.compiled/Property/Config').Config;

  var dumpPath = this.opts.locate('output-path').value;

  if (mainPath.indexOf('/') !== 0) {
    mainPath = path.join(process.cwd(), mainPath);
  }

  var configFile = path.join(mainPath, Config.DEFAULT_FILENAME);
  var configExists = fs.existsSync(configFile);
  var config = null;

  if (!configExists) {
    config = Config.generate();

    fs.writeFileSync(configFile, JSON.stringify(config));
  } else {
    config = JSON.parse(fs.readFileSync(configFile));
  }

  console.log((new Date().toTimeString()) + ' Dumping frontend into ' + dumpPath);

  var tmpDir = os.tmpdir();
  var tmpPropertyPath = path.join(tmpDir, path.basename(mainPath));
  tmpPropertyPath += '_' + (new Date()).getTime();

  var propertyInstance;

  exec('cp -R ' + path.join(mainPath, '') + ' ' + tmpPropertyPath,
    function(error, stdout, stderr) {
      if (error) {
        console.error((new Date().toTimeString()) + ' Error while creating working directory ' + tmpPropertyPath + ': ' + error);
        this.exit(1);
      }

      propertyInstance = new Property(tmpPropertyPath, Config.DEFAULT_FILENAME);

      propertyInstance.assureFrontendEngine(function(error) {
        if (error) {
          console.error((new Date().toTimeString()) + ' Error while assuring frontend engine: ' + error);
        }

        propertyInstance.fakeBuild();
        propertyInstance.buildFrontend();

        var frontendDumpPath = path.join(tmpPropertyPath, '_public');

        exec('mkdir -p ' + dumpPath + '; cp -R ' + frontendDumpPath + '/ ' + dumpPath, function(error, stdout, stderr) {
          if (error) {
            console.error((new Date().toTimeString()) + ' Error while copying '
              + frontendDumpPath + ' into ' + dumpPath + ': ' + error);
            this.exit(1);
          }

          console.log((new Date().toTimeString()) + ' Frontend dumped successfully');
        }.bind(this));
      }.bind(this));
    }.bind(this)
  );
};
