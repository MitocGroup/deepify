#!/usr/bin/env node
/**
 * Created by AlexanderC on 6/19/15.
 */

'use strict';

module.exports = function(mainPath) {
  let path = require('path');
  let fs = require('fs');
  let fse = require('fs-extra');
  let os = require('os');
  let Property = require('deep-package-manager').Property_Instance;
  let Config = require('deep-package-manager').Property_Config;
  let Exec = require('../../../lib.compiled/Helpers/Exec').Exec;

  mainPath = this.normalizeInputPath(mainPath);

  let dumpPath = path.join(
    this.normalizeInputPath(this.opts.locate('output-path').value) || path.join(mainPath, '_www'),
    ''
  );

  let configFile = path.join(mainPath, Config.DEFAULT_FILENAME);
  let configExists = fs.existsSync(configFile);
  let config = null;

  if (!configExists) {
    config = Config.generate();

    fs.writeFileSync(configFile, JSON.stringify(config));
  } else {
    config = JSON.parse(fs.readFileSync(configFile));
  }

  console.log('Dumping frontend into ' + dumpPath);

  let tmpDir = os.tmpdir();
  let tmpPropertyPath = path.join(tmpDir, path.basename(mainPath));
  tmpPropertyPath += '_' + (new Date()).getTime();

  let propertyInstance;

  fse.ensureDirSync(tmpPropertyPath);

  new Exec('cp -R', path.join(mainPath, '*'), tmpPropertyPath + '/')
    .avoidBufferOverflow()
    .run((result) => {
      if (result.failed) {
        console.error('Error while creating working directory ' + tmpPropertyPath + ': ' + result.error);
        this.exit(1);
      }

      propertyInstance = new Property(tmpPropertyPath, Config.DEFAULT_FILENAME);

      propertyInstance.assureFrontendEngine((error) => {
        if (error) {
          console.error('Error while assuring frontend engine: ' + error);
        }

        // @todo: move this anywhere
        process.on('exit', () => {
          new Exec('rm -rf', tmpPropertyPath)
            .avoidBufferOverflow()
            .run((result) => {
              if (result.failed) {
                console.error(result.error);
              }
            });
        });

        propertyInstance.fakeBuild();
        propertyInstance.buildFrontend();

        let frontendDumpPath = path.join(tmpPropertyPath, '_public');

        console.log('Copying built sources into ' + dumpPath);

        fse.ensureDirSync(dumpPath);

        new Exec('cp -R', path.join(frontendDumpPath, '*'), dumpPath + '/')
          .avoidBufferOverflow()
          .run((result) => {
            if (result.failed) {
              console.error('Error while copying ' + frontendDumpPath + ' into ' + dumpPath + ': ' + result.error);
              this.exit(1);
            }

            console.log('Frontend dumped successfully');
          });
      });
    });
};
