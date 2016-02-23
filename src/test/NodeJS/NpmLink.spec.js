'use strict';

import {expect} from 'chai';
import {NpmLink} from '../../lib/NodeJS/NpmLink';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';

suite('NodeJS/NpmLink', () => {
  let libs = 'mocha isparta';
  let libsArray = ['codacy-coverage', 'istanbul'];
  let npmLink = null;

  test('Class NpmLink exists in NodeJS/NpmLink', () => {
    expect(NpmLink).to.be.an('function');
  });

  test('Check constructor sets _libsPlain = null', () => {
    npmLink = new NpmLink();
    expect(npmLink).to.be.an.instanceOf(NpmLink);
    expect(npmLink.libsPlain).to.equal(null);
  });

  test('Check _libsPlain setter', () => {
    npmLink.libs = libsArray;
    expect(npmLink.libsPlain).to.equal(libsArray.join(' '));

    npmLink.libs = libs;
    expect(npmLink.libsPlain).to.equal(libs);
  });

  test('Check _newInstance() returns new NpmInstall instance with dirs.length = 3', () => {
    let args = ['mocha', '-g', 'logLevel=debug'];

    let actualResult = npmLink._newInstance(args);

    expect(actualResult).to.be.an.instanceOf(NpmInstall);
    expect(actualResult.libsPlain).to.equal(libs);
  });

  test('Check _mainCmd getter returns valid string', () => {
    expect(npmLink._mainCmd).to.includes(`npm link ${libs}`);
  });
});
