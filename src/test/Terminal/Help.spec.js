'use strict';

import {expect} from 'chai';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {Help} from '../../lib/Terminal/Help';
import {Program} from '../../lib/Terminal/Program';
import {Argument} from '../../lib/Terminal/Argument';
import {Option} from '../../lib/Terminal/Option';
import {ProgramInstanceRequiredException} from '../../lib/Terminal/Exception/ProgramInstanceRequiredException';

chai.use(sinonChai);

suite('Terminal/Help', () => {
  let programName = 'testProgramName';
  let programVersion = 'testProgramVersion';
  let programDescription = 'testProgramDescription';
  let programExample = 'testProgramExample';
  let program = null;
  let help = null;

  test('Class Help exists in Terminal/Help', () => {
    expect(Help).to.be.an('function');
  });

  test('Check constructor sets correctly values by default', () => {
    program = new Program(programName, programVersion, programDescription, programExample);
    help = new Help(program);

    expect(help, 'is an instance of Help').to.be.an.instanceOf(Help);
    expect(help.program, 'is an instance of Program').to.be.an.instanceOf(Program);
    expect(help.program).to.be.eql(program);
  });

  test('Check constructor throws ProgramInstanceRequiredException', () => {
    let error = null;

    try {
      help = new Help({});
    } catch (e) {
      error = e;
    }

    expect(error, 'is an instance of Help').to.be.an.instanceOf(ProgramInstanceRequiredException);
  });

  test('Check _stringify() returns "unknown"', () => {
    let actualResult = Help._stringify();

    expect(actualResult).to.equal('unknown');

    actualResult = Help._stringify(null);

    expect(actualResult).to.equal('unknown');
  });

  test('Check _stringify() returns "true"', () => {
    let actualResult = Help._stringify(true);

    expect(actualResult).to.equal('true');
  });

  test('Check _stringify() returns "false"', () => {
    let actualResult = Help._stringify(false);

    expect(actualResult).to.equal('false');
  });

  test('Check _stringify() returns "one,two"', () => {
    let actualResult = Help._stringify(['one', 'two']);

    expect(actualResult).to.equal('one,two');
  });

  test('Check _printHead', () => {
    let stub = sinon.stub(console, 'log');
    let actualResult = help._printHead();
    let expectedResult = `${Help._stringify(help.program.name)}@${Help._stringify(help.program.version)} -,` +
      `${Help._stringify(help.program.description)}`;

    stub.restore();

    expect(actualResult, 'is an instance of Help').to.be.an.instanceOf(Help);
    expect(stub.callCount).to.be.equal(3);
    expect(stub.args[1].toString()).to.equal(expectedResult);
  });

  test('Check _printExample', () => {
    let stub = sinon.stub(console, 'log');
    let expectedResult = `Usage example: ${help.program.example}`;

    let actualResult = help._printExample();

    stub.restore();

    expect(actualResult, 'is an instance of Help').to.be.an.instanceOf(Help);
    expect(stub.callCount).to.be.equal(2);
    expect(stub.args[0].toString()).to.equal(expectedResult);
  });

  test('Check _scoreSimilarWord returns 0', () => {

    let actualResult = Help._scoreSimilarWord('testString', 'testWord');

    expect(actualResult).to.be.equal(0);
  });

  test('Check _findSuitableCommand for !cmdVector', () => {
    let cmdVector = ['pretest', 'test', 'posttest'];
    let search = null;

    let actualResult = Help._findSuitableCommand(search, cmdVector);

    expect(actualResult).to.be.eql(cmdVector);
  });

  test('Check _findSuitableCommand', () => {
    let cmdVector = ['pretest', 'test', 'posttest'];
    let search = 'test';

    let actualResult = Help._findSuitableCommand(search, cmdVector);

    expect(actualResult).to.be.eql([search]);
  });

  //@todo - stub all methods
  test('Check print', () => {
    //let printHeadStub = sinon.stub(help, '_printHead');

    //let printExampleStub = sinon.stub(help, '_printExample');
    //let printArgsStub = sinon.stub(help, '_printArgs');
    //let printOptsStub = sinon.stub(help, '_printOpts');
    //let printCommandsStub = sinon.stub(help, '_printCommands');

    let actualResult = help.print();

    //printHeadStub.restore();
    //printExampleStub.restore();
    //printArgsStub.restore();
    //printOptsStub.restore();
    //printCommandsStub.restore();

    expect(actualResult, 'is an instance of Help').to.be.an.instanceOf(Help);
  });

  test('Check _printArgs for args.length===0', () => {
    let stub = sinon.stub(console, 'log');
    let actualResult = help._printArgs();

    stub.restore();

    expect(actualResult, 'is an instance of Help').to.be.an.instanceOf(Help);
    expect(stub.callCount).to.be.equal(1);
    expect(stub.args[0].toString()).to.contains('Arguments');
    expect(stub.args[0].toString()).to.contains('None');
  });

  test('Check _printArgs', () => {
    let firstArgument = 'newArg1';
    let secondArgument = 'newArg2';
    let hiddenArgumentName = 'hiddenArg';
    let hiddenArgument = new Argument(hiddenArgumentName);

    hiddenArgument.hidden = true;

    help._program._args.add(new Argument(firstArgument));
    help._program._args.add(new Argument(secondArgument));
    help._program._args.add(hiddenArgument);

    let stub = sinon.stub(console, 'log');

    let actualResult = help._printArgs();

    stub.restore();

    expect(actualResult, 'is an instance of Help').to.be.an.instanceOf(Help);
    expect(stub.args[0].toString()).to.contains('Arguments:');
    expect(stub.args[0].toString()).to.not.contains('None');
    expect(stub.args[1].toString()).to.contains(firstArgument);
    expect(stub.args[2].toString()).to.contains(secondArgument);
    expect(stub.args[3].toString()).to.not.contains(hiddenArgumentName);
    expect(stub.callCount).to.be.equal(help.program._args.list().length + 1);
  });

  test('Check _printOpts for opts.length===0', () => {
    let stub = sinon.stub(console, 'log');
    let actualResult = help._printOpts();

    stub.restore();

    expect(actualResult, 'is an instance of Help').to.be.an.instanceOf(Help);
    expect(stub.callCount).to.be.equal(1);
    expect(stub.args[0].toString()).to.contains('Options');
    expect(stub.args[0].toString()).to.contains('None');
  });

  test('Check _printOpts', () => {
    let firstOption = 'newOption1';
    let secondOption = 'newOption2';
    let hiddenOptionName = 'hiddenOption';
    let hiddenOption = new Option(hiddenOptionName);

    hiddenOption.hidden = true;

    help._program._opts.add(new Option(firstOption));
    help._program._opts.add(new Option(secondOption));
    help._program._opts.add(hiddenOption);

    let stub = sinon.stub(console, 'log');

    let actualResult = help._printOpts();

    stub.restore();

    expect(actualResult, 'is an instance of Help').to.be.an.instanceOf(Help);
    expect(stub.args[0].toString()).to.contains('Options:');
    expect(stub.args[0].toString()).to.not.contains('None');
    expect(stub.args[1].toString()).to.contains(firstOption);
    expect(stub.args[2].toString()).to.contains(secondOption);
    expect(stub.args[3].toString()).to.not.contains(hiddenOptionName);
    expect(stub.callCount).to.be.equal(help.program._args.list().length + 1);
  });

  test('Check _printCommands with default sortByKeys', () => {
    let firstProgram = 'newProgram1';
    let secondProgram = 'newProgram2';
    let thirdProgram = 'abcProgram2';

    help._program.addCommand(new Program(firstProgram));
    help._program.addCommand(new Program(secondProgram));
    help._program.addCommand(new Program(thirdProgram));

    let stub = sinon.stub(console, 'log');

    let actualResult = help._printCommands();

    stub.restore();

    expect(actualResult, 'is an instance of Help').to.be.an.instanceOf(Help);
    expect(stub.args[0].toString()).to.contains('Available commands:');
    expect(stub.args[1].toString()).to.contains(firstProgram);
    expect(stub.args[2].toString()).to.contains(secondProgram);
    expect(stub.args[3].toString()).to.contains(thirdProgram);
    expect(stub.callCount).to.be.equal(help.program._args.list().length + 2);
  });

  test('Check _printCommands with sortByKeys', () => {
    let firstProgram = 'newProgram1';
    let secondProgram = 'newProgram2';
    let thirdProgram = 'abcProgram2';

    let stub = sinon.stub(console, 'log');

    let actualResult = help._printCommands(true);

    stub.restore();

    expect(actualResult, 'is an instance of Help').to.be.an.instanceOf(Help);
    expect(stub.args[0].toString()).to.contains('Available commands:');
    expect(stub.args[1].toString()).to.contains(thirdProgram);
    expect(stub.args[2].toString()).to.contains(firstProgram);
    expect(stub.args[3].toString()).to.contains(secondProgram);
    expect(stub.callCount).to.be.equal(help.program._args.list().length + 2);
  });

  test('Check printAutoCompletion with sortByKeys', () => {
    let matchCommand = 'Program';

    let stub = sinon.stub(console, 'log');

    let actualResult = help.printAutoCompletion(matchCommand, true);

    stub.restore();

    expect(actualResult, 'is an instance of Help').to.be.an.instanceOf(Help);
    expect(stub.args[0].toString()).to.eql('abcProgram2\nnewProgram1\nnewProgram2');
    expect(stub.callCount).to.be.equal(1);
  });

  test('Check _scoreSimilarWord for !word returns 0', () => {
    let string = 'string test';
    let word = null;

    let actualResult = Help._scoreSimilarWord(string, word)

    expect(actualResult).to.be.equal(0);
  });

  test('Check _scoreSimilarWord for word returns valid score more than 0', () => {
    let matchedString = 'word score';
    let shortString = 'string word score';
    let longString = 'string string for testing word score';
    let word = 'word';

    let actualResult = Help._scoreSimilarWord(matchedString, word, 3);
    expect(actualResult).to.be.equal(1);

    actualResult= Help._scoreSimilarWord(shortString, word, 3);
    expect(actualResult).to.be.above(0);

    let actualResultForLongString = Help._scoreSimilarWord(longString, word, 2);
    expect(actualResultForLongString).to.be.above(0);

    expect(actualResult).to.be.above(actualResultForLongString);
  });

  test('Check _scoreSimilarWord for word returns valid score less than 0', () => {
    let string = 'string test for w';
    let word = 'word';

    let actualResult = Help._scoreSimilarWord(string, word, 2);
    expect(actualResult).to.be.below(0);
  });


});
