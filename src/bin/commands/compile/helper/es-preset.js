/**
 * Created by AlexanderC on 6/19/15.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const PACKAGE_FILE = 'package.json';
const DEEP_LIB_REGEXP = /deep-[a-z]+$/i;

module.exports = function() {
  try {
    const packageFile = path.join(process.cwd(), PACKAGE_FILE);
    
    if (DEEP_LIB_REGEXP.test(process.cwd()) 
      && fs.existsSync(packageFile) 
      && DEEP_LIB_REGEXP.test(require(packageFile).name)) {
        
      return 'babel-preset-es2015-node4';
    }
  } catch (error) {
    console.error(error);
  }
  
  return 'babel-preset-node6';
};
