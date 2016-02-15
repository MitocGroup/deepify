'use strict';

import {expect} from 'chai';
import {Program} from '../../lib/Terminal/Program';
import {Options} from '../../lib/Terminal/Options';
import {Arguments} from '../../lib/Terminal/Arguments';
import {Help} from '../../lib/Terminal/Help';
import {InvalidActionException} from '../../lib/Terminal/Exception/InvalidActionException';
import {ProgramInstanceRequiredException} from '../../lib/Terminal/Exception/ProgramInstanceRequiredException';

suite('Terminal/Program', () => {
  let programName = 'testProgramName';
  let programVersion = 'testProgramVersion';
  let programDescription = 'testProgramDescription';
  let programExample = 'testProgramExample';
  let program = null;

  let defaultprogramName = 'testProgramName';
  let defaultProgram = null;

  let subProgramName = 'testSubProgramName';
  let subProgramVersion = 'testSubProgramVersion';
  let subProgramDescription = 'testSubProgramDescription';
  let subProgramExample = 'testSubProgramExample';
  let subProgramAction = () => { return; };

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

  test('Check action setter throws InvalidActionException', () => {
    let error = null;

    try {
      program.action = 'not a function';
    } catch (e) {
      error = e;
    }

    expect(error, 'is an instance of InvalidActionException').to.be.an.instanceOf(InvalidActionException);

  });

  test('Check addCommand() throws ProgramInstanceRequiredException', () => {
    let error = null;

    try {
      program.addCommand({});
    } catch (e) {
      error = e;
    }

    expect(
      error, 'is an instance of ProgramInstanceRequiredException'
    ).to.be.an.instanceOf(ProgramInstanceRequiredException);
  });

  test('Check input() for !args', () => {
    let _program = new Program();

    let actualResult = _program.input();

    expect(actualResult, 'is an instance of Program').to.be.an.instanceOf(Program);
    expect(actualResult.nodeBinary).to.be.equal('node');
    expect(actualResult.scriptPath).to.be.contains('_mocha');
  });

  test('Check input() for args', () => {
    let inputArgs = ['deepify', '--resource=somevelue', 'arg1', '--',
      '-coptval3', '-b', 'optval', '--dirty', '--', 'arg2',];
    console.log('before: ', program);

    let actualResult = program.input(inputArgs);

    console.log('after: ', program);
    expect(actualResult, 'is an instance of Program').to.be.an.instanceOf(Program);
  });

  test('Check defaults()', () => {
    console.log('before default: ', defaultProgram);
    defaultProgram = new Program(defaultprogramName);

    let actualResult = defaultProgram.defaults();

    expect(actualResult, 'is an instance of Program').to.be.an.instanceOf(Program);
  });

  test('Check hasCommands getter returns false', () => {
   let actualResult = program.hasCommands;

    expect(actualResult).to.equal(false);
  });

  test('Check command() adds subprogram to program._commands array', () => {
    let actualResult = program.command(
      subProgramName, subProgramAction, subProgramDescription, subProgramExample, subProgramVersion
    );

    expect(actualResult, 'is an instance of Program').to.be.an.instanceOf(Program);
    expect(actualResult.name).to.be.equal(subProgramName);
    expect(actualResult.action).to.be.equal(subProgramAction);
    expect(actualResult.description).to.be.equal(subProgramDescription);
    expect(actualResult.example).to.be.equal(subProgramExample);
    expect(actualResult.version).to.be.equal(subProgramVersion);
  });

  test('Check hasCommands getter returns true', () => {
    let actualResult = program.hasCommands;

    expect(actualResult).to.equal(true);
  });

  test('Check getCommand() returns valid command', () => {
    let actualResult = program.getCommand(subProgramName);

    expect(actualResult, 'is an instance of Program').to.be.an.instanceOf(Program);
    expect(actualResult.name).to.be.equal(subProgramName);
    expect(actualResult.action).to.be.equal(subProgramAction);
    expect(actualResult.description).to.be.equal(subProgramDescription);
    expect(actualResult.example).to.be.equal(subProgramExample);
    expect(actualResult.version).to.be.equal(subProgramVersion);
  });

  test('Check getCommand() returns null for non-existed command name', () => {
    let actualResult = program.getCommand('non-existed command name');

    expect(actualResult).to.equal(null);
  });

  test('Check help returns instance of Help', () => {
    let actualResult = program.help;

    expect(actualResult, 'is an instance of Help').to.be.an.instanceOf(Help);
  });

  test('Check description getter/setter', () => {
    let description = program.description;
    let updateDescription = 'updatedDescription';

    program.description = updateDescription;
    expect(program.description).to.equal(updateDescription);

    program.description = description;
    expect(program.description).to.equal(description);
  });

  test('Check version getter/setter', () => {
    let version = program.version;
    let updateVersion = 'updatedVersion';

    program.version = updateVersion;
    expect(program.version).to.equal(updateVersion);

    program.version = version;
    expect(program.version).to.equal(version);
  });

  test('Check example getter/setter', () => {
    let example = program.example;
    let updateExample = 'updatedExample';

    program.example = updateExample;
    expect(program.example).to.equal(updateExample);

    program.example = example;
    expect(program.example).to.equal(example);
  });
});
