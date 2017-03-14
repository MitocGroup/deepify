/**
 * Created by CCristi on 3/7/17.
 */

'use strict';

const DEFAULT_ENV = 'dev';
const BLUE_GREEN_MICROSERVICE = 'deep-blue-green';

module.exports = function(mainPath) {
  let URL = require('url');
  let Replication = require('deep-package-manager').Replication_Instance;
  let Property = require('deep-package-manager').Property_Instance;
  let Exec = require('../../lib.compiled/Helpers/Exec').Exec;
  let Bin = require('../../lib.compiled/NodeJS/Bin').Bin;

  let scriptPath = this.scriptPath;
  let blueHash = this.opts.locate('blue').value;
  let greenHash = this.opts.locate('green').value;
  let domain = this.opts.locate('domain').value;
  let greenHostName = normalizeHostname(this.opts.locate('green-hostname').value);
  let bluePercentage = this.opts.locate('blue-percentage').value;
  let greenPercentage = this.opts.locate('green-percentage').value;
  let hasToReplicate = this.opts.locate('replicate-data').exists;

  mainPath = this.normalizeInputPath(mainPath);
  let blueProperty = createProperty(blueHash);
  let greenProperty = createProperty(greenHash);

  Promise.all([
    loadPropertyConfig(blueProperty),
    loadPropertyConfig(greenProperty),
  ]).then(result => {
    let blueConfig = result[0];
    let greenConfig = result[1];
    let percentage = getPercentage();

    // @todo: add a parameter for tables to replicate?
    let tables = blueConfig.modelsSettings.reduce((tables, modelObj) => {
      return tables.concat(Object.keys(modelObj));
    }, []);

    greenHostName = greenHostName || `https://${greenConfig.provisioning.cloudfront.domain}`;

    if (!blueConfig.microservices.hasOwnProperty(BLUE_GREEN_MICROSERVICE)) {
      throw new Error(
        `Missing "${BLUE_GREEN_MICROSERVICE}" microservice. ` +
        `Please make sure you have installed "${BLUE_GREEN_MICROSERVICE}" microservice in your application.`
      );
    }

    let replication = new Replication(blueConfig, greenConfig);

    return (
      hasToReplicate
        ? replicateData(tables)
        : Promise.resolve()
    ).then(() => replication.publish(
      greenHostName,
      guessAppDomain(),
      percentage
    ).then(() => {
      console.info(
        `Blue green traffic management has been enabled. ${blueConfig.provisioning.cloudfront.domain} ` +
        `(${100 - percentage}%) AND ${greenConfig.provisioning.cloudfront.domain} (${percentage}%)`
      );
    }));
  }).catch(e => {
    console.error(e.toString(), e.stack);
  });

  /**
   * @param {String[]} tables
   * @returns {Promise.<Promise>}
   */
  function replicateData(tables) {
    return execReplicateCommand('prepare', tables)
      .then(() => waitForReplicationBackfill(tables))
      .then(() => execReplicateCommand('start', tables));
  }

  /**
   * @todo: implement deepify replicate status
   * @param tables
   * @returns {Promise}
   */
  function waitForReplicationBackfill(tables) {
    console.debug('Waiting for resources backfill');

    return execReplicateCommand('status', tables, ['--raw']).then(rawResult => {
      let backfillStatus = JSON.parse(rawResult);
      let resourceCount = 0;
      let percentSum = 0;

      for (let service in backfillStatus) {
        if (!backfillStatus.hasOwnProperty(service)) {
          continue;
        }

        for (let resource in backfillStatus[service]) {
          if (!backfillStatus[service].hasOwnProperty(resource)) {
            continue;
          }

          resourceCount++;
          percentSum += backfillStatus[service][resource];
        }
      }

      let percent = percentSum / resourceCount;

      if (percent < 1) {
        console.debug(`${percent * 100}% resources have been backfilled`);

        return new Promise((resolve, reject) => setTimeout(() => {
          waitForReplicationBackfill(tables)
            .then(resolve)
            .catch(reject);
        }, 10000));
      } else {
        return Promise.resolve();
      }
    });
  }

  /**
   * @param {String} cmdName
   * @param {String[]} tables
   * @param {String[]} [extraArgs=[]]
   * @returns {Promise}
   */
  function execReplicateCommand(cmdName, tables, extraArgs) {
    let exec = new Exec(
      Bin.node,
      scriptPath,
      'replicate',
      cmdName,
      `--tables="${tables.join(',')}"`,
      `--blue=${blueHash}`,
      `--green=${greenHash}`,
      mainPath
    );

    (extraArgs || []).forEach(exec.addArg.bind(exec));

    console.debug(`Executing "deepify replicate ${cmdName}"`);

    return new Promise((resolve, reject) => {
      exec.run(cmd => {
        if (cmd.failed) {
          reject(new Error(`"deepify replicate "${cmdName}" failed.`));
        }

        resolve(cmd.result);
      }, true);
    });
  }

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
   * @param {Object} property
   * @returns {string}
   */
  function generatePrivateBucketName(property) {
    return `deep.${property.config.env}.private.${property.configObj.baseHash}`;
  }

  /**
   * Dirty algorithm to extract app domain
   * @returns {String}
   */
  function guessAppDomain() {
    if (domain) {
      return domain;
    }

    let host = URL.parse(greenHostName).host;
    let hostParts = host.split('.');

    return hostParts.length >= 3
      ? hostParts.slice(1).join('.')
      : host;
  }

  /**
   * @returns {Number}
   */
  function getPercentage() {
    let bPercentage = normalizePercentageNumber(bluePercentage);
    let gPercentage = normalizePercentageNumber(greenPercentage);

    if (bPercentage && gPercentage) {
      if (bPercentage + gPercentage !== 100) {
        throw new Error(`Invalid percentage sum: ${bPercentage} + ${gPercentage} != 100`);
      }

      return gPercentage;
    } else if (gPercentage) {
      return gPercentage;
    } else if (bPercentage) {
      return 100 - bPercentage;
    }

    throw new Error(`You must specify --blue-percentage, either --green-percentage`);
  }

  /**
   * @param {String} rawNumber
   * @returns {Number|null}
   */
  function normalizePercentageNumber(rawNumber) {
    let number = null;

    if (rawNumber) {
      number = parseInt(rawNumber);

      if (isNaN(number)) {
        throw new Error(`Invalid percentage number: ${rawNumber}`);
      }

      if (number < 0 !== number > 100) {
        throw new Error(`Out of range percentage number: ${rawNumber}`);
      }
    }

    return number;
  }

  /**
   * @param {String} hostname
   * @param {String} [preferredProtocol='https'] preferredProtocol
   * @returns {*}
   */
  function normalizeHostname(hostname, preferredProtocol) {
    preferredProtocol = preferredProtocol || 'https';

    return hostname && !/^\s*https?:\/\//.test(preferredProtocol)
      ? `${preferredProtocol}://${hostname}`
      : hostname;
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
