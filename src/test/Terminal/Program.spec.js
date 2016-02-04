'use strict';

import chai from 'chai';
import {Program} from '../../lib/Terminal/Program';

suite('Terminal/Program', () => {
  let program = null;

  test('Class Program exists in Terminal/Program', () => {
    chai.expect(Program).to.be.an('function');
  });

  test('Check constructor sets correctly values by default', () => {
    program = new Program();

    chai.expect(program, 'is an instance of Program').to.be.an.instanceOf(Program);
    chai.expect(program.name).to.be.equal(null);
    chai.expect(program.version).to.be.equal(null);
    chai.expect(program.description).to.be.equal(null);
    chai.expect(program.example).to.be.equal(null);
    chai.expect(program.commands).to.be.eql([]);
    chai.expect(program.commands).to.be.eql([]);
  });
});
