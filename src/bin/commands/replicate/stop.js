/**
 * Created by CCristi on 2/6/17.
 */

'use strict';

module.exports = function(mainPath) {
  require('./_replicate')({
    context: this,
    mainPath: mainPath,
    afterLoad: (replicationInstance, tables, blueHash, greenHash) => {
      return replicationInstance.stop(tables).then(() => {
        console.log(`Data Replication between "${blueHash}" and "${greenHash}" has been stopped.`);
      });
    },
  });
};
