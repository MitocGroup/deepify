/**
 * Created by CCristi on 5/31/16.
 * @todo: move into '/lib/Helpers/' folder when get rid of uglifyjs
 */

'use strict';

let AbstractService = require('deep-package-manager').Provisioning_Service_AbstractService;
let CognitoIdentityProviderService = require('deep-package-manager')
  .Provisioning_Service_CognitoIdentityProviderService;
let S3Service = require('deep-package-manager').Provisioning_Service_S3Service;
let DeployConfig = require('deep-package-manager').Property_DeployConfig;
let co = require('co');
let os = require('os');

module.exports = class ApplicationFormatter {
  /**
   * @param {Property_Instance} property
   */
  constructor(property) {
    this._namingCache = {};
    this._property = property;
  }

  /**
   * @param {Object} result
   * @param {Number} levelsFlags
   * @returns {Promise}
   */
  format(result, levelsFlags) {
    let formattedResult = {};

    return co(function* () {
      for (let service in result) {
        if (!result.hasOwnProperty(service)) {
          continue;
        }

        let resources = result[service];

        for (let resourceName in resources) {
          if (!resources.hasOwnProperty(resourceName)) {
            continue;
          }

          let resourceData = resources[resourceName];
          let appName = yield this._resolveAppName(service, resourceName, resourceData);

          formattedResult[appName] = formattedResult[appName] || {};
          formattedResult[appName][service] = formattedResult[appName][service] || [];
          formattedResult[appName][service].push(this._findSuitableResourceName(
            service, resourceData, resourceName
          ));
        }
      }

      return this._stringifyResult(formattedResult, levelsFlags);
    }.bind(this));
  }

  /**
   * @param {String} service
   * @param {String} resourceName
   * @param {Object} resourceData
   * @returns {Promise}
   * @private
   */
  _resolveAppName(service, resourceName, resourceData) {
    let resourceId;
    let appBaseHash;
    let appEnv;

    switch (service) {
      case 'APIGateway':
      case 'APIGatewayKey':
      case 'APIGatewayPlan':
        resourceId = resourceData.name;
        break;
      case 'CloudFront':
        resourceId = resourceData.DeepResourceId; // "DeepResourceId" is injected by CloudFront Listing Driver
        break;
      case 'IAM':
        resourceId = resourceData.RoleName;
        break;
      case 'CognitoIdentity':
        resourceId = resourceData.IdentityPoolName;
        break;
      case 'CognitoIdentityProvider':
        resourceId = resourceData.Name;
        break;
      default:
        resourceId = resourceName;
    }

    appBaseHash = AbstractService.extractBaseHashFromResourceName(resourceId);
    appEnv = AbstractService.extractEnvFromResourceName(resourceId);

    if (appBaseHash && appEnv) {
      let cacheKey = `${appBaseHash}.${appEnv}`;

      if (this._namingCache.hasOwnProperty(cacheKey)) {
        return Promise.resolve(this._namingCache[cacheKey]);
      }

      return co(function* () {
        try {
          let data = yield this._tryReadS3ProvisionConfig(appBaseHash, appEnv);
          let config = JSON.parse(data.Body.toString());

          this._namingCache[cacheKey] = `${config.appName} (${appBaseHash})`;
        } catch (e) {
          this._namingCache[cacheKey] = `${appEnv} (${appBaseHash})`;
        }

        return this._namingCache[cacheKey];
      }.bind(this));
    }

    return Promise.resolve(ApplicationFormatter.UNKNOWN_APPLICATION);
  }

  /**
   * @param {Object} result
   * @param {Number} levelsFlags
   * @returns {*}
   * @private
   */
  _stringifyResult(result, levelsFlags) {
    let TAB = '  ';
    let output = os.EOL;
    let appIndex = 0;

    Object.keys(result).sort().forEach((appName) => {
      let serviceIndex = 0;
      let servicesObj = result[appName];
      let servicesNames = Object.keys(servicesObj);

      if (levelsFlags & ApplicationFormatter.APP_LEVEL) {
        appName += ` | using ${servicesNames.length} cloud services`;
        output += `${os.EOL}#${++appIndex}. ${appName} ${os.EOL}`;
        output += `    ${'-'.repeat(appName.length)} ${os.EOL}`;
      }

      servicesNames.sort(ApplicationFormatter.serviceSorting).forEach((serviceName) => {
        let resourceIndex = 0;
        let resourcesArr = servicesObj[serviceName];

        if (levelsFlags & ApplicationFormatter.SERVICE_LEVEL) {
          output += `${os.EOL}${TAB.repeat(2)}${++serviceIndex}. ${this._humanizeAwsServiceName(serviceName)} `;
          output += `| using ${resourcesArr.length} cloud resources: ${os.EOL}`;
        }

        if (levelsFlags & ApplicationFormatter.RESOURCE_LEVEL) {
          for (let resource of resourcesArr) {
            output += `${TAB.repeat(3)}${serviceIndex}.${++resourceIndex}. ${resource}${os.EOL}`;
          }
        }
      });

      output += os.EOL;
    });

    return output;
  }

  /**
   * @param {String} appBaseHash
   * @param {String} appEnv
   * @returns {Promise}
   * @private
   */
  _tryReadS3ProvisionConfig(appBaseHash, appEnv) {
    let s3 = this._property.provisioning.getAwsServiceByName('s3');
    let payload = {
      Bucket: this._generateSystemBucketARN(appBaseHash, appEnv),
      Key: DeployConfig.generateConfigFilename(appBaseHash, appEnv),
    };

    return s3.getObject(payload).promise();
  }

  /**
   * @param {String} baseHash
   * @param {String} env
   * @returns {String}
   * @private
   */
  _generateSystemBucketARN(baseHash, env) {
    return [
      AbstractService.AWS_RESOURCES_PREFIX,
      env,
      S3Service.PRIVATE_BUCKET,
      baseHash
    ].join(AbstractService.DELIMITER_DOT);
  }

  /**
   *
   * @param {String} service
   * @returns {String}
   * @private
   */
  _humanizeAwsServiceName(service) {
    return `${this._findSuitableServiceTier(service)} Tier / Amazon ${service}`;
  }

  /**
   * @param {String} service
   * @returns {*}
   * @private
   */
  _findSuitableServiceTier(service) {
    switch(service) {
      case 'IAM':
      case 'CognitoIdentity':
      case 'CognitoIdentityProvider':
        return ApplicationFormatter.SECURITY_TIER;
      case 'ES':
      case 'ElastiCache':
      case 'CloudWatchLogs':
      case 'DynamoDB':
      case 'SQS':
        return ApplicationFormatter.DATA_TIER;
      case 'CloudWatchEvents':
      case 'Lambda':
      case 'APIGateway':
      case 'APIGatewayKey':
      case 'APIGatewayPlan':
        return ApplicationFormatter.BACKEND_TIER;
      case 'S3':
      case 'CloudFront':
        return ApplicationFormatter.FRONTEND_TIER;
      default:
        return '';
    }
  }

  /**
   * @param {String} serviceA
   * @param {String} serviceB
   * @returns {Number}
   * @private
   */
  static serviceSorting(serviceA, serviceB) {
    let order = [
      'IAM',
      'CognitoIdentity',
      'CognitoIdentityProvider',
      'S3',
      'CloudFront',
      'APIGateway',
      'APIGatewayKey',
      'APIGatewayPlan',
      'Lambda',
      'CloudWatchEvents',
      'DynamoDB',
      'SQS',
      'ElastiCache',
      'ES',
      'CloudWatchLogs',
    ];

    return order.indexOf(serviceA) - order.indexOf(serviceB);
  }

  /**
   * @param {String} service
   * @param {Object} resourceData
   * @param {String} defaultName
   * @returns {*}
   * @private
   */
  _findSuitableResourceName(service, resourceData, defaultName) {
    switch (service) {
      case 'IAM':
        return resourceData.RoleName;
      case 'CognitoIdentity':
        return `${resourceData.IdentityPoolId} (${resourceData.IdentityPoolName})`;
      case 'CloudFront':
        return `${resourceData.DomainName} | ${resourceData.Enabled ? 'Enabled' : 'Disabled'}`;
      case 'APIGateway':
      case 'APIGatewayKey':
      case 'APIGatewayPlan':
        return resourceData.name;
      case 'Lambda':
        return resourceData.FunctionName;
      case 'S3':
      case 'CloudWatchEvents':
        return resourceData.Name;
      case 'ES':
        return `${resourceData.DomainName} | ${resourceData.Deleted ? 'Deleting' : 'Running'}`;
      case 'CognitoIdentityProvider':
        return this._property.provisioning.services
          .find(CognitoIdentityProviderService)
          ._generateCognitoProviderName(resourceData);
      default:
        return defaultName;
    }
  }

  /**
   * @returns {Number}
   */
  static get APP_LEVEL() {
    return 0x001;
  }

  /**
   * @returns {Number}
   */
  static get SERVICE_LEVEL() {
    return 0x002;
  }

  /**
   * @returns {Number}
   */
  static get RESOURCE_LEVEL() {
    return 0x004;
  }

  /**
   * @returns {String}
   */
  static get BACKEND_TIER() {
    return 'Backend';
  }

  /**
   * @returns {String}
   */
  static get FRONTEND_TIER() {
    return 'Frontend';
  }

  /**
   * @returns {String}
   */
  static get SECURITY_TIER() {
    return 'Security';
  }

  /**
   * @returns {String}
   */
  static get DATA_TIER() {
    return 'Data';
  }

  /**
   * @returns {String}
   */
  static get UNKNOWN_APPLICATION() {
    return 'unknown application';
  }
};
