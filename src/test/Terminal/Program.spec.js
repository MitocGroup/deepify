'use strict';

import chai from 'chai';
import {Program} from '../../lib/Terminal/Program';
import {Options} from '../../lib/Terminal/Options';
import {Arguments} from '../../lib/Terminal/Arguments';

suite('Terminal/Program', () => {
  let programName = 'testProgramName';
  let programVersion = 'testProgramVersion';
  let programDescription = 'testProgramDescription';
  let programExample = 'testProgramExample';
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
    chai.expect(program.inputParsed).to.be.equal(false);
    chai.expect(program.unmanagedArgs).to.be.eql([]);
    chai.expect(program.action).to.be.an('function');
    chai.expect(program.opts).to.be.an.instanceOf(Options);
    chai.expect(program.args).to.be.an.instanceOf(Arguments);
    chai.expect(program.nodeBinary).to.equal(Program.NODE_BINARY);
    chai.expect(program.scriptPath).to.equal(null);
  });

  test('Check constructor sets name', () => {
    program = new Program(programName, programVersion, programDescription, programExample);

    chai.expect(program, 'is an instance of Program').to.be.an.instanceOf(Program);
    chai.expect(program.name).to.be.equal(programName);
    chai.expect(program.version).to.be.equal(programVersion);
    chai.expect(program.description).to.be.equal(programDescription);
    chai.expect(program.example).to.be.equal(programExample);
    chai.expect(program.commands).to.be.eql([]);
    chai.expect(program.inputParsed).to.be.equal(false);
    chai.expect(program.unmanagedArgs).to.be.eql([]);
    chai.expect(program.action).to.be.an('function');
    chai.expect(program.opts).to.be.an.instanceOf(Options);
    chai.expect(program.args).to.be.an.instanceOf(Arguments);
    chai.expect(program.nodeBinary).to.equal(Program.NODE_BINARY);
    chai.expect(program.scriptPath).to.equal(null);
  });
});
