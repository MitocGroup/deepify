/**
 * Created by CCristi on 5/31/16.
 * @todo: move into '/lib/Helpers/' folder when get rid of uglifyjs
 */

'use strict';

let AbstractService = require('deep-package-manager').Provisioning_Service_AbstractService;
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
   * @returns {Promise}
   */
  format(result) {
    let formattedResult = {};

    return co(function* () {
      for (let service in result) {
        if (!result.hasOwnProperty(service)) {
          continue;
        }

        let humanizedServiceName = this._humanizeAwsServiceName(service);
        let resources = result[service];

        for (let resourceName in resources) {
          if (!resources.hasOwnProperty(resourceName)) {
            continue;
          }

          let resourceData = resources[resourceName];
          let appName = yield this._resolveAppName(service, resourceName, resourceData);

          formattedResult[appName] = formattedResult[appName] || {};
          formattedResult[appName][humanizedServiceName] = formattedResult[appName][humanizedServiceName] || [];
          formattedResult[appName][humanizedServiceName].push(this._findSuitableResourceName(
            service, resourceData, resourceName
          ));
        }
      }

      return this._stringifyResult(formattedResult);
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
        resourceId = resourceData.name;
        break;
      case 'CloudFront':
        resourceId = resourceData.Comment;
        break;
      case 'IAM':
        resourceId = resourceData.RoleName;
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

          this._namingCache[cacheKey] = `${config.appName} (${config.deployId})`;
        } catch (e) {
          this._namingCache[cacheKey] = `${appEnv} (${appBaseHash})`;
        }

        return this._namingCache[cacheKey];
      }.bind(this));
    }

    return Promise.resolve(ApplicationFormatter.UNKNOWN_APPLICATION);
  }

  /**
   * @param {String} result
   * @returns {*}
   * @private
   */
  _stringifyResult(result) {
    let TAB = '  ';
    let output = os.EOL;
    let appIndex = 0;

    Object.keys(result).sort().forEach((appId) => {
      let serviceIndex = 0;
      let resourcesObj = result[appId];
      output += `${os.EOL} #${++appIndex}. ${appId} ${os.EOL}`;
      output += `     ${'-'.repeat(appId.length)} ${os.EOL}`;

      Object.keys(resourcesObj).sort().forEach((serviceName) => {
        let resourceIndex = 0;
        let resourcesArr = resourcesObj[serviceName];
        output += `${TAB}${++serviceIndex}. ${serviceName}: ${os.EOL}`;

        for (let resource of resourcesArr) {
          output += `${TAB.repeat(2)} ${serviceIndex}.${++resourceIndex}. ${resource}${os.EOL}`;
        }
      });
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
      S3Service.SYSTEM_BUCKET,
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
   */
  _findSuitableServiceTier(service) {
    switch(service) {
      case 'IAM':
      case 'CognitoIdentity':
        return 'Security';
      case 'ES':
      case 'ElastiCache':
      case 'CloudWatchLogs':
      case 'DynamoDB':
      case 'SQS':
        return 'Data';
      case 'CloudWatchEvents':
      case 'Lambda':
      case 'APIGateway':
        return 'Backend';
      case 'S3':
      case 'CloudFront':
        return 'Frontend';
      default:
        return '';
    }
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
        return resourceData.DomainName;
      case 'APIGateway':
        return resourceData.name;
      case 'Lambda':
        return resourceData.FunctionName;
      case 'S3':
      case 'CloudWatchEvents':
        return resourceData.Name;
      default:
        return defaultName;
    }
  }

  /**
   * @returns {String}
   */
  static get UNKNOWN_APPLICATION() {
    return 'unknown application';
  }
};
