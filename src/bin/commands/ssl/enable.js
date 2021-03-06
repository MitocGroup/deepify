#!/usr/bin/env node
/**
 * Created by AlexanderC on 8/4/15.
 */

'use strict';

module.exports = function(mainPath) {
  var path = require('path');
  var fse = require('fs-extra');
  var fs = require('fs');
  var Property = require('deep-package-manager').Property_Instance;
  var ACMService = require('deep-package-manager').Provisioning_Service_ACMService;
  var CloudFrontService = require('deep-package-manager').Provisioning_Service_CloudFrontService;
  var Config = require('deep-package-manager').Property_Config;

  var domain = this.opts.locate('domain').value || null;
  mainPath = this.normalizeInputPath(mainPath);

  var propertyConfigFile = path.join(mainPath, Config.DEFAULT_FILENAME);

  if (!fs.existsSync(propertyConfigFile)) {
    console.error('You should have the application configured');
    this.exit(1);
  }

  if (domain) {
    var config = null;

    config = fse.readJsonSync(propertyConfigFile);
    config.domain = domain;

    fse.outputJsonSync(propertyConfigFile, config);
  }

  var property = new Property(mainPath);

  domain = property.config.domain;

  if (!domain) {
    console.error(`Please add a domain to '${Config.DEFAULT_FILENAME}' config file in order to activate SSL!`);
    console.info('You may add \'--domain\' option to add it to the config automatically.');
    this.exit(1);
  }

  property.configObj.tryLoadConfig(() => {
    if (!property.configObj.configExists) {
      console.error('You should have the application deployed');
      this.exit(1);
    }

    property.config.domain = domain;

    var acmService = property.provisioning.services.find(ACMService);
    var cfService = property.provisioning.services.find(CloudFrontService);

    console.debug(`Ensure ACM certificate available for domain '${domain}'`);

    acmService.ensureCertificate(domain, (error, certArn) => {
      if (error) {
        console.error(error);
        this.exit(1);
      }

      console.debug(`Ensure ACM certificate '${certArn}' for domain '${domain}' have been activated`);

      acmService.isCertificateIssued(certArn, (error, isIssued) => {
        if (error) {
          console.error(error);
          this.exit(1);
        } else if(!isIssued) {
          console.error(
            'You must validate the certificate \'' + certArn
            + '\' by accessing the link from the mail sent by AWS ' +
            '(Subject: "Certificate approval for ' + domain + '")'
          );
          this.exit(1);
        }

        var configChanges = {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
          },
          ViewerCertificate: {
            Certificate: certArn,
            CertificateSource: 'acm',
            CloudFrontDefaultCertificate: false,
          },
          Aliases: {
            Quantity: 1,
            Items: [domain],
          },
        };

        console.log(`Activating ACM certificate '${certArn}' for domain '${domain}'`);

        cfService.updateDistribution(configChanges, (error) => {
          if (error) {
            console.error(error);
            this.exit(1);
          }

          console.info(`The ACM certificate ${certArn} have been successfully assigned to the CloudFront distribution`);
        });
      });
    });
  });
};
