'use strict';

import chai from 'chai';
import {NpmInstallLibs} from '../../lib/NodeJS/NpmInstallLibs';

suite('NodeJS/NpmInstallLibs', function() {
  test('Class NpmInstallLibs exists in NodeJS/NpmInstallLibs', function() {
    chai.expect(typeof NpmInstallLibs).to.equal('function');
  });
});
