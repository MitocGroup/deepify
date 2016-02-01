'use strict';

import chai from 'chai';
import {DepsTreeOptimizer} from '../../lib/NodeJS/DepsTreeOptimizer';

suite('NodeJS/DepsTreeOptimizer', function() {
  test('Class DepsTreeOptimizer exists in NodeJS/DepsTreeOptimizer', function() {
    chai.expect(typeof DepsTreeOptimizer).to.equal('function');
  });
});
