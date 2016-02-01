'use strict';

import chai from 'chai';
import {NpmRun} from '../../lib/NodeJS/NpmRun';

suite('NodeJS/NpmRun', function() {
  test('Class NpmRun exists in NodeJS/NpmRun', function() {
    chai.expect(typeof NpmRun).to.equal('function');
  });
});
