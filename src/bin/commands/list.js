/**
 * Created by CCristi on 5/6/16.
 */

'use strict';

module.exports = function(mainPath) {
  let Property = require('deep-package-manager').Property_Instance;
  let AbstractService = require('deep-package-manager').Provisioning_Service_AbstractService;
  let ProvisioningCollisionsListingException = require('deep-package-manager').Property_Exception_ProvisioningCollisionsListingException;
  let Listing  =  require('deep-package-manager').Provisioning_Listing;
  let ApplicationFormatter = require('./helper/ListingFormatter/ApplicationFormatter');

  mainPath = this.normalizeInputPath(mainPath);
  let property = new Property(mainPath);
  let lister = new Listing(property);
  let rawResource = this.opts.locate('resource').value;
  let service = this.opts.locate('service').value;
  let format = this.opts.locate('format').value || 'application';
  let depth = this.opts.locate('depth').value || 3;
  let resource = null;

  let servicesToList = (servicesRaw) => {
    if (!servicesRaw) {
      return Listing.SERVICES;
    }

    let services = servicesRaw.split(',');

    servicesRaw.split(',').forEach((service) => {
      if (Listing.SERVICES.indexOf(service) === -1) {
        console.error(`Unknown service: ${service}. Available services: ${Listing.SERVICES.join(',')}`);
        this.exit(1);
      }
    });

    return services;
  };

  if (rawResource) {
    resource = AbstractService.extractBaseHashFromResourceName(rawResource);

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

  let serviceList = servicesToList(service);
  let depthFlagsMap = {
    get 1() { return ApplicationFormatter.APP_LEVEL; },
    get 2() { return this[1] | ApplicationFormatter.SERVICE_LEVEL; },
    get 3() { return this[2] | ApplicationFormatter.RESOURCE_LEVEL; },
  };

  lister.hash = resource || AbstractService.AWS_RESOURCE_GENERALIZED_REGEXP;
  lister.list((listingResult) => {
    if (Object.keys(listingResult.errors).length > 0) {
      console.error(new ProvisioningCollisionsListingException(listingResult.errors).message);
      this.exit(1);
    } else if (listingResult.matchedResources <= 0) {
      console.warn(`There are no DEEP resource on your AWS account ${resource ? `matching '${resource}' hash.` : '.'}`);
      this.exit(0);
    } else {
      try {
        let ucFormat = format.charAt(0).toUpperCase() + format.slice(1);
        let FormatterClass = require(`./helper/ListingFormatter/${ucFormat}Formatter`);
        let formatter = new FormatterClass(property);
        let levelsFlags = depthFlagsMap[depth] || depthFlagsMap[3];

        formatter.format(listingResult.resources, levelsFlags).then((strResources) => {
          if (depth == 1) {
            strResources = 'To get more details, run deepify list --depth=2 or deepify list --depth=3' + strResources;
          }

          console.log(strResources);
        });
      } catch (e) {
        console.error(`'${format}' formatter is not supported`);
        this.exit(1);
      }
    }
  }, serviceList);
};
