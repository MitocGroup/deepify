'use strict';

import {expect} from 'chai';
import {Options} from '../../lib/Terminal/Options';
import {Option} from '../../lib/Terminal/Option';
import {OptionsObjectRequiredException} from '../../lib/Terminal/Exception/OptionsObjectRequiredException';
import {OptionObjectRequiredException} from '../../lib/Terminal/Exception/OptionObjectRequiredException';
import {MissingOptionException} from '../../lib/Terminal/Exception/MissingOptionException';

suite('Terminal/Options', () => {
  let options = null;
  let name = 'logLevel';

  test('Class Options exists in Terminal/Options', () => {
    expect(Options).to.be.an('function');
  });

  test('Check constructor sets correctly values by default', () => {
    options = new Options();

    expect(options, 'is an instance of Options').to.be.an.instanceOf(Options);
    expect(options.list()).to.be.eql([]);
  });

  test('Check merge throws OptionsObjectRequiredException', () => {
    let error = null;

    try {
      options.merge({});
    } catch (e) {
      error = e;
    }

    expect(error, 'is an instance of OptionsObjectRequiredException').to.be.an.instanceOf(OptionsObjectRequiredException);
  });

  test('Check add() throws OptionObjectRequiredException', () => {
    let error = null;

    try {
      options.add({});
    } catch (e) {
      error = e;
    }

    expect(error, 'is an instance of OptionObjectRequiredException').to.be.an.instanceOf(OptionObjectRequiredException);
  });

  test('Check add() adds option', () => {
    let option = new Option(name, 'log', 'level of logging');

    let actualResult = options.add(option);

    expect(actualResult, 'is an instance of Options').to.be.an.instanceOf(Options);
    expect(actualResult.list().length).to.be.equal(1);
    expect(actualResult.locate(name)).to.be.eql(option);
  });

  test('Check locate() returns null for non-existed option', () => {

    let actualResult = options.locate('non-existed option');

    expect(actualResult).to.be.equal(null);
  });

  test('Check merge() merge options', () => {
    let _options = new Options();
    let _name = 'help';

    _options.create(_name, 'h');

    let actualResult = options.merge(_options);

    expect(actualResult, 'is an instance of Options').to.be.an.instanceOf(Options);
    expect(actualResult.list().length).to.be.equal(2);
    expect(actualResult.locate(name)).to.be.an.instanceOf(Option);
    expect(actualResult.locate(_name)).to.be.an.instanceOf(Option);
  });

  test('Check remove() deletes option by name', () => {
    let toRemoveOptionName = 'help';
    let actualResult = options.remove(toRemoveOptionName);

    expect(actualResult, 'is an instance of Options').to.be.an.instanceOf(Options);
    expect(actualResult.list().length).to.be.equal(1);
    expect(actualResult.locate(name)).to.be.an.instanceOf(Option);
    expect(actualResult.locate(toRemoveOptionName)).to.equal(null);
  });

  test('Check validate()', () => {
    let actualResult = options.validate();

    expect(actualResult, 'is an instance of Options').to.be.an.instanceOf(Options);
  });

  test('Check validate() throws MissingOptionException', () => {
    let error = null;
    let _option = options.locate(name);

    _option.required = true;

    try {
      options.validate();
    } catch (e) {
      error = e;
    }

    expect(error, 'is an instance of MissingOptionException').to.be.an.instanceOf(MissingOptionException);
  });

  test('Check populate()', () => {
    let inputArgs = ['--force', '-s', '--logLevel=debug',];

    let actualResult = options.populate(inputArgs);

    expect(actualResult, 'is an instance of Options').to.be.an.instanceOf(Options);
    expect(actualResult.validate(), 'is an instance of Options').to.be.an.instanceOf(Options);
  });

  test('Check normalizeInputOpts()', () => {
    let inputArgs = ['deepify', '--resource=somevalue', 'arg1', '--',
      '-coptval3', '-b', 'optval', '--dirty', '--', 'arg2',];
    let expectedResult = ['deepify', '--resource=somevalue', 'arg1',
      '--', '-c=optval3', '-b=optval', '--dirty', 'arg2',];

    Options.normalizeInputOpts(inputArgs);

    expect(inputArgs).to.be.eql(expectedResult);
  });
});
