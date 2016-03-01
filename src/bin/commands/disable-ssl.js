#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(mainPath) {
  var path = require('path');
  var fs = require('fs');
  var Property = require('deep-package-manager').Property_Instance;
  var ACMService = require('deep-package-manager').Provisioning_Service_ACMService;
  var CloudFrontService = require('deep-package-manager').Provisioning_Service_CloudFrontService;
  var Config = require('deep-package-manager').Property_Config;

  if ((!/^win/.test(process.platform) && mainPath.indexOf(path.sep) !== 0 ) ||
    (/^win/.test(process.platform) && !(/^[a-z]{1}:/i.test(mainPath)))) {
    mainPath = path.join(process.cwd(), mainPath);
  }

  var propertyConfigFile = path.join(mainPath, Config.DEFAULT_FILENAME);

  if (!fs.existsSync(propertyConfigFile)) {
    console.error('You should have the application configured');
    this.exit(1);
  }

  var property = new Property(mainPath);

  property.configObj.tryLoadConfig(function() {
    if (!property.configObj.configExists) {
      console.error('You should have the application deployed');
      this.exit(1);
    }

    var domain = property.config.domain;

    if (!domain) {
      console.error('Please add a domain to \'' + Config.DEFAULT_FILENAME + '\' config file in order to deactivate SSL!');
    }

    var acmService = property.provisioning.services.find(ACMService);
    var cfService = property.provisioning.services.find(CloudFrontService);

    console.log('Looking for ACM certificate available of the domain \'' + domain + '\'');

    acmService.getDomainCertificateArn(domain, function(certArn) {
      if (!certArn) {
        console.error('There is no certificate available for the domain \'' + domain + '\'');
        this.exit(1);
      }

      var configChanges = {
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

      console.log('Deactivating ACM certificate \'' + certArn + '\' for domain \'' + domain + '\'');

      cfService.updateDistribution(configChanges, function(error) {
        if (error) {
          console.error(error);
          this.exit(1);
        }

        console.log(
          'Certificate \'' + certArn + '\' have been successfully unassigned from the CloudFront distribution'
        );
      }.bind(this));
    }.bind(this));
  }.bind(this));
};
