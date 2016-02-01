'use strict';

import chai from 'chai';
import {PackageVersionResolver} from '../../lib/NodeJS/PackageVersionResolver';

suite('NodeJS/PackageVersionResolver', function() {
  test('Class PackageVersionResolver exists in NodeJS/PackageVersionResolver', function() {
    chai.expect(typeof PackageVersionResolver).to.equal('function');
  });
});
