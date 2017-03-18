/**
 * Created by CCristi on 3/16/17.
 */

'use strict';

const path = require('path');


module.exports = function(mainPath) {
  const Exec = require('../../lib.compiled/Helpers/Exec').Exec;
  const Bin = require('../../lib.compiled/NodeJS/Bin').Bin;
  const Property = require('deep-package-manager').Property_Instance;
  const LambdaExtractor = require('../../lib.compiled/Helpers/LambdasExtractor').LambdasExtractor;
  const Prompt = require('../../lib.compiled/Terminal/Prompt').Prompt;

  const resourcesToUpdate = this.opts.locate('partial').value;
  const debugBuild = this.opts.locate('debug-build').exists;
  mainPath = this.normalizeInputPath(mainPath);

  const propertyInstance = Property.create(mainPath);
  const resourcesIdentifiers = Object.keys(
    new LambdaExtractor(propertyInstance, getResourceToUpdate())
      .extract(LambdaExtractor.NPM_PACKAGE_FILTER, LambdaExtractor.EXTRACT_OBJECT)
  );

  propertyInstance.configObj.tryLoadConfig(() => {
    if (!propertyInstance.configObj.configExists) {
      throw new Error('Action deploy is available only on application update');
    }

    let prompt = new Prompt(`Prepare for production "${resourcesToUpdate}"?`);
    let prepareResources = (__, cb) => {
      console.debug(`Skipping "${resourcesToUpdate}" production preparation...`);

      cb();
    };

    prompt.readConfirm((result) => {
      if (result) {
        prepareResources = doCompileProd.bind(this);
      }

      prepareResources(propertyInstance.path, () => {
        Promise.all(
          resourcesIdentifiers.map(resource => {
            return new Promise((resolve, reject) => {
              try {
                propertyInstance.deployAction('@' + resource, () => {
                  console.info(`"${resource}" has been deployed.`);
                  resolve();
                });
              } catch(e) {
                reject(e);
              }
            });
          })
        ).then(() => {
          console.info('All resources have been deployed.');
        }).catch(e => {
          setImmediate(() => {
            throw e;
          });
        });
      });
    });
  });

  /**
   * @param {String} propertyPath
   * @param {Function} cb
   */
  function doCompileProd(propertyPath, cb) {
    console.debug('Start preparing for production');

    let cmd = new Exec(
      Bin.node,
      this.scriptPath,
      'compile',
      'prod',
      `--partial="${resourcesToUpdate}"`,
      propertyPath
    );

    if (debugBuild) {
      cmd.addArg('--debug-build');
    }

    cmd.run((result) => {
      if (result.failed) {
        console.error(`Backend production preparations failed: ${result.error}`);
        this.exit(1);
      }

      cb();
    }, true);
  }

  /**
   * @returns {String[]}
   */
  function getResourceToUpdate() {
    if (!resourcesToUpdate) {
      throw new Error('No resource have been provided for update');
    }

    let msIdentifiers = arrayUnique(resourcesToUpdate.split(',').map(id => id.trim()));

    return typeof msIdentifiers === 'string' ? [msIdentifiers] : msIdentifiers;
  }

  /**
   * @param {String[]} array
   * @returns {*}
   */
  function arrayUnique(array) {
    return array.reduce((uniqueArray, item) => {
      if (uniqueArray.indexOf(item) === -1) {
        uniqueArray.push(item);
      }

      return uniqueArray;
    });
  }
};
