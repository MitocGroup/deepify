/**
 * Created by CCristi on 3/7/17.
 */

'use strict';

const DEFAULT_ENV = 'dev';
const BLUE_GREEN_MICROSERVICE = 'deep-blue-green';

module.exports = function(mainPath) {
  let path = require('path');
  let fs = require('fs');
  let Replication = require('deep-package-manager').Replication_Instance;
  let Property = require('deep-package-manager').Property_Instance;
  let Exec = require('../../lib.compiled/Helpers/Exec').Exec;
  let Bin = require('../../lib.compiled/NodeJS/Bin').Bin;
  let publishCommand = this;

  let scriptPath = this.scriptPath;
  let blueHash = this.opts.locate('blue').value;
  let greenHash = this.opts.locate('green').value;
  let trafficRatio = this.opts.locate('ratio').value;
  let hasToReplicate = this.opts.locate('data-replicate').exists;
  let skipRoute53 = this.opts.locate('skip-route53').exists;

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

    if (!blueConfig.microservices.hasOwnProperty(BLUE_GREEN_MICROSERVICE)) {
      throw new Error(
        `Missing "${BLUE_GREEN_MICROSERVICE}" microservice. ` +
        `Please make sure you have installed "${BLUE_GREEN_MICROSERVICE}" microservice BEFORE deploying any application.`
      );
    }

    let replication = new Replication(blueConfig, greenConfig);

    return (hasToReplicate ? replicateData(tables) : Promise.resolve())
      .then(() => {
        if (hasConfig(replication.hashCode)) {
          let config = getConfig(replication.hashCode);

          return replication.update(percentage, skipRoute53, config);
        }

        return replication.publish(percentage, skipRoute53);
      })
      .then(dumpConfig.bind(this))
      .then(() => {
      console.info(
        `Blue green traffic management has been enabled. ${blueConfig.provisioning.cloudfront.domain} ` +
        `(${100 - percentage}%) AND ${greenConfig.provisioning.cloudfront.domain} (${percentage}%)`
      );
    });
  }).catch(e => {
    console.error(e.stack);
    publishCommand.exit(1);
  });

  /**
   * @param {String} hashCode
   * @returns {String}
   */
  function buildConfigFileName(hashCode) {
    return `.${hashCode}.blue-green.json`;
  }

  /**
   * @param {String} hashCode
   * @returns {Boolean}
   */
  function hasConfig(hashCode) {
    return !!getConfig(hashCode);
  }

  /**
   * @param {String} hashCode
   * @returns {Object}
   */
  function getConfig(hashCode) {
    let fileName = buildConfigFileName(hashCode);
    let filePath = path.join(mainPath, fileName);

    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath));
      } catch (e) {
        console.error(`Broken blue green config "${filePath}": ${e.toString()}`);

        publishCommand.exit(1);
      }
    }

    return null;
  }

  /**
   * @param {Object} config
   */
  function dumpConfig(config) {
    let fileName = buildConfigFileName(config.hash);

    fs.writeFileSync(fileName, JSON.stringify(config, null, '  '));
  }

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

  /**
   * @param {Object} property
   * @returns {Promise}
   */
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
   * @param {Object} property
   * @returns {string}
   */
  function generatePrivateBucketName(property) {
    return `deep.${property.config.env}.private.${property.configObj.baseHash}`;
  }

  /**
   * @returns {Number}
   */
  function getPercentage() {
    let rationMatches = trafficRatio.match(/^\s*(\d+)[:\/\|](\d+)\s*$/);

    if (!rationMatches) {
      throw new Error(`Invalid --ration ${trafficRatio} option. Expected --ration [blue-number]:[green-number] format`);
    }

    let blueRation = parseInt(rationMatches[1]);
    let greenRation = parseInt(rationMatches[2]);

    let sum = blueRation + greenRation;

    if (sum === 0) {
      throw new Error('Blue ration plus Green ration must be greater than 0');
    }

    return greenRation / sum * 100;
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
