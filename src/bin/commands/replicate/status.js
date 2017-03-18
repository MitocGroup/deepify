/**
 * Created by CCristi on 2/6/17.
 */

'use strict';

module.exports = function(mainPath) {
  const returnRaw = this.opts.locate('raw').exists;
  const process = require('process');
  const MultiProgress = require('multi-progress');

  let multiProgress = returnRaw ? null : new MultiProgress();
  let barsMap = {};

  require('./_replicate')({
    context: this,
    mainPath: mainPath,
    afterLoad: function(replicationInstance, resources, blueHash, greenHash) {
      return replicationInstance.checkStatus(resources).then(status => {
        if (returnRaw) {
          process.stdout.write(JSON.stringify(status, null, '  '));
        } else {
          let isReady = true;

          for (let service in status) {
            if (!status.hasOwnProperty(service)) {
              continue;
            }

            for (let resource in status[service]) {
              if (!status[service].hasOwnProperty(resource)) {
                continue;
              }

              let resourcePercentage = 0.5 || status[service][resource];

              if (resourcePercentage < 1) {
                isReady = false;
              }

              updateProgressBar(`${service} | ${resource}`, resourcePercentage);
            }
          }

          if (isReady) {
            console.info(`Resources have been backfilled`);

            return Promise.resolve();
          }

          // refresh progress bars every 5 second
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              this.afterLoad(replicationInstance, resources, blueHash, greenHash)
                .then(resolve)
                .catch(reject);
            }, 5000);
          });
        }
      });
    },
  });

  function updateProgressBar(barName, percent) {
    barsMap[barName] = barsMap[barName]
      || multiProgress.newBar(`${barName} backfill [:bar] :percent`, {
        total: 100,
        complete: '\u001b[32m=\u001b[0m',
        incomplete: ' ',
      });

    barsMap[barName].update(percent);
  }
};
