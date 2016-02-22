'use strict';

import {expect} from 'chai';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {NpmChain} from '../../lib/NodeJS/NpmChain';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';
import {NpmLink} from '../../lib/NodeJS/NpmLink';
import {NpmUpdate} from '../../lib/NodeJS/NpmUpdate';
import {NpmListDependencies} from '../../lib/NodeJS/NpmListDependencies';
import {NpmDependency} from '../../lib/NodeJS/NpmDependency';

chai.use(sinonChai);

suite('NodeJS/NpmChain', () => {
  let npmLink = null;
  let npmUpdate = new NpmUpdate();
  let npmChain = null;
  let npmListDependencies = new NpmListDependencies('./');
  let args = ['./'];
  let extraArg = 'chai@^2.2.x';
  let install = new NpmInstall(args);
  install.addExtraArg(extraArg);

  test('Class NpmChain exists in NodeJS/NpmChain', () => {
    expect(NpmChain).to.be.an('function');
  });

  test('Check constructor sets _commands', () => {
    let libs = 'mocha isparta';
    npmLink = new NpmLink();
    npmLink.libs = libs;

    npmChain = new NpmChain(npmLink);
    expect(npmChain).to.be.an.instanceOf(NpmChain);
    expect(npmChain.commands[0]).to.be.an.instanceOf(NpmInstall);
    expect(npmChain.commands).to.include(npmLink);
  });

  test('Check add() adds command', () => {
    npmChain.add(npmUpdate);
    expect(npmChain).to.be.an.instanceOf(NpmChain);
    expect(npmChain.commands).to.include(npmLink);
    expect(npmChain.commands).to.include(npmUpdate);
  });

  test('Check _trigger() for _commands.length <= 0', () => {
    let spyCallback = sinon.spy();
    let npmChainWithoutCommands = new NpmChain();

    let actualResult = npmChainWithoutCommands._trigger('run', spyCallback);

    expect(actualResult).to.equal(undefined);
    expect(spyCallback).to.have.been.calledWithExactly();
  });

  test('Check runChunk() executes successfully', () => {
    let spyCallback = sinon.spy();
    let npmChain = new NpmChain();

    npmChain.add(install);

    npmChain.runChunk(spyCallback, 3, true);

    expect(npmListDependencies.list(0)).to.be.an.instanceOf(NpmDependency);
    expect(spyCallback).to.not.have.been.calledWith();
  });

  test('Check run() executes successfully', () => {
    let spyCallback = sinon.spy();
    let npmChain = new NpmChain();

    npmChain.add(install);

    npmChain.run(spyCallback, 3, true);

    expect(npmListDependencies.list(0)).to.be.an.instanceOf(NpmDependency);
    expect(spyCallback).to.not.have.been.calledWith();
  });
});
