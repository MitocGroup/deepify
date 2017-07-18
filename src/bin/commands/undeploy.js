/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

module.exports = function(mainPath) {
  let Property = require('deep-package-manager').Property_Instance;
  let Config = require('deep-package-manager').Property_Config;
  let Undeploy = require('deep-package-manager').Provisioning_Undeploy;
  let ProvisioningDumpFileMatcher = require('deep-package-manager')
    .Provisioning_UndeployMatcher_ProvisioningDumpFileMatcher;
  let AbstractService = require('deep-package-manager').Provisioning_Service_AbstractService;
  let Prompt = require('../../lib.compiled/Terminal/Prompt').Prompt;
  let validateNodeVersion = require('./helper/validate-node-version');

  let dirtyMode = this.opts.locate('dirty').exists;
  let forceProd = this.opts.locate('prod').exists;
  let cfgBucket = this.opts.locate('cfg-bucket').value;
  let rawResource = this.opts.locate('resource').value;
  let resource = null;
  let resourceEnv = null;

  validateNodeVersion.call(this);

  if (rawResource) {
    resource = AbstractService.extractBaseHashFromResourceName(rawResource);
    resourceEnv = AbstractService.extractEnvFromResourceName(rawResource);

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

  let property = new Property(mainPath, Config.DEFAULT_FILENAME);
  let matcher = new ProvisioningDumpFileMatcher(property);
  property.configObj.baseHash = resource || property.configObj.baseHash;
  property.config.env = resourceEnv || property.config.env;

  matcher.read((error) => {
    if (error && !resource && !dirtyMode) {
      console.error(error);
      console.info('You may want to add "--dirty" flag to delete all account resources');
      this.exit(1);
      return;
    }

    let backupConfig = !error;

    // @todo: confirm prod env undeploy
    if (!error && !resource && !dirtyMode && matcher.property.env.toLowerCase() === 'prod' && !forceProd) {
      let prompt = new Prompt(
        'You are about to undeploy production environment.\n' +
        'Please type "YES" in order to confirm the undeploy.'
      );

      prompt.syncMode = true;

      prompt.read((confirmation) => {
        if ((confirmation || '').toLowerCase() !== 'yes') {
          console.info('Undeploy cancelled by user');
          this.exit(0);
        }
      });
    }

    let undeploy = new Undeploy(
      property,
      true,
      error ? Undeploy.DEFAULT_MATCHER : matcher
    );

    let infoMsg = `Undeploying "${resource}" resources from "${property.config.env}" environment ...`;

    if (dirtyMode) {
      infoMsg = `Undeploying all deep resources from your AWS account ...`;
    }

    console.info(infoMsg);

    undeploy.execute((error, results) => {
      if (error) {
        console.error(error);
        this.exit(1);
        return;
      } else if(!results) {
        console.warn('There are no AWS resources matched.');

        if (!resourceEnv) {
          console.warn('Please make sure "' + resource + '" resource exists in "' + property.config.env +
            '" environment or consider specifying full resource name (e.g. deep-dev-private-db0c09cc)');
        }
      }

      if (backupConfig) {
        console.debug(`Create configuration backup in ${matcher.fileNameBck}`);

        matcher.bckConfigFile((error) => {
          if (error) {
            console.error(error);

            this.exit(1);
            return;
          }

          this.exit(0);
        });

        return;
      }

      this.exit(0);
    }, resource = resource || AbstractService.AWS_RESOURCE_LISTING_REGEXP, !dirtyMode ? property.config.env : null);
  }, cfgBucket);
};
