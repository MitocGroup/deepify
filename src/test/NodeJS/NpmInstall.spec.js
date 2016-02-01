'use strict';

import chai from 'chai';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';

suite('NodeJS/NpmInstall', function() {
  let npmInstall = new NpmInstall();

  test('Class NpmInstall exists in NodeJS/NpmInstall', function() {
    chai.expect(typeof NpmInstall).to.equal('function');
  });

  test('Check DEFAULT_SILENT_STATE getter returns false', function() {
    chai.expect(NpmInstall.DEFAULT_SILENT_STATE).to.equal(false);
  });

  test('Check DEFAULT_CHUNK_SIZE getter returns value above than 0', function() {
    chai.expect(NpmInstall.DEFAULT_CHUNK_SIZE).to.above(0);
  });

  test('Check _mainCmd getter returns valid string', function() {
    chai.expect(npmInstall._mainCmd).to.includes('npm install');
  });

  test('Check constructor sets valid value for _dirs', function() {
    chai.expect(npmInstall).to.be.an.instanceOf(NpmInstall);
    chai.expect(npmInstall.dirs).to.be.eql([]);
  });

  test('Check constructor sets valid value for _extraArgs', function() {
    chai.expect(Array.isArray(npmInstall.extraArgs)).to.be.equal(true);
    chai.expect(npmInstall.extraArgs).to.eql([]);
  });

  test('Check _execArgs getter', function() {
    chai.expect(Array.isArray(npmInstall._execArgs)).to.be.equal(true);
    chai.expect(npmInstall._execArgs[0]).to.includes('npm install');
  });

  test('Check addExtraArg()', function() {
    let length = npmInstall.extraArgs.length;
    let newArg = 'logLevel=debug';

    let actualResult = npmInstall.addExtraArg(newArg);

    chai.expect(actualResult).to.be.an.instanceOf(NpmInstall);
    chai.expect(actualResult.extraArgs.length).to.equal(++length);
    chai.expect(actualResult.extraArgs.pop()).to.equal(newArg);
  });

  test('Check _chunkArray() returns valid array', function() {
    let toChunkArray = ['one', 'two', 'three', 'four'];
    let expectedResult = [['one', 'two', 'three'], ['four']];
    let size = 3;

    let actualResult = NpmInstall._chunkArray(toChunkArray, size);

    chai.expect(actualResult).to.be.an.instanceOf(Array);
    chai.expect(actualResult).to.eql(expectedResult);
  });

  test('Check _newInstance() returns new NpmInstall instance with dirs.length = 3', function() {
    let args = ['mocha', '-g', 'logLevel=debug'];

    let actualResult = npmInstall._newInstance(args);

    chai.expect(actualResult).to.be.an.instanceOf(NpmInstall);
    chai.expect(actualResult.extraArgs).to.eql([]);
    chai.expect(actualResult.dirs).to.eql(args);
  });

  test('Check _newInstance() returns new NpmInstall instance with dirs.length = 3', function() {
    let args = ['mocha'];

    let actualResult = npmInstall._newInstance(args);

    chai.expect(actualResult).to.be.an.instanceOf(NpmInstall);
    chai.expect(actualResult.extraArgs).to.eql([]);
    chai.expect(actualResult.dirs).to.eql(args);
  });

});