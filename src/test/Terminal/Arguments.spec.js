'use strict';

import chai from 'chai';
import {Arguments} from '../../lib/Terminal/Arguments';
import {Argument} from '../../lib/Terminal/Argument';
import {ArgumentObjectRequiredException} from '../../lib/Terminal/Exception/ArgumentObjectRequiredException';

suite('Terminal/Arguments', () => {
  let name = 'server';
  let argumentsInstance = null;
  let argument = new Argument(name);

  test('Class Arguments exists in Terminal/Arguments', () => {
    chai.expect(Arguments).to.be.an('function');
  });

  test('Check constructor sets correctly values by default', () => {
    argumentsInstance = new Arguments();

    chai.expect(argumentsInstance, 'is an instance of Argument').to.be.an.instanceOf(Arguments);
    chai.expect(argumentsInstance.list()).to.be.eql([]);
    chai.expect(argumentsInstance.listUnmanaged()).to.be.eql([]);
  });

  test('Check add() throws ArgumentObjectRequiredException', () => {
    let error = null;

    try {
      argumentsInstance.add({});
    } catch(e) {
      error = e;
    }

    chai.expect(
      error, 'is an instance of ArgumentObjectRequiredException'
    ).to.be.an.instanceOf(ArgumentObjectRequiredException);
    chai.expect(argumentsInstance.list()).to.be.eql([]);
  });

  test('Check add()', () => {
    let actualResult = argumentsInstance.add(argument);

    chai.expect(actualResult).to.be.an.instanceOf(Arguments);
    chai.expect(argumentsInstance.list()[0]).to.be.an.instanceOf(Argument);
  });

  test('Check hasUnmanaged() returns false', () => {
    chai.expect(argumentsInstance.hasUnmanaged).to.be.equal(false);
  });
});
