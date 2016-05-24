'use strict';

import chai from 'chai';
import {NpmUninstallLibs} from '../../lib/NodeJS/NpmUninstallLibs';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';

suite('NodeJS/NpmUninstallLibs', () => {
  let libs = 'mocha istanbul';
  let libsArray = ['codacy-coverage', 'istanbul'];
  let npmUninstallLibs = null;

  test('Class NpmUninstallLibs exists in NodeJS/NpmUninstallLibs', () => {
    chai.expect(NpmUninstallLibs).to.be.an('function');
  });

  test('Check constructor sets _libsPlain = null', () => {
    npmUninstallLibs = new NpmUninstallLibs();
    chai.expect(npmUninstallLibs).to.be.an.instanceOf(NpmUninstallLibs);
    chai.expect(npmUninstallLibs.libsPlain).to.equal(null);
  });

  test('Check _libsPlain setter', () => {
    npmUninstallLibs.libs = libsArray;
    chai.expect(npmUninstallLibs.libsPlain).to.equal(libsArray.join(' '));

    npmUninstallLibs.libs = libs;
    chai.expect(npmUninstallLibs.libsPlain).to.equal(libs);
  });

  test('Check _newInstance() returns new NpmInstall instance with dirs.length = 3', () => {
    let args = ['mocha', '-g', 'logLevel=debug'];

    let actualResult = npmUninstallLibs._newInstance(args);

    chai.expect(actualResult).to.be.an.instanceOf(NpmInstall);
    chai.expect(actualResult.libsPlain).to.equal(libs);
  });

  test('Check _mainCmd getter returns valid string', () => {
    chai.expect(npmUninstallLibs._mainCmd).to.includes(`npm uninstall ${libs}`);
  });
});
