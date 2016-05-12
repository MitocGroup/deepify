#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(mainPath) {
  let path = require('path');
  let fs = require('fs');
  let Property = require('deep-package-manager').Property_Instance;
  let ACMService = require('deep-package-manager').Provisioning_Service_ACMService;
  let CloudFrontService = require('deep-package-manager').Provisioning_Service_CloudFrontService;
  let Config = require('deep-package-manager').Property_Config;

  mainPath = this.normalizeInputPath(mainPath);

  let propertyConfigFile = path.join(mainPath, Config.DEFAULT_FILENAME);

  if (!fs.existsSync(propertyConfigFile)) {
    console.error('You should have the application configured');
    this.exit(1);
  }

  let property = new Property(mainPath);

  property.configObj.tryLoadConfig(() => {
    if (!property.configObj.configExists) {
      console.error('You should have the application deployed');
      this.exit(1);
    }

    let domain = property.config.domain;

    if (!domain) {
      console.error(`Please add a domain to '${Config.DEFAULT_FILENAME}' config file in order to deactivate SSL!`);
    }

    let acmService = property.provisioning.services.find(ACMService);
    let cfService = property.provisioning.services.find(CloudFrontService);

    console.log(`Looking for ACM certificate available of the domain '${domain}'`);

    acmService.getDomainCertificateArn(domain, (certArn) => {
      if (!certArn) {
        console.error(`There is no certificate available for the domain '${domain}'`);
        this.exit(1);
      }

      let configChanges = {
        DefaultCacheBehavior: {
          ViewerProtocolPolicy: 'allow-all',
        },
        ViewerCertificate: {
          Certificate: null,
          CertificateSource: 'cloudfront',
          CloudFrontDefaultCertificate: true,
        },
        Aliases: {
          Quantity: 0,
          Items: null,
        },
      };

      console.log(`Deactivating ACM certificate '${certArn}' for domain '${domain}'`);

      cfService.updateDistribution(configChanges, (error) => {
        if (error) {
          console.error(error);
          this.exit(1);
        }

        console.log(`Certificate '${certArn}' have been successfully unassigned from the CloudFront distribution`);
      });
    });
  });
};
