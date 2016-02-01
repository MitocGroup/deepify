'use strict';

import chai from 'chai';
import {NpmDedupe} from '../../lib/NodeJS/NpmDedupe';

suite('NodeJS/NpmDedupe', function() {
  test('Class NpmDedupe exists in NodeJS/NpmDedupe', function() {
    chai.expect(typeof NpmDedupe).to.equal('function');
  });
});
