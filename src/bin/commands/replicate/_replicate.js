/**
 * Created by CCristi on 2/6/17.
 */

'use strict';

const DEFAULT_ENV = 'dev';
const BLUE_GREEN_MICROSERVICE = 'deep-blue-green';

module.exports = function(commandParams) {
  let Replication = require('deep-package-manager').Replication_Instance;
  let Property = require('deep-package-manager').Property_Instance;
  let tablesRaw = commandParams.context.opts.locate('tables').value;
  let blueHash = commandParams.context.opts.locate('blue').value;
  let greenHash = commandParams.context.opts.locate('green').value;

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

    let replication = new Replication(blueConfig, greenConfig, blueHash, greenHash);

    return commandParams.afterLoad(replication, getTables(), blueHash, greenHash);
  }).catch(e => {
    console.error(e.toString(), e.stack);
  });

  function loadPropertyConfig(property) {
    return new Promise((resolve, reject) => {
      property.configObj.tryLoadConfig(error => {
        if (error) {
          return reject(error);
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
   * @param {Object} property
   * @returns {string}
   */
  function generatePrivateBucketName(property) {
    return `deep.${property.config.env}.private.${property.configObj.baseHash}`;
  }

  /**
   * @param {String} baseHash
   * @param {String|undefined} env
   * @returns {Object}
   */
  function createProperty(baseHash, env) {
    let property = Property.create(mainPath);

    property.configObj.baseHash = baseHash;
    property.config.env = env || DEFAULT_ENV;

    return property;
  }
};
