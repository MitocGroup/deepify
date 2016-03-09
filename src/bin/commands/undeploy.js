/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

module.exports = function(mainPath) {
  var Property = require('deep-package-manager').Property_Instance;
  var Config = require('deep-package-manager').Property_Config;
  var Undeploy = require('deep-package-manager').Provisioning_Undeploy;
  var ProvisioningDumpFileMatcher = require('deep-package-manager').Provisioning_UndeployMatcher_ProvisioningDumpFileMatcher;
  var AbstractService = require('deep-package-manager').Provisioning_Service_AbstractService;
  var path = require('path');
  var Prompt = require('../../lib.compiled/Terminal/Prompt').Prompt;

  var dirtyMode = this.opts.locate('dirty').exists;
  var forceProd = this.opts.locate('prod').exists;
  var cfgBucket = this.opts.locate('cfg-bucket').value;
  var rawResource = this.opts.locate('resource').value;

  var resource = null;
  var skipDirtyCheck = false;

  if (rawResource) {
    resource = AbstractService.extractBaseHashFromResourceName(rawResource);
    skipDirtyCheck = true;

    if (!resource) {
      // in case the hash is provided
      if (rawResource.length === AbstractService.MAIN_HASH_SIZE) {
        resource = rawResource;
      } else {
        console.error('Unable to extract base hash from ' + rawResource);
        this.exit(1);
      }
    }
  }

  mainPath = this.normalizeInputPath(mainPath);

  var property = new Property(mainPath, Config.DEFAULT_FILENAME);
  var matcher = new ProvisioningDumpFileMatcher(property);

  matcher.read(function(error) {
    if (error && !resource && !dirtyMode) {
      console.error(error);
      console.log('You may want to add "--dirty" flag to delete all account resources');

      this.exit(1);
      return;
    }

    var backupConfig = !error;

    // @todo: confirm prod env undeploy
    if (!error && !resource && !dirtyMode && matcher.property.env.toLowerCase() === 'prod' && !forceProd) {
      var prompt = new Prompt(
        'You are about to undeploy production environment.\n' +
        'Please type "YES" in order to confirm the undeploy.'
      );

      prompt.syncMode = true;

      prompt.read((confirmation) => {
        if ((confirmation || '').toLowerCase() !== 'yes') {
          console.log('Undeploy cancelled by user');
          this.exit(0);
        }
      });
    }

    var undeploy = new Undeploy(
      property,
      true,
      error ? Undeploy.DEFAULT_MATCHER : matcher
    );

    undeploy.execute(function (error, results) {
      if (error) {
        console.error(error);
        this.exit(1);
        return;
      } else if(!results) {
        console.log('There are no AWS resources matched...');
      }

      if (backupConfig) {
        console.log('Create configuration backup in ' + this.fileNameBck);

        matcher.bckConfigFile(function(error) {
          if (error) {
            console.error(error);

            this.exit(1);
            return;
          }

          this.exit(0);
        }.bind(this));

        return;
      }

      this.exit(0);
    }.bind(this), resource = resource || AbstractService.AWS_RESOURCE_GENERALIZED_REGEXP);
  }.bind(this), cfgBucket);
};
