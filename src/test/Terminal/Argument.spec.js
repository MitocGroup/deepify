'use strict';

import chai from 'chai';
import {Argument} from '../../lib/Terminal/Argument';

suite('Terminal/Argument', () => {
  let name = 'server';
  let argument = null;

  test('Class Argument exists in Terminal/Argument', () => {
    chai.expect(Argument).to.be.an('function');
  });

  test('Check constructor sets correctly values by default', () => {
    argument = new Argument(name);

    chai.expect(argument, 'is an instance of Argument').to.be.an.instanceOf(Argument);
    chai.expect(argument.name).to.be.equal(name);
    chai.expect(argument.description).to.be.equal(null);
    chai.expect(argument.required).to.be.equal(false);
    chai.expect(argument.hidden).to.be.equal(false);
    chai.expect(argument.exists).to.be.equal(false);
    chai.expect(argument.value).to.be.equal(undefined);
  });

  test('Check _matchNonOption() returns false', () => {
    let actualResult = Argument._matchNonOption('-testArgument');

    chai.expect(actualResult).to.be.equal(false);
  });

  test('Check _matchNonOption() returns true', () => {
    let actualResult = Argument._matchNonOption('testArgument');

    chai.expect(actualResult).to.be.equal(true);
  });

  test('Check collect()', () => {
    let actualResult = argument.collect(['argumentHere']);

    chai.expect(actualResult).to.be.an.instanceOf(Argument);
    chai.expect(actualResult.value).to.be.equal('argumentHere');
  });

  test('Check hidden setter/getter', () => {
    let hidden = argument.hidden;

    argument.hidden = true;
    chai.expect(argument.hidden).to.be.equal(true);

    argument.hidden = false;
    chai.expect(argument.hidden).to.be.equal(false);

    argument.hidden = hidden;
    chai.expect(argument.hidden).to.be.equal(hidden);
  });

  test('Check required setter/getter', () => {
    let required = argument.required;

    argument.required = true;
    chai.expect(argument.required).to.be.equal(true);

    argument.required = false;
    chai.expect(argument.required).to.be.equal(false);

    argument.required = required;
    chai.expect(argument.required).to.be.equal(required);
  });
});
