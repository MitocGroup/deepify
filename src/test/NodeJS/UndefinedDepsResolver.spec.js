'use strict';

import chai from 'chai';
import {UndefinedDepsResolver} from '../../lib/NodeJS/UndefinedDepsResolver';

suite('NodeJS/UndefinedDepsResolver', function() {
  test('Class UndefinedDepsResolver exists in NodeJS/UndefinedDepsResolver', function() {
    chai.expect(typeof UndefinedDepsResolver).to.equal('function');
  });
});
