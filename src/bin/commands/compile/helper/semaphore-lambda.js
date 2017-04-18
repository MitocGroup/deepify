'use strict';

class SemaphoreLambda {
  constructor() {
    this._execVector = {};
  }
  
  /**
   * @param {Promise|*} promiseCb
   * @param {*} id
   *
   * @returns {Promise|*}
   */
  wrap(promiseCb, id) {
    return this._greenLight(id)
      .then(() => {
        this._execVector[id] = true;
        
        return promiseCb();
      })
      .then(result => {
        delete this._execVector[id];
        
        return Promise.resolve(result);
      });
  }
  
  /**
   * @param {*} id
   *
   * @returns {Promise|*}
   */
  _greenLight(id) {
    if (!this._execVector.hasOwnProperty(id)) {
      return Promise.resolve();
    }
    
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (!this._execVector.hasOwnProperty(id)) {
          console.debug(`[SEMAPHOR] Process #${id} have finished`);
          
          clearInterval(interval);
          process.nextTick(() => resolve());
        }
        
        console.debug(`[SEMAPHOR] Waiting for process #${id} to finish`);
      }, SemaphoreLambda.INTERVAL);
    });
  }
  
  /**
   * @returns {Number}
   */
  static get INTERVAL() {
    return 200;
  }
}

module.exports = SemaphoreLambda;
