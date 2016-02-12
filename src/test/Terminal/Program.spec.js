'use strict';

import {expect} from 'chai';
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
    expect(Program).to.be.an('function');
  });

  test('Check constructor sets correctly values by default', () => {
    program = new Program();

    expect(program, 'is an instance of Program').to.be.an.instanceOf(Program);
    expect(program.name).to.be.equal(null);
    expect(program.version).to.be.equal(null);
    expect(program.description).to.be.equal(null);
    expect(program.example).to.be.equal(null);
    expect(program.commands).to.be.eql([]);
    expect(program.inputParsed).to.be.equal(false);
    expect(program.unmanagedArgs).to.be.eql([]);
    expect(program.action).to.be.an('function');
    expect(program.opts).to.be.an.instanceOf(Options);
    expect(program.args).to.be.an.instanceOf(Arguments);
    expect(program.nodeBinary).to.equal(Program.NODE_BINARY);
    expect(program.scriptPath).to.equal(null);
  });

  test('Check constructor sets name', () => {
    program = new Program(programName, programVersion, programDescription, programExample);

    expect(program, 'is an instance of Program').to.be.an.instanceOf(Program);
    expect(program.name).to.be.equal(programName);
    expect(program.version).to.be.equal(programVersion);
    expect(program.description).to.be.equal(programDescription);
    expect(program.example).to.be.equal(programExample);
    expect(program.commands).to.be.eql([]);
    expect(program.inputParsed).to.be.equal(false);
    expect(program.unmanagedArgs).to.be.eql([]);
    expect(program.action).to.be.an('function');
    expect(program.opts).to.be.an.instanceOf(Options);
    expect(program.args).to.be.an.instanceOf(Arguments);
    expect(program.nodeBinary).to.equal(Program.NODE_BINARY);
    expect(program.scriptPath).to.equal(null);
  });
});
