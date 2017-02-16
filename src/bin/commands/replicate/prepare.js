/**
 * Created by CCristi on 2/6/17.
 */

'use strict';

module.exports = function(mainPath) {
  require('./_replicate')({
    context: this,
    mainPath: mainPath,
    afterLoad: (replicationInstance, tables, blueHash, greenHash) => {
      return replicationInstance.prepare(tables).then(() => {
        console.log('Replication has been prepared. You can check backfill status by running: ');
        console.log(`deepify replicate status --blue "${blueHash}" --green "${greenHash}" --tables "${tables.join(',')}"`);
      });
    },
  });
};
