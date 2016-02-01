'use strict';

import chai from 'chai';
import {NpmLink} from '../../lib/NodeJS/NpmLink';

suite('NodeJS/NpmLink', function() {
  test('Class NpmLink exists in NodeJS/NpmLink', function() {
    chai.expect(typeof NpmLink).to.equal('function');
  });
});
