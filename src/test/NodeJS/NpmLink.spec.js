'use strict';

import chai from 'chai';
import {NpmLink} from '../../lib/NodeJS/NpmLink';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';

suite('NodeJS/NpmLink', () => {
  let libs = 'mocha istanbul';
  let libsArray = ['codacy-coverage', 'istanbul'];
  let npmLink = null;

  test('Class NpmLink exists in NodeJS/NpmLink', () => {
    chai.expect(NpmLink).to.be.an('function');
  });

  test('Check constructor sets _libsPlain = null', () => {
    npmLink = new NpmLink();
    chai.expect(npmLink).to.be.an.instanceOf(NpmLink);
    chai.expect(npmLink.libsPlain).to.equal(null);
  });

  test('Check _libsPlain setter', () => {
    npmLink.libs = libsArray;
    chai.expect(npmLink.libsPlain).to.equal(libsArray.join(' '));

    npmLink.libs = libs;
    chai.expect(npmLink.libsPlain).to.equal(libs);
  });

  test('Check _newInstance() returns new NpmInstall instance with dirs.length = 3', () => {
    let args = ['mocha', '-g', 'logLevel=debug'];

    let actualResult = npmLink._newInstance(args);

    chai.expect(actualResult).to.be.an.instanceOf(NpmInstall);
    chai.expect(actualResult.libsPlain).to.equal(libs);
  });

  test('Check _mainCmd getter returns valid string', () => {
    chai.expect(npmLink._mainCmd).to.includes(`npm link ${libs}`);
  });
});
