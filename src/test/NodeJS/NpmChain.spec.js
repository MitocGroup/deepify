'use strict';

import {expect} from 'chai';
import {NpmChain} from '../../lib/NodeJS/NpmChain';
import {NpmInstall} from '../../lib/NodeJS/NpmInstall';
import {NpmLink} from '../../lib/NodeJS/NpmLink';
import {NpmUpdate} from '../../lib/NodeJS/NpmUpdate';

suite('NodeJS/NpmChain', () => {
  let npmLink = null;
  let npmUpdate = new NpmUpdate();
  let npmChain = null;

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
});
