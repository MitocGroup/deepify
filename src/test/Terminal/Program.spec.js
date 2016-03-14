'use strict';

import chai from 'chai';
import {Program} from '../../lib/Terminal/Program';
import {Options} from '../../lib/Terminal/Options';
import {Arguments} from '../../lib/Terminal/Arguments';
import os from 'os';
import path from 'path';

suite('Terminal/Program', () => {
  let programName = 'testprogramname';
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

  test('Check Program.normalizeInputPath resolves input path', () => {

    // @todo: add tests for windows...
    //let winFullPathDisk = 'c:\abc\abc\abc';
    //let winFullPath = '\abc\abc\abc';
    //let winFullTildaPath = '~\abc\abc\abc';
    //let winRelativePath = 'abc\abc\abc';

    let noPath = null;
    let tildaOnlyPath = '~';
    let unixFullPath = '/abc/abc/abc';
    let unixRelativePath = 'abc/abc/abc';
    let unixRelativePathDots = '../abc/abc/abc';
    let unixRelativePathDot = './abc/abc/abc';
    let unixBashPwdPath = `\`pwd\`${unixFullPath}`;
    let unixBashPwdLongPath = `$(pwd)${unixFullPath}`;

    chai.expect(program.normalizeInputPath(noPath)).to.be.equal(process.cwd());
    chai.expect(program.normalizeInputPath(tildaOnlyPath)).to.be.equal(program._homeDir);
    chai.expect(program.normalizeInputPath(unixFullPath)).to.be.equal(unixFullPath);
    chai.expect(program.normalizeInputPath(unixRelativePath)).to.be.equal(path.join(process.cwd(), unixRelativePath));
    chai.expect(program.normalizeInputPath(unixRelativePathDots)).to.be.equal(path.join(process.cwd(), unixRelativePathDots));
    chai.expect(program.normalizeInputPath(unixRelativePathDot)).to.be.equal(path.join(process.cwd(), unixRelativePathDot));
    chai.expect(program.normalizeInputPath(unixBashPwdPath)).to.be.equal(path.join(process.cwd(), unixFullPath));
    chai.expect(program.normalizeInputPath(unixBashPwdLongPath)).to.be.equal(path.join(process.cwd(), unixFullPath));
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
