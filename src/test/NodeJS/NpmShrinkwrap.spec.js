'use strict';

import chai from 'chai';
import {NpmShrinkwrap} from '../../lib/NodeJS/NpmShrinkwrap';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';

suite('NodeJS/NpmShrinkwrap', function() {
  let npmShrinkwrap = null;

  test('Class NpmShrinkwrap exists in NodeJS/NpmShrinkwrap', function() {
    chai.expect(typeof NpmShrinkwrap).to.equal('function');
  });

  test('Check constructor sets _cmd = null', function() {
    npmShrinkwrap = new NpmShrinkwrap();
    chai.expect(npmShrinkwrap).to.be.an.instanceOf(NpmShrinkwrap);
  });

  test('Check _newInstance() returns new NpmInstall instance with dirs.length = 3', function() {
    let args = ['mocha', '-g', 'logLevel=debug'];

    let actualResult = npmShrinkwrap._newInstance(args);

    chai.expect(actualResult).to.be.an.instanceOf(NpmInstall);
    chai.expect(actualResult.extraArgs).to.eql([]);
    chai.expect(actualResult.dirs).to.eql(args);
  });

  test('Check _mainCmd getter returns valid string', function() {
    chai.expect(npmShrinkwrap._mainCmd).to.includes('npm shrinkwrap');
  });
});
