'use strict';

import chai from 'chai';
import {NpmPrune} from '../../lib/NodeJS/NpmPrune';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';

suite('NodeJS/NpmPrune', () => {
  let npmPrune = null;

  test('Class NpmPrune exists in NodeJS/NpmPrune', () => {
    chai.expect(NpmPrune).to.be.an('function');
  });

  test('Check constructor sets _cmd = null', () => {
    npmPrune = new NpmPrune();
    chai.expect(npmPrune).to.be.an.instanceOf(NpmPrune);
  });

  test('Check _newInstance() returns new NpmInstall instance with dirs.length = 3', () => {
    let args = ['mocha', '-g', 'logLevel=debug'];

    let actualResult = npmPrune._newInstance(args);

    chai.expect(actualResult).to.be.an.instanceOf(NpmInstall);
    chai.expect(actualResult.extraArgs).to.eql([]);
    chai.expect(actualResult.dirs).to.eql(args);
  });

  test('Check _mainCmd getter returns valid string', () => {
    chai.expect(npmPrune._mainCmd).to.includes('npm prune');
  });
});
