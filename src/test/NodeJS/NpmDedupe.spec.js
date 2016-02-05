'use strict';

import chai from 'chai';
import {NpmDedupe} from '../../lib/NodeJS/NpmDedupe';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';

suite('NodeJS/NpmDedupe', () => {
  let npmDedupe = null;

  test('Class NpmDedupe exists in NodeJS/NpmDedupe', () => {
    chai.expect(NpmDedupe).to.be.an('function');
  });

  test('Check constructor sets _cmd = null', () => {
    npmDedupe = new NpmDedupe();
    chai.expect(npmDedupe).to.be.an.instanceOf(NpmDedupe);
  });

  test('Check _newInstance() returns new NpmInstall instance with dirs.length = 3', () => {
    let args = ['mocha', '-g', 'logLevel=debug'];

    let actualResult = npmDedupe._newInstance(args);

    chai.expect(actualResult).to.be.an.instanceOf(NpmInstall);
    chai.expect(actualResult.extraArgs).to.eql([]);
    chai.expect(actualResult.dirs).to.eql(args);
  });

  test('Check _mainCmd getter returns valid string', () => {
    chai.expect(npmDedupe._mainCmd).to.includes('npm dedupe');
  });
});
