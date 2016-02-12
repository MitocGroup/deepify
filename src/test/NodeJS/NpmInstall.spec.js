'use strict';

import {expect} from 'chai';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';

suite('NodeJS/NpmInstall', () => {
  let npmInstall = new NpmInstall();

  test('Class NpmInstall exists in NodeJS/NpmInstall', () => {
    expect(NpmInstall).to.be.an('function');
  });

  test('Check DEFAULT_SILENT_STATE getter returns false', () => {
    expect(NpmInstall.DEFAULT_SILENT_STATE).to.equal(false);
  });

  test('Check DEFAULT_CHUNK_SIZE getter returns value above than 0', () => {
    expect(NpmInstall.DEFAULT_CHUNK_SIZE).to.above(0);
  });

  test('Check _mainCmd getter returns valid string', () => {
    expect(npmInstall._mainCmd).to.includes('npm install');
  });

  test('Check constructor sets valid value for _dirs', () => {
    expect(npmInstall).to.be.an.instanceOf(NpmInstall);
    expect(npmInstall.dirs).to.be.eql([]);
  });

  test('Check constructor sets valid value for _extraArgs', () => {
    expect(Array.isArray(npmInstall.extraArgs)).to.be.equal(true);
    expect(npmInstall.extraArgs).to.eql([]);
  });

  test('Check _execArgs getter', () => {
    expect(Array.isArray(npmInstall._execArgs)).to.be.equal(true);
    expect(npmInstall._execArgs[0]).to.includes('npm install');
  });

  test('Check addExtraArg()', () => {
    let length = npmInstall.extraArgs.length;
    let newArg = 'logLevel=debug';

    let actualResult = npmInstall.addExtraArg(newArg);

    expect(actualResult).to.be.an.instanceOf(NpmInstall);
    expect(actualResult.extraArgs.length).to.equal(++length);
    expect(actualResult.extraArgs.pop()).to.equal(newArg);
  });

  test('Check _chunkArray() returns valid array', () => {
    let toChunkArray = ['one', 'two', 'three', 'four'];
    let expectedResult = [['one', 'two', 'three'], ['four']];
    let size = 3;

    let actualResult = NpmInstall._chunkArray(toChunkArray, size);

    expect(actualResult).to.be.an.instanceOf(Array);
    expect(actualResult).to.eql(expectedResult);
  });

  test('Check _newInstance() returns new NpmInstall instance with dirs.length = 3', () => {
    let args = ['mocha', '-g', 'logLevel=debug'];

    let actualResult = npmInstall._newInstance(args);

    expect(actualResult).to.be.an.instanceOf(NpmInstall);
    expect(actualResult.extraArgs).to.eql([]);
    expect(actualResult.dirs).to.eql(args);
  });

  test('Check _newInstance() returns new NpmInstall instance with dirs.length = 3', () => {
    let args = ['mocha'];

    let actualResult = npmInstall._newInstance(args);

    expect(actualResult).to.be.an.instanceOf(NpmInstall);
    expect(actualResult.extraArgs).to.eql([]);
    expect(actualResult.dirs).to.eql(args);
  });

});
