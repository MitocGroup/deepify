'use strict';

import {expect} from 'chai';
import {Option} from '../../lib/Terminal/Option';

suite('Terminal/Option', () => {
  let option = null;
  let name = 'server'

  test('Class Option exists in Terminal/Option', () => {
    expect(Option).to.be.an('function');
  });

  test('Check constructor sets correctly values by default', () => {
    option = new Option(name);

    expect(option, 'is an instance of Option').to.be.an.instanceOf(Option);
    expect(option.name).to.be.equal(name);
    expect(option.description).to.be.equal(null);
    expect(option.alias).to.be.equal(null);
    expect(option.required).to.be.equal(false);
    expect(option.hidden).to.be.equal(false);
  });

  test('Check required getter/setter', () => {
    let required = option.required;

    option.required = true;
    expect(option.required).to.be.equal(true);

    option.required = false;
    expect(option.required).to.be.equal(false);

    option.required = required;
    expect(option.required).to.be.equal(required);
  });

  test('Check value getter/setter', () => {
    let value = option.value;

    option._value = true;
    expect(option.value).to.be.equal(true);

    option._value = false;
    expect(option.value).to.be.equal(false);

    option._value = value;
    expect(option.value).to.be.equal(value);
  });

  test('Check exists getter/setter', () => {
    let exists = option.exists;

    option._exists = true;
    expect(option.exists).to.be.equal(true);

    option._exists = false;
    expect(option.exists).to.be.equal(false);

    option._exists = exists;
    expect(option.exists).to.be.equal(exists);
  });

  test('Check _cleanupValue', () => {
    let value = '"test cleanup"';

    let actualResult = Option._cleanupValue(value);

    expect(actualResult).to.be.equal('test cleanup');
  });

  test('Check _parse for option with "="', () => {
    let inputOption = '--logLevel=info';
    let expectedResult = {
      name: 'logLevel',
      value: 'info',
    };

    let actualResult = option._parse(inputOption);

    expect(actualResult).to.be.eql(expectedResult);
  });

  test('Check _parse for option w/o "="', () => {
    let inputOption = '--help';
    let expectedResult = {
      name: 'help',
      value: null,
    };

    let actualResult = option._parse(inputOption);

    expect(actualResult).to.be.eql(expectedResult);
  });

  test('Check _parse returns null', () => {
    let inputOption = 'invalidOption';

    let actualResult = option._parse(inputOption);

    expect(actualResult).to.be.equal(null);
  });

  test('Check collect', () => {
    let inputOption = ['--force', '-s', '--logLevel=debug',];

    option = new Option('logLevel');

    let actualResult = option.collect(inputOption);

    expect(actualResult, 'is an instance of Option').to.be.an.instanceOf(Option);
    expect(actualResult.exists).to.be.equal(true);
    expect(actualResult.value).to.be.equal('debug');
  });
});
