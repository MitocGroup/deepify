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
  var cfDomain = deployConfig.provisioning.cloudfront.domain;
  var cfId = deployConfig.provisioning.cloudfront.id;

  if (domain) {
    let config = null;

    config = fse.readJsonSync(propertyConfigFile);
    config.domain = domain;

    fse.outputJsonSync(propertyConfigFile, config);
  }

  var property = new Property(mainPath);
  var acm = property.provisioning.acm;
  var cf = property.provisioning.cloudFront;

  domain = property.config.domain;

  if (!domain) {
    console.error('Please add a domain to \'' + Config.DEFAULT_FILENAME + '\' config file in order to activate SSL!');
    console.log('You may add \'--domain\' option to add it to the config automatically.');
  }

  getCertArn.bind(this)(function(certArn) {
    ensureActive.bind(this)(certArn, function() {
      activateForCf.bind(this)(certArn, function() {
        console.log(
          'Certificate \'' + certArn + '\' have been successfully assigned to the \'' +
          cfDomain + '\' CloudFront distribution'
        );
      }.bind(this));
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

      console.log('Creating certificate for domain \'' + domain + '\'');

      createCert.bind(this)(cb);
    }.bind(this));
  }

  function createCert(cb) {
    var payload = {
      DomainName: domain,
      IdempotencyToken: Hash.md5(property.identifier + '|' + domain),
    };

    acm.requestCertificate(payload, function (error, data) {
      if (error) {
        console.error(error);
        this.exit(1);
      }

      cb(data.CertificateArn);
    }.bind(this));
  }

  function ensureActive(certArn, cb) {
    var payload = {
      CertificateArn: certArn,
    };

    acm.describeCertificate(payload, function (error, data) {
      if (error) {
        console.error(error);
        this.exit(1);
      }

      console.log('Certificate status: ' + data.Certificate.Status);

      if (data.Certificate.Status !== 'ISSUED') {
        console.error(
          'You must validate the certificate \'' + certArn
          + '\' by accessing the link from the mail sent by AWS (Subject: "Certificate approval for ' + domain + '")'
        );
        this.exit(1);
      }

      cb();
    }.bind(this));
  }

  function activateForCf(certArn, cb) {
    console.log('Fetching CloudFront distribution \'' + cfDomain + '\' configuration');

    getCfConfig.bind(this)(function(distConfig, eTag) {
      var payload = {
        DistributionConfig: distConfig,
        Id: cfId,
        IfMatch: eTag,
      };

      payload.DistributionConfig.DefaultCacheBehavior.ViewerProtocolPolicy = 'redirect-to-https';
      payload.DistributionConfig.ViewerCertificate.Certificate = certArn;
      payload.DistributionConfig.ViewerCertificate.CertificateSource = 'acm';
      payload.DistributionConfig.ViewerCertificate.CloudFrontDefaultCertificate = false;
      payload.DistributionConfig.Aliases = {
        Quantity: 1,
        Items: [domain],
      };

      console.log('Updating CloudFront distribution \'' + cfDomain + '\' configuration');

      cf.updateDistribution(payload, function (error) {
        if (error) {

          // manage special case
          if (error.code === 'CNAMEAlreadyExists') {
            console.error(
              'Seems like the domain/CNAME \'' + domain +
              '\' is already associated with an other CloudFront distribution!'
            );
          } else {
            console.error(error);
          }

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
