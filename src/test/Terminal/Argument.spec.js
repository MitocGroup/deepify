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
  });
});
