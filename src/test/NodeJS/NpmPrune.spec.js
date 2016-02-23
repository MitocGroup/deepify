'use strict';

import {expect} from 'chai';
import {NpmPrune} from '../../lib/NodeJS/NpmPrune';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';

suite('NodeJS/NpmPrune', () => {
  let npmPrune = null;

  test('Class NpmPrune exists in NodeJS/NpmPrune', () => {
    expect(NpmPrune).to.be.an('function');
  });

  test('Check constructor sets _cmd = null', () => {
    npmPrune = new NpmPrune();
    expect(npmPrune).to.be.an.instanceOf(NpmPrune);
  });

  test('Check _newInstance() returns new NpmInstall instance with dirs.length = 3', () => {
    let args = ['mocha', '-g', 'logLevel=debug'];

    let actualResult = npmPrune._newInstance(args);

    expect(actualResult).to.be.an.instanceOf(NpmInstall);
    expect(actualResult.extraArgs).to.eql([]);
    expect(actualResult.dirs).to.eql(args);
  });

  test('Check _mainCmd getter returns valid string', () => {
    expect(npmPrune._mainCmd).to.includes('npm prune');
  });
});
