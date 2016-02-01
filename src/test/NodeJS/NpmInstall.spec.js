'use strict';

import chai from 'chai';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';

suite('NodeJS/NpmInstall', function() {
  let npmInstall = new NpmInstall();

  test('Class NpmInstall exists in NodeJS/NpmInstall', function() {
    chai.expect(typeof NpmInstall).to.equal('function');
  });

  test('Check DEFAULT_SILENT_STATE getter returns false', function() {
    chai.expect(NpmInstall.DEFAULT_SILENT_STATE).to.equal(false);
  });

  test('Check DEFAULT_CHUNK_SIZE getter returns value above than 0', function() {
    chai.expect(NpmInstall.DEFAULT_CHUNK_SIZE).to.above(0);
  });

  test('Check _mainCmd getter returns valid string', function() {
    chai.expect(npmInstall._mainCmd).to.includes('npm install');
  });

  test('Check constructor sets valid value for _dirs', function () {
    chai.expect(npmInstall).to.be.an.instanceOf(NpmInstall);
    chai.expect(npmInstall.dirs).to.be.eql([]);
  });

  test('Check constructor sets valid value for _execArgs', function () {
    chai.expect(Array.isArray(npmInstall._execArgs)).to.be.equal(true);
  });

});
