'use strict';

import chai from 'chai';
import {Bin} from '../../lib/NodeJS/Bin';

suite('NodeJS/Bin', () => {
  test('Class Bin exists in NodeJS/Bin', () => {
    chai.expect(Bin).to.be.an('function');
  });

  test('Check npmModuleInstalled() returns true for global mocha', () => {
    chai.expect(Bin.npmModuleInstalled('mocha', true)).to.equal(true);
  });

  test('Check npmModuleInstalled() returns true for local fs-extra', () => {
    chai.expect(Bin.npmModuleInstalled('fs-extra', false)).to.equal(true);
  });

  test('Check npmMajorVersion returns version above than 1', () => {
    chai.expect(Bin.npmMajorVersion).to.be.above(1);
  });

  test('Check nodeMajorVersion returns version above than -1', () => {
    chai.expect(Bin.nodeMajorVersion).to.be.above(-1);
  });

  test('Check node returns valid string', () => {
    chai.expect(Bin.node).to.contain('node');

    //check when Bin._node already setted
    chai.expect(Bin.node).to.contain('node');
  });

  test('Check npm returns valid string', () => {
    chai.expect(Bin.npm).to.contain('npm');

    //check when Bin._node already setted
    chai.expect(Bin.npm).to.contain('npm');
  });
});
