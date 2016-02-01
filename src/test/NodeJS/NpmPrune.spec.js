'use strict';

import chai from 'chai';
import {NpmPrune} from '../../lib/NodeJS/NpmPrune';

suite('NodeJS/NpmPrune', function() {
  test('Class NpmPrune exists in NodeJS/NpmPrune', function() {
    chai.expect(typeof NpmPrune).to.equal('function');
  });
});
