/**
 * Created by CCristi on 5/6/16.
 */

'use strict';

module.exports = function(mainPath) {
  let Property = require('deep-package-manager').Property_Instance;
  let AbstractService = require('deep-package-manager').Provisioning_Service_AbstractService;
  let ProvisioningCollisionsListingException = require('deep-package-manager').Property_Exception_ProvisioningCollisionsListingException;
  let Listing  =  require('deep-package-manager').Provisioning_Listing;
  let OS = require('os');

  mainPath = this.normalizeInputPath(mainPath);
  let property = new Property(mainPath);
  let lister = new Listing(property);
  let rawResource = this.opts.locate('resource').value;
  let service = this.opts.locate('service').value;
  let resource = null;

  let servicesToList = (servicesRaw) => {
    if (!servicesRaw) {
      return Listing.SERVICES;
    }

    let services = servicesRaw.split(',');

    servicesRaw.split(',').forEach((service) => {
      if (Listing.SERVICES.indexOf(service) === -1) {
        console.error(`Unkown service: ${service}. Available services: ${Listing.SERVICES.join(',')}`);
        this.exit(1);
      }
    });

    return services;
  };

  let stringifyResourcesObj = (resourcesObj) => {
    let output = OS.EOL;
    let TAB = '  ';

    for (let serviceName in resourcesObj) {
      if (!resourcesObj.hasOwnProperty(serviceName)) {
        continue;
      }

      output += `- ${serviceName}: ${OS.EOL}`;
      let resourcesArr = Object.keys(resourcesObj[serviceName]);

      for (let resource of resourcesArr) {
        output += `${TAB}- ${resource}${OS.EOL}`;
      }
    }

    return output;
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

  lister.hash = resource || AbstractService.AWS_RESOURCE_GENERALIZED_REGEXP;

  lister.list((listingResult) => {
    if (Object.keys(listingResult.errors).length > 0) {
      console.error(new ProvisioningCollisionsListingException(listingResult.errors).message);
      this.exit(1);
    } else if (listingResult.matchedResources <= 0) {
      console.log(`There are no DEEP resource on your AWS account ${resource ? `matching '${resource}' hash` : ''}.`);
      this.exit(1);
    } else {
      console.log(stringifyResourcesObj(listingResult.resources));
    }
  }, servicesToList(service));
};
