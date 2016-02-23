'use strict';

import {expect} from 'chai';
import {NpmUpdate} from '../../lib/NodeJS/NpmUpdate';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';

suite('NodeJS/NpmUpdate', () => {
  let npmUpdate = null;

  test('Class NpmUpdate exists in NodeJS/NpmUpdate', () => {
    expect(NpmUpdate).to.be.an('function');
  });

  test('Check constructor sets _cmd = null', () => {
    npmUpdate = new NpmUpdate();
    expect(npmUpdate).to.be.an.instanceOf(NpmUpdate);
  });

  test('Check _newInstance() returns new NpmInstall instance with dirs.length = 3', () => {
    let args = ['mocha', '-g', 'logLevel=debug'];

    let actualResult = npmUpdate._newInstance(args);

    expect(actualResult).to.be.an.instanceOf(NpmInstall);
    expect(actualResult.extraArgs).to.eql([]);
    expect(actualResult.dirs).to.eql(args);
  });

  test('Check _mainCmd getter returns valid string', () => {
    expect(npmUpdate._mainCmd).to.includes('npm update');
  });
});
