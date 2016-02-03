'use strict';

import chai from 'chai';
import {DepsTreeOptimizer} from '../../lib/NodeJS/DepsTreeOptimizer';

suite('NodeJS/DepsTreeOptimizer', () => {
  test('Class DepsTreeOptimizer exists in NodeJS/DepsTreeOptimizer', () => {
    chai.expect(DepsTreeOptimizer).to.be.an('function');
  });
});
