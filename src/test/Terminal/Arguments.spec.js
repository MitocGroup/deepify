'use strict';

import chai from 'chai';
import {Arguments} from '../../lib/Terminal/Arguments';

suite('Terminal/Arguments', () => {
  let argumentsInstance = null;

  test('Class Arguments exists in Terminal/Arguments', () => {
    chai.expect(Arguments).to.be.an('function');
  });

  test('Check constructor sets correctly values by default', () => {
    argumentsInstance = new Arguments();

    chai.expect(argumentsInstance, 'is an instance of Argument').to.be.an.instanceOf(Arguments);
    chai.expect(argumentsInstance.list()).to.be.eql([]);
    chai.expect(argumentsInstance.listUnmanaged()).to.be.eql([]);
  });
});
