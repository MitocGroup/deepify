'use strict';

import {expect} from 'chai';
import {NpmDedupe} from '../../lib/NodeJS/NpmDedupe';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';

suite('NodeJS/NpmDedupe', () => {
  let npmDedupe = null;

  test('Class NpmDedupe exists in NodeJS/NpmDedupe', () => {
    expect(NpmDedupe).to.be.an('function');
  });

  test('Check constructor sets _cmd = null', () => {
    npmDedupe = new NpmDedupe();
    expect(npmDedupe).to.be.an.instanceOf(NpmDedupe);
  });

  test('Check _newInstance() returns new NpmInstall instance with dirs.length = 3', () => {
    let args = ['mocha', '-g', 'logLevel=debug'];

    let actualResult = npmDedupe._newInstance(args);

    expect(actualResult).to.be.an.instanceOf(NpmInstall);
    expect(actualResult.extraArgs).to.eql([]);
    expect(actualResult.dirs).to.eql(args);
  });

  test('Check _mainCmd getter returns valid string', () => {
    expect(npmDedupe._mainCmd).to.includes('npm dedupe');
  });
});
