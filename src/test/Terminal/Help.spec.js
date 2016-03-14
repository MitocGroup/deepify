'use strict';

import chai from 'chai';
import {Help} from '../../lib/Terminal/Help';
import {Program} from '../../lib/Terminal/Program';
import {ProgramInstanceRequiredException} from '../../lib/Terminal/Exception/ProgramInstanceRequiredException';

suite('Terminal/Help', () => {
  let programName = 'testprogramname';
  let programVersion = 'testProgramVersion';
  let programDescription = 'testProgramDescription';
  let programExample = 'testProgramExample';
  let program = null;
  let help = null;

  test('Class Help exists in Terminal/Help', () => {
    chai.expect(Help).to.be.an('function');
  });

  test('Check constructor sets correctly values by default', () => {
    program = new Program(programName, programVersion, programDescription, programExample);
    help = new Help(program)

    chai.expect(help, 'is an instance of Help').to.be.an.instanceOf(Help);
    chai.expect(help.program, 'is an instance of Program').to.be.an.instanceOf(Program);
    chai.expect(help.program).to.be.eql(program);
  });

  test('Check constructor throws ProgramInstanceRequiredException', () => {
    let error = null;

    try {
      help = new Help({});
    } catch (e) {
      error = e;
    }

    chai.expect(error, 'is an instance of Help').to.be.an.instanceOf(ProgramInstanceRequiredException);
  });

  test('Check _stringify() returns "unknown"', () => {
    let actualResult = Help._stringify();

    chai.expect(actualResult).to.equal('unknown');

    actualResult = Help._stringify(null);

    chai.expect(actualResult).to.equal('unknown');
  });

  test('Check _stringify() returns "true"', () => {
    let actualResult = Help._stringify(true);

    chai.expect(actualResult).to.equal('true');
  });

  test('Check _stringify() returns "false"', () => {
    let actualResult = Help._stringify(false);

    chai.expect(actualResult).to.equal('false');
  });

  test('Check _stringify() returns "one,two"', () => {
    let actualResult = Help._stringify(['one', 'two']);

    chai.expect(actualResult).to.equal('one,two');
  });

  //@todo - need to deeply investigate how to check console.log
  test('Check _printHead', () => {
    let actualResult = help._printHead();

    chai.expect(actualResult, 'is an instance of Help').to.be.an.instanceOf(Help);
  });

  test('Check _printExample', () => {
    let actualResult = help._printExample();

    chai.expect(actualResult, 'is an instance of Help').to.be.an.instanceOf(Help);
  });

  test('Check print', () => {
    let actualResult = help.print();

    chai.expect(actualResult, 'is an instance of Help').to.be.an.instanceOf(Help);
  });

  test('Check _scoreSimilarWord returns 0', () => {

    let actualResult = Help._scoreSimilarWord('testString', 'testWord');

    chai.expect(actualResult).to.be.equal(0);
  });
});
