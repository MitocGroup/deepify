'use strict';

import {expect} from 'chai';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {Program} from '../../lib/Terminal/Program';
import {Option} from '../../lib/Terminal/Option';
import {Options} from '../../lib/Terminal/Options';
import {Arguments} from '../../lib/Terminal/Arguments';
import {Help} from '../../lib/Terminal/Help';
import {InvalidActionException} from '../../lib/Terminal/Exception/InvalidActionException';
import {ProgramInstanceRequiredException} from '../../lib/Terminal/Exception/ProgramInstanceRequiredException';
import {UnknownOptionException} from '../../lib/Terminal/Exception/UnknownOptionException';
import {ValidationException} from '../../lib/Terminal/Exception/ValidationException';
import DeepLog from 'deep-log';

chai.use(sinonChai);

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
  let subProgramAction = () => {
    return;
  };

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

    let actualResult = program.input(inputArgs);

    expect(actualResult, 'is an instance of Program').to.be.an.instanceOf(Program);
    expect(actualResult.args.listUnmanaged()).to.include('deepify');
    expect(actualResult.args.listUnmanaged()).to.include('arg1');
    expect(actualResult.args.listUnmanaged()).to.include('arg2');
  });

  test('Check defaults() for !hasCommands', () => {
    defaultProgram = new Program(defaultprogramName);
    let actualResult = defaultProgram.defaults();

    expect(actualResult, 'is an instance of Program').to.be.an.instanceOf(Program);
    expect(actualResult.opts.locate('cmd-auto-complete'), 'is an instance of Program').to.be.an.instanceOf(Option);
    expect(actualResult.opts.locate('version'), 'is an instance of Program').to.be.an.instanceOf(Option);
    expect(actualResult.opts.locate('help'), 'is an instance of Program').to.be.an.instanceOf(Option);
    expect(actualResult.args.locate('command')).to.equal(null);
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

  test('Check defaults() for hasCommands', () => {
    let actualResult = program.defaults();

    expect(actualResult, 'is an instance of Program').to.be.an.instanceOf(Program);
    expect(actualResult.opts.locate('cmd-auto-complete'), 'is an instance of Program').to.be.an.instanceOf(Option);
    expect(actualResult.opts.locate('version'), 'is an instance of Program').to.be.an.instanceOf(Option);
    expect(actualResult.opts.locate('help'), 'is an instance of Program').to.be.an.instanceOf(Option);
    expect(actualResult.args.locate('command')).to.not.equal(null);
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
    let updatedVersion = 'updatedVersion';

    program.version = updatedVersion;
    expect(program.version).to.equal(updatedVersion);

    program.version = version;
    expect(program.version).to.equal(version);
  });

  test('Check example getter/setter', () => {
    let example = program.example;
    let updatedExample = 'updatedExample';

    program.example = updatedExample;
    expect(program.example).to.equal(updatedExample);

    program.example = example;
    expect(program.example).to.equal(example);
  });

  test('Check name getter/setter', () => {
    let name = program.name;
    let updatedName = 'updatedName';

    program.name = updatedName;
    expect(program.name).to.equal(updatedName);

    program.name = name;
    expect(program.name).to.equal(name);
  });

  test('Check logDriver static getter', () => {
    let actualResult = Program._logDriver;

    expect(actualResult, 'is an instance of DeepLog').to.be.an.instanceOf(DeepLog);
  });

  test('Check _outputListCommands()', () => {
    let stub = sinon.stub(console, 'log');
    let _subProgramName = 'second testSubProgramName2';
    let _subProgramVersion = 'second testSubProgramVersion2';
    let _subProgramDescription = 'second testSubProgramDescription2';
    let _subProgramExample = 'second testSubProgramExample2';
    let _subProgramAction = () => {
      return;
    };

    program.command(
      _subProgramName, _subProgramAction, _subProgramDescription, _subProgramExample, _subProgramVersion
    );

    let actualResult = program._outputListCommands();

    stub.restore();

    expect(actualResult, 'is an instance of Program').to.be.an.instanceOf(Program);
    expect(stub.callCount).to.be.equal(6);
    expect(stub.args[0].toString()).to.equal('');
    expect(stub.args[1].toString()).to.equal('Available commands:');
    expect(stub.args[2].toString()).to.equal('');
    expect(stub.args[3].toString()).to.contains(`${subProgramName} - ${subProgramDescription}`);
    expect(stub.args[4].toString()).to.contains(`${_subProgramName} - ${_subProgramDescription}`);
    expect(stub.args[5].toString()).to.equal('');
  });

  test('Check inherit()', () => {
    let toInheritProgramName = 'toInherit';
    let toInheritProgramVersion = 'to inherit testSubProgramVersion';
    let toInheritProgramDescription = 'to inherit testSubProgramDescription';
    let toInheritProgramExample = 'to inherit testSubProgramExample2';
    let toInheritProgramAction = () => {
      return;
    };
    let inputArgs = ['server', '--silent', '--toInherit', 'optionValue',];

    let toInheritProgram = new Program(
      toInheritProgramName,
      toInheritProgramVersion,
      toInheritProgramDescription,
      toInheritProgramExample,
      toInheritProgramAction
    );

    toInheritProgram.input(inputArgs);

    //act
    let actualResult = program.inherit(toInheritProgram);

    //assert
    expect(actualResult, 'is an instance of Program').to.be.an.instanceOf(Program);
    expect(actualResult.opts.locate('cmd-auto-complete'), 'is an instance of Program').to.be.an.instanceOf(Option);
    expect(actualResult.opts.locate('version'), 'is an instance of Program').to.be.an.instanceOf(Option);
    expect(actualResult.opts.locate('help'), 'is an instance of Program').to.be.an.instanceOf(Option);
    expect(actualResult.args.listUnmanaged()).to.includes('deepify');
    expect(actualResult.args.listUnmanaged()).to.includes('arg1');
    expect(actualResult.args.listUnmanaged()).to.includes('arg2');
    expect(actualResult.args.listUnmanaged()).to.includes('server');
    expect(actualResult.unmanagedArgs).to.includes('--silent');
    expect(actualResult.unmanagedArgs).to.includes('--toInherit=optionValue');
  });

  test('Check _validateInput() throws UnknownOptionException', () => {
    let error = null;

    try {
      program._validateInput();
    } catch (e) {
      error = e;
    }

    expect(error, 'is an instance of UnknownOptionException').to.be.an.instanceOf(UnknownOptionException);
  });

  test('Check _validateInput() throws ValidationException', () => {
    let error = null;

    program.args.locate('command').required = true;
    program.args.locate('command')._exists = false;

    try {
      program._validateInput();
    } catch (e) {
      error = e;
    }

    expect(error, 'is an instance of ValidationException').to.be.an.instanceOf(ValidationException);

    //undo changes
    program.args.locate('command').required = false;
    program.args.locate('command')._exists = true;
  });

  test('Check _validateInput() throws ValidationException', () => {
    let error = null;

    program.args.locate('command').required = true;
    program.args.locate('command')._exists = false;

    try {
      program._validateInput();
    } catch (e) {
      error = e;
    }

    expect(error, 'is an instance of ValidationException').to.be.an.instanceOf(ValidationException);

    //undo changes
    program.args.locate('command').required = false;
    program.args.locate('command')._exists = true;
  });

  test('Check _validateInput() for _unmanagedArgs.length = 0', () => {
    program._unmanagedArgs = [];

    let actualResult = program._validateInput();

    expect(actualResult, 'is an instance of Program').to.be.an.instanceOf(Program);
  });

  //@todo - need to be clarify with Alex C, because _validateInput throws exceptions
  test('Check run()', () => {
    let error = null;
    let stub = sinon.stub(console, 'log');
    program = new Program('npm');
    program.defaults();
    program._unmanagedArgs = [];

    try {
      program.run(['list']);
    } catch (e) {
      error = e;
    }

    stub.restore();
  });
});
