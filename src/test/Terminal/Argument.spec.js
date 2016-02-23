'use strict';

import {expect} from 'chai';
import {Argument} from '../../lib/Terminal/Argument';

suite('Terminal/Argument', () => {
  let name = 'server';
  let argument = null;

  test('Class Argument exists in Terminal/Argument', () => {
    expect(Argument).to.be.an('function');
  });

  test('Check constructor sets correctly values by default', () => {
    argument = new Argument(name);

    expect(argument, 'is an instance of Argument').to.be.an.instanceOf(Argument);
    expect(argument.name).to.be.equal(name);
    expect(argument.description).to.be.equal(null);
    expect(argument.required).to.be.equal(false);
    expect(argument.hidden).to.be.equal(false);
    expect(argument.exists).to.be.equal(false);
    expect(argument.value).to.be.equal(undefined);
  });

  test('Check _matchNonOption() returns false', () => {
    let actualResult = Argument._matchNonOption('-testArgument');

    expect(actualResult).to.be.equal(false);
  });

  test('Check _matchNonOption() returns true', () => {
    let actualResult = Argument._matchNonOption('testArgument');

    expect(actualResult).to.be.equal(true);
  });

  test('Check collect()', () => {
    let actualResult = argument.collect(['argumentHere']);

    expect(actualResult).to.be.an.instanceOf(Argument);
    expect(actualResult.value).to.be.equal('argumentHere');
  });

  test('Check hidden setter/getter', () => {
    let hidden = argument.hidden;

    argument.hidden = true;
    expect(argument.hidden).to.be.equal(true);

    argument.hidden = false;
    expect(argument.hidden).to.be.equal(false);

    argument.hidden = hidden;
    expect(argument.hidden).to.be.equal(hidden);
  });

  test('Check required setter/getter', () => {
    let required = argument.required;

    argument.required = true;
    expect(argument.required).to.be.equal(true);

    argument.required = false;
    expect(argument.required).to.be.equal(false);

    argument.required = required;
    expect(argument.required).to.be.equal(required);
  });
});
