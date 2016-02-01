'use strict';

import chai from 'chai';
import {NpmUninstallLibs} from '../../lib/NodeJS/NpmUninstallLibs';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';

suite('NodeJS/NpmUninstallLibs', function() {
  let libs = 'mocha isparta';
  let libsArray = ['codacy-coverage', 'istanbul'];
  let npmUninstallLibs = null;

  test('Class NpmUninstallLibs exists in NodeJS/NpmUninstallLibs', function() {
    chai.expect(typeof NpmUninstallLibs).to.equal('function');
  });

  test('Check constructor sets _libsPlain = null', function() {
    npmUninstallLibs = new NpmUninstallLibs();
    chai.expect(npmUninstallLibs).to.be.an.instanceOf(NpmUninstallLibs);
    chai.expect(npmUninstallLibs.libsPlain).to.equal(null);
  });

  test('Check _libsPlain setter', function() {
    npmUninstallLibs.libs = libsArray;
    chai.expect(npmUninstallLibs.libsPlain).to.equal(libsArray.join(' '));

    npmUninstallLibs.libs = libs;
    chai.expect(npmUninstallLibs.libsPlain).to.equal(libs);
  });

  test('Check _newInstance() returns new NpmInstall instance with dirs.length = 3', function() {
    let args = ['mocha', '-g', 'logLevel=debug'];

    let actualResult = npmUninstallLibs._newInstance(args);

    chai.expect(actualResult).to.be.an.instanceOf(NpmInstall);
    chai.expect(actualResult.libsPlain).to.equal(libs);
  });

  test('Check _mainCmd getter returns valid string', function() {
    chai.expect(npmUninstallLibs._mainCmd).to.includes(`npm uninstall ${libs}`);
  });
});
