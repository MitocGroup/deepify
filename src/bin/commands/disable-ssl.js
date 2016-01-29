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
  var ACMListing = require('deep-package-manager').Provisioning_ListingDriver_ACMDriver;
  var Hash = require('deep-package-manager').Helpers_Hash;
  var Config = require('deep-package-manager').Property_Config;

  if (mainPath.indexOf(path.sep) !== 0) {
    mainPath = path.join(process.cwd(), mainPath);
  }

  var propertyConfigFile = path.join(mainPath, Config.DEFAULT_FILENAME);
  var deployConfigFile = path.join(mainPath, '.cfg.deeploy.json');

  if (!fs.existsSync(propertyConfigFile) || !fs.existsSync(deployConfigFile)) {
    console.error('You should have the application deployed');
  }

  var deployConfig = fse.readJsonSync(deployConfigFile);
  var cfDomain = deployConfig.provisioning.cloudfront.domain;
  var cfId = deployConfig.provisioning.cloudfront.id;

  var property = new Property(mainPath);
  var acm = property.provisioning.acm;
  var cf = property.provisioning.cloudFront;
  var domain = property.config.domain;

  if (!domain) {
    console.error('Please add a domain to \'' + Config.DEFAULT_FILENAME + '\' config file in order to deactivate SSL!');
  }

  getCertArn.bind(this)(function(certArn) {
    deactivateForCf.bind(this)(certArn, function() {
      console.log(
        'Certificate \'' + certArn + '\' have been successfully unassigned on the \'' +
        cfDomain + '\' CloudFront distribution'
      );
    }.bind(this));
  }.bind(this));

  function getCertArn(cb) {
    var domainRegex = new RegExp('^' + _escapeRegExp(domain) + '$', 'i');

    var listing = new ACMListing(
      acm,
      domainRegex
    );

    console.log('Fetching account certificates');

    listing.list(function() {
      var certificates = listing.extractResetStack;

      for (var certArn in certificates) {
        if (!certificates.hasOwnProperty(certArn)) {
          continue;
        }

        var certData = certificates[certArn];

        if (domain === certData.DomainName) {
          console.log('Certificate \'' + certArn + '\' available for domain \'' + domain + '\'');
          cb(certArn);
          return;
        }
      }

      console.error('There is no certificate available for the domain \'' + domain + '\'');
      this.exit(1);
    }.bind(this));
  }

  function deactivateForCf(certArn, cb) {
    console.log('Fetching CloudFront distribution \'' + cfDomain + '\' configuration');

    getCfConfig.bind(this)(function(distConfig, eTag) {
      var payload = {
        DistributionConfig: distConfig,
        Id: cfId,
        IfMatch: eTag,
      };

      payload.DistributionConfig.DefaultCacheBehavior.ViewerProtocolPolicy = 'allow-all';
      delete payload.DistributionConfig.ViewerCertificate.Certificate;
      payload.DistributionConfig.ViewerCertificate.CertificateSource = 'cloudfront';
      payload.DistributionConfig.ViewerCertificate.CloudFrontDefaultCertificate = true;
      payload.DistributionConfig.Aliases = {
        Quantity: 0,
        Items: [],
      };

      console.log('Updating CloudFront distribution \'' + cfDomain + '\' configuration');

      cf.updateDistribution(payload, function (error) {
        if (error) {
          console.error(error);
          this.exit(1);
        }

        cb();
      }.bind(this));
    }.bind(this));
  }

  function getCfConfig(cb) {
    var payload = {
      Id: cfId,
    };

    cf.getDistributionConfig(payload, function (error, data) {
      if (error) {
        console.error(error);
        this.exit(1);
      }

      cb(data.DistributionConfig, data.ETag);
    }.bind(this));
  }

  function _escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }
};
