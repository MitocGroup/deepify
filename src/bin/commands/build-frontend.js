#!/usr/bin/env node
/**
 * Created by AlexanderC on 6/19/15.
 */

'use strict';

module.exports = function(mainPath) {
  var path = require('path');
  var fs = require('fs');
  var fse = require('fs-extra');
  var os = require('os');
  var exec = require('child_process').exec;
  var Property = require('deep-package-manager').Property_Instance;
  var Config = require('deep-package-manager').Property_Config;

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

  fse.ensureDirSync(tmpPropertyPath);

  exec('cp -R ' + path.join(mainPath, '*') + ' ' + tmpPropertyPath + '/ &>/dev/null',
    function(error) {
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

        console.log('Copying built sources into ' + dumpPath);

        fse.ensureDirSync(dumpPath);

        exec('cp -R ' + path.join(frontendDumpPath, '*') + ' ' + dumpPath + '/ &>/dev/null', function(error) {
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
