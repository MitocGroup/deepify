/**
 * Created by CCristi on 2/6/17.
 */

'use strict';

const DEFAULT_ENV = 'dev';
const BLUE_GREEN_MICROSERVICE = 'deep-blue-green';

module.exports = function(commandParams) {
  let fs = require('fs');
  let os = require('os');
  let path = require('path');
  let Replication = require('deep-package-manager').Replication_Instance;
  let Property = require('deep-package-manager').Property_Instance;
  let tablesRaw = commandParams.context.opts.locate('tables').value;
  let blueHash = commandParams.context.opts.locate('blue').value;
  let greenHash = commandParams.context.opts.locate('green').value;
  let publicIgnore = commandParams.context.opts.locate('public-ignore').value;
  let privateIgnore = commandParams.context.opts.locate('private-ignore').value;

  let mainPath = commandParams.context.normalizeInputPath(commandParams.mainPath);
  let blueProperty = createProperty(blueHash);
  let greenProperty = createProperty(greenHash);

  Promise.all([
    loadPropertyConfig(blueProperty),
    loadPropertyConfig(greenProperty),
  ]).then(result => {
    let blueConfig = result[0];
    let greenConfig = result[1];

    if (!blueConfig.microservices.hasOwnProperty(BLUE_GREEN_MICROSERVICE)) {
      throw new Error(
        `Missing "${BLUE_GREEN_MICROSERVICE}" microservice. ` +
        `Please make sure you have installed "${BLUE_GREEN_MICROSERVICE}" microservice in your application.`
      );
    }

    let replication = new Replication(blueConfig, greenConfig);

    let params = {
      DB: getTables(),
      FS: getIgnoreGlobs(),
    };

    return commandParams.afterLoad(replication, params, blueHash, greenHash);
  }).catch(e => {
    setImmediate(() => {
      throw e;
    });
  });

  function loadPropertyConfig(property) {
    return new Promise((resolve, reject) => {
      property.configObj.tryLoadConfig(error => {
        if (error) {
          return reject(error);
        }

        if (!property.config.aws) {
          console.debug('Missing aws config in snapshot. Using aws config from deeploy.json');

          try {
            let deeployJson = require(path.join(mainPath, 'deeploy.json'));

            property.config.aws = deeployJson.aws;
          } catch (e) {
            throw new Error(
              `Missing "deeploy.json file in ${mainPath}". ` +
              `Please ensure you are running "deepify ${this.name}" in property directory`
            );
          }
        }

        resolve(property.config);
      }, generatePrivateBucketName(property))
    });
  }

  /**
   * @returns {Array}
   */
  function getTables() {
    return tablesRaw.split(',') || [];
  }

  /**
   * @returns {{privateIgnoreGlob: string, publicIgnoreGlob: string}}
   */
  function getIgnoreGlobs() {
    return {
      privateIgnoreGlob: readIgnoreFileSafe(privateIgnore) || 'temp',
      publicIgnoreGlob: readIgnoreFileSafe(publicIgnore) || '*__EOL__!shared',
    };
  }

  /**
   * @param {String} filePath
   * @returns {String|null}
   */
  function readIgnoreFileSafe(filePath) {
    try {
      let content = fs.readFileSync(filePath).toString();

      return content.split(os.EOL).filter(l => !!l.trim()).join('__EOL__');
    } catch (e) {
      return null;
    }
  }

  /**
   * @param {Object} property
   * @returns {string}
   */
  function generatePrivateBucketName(property) {
    return `deep.${property.config.env}.private.${property.configObj.baseHash}`;
  }

  /**
   * @param {String} baseHash
   * @returns {Object}
   */
  function createProperty(baseHash) {
    let hashParts = baseHash.split(':');
    let property = Property.create(mainPath);

    property.configObj.baseHash = hashParts[0];
    property.config.env = hashParts[1] || DEFAULT_ENV;

    return property;
  }
};
