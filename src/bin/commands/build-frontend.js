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

  if (mainPath.indexOf('/') !== 0) {
    mainPath = path.join(process.cwd(), mainPath);
  }

  var dumpPath = path.join(
    this.opts.locate('output-path').value || path.join(mainPath, '_www'),
    ''
  );

  var configFile = path.join(mainPath, Config.DEFAULT_FILENAME);
  var configExists = fs.existsSync(configFile);
  var config = null;

  if (!configExists) {
    config = Config.generate();

    fs.writeFileSync(configFile, JSON.stringify(config));
  } else {
    config = JSON.parse(fs.readFileSync(configFile));
  }

  console.log('Dumping frontend into ' + dumpPath);

  var tmpDir = os.tmpdir();
  var tmpPropertyPath = path.join(tmpDir, path.basename(mainPath));
  tmpPropertyPath += '_' + (new Date()).getTime();

  var propertyInstance;

  exec('rsync -a --delete ' + path.join(mainPath, '') + '/ ' + tmpPropertyPath + '/',
    function(error, stdout, stderr) {
      if (error) {
        console.error('Error while creating working directory ' + tmpPropertyPath + ': ' + error);
        this.exit(1);
      }

      propertyInstance = new Property(tmpPropertyPath, Config.DEFAULT_FILENAME);

      propertyInstance.assureFrontendEngine(function(error) {
        if (error) {
          console.error('Error while assuring frontend engine: ' + error);
        }

        // @todo: move this anywhere
        process.on('exit', function() {
          exec('rm -rf ' + tmpPropertyPath);
        });

        propertyInstance.fakeBuild();
        propertyInstance.buildFrontend();

        var frontendDumpPath = path.join(tmpPropertyPath, '_public');

        exec('mkdir -p ' + dumpPath + '; rsync -a --delete ' + frontendDumpPath + '/ ' + dumpPath + '/', function(error, stdout, stderr) {
          if (error) {
            console.error('Error while copying ' + frontendDumpPath + ' into ' + dumpPath + ': ' + error);
            this.exit(1);
          }

          console.log('Frontend dumped successfully');
        }.bind(this));
      }.bind(this));
    }.bind(this)
  );
};
