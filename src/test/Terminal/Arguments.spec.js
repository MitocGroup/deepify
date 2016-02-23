'use strict';

import {expect} from 'chai';
import {Arguments} from '../../lib/Terminal/Arguments';
import {Argument} from '../../lib/Terminal/Argument';
import {ArgumentObjectRequiredException} from '../../lib/Terminal/Exception/ArgumentObjectRequiredException';
import {ArgumentsObjectRequiredException} from '../../lib/Terminal/Exception/ArgumentsObjectRequiredException';
import {MissingArgumentException} from '../../lib/Terminal/Exception/MissingArgumentException';

suite('Terminal/Arguments', () => {
  let name = 'server';
  let argumentsInstance = null;
  let argument = new Argument(name);

  test('Class Arguments exists in Terminal/Arguments', () => {
    expect(Arguments).to.be.an('function');
  });

  test('Check constructor sets correctly values by default', () => {
    argumentsInstance = new Arguments();

    expect(argumentsInstance, 'is an instance of Argument').to.be.an.instanceOf(Arguments);
    expect(argumentsInstance.list()).to.be.eql([]);
    expect(argumentsInstance.listUnmanaged()).to.be.eql([]);
  });

  test('Check add() throws ArgumentObjectRequiredException', () => {
    let error = null;

    try {
      argumentsInstance.add({});
    } catch (e) {
      error = e;
    }

    expect(
      error, 'is an instance of ArgumentObjectRequiredException'
    ).to.be.an.instanceOf(ArgumentObjectRequiredException);
    expect(argumentsInstance.list()).to.be.eql([]);
  });

  test('Check add()', () => {
    let actualResult = argumentsInstance.add(argument);

    expect(actualResult).to.be.an.instanceOf(Arguments);
    expect(argumentsInstance.list()[0]).to.be.an.instanceOf(Argument);
    expect(argumentsInstance.list()[0].name).to.be.equal(name);
  });

  test('Check locate() returns argument by name', () => {
    let actualResult = argumentsInstance.locate(name);

    expect(actualResult).to.be.an.instanceOf(Argument);
    expect(actualResult).to.be.equal(argument);
  });

  test('Check locate() returns null', () => {
    let actualResult = argumentsInstance.locate('non-existing name');

    expect(actualResult).to.be.equal(null);
  });

  test('Check listValues() for !includeUnmanaged', () => {
    argument.collect(['logLevel=debug']);

    let actualResult = argumentsInstance.listValues(false);

    expect(actualResult[0]).to.be.equal(argument.value);
  });

  test('Check hasUnmanaged() returns false', () => {
    expect(argumentsInstance.hasUnmanaged).to.be.equal(false);
  });

  test('Check remove()', () => {
    argumentsInstance.remove(name);

    expect(argumentsInstance.list()).to.be.eql([]);
  });

  test('Check create()', () => {
    name = 'deploy';
    let actualResult = argumentsInstance.create(name);

    expect(actualResult).to.be.an.instanceOf(Arguments);
    expect(argumentsInstance.list()[0]).to.be.an.instanceOf(Argument);
    expect(argumentsInstance.list()[0].name).to.be.equal(name);
  });

  test('Check merge()', () => {
    let toMergeName = 'install';
    let sibling = new Arguments(toMergeName);
    sibling.create(toMergeName);

    let actualResult = argumentsInstance.merge(sibling);

    expect(actualResult).to.be.an.instanceOf(Arguments);
    expect(argumentsInstance.list()[0]).to.be.an.instanceOf(Argument);
    expect(argumentsInstance.list()[0].name).to.be.equal(name);
    expect(argumentsInstance.list()[1]).to.be.an.instanceOf(Argument);
    expect(argumentsInstance.list()[1].name).to.be.eql(toMergeName);
  });

  test('Check merge() throws ArgumentObjectRequiredException', () => {
    let error = null;
    let expectedResult = argumentsInstance.list();

    try {
      argumentsInstance.merge({});
    } catch (e) {
      error = e;
    }

    expect(
      error, 'is an instance of ArgumentsObjectRequiredException'
    ).to.be.an.instanceOf(ArgumentsObjectRequiredException);
    expect(argumentsInstance.list()).to.be.eql(expectedResult);
  });

  test('Check populate()', () => {
    let argumentItem = 'logLevel=warn';
    let args = [argumentItem];

    let actualResult = argumentsInstance.populate(args);

    expect(actualResult).to.be.an.instanceOf(Arguments);

    expect(argumentsInstance.list()[0].value).to.be.equal(argumentItem);
    expect(argumentsInstance.list()[0].exists).to.be.equal(true);

  });

  //@todo - clarify with Alex C if Argument[] or String[]
  test('Check populateUnmanaged()', () => {
    let args = ['logLevel=info', 'testArg=value'];

    let actualResult = argumentsInstance.populateUnmanaged(args);

    expect(actualResult).to.be.an.instanceOf(Arguments);
    expect(actualResult.listUnmanaged()).to.be.eql(args);
  });

  test('Check hasUnmanaged() returns true', () => {
    expect(argumentsInstance.hasUnmanaged).to.be.equal(true);
  });

  test('Check validate()', () => {
    let actualResult = argumentsInstance.validate();

    expect(
      actualResult, 'is an instance of Arguments'
    ).to.be.an.instanceOf(Arguments);
  });

  test('Check validate() throws MissingArgumentException', () => {
    let error = null;

    argumentsInstance.list()[0].required = true;
    argumentsInstance.list()[0]._exists = false;

    try {
      argumentsInstance.validate();
    } catch (e) {
      error = e;
    }

    expect(
      error, 'is an instance of MissingArgumentException'
    ).to.be.an.instanceOf(MissingArgumentException);
  });

  test('Check listvalidate() for includeUnmanaged', () => {
    let expectedResult = ['logLevel=info', 'testArg=value'];

    let actualResult = argumentsInstance.listValues(true);

    expect(actualResult).to.eql(expectedResult);
  });
});
