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

  if (mainPath.indexOf(path.sep) !== 0) {
    mainPath = path.join(process.cwd(), mainPath);
  }

  var propertyConfigFile = path.join(mainPath, Config.DEFAULT_FILENAME);
  var deployConfigFile = path.join(mainPath, '.cfg.deeploy.json');

  if (!fs.existsSync(propertyConfigFile) || !fs.existsSync(deployConfigFile)) {
    console.error('You should have the application deployed');
  }

  var deployConfig = fse.readJsonSync(deployConfigFile);

  if (domain) {
    var config = null;

    config = fse.readJsonSync(propertyConfigFile);
    config.domain = domain;

    fse.outputJsonSync(propertyConfigFile, config);
  }

  var property = new Property(mainPath);

  domain = property.config.domain;

  property._config = deployConfig;
  property.provisioning.injectConfig(deployConfig);
  property.config.domain = domain;

  if (!domain) {
    console.error('Please add a domain to \'' + Config.DEFAULT_FILENAME + '\' config file in order to activate SSL!');
    console.log('You may add \'--domain\' option to add it to the config automatically.');
  }

  var acmService = property.provisioning.services.find(ACMService);
  var cfService = property.provisioning.services.find(CloudFrontService);

  console.log('Ensure ACM certificate available for domain \'' + domain + '\'');

  acmService.ensureCertificate(domain, function (error, certArn) {
    if (error) {
      console.error(error);
      this.exit(1);
    }

    console.log('Ensure ACM certificate \'' + certArn + '\' for domain \'' + domain + '\' have been activated');

    acmService.isCertificateIssued(certArn, function(error, isIssued) {
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

      console.log('Activating ACM certificate \'' + certArn + '\' for domain \'' + domain + '\'');

      cfService.updateDistribution(configChanges, function(error) {
        if (error) {
          console.error(error);
          this.exit(1);
        }

        console.log(
          'The ACM certificate \'' + certArn + '\' have been successfully assigned to the CloudFront distribution'
        );
      }.bind(this));
    }.bind(this));
  }.bind(this));
};
