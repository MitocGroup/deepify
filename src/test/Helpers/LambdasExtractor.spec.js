'use strict';

import chai from 'chai';
import {LambdasExtractor} from '../../lib/Helpers/LambdasExtractor';

suite('Helpers/LambdasExtractor', function() {
  test('Class LambdasExtractor exists in Helpers/LambdasExtractor', function() {
    chai.expect(typeof LambdasExtractor).to.equal('function');
  });
});
