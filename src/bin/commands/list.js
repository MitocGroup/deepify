/**
 * Created by CCristi on 5/6/16.
 */

'use strict';

module.exports = function(mainPath) {
  let Property = require('deep-package-manager').Property_Instance;
  let AbstractService = require('deep-package-manager').Provisioning_Service_AbstractService;
  let ProvisioningCollisionsListingException = require('deep-package-manager')
    .Property_Exception_ProvisioningCollisionsListingException;
  let Listing  =  require('deep-package-manager').Provisioning_Listing;
  let ApplicationFormatter = require('./helper/ListingFormatter/ApplicationFormatter');

  mainPath = this.normalizeInputPath(mainPath);
  let property = Property.create(mainPath);
  let lister = new Listing(property);
  let rawResource = this.opts.locate('resource').value;
  let service = this.opts.locate('service').value;
  let region = this.opts.locate('region').value;
  let format = this.opts.locate('format').value || 'application';
  let depth = parseInt(this.opts.locate('depth').value || 1);
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

  let regionsToList = (regionsRaw) => {
    if (!regionsRaw) {
      return Listing.REGIONS;
    }

    let regions = regionsRaw.split(',');

    if (regions.indexOf('*') !== -1) {
      return Listing.REGIONS;
    }

    regions.forEach((region) => {
      if (Listing.REGIONS.indexOf(region) === -1) {
        console.error(`Unknown or unsupported region: ${region}. Available regions: ${Listing.REGIONS.join(',')}`);
        this.exit(1);
      }
    });

    return regions;
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
  let regionList = regionsToList(region);
  let depthFlagsMap = {
    get 1() { return ApplicationFormatter.APP_LEVEL; },
    get 2() { return this[1] | ApplicationFormatter.SERVICE_LEVEL; },
    get 3() { return this[2] | ApplicationFormatter.RESOURCE_LEVEL; },
  };

  lister.hash = resource || AbstractService.AWS_RESOURCE_LISTING_REGEXP;

  console.log(`Querying AWS region${regionList.length > 1 ? 's' : ''} and compiling the list of applications...`);

  lister.listAll((listingResult) => {
    if (lister.resultHasErrors(listingResult)) {
      console.error(new ProvisioningCollisionsListingException(listingResult).message);
      this.exit(1);
    } else if (lister.resultMatchedResources(listingResult) <= 0) {
      console.warn(`There are no DEEP resource on your AWS account ${resource ? `matching '${resource}' hash.` : '.'}`);
      this.exit(0);
    } else {
      try {
        let ucFormat = format.charAt(0).toUpperCase() + format.slice(1);
        let FormatterClass = require(`./helper/ListingFormatter/${ucFormat}Formatter`);
        let formatter = new FormatterClass(property);
        let levelsFlags = depthFlagsMap[depth] || depthFlagsMap[1];

        formatter.format(listingResult, levelsFlags, regionList).then((strResources) => {
          if (depth === 1) {
            console.log('Below output is consolidated. Use parameters like --depth or --region to get more details,' +
              ' but be aware that it takes considerably more time');
            console.log('Run deepify list --depth=2 to get service level details.' +
              ' And, deepify list --depth=3 to get resource level details.');
          }

          console.log(strResources);
        });
      } catch (e) {
        console.error(`'${format}' formatter is not supported`);
        this.exit(1);
      }
    }
  }, serviceList, regionList);
};
