'use strict';

import chai from 'chai';
import {NpmRun} from '../../lib/NodeJS/NpmRun';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';

suite('NodeJS/NpmRun', () => {
  let npmRun = null;
  let cmd = 'test';

  test('Class NpmRun exists in NodeJS/NpmRun', () => {
    chai.expect(NpmRun).to.be.an('function');
  });

  test('Check constructor sets _cmd = null', () => {
    npmRun = new NpmRun();
    chai.expect(npmRun).to.be.an.instanceOf(NpmRun);
    chai.expect(npmRun.cmd).to.equal(null);
  });

  test('Check _newInstance() returns new NpmInstall instance with dirs.length = 3', () => {
    let args = ['mocha', '-g', 'logLevel=debug'];

    let actualResult = npmRun._newInstance(args);

    chai.expect(actualResult).to.be.an.instanceOf(NpmInstall);
    chai.expect(actualResult.extraArgs).to.eql([]);
    chai.expect(actualResult.dirs).to.eql(args);
  });

  test('Check cmd setter', () => {
    npmRun.cmd = cmd;

    chai.expect(npmRun.cmd).to.equal(cmd);
  });

  test('Check _mainCmd getter returns valid string', () => {
    chai.expect(npmRun._mainCmd).to.includes(`npm run ${cmd}`);
  });
});
