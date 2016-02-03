'use strict';

import chai from 'chai';
import {NpmShrinkwrap} from '../../lib/NodeJS/NpmShrinkwrap';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';

suite('NodeJS/NpmShrinkwrap', () => {
  let npmShrinkwrap = null;

  test('Class NpmShrinkwrap exists in NodeJS/NpmShrinkwrap', () => {
    chai.expect(NpmShrinkwrap).to.be.an('function');
  });

  test('Check constructor sets _cmd = null', () => {
    npmShrinkwrap = new NpmShrinkwrap();
    chai.expect(npmShrinkwrap).to.be.an.instanceOf(NpmShrinkwrap);
  });

  test('Check _newInstance() returns new NpmInstall instance with dirs.length = 3', () => {
    let args = ['mocha', '-g', 'logLevel=debug'];

    let actualResult = npmShrinkwrap._newInstance(args);

    chai.expect(actualResult).to.be.an.instanceOf(NpmInstall);
    chai.expect(actualResult.extraArgs).to.eql([]);
    chai.expect(actualResult.dirs).to.eql(args);
  });

  test('Check _mainCmd getter returns valid string', () => {
    chai.expect(npmShrinkwrap._mainCmd).to.includes('npm shrinkwrap');
  });
});
