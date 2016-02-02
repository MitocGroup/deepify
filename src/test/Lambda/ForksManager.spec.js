'use strict';

import chai from 'chai';
import {ForksManager} from '../../lib/Lambda/ForksManager';
import ChildProcess from 'child_process';
import path from 'path';

suite('Lambda/ForksManager', function () {
  test('Class ForksManager exists in Lambda/ForksManager', function () {
    chai.expect(typeof ForksManager).to.equal('function');
  });

  test('Check STORAGE_KEY static getter', function () {
    chai.expect(ForksManager.STORAGE_KEY).to.equal('_deep_fm_forks_');
  });

  test('Check SIGKILL_KEY static getter', function () {
    chai.expect(ForksManager.SIGKILL_KEY).to.equal('_deep_fm_sigkill_');
  });

  test('Check _isManaged static getter return false', function () {
    chai.expect(ForksManager._isManaged, '_isManaged returns false').to.equal(false);
  });

  test('Check _wasMainProcessKilled static getter return false', function () {
    chai.expect(ForksManager._wasMainProcessKilled, '_wasMainProcessKilled returns false').to.equal(false);
  });

  test('Check _isForksStackEmpty static getter return true', function () {
    chai.expect(ForksManager._isForksStackEmpty, '_isForksStackEmpty returns false').to.equal(true);
  });

  test('Check manage() for !ForksManager._isManaged', function () {
    let fork = ChildProcess.fork(path.join(__dirname + './../PathToForked/child'));

    let actualResult = ForksManager.manage(fork);

    chai.expect(actualResult, 'returns undefined').to.equal(undefined);
    chai.expect(ForksManager._isManaged, '_isManaged returns false').to.equal(false);
    chai.expect(ForksManager._wasMainProcessKilled, '_wasMainProcessKilled returns false').to.equal(false);
    chai.expect(ForksManager._isForksStackEmpty, '_isForksStackEmpty returns false').to.equal(true);
  });

  test('Check registerListener() for !ForksManager._isManaged', function () {
    ForksManager.registerListener();

    chai.expect(ForksManager._isManaged, '_isManaged returns true').to.equal(true);
    chai.expect(ForksManager._isForksStackEmpty, '_isForksStackEmpty returns true').to.equal(true);
    chai.expect(ForksManager._wasMainProcessKilled, '_wasMainProcessKilled returns false').to.equal(false);
  });

  test('Check manage() > _addForkToStack() ', function() {
    let fork = ChildProcess.fork(path.join(__dirname + './../PathToForked/child'));

    ForksManager.manage(fork);

    chai.expect(ForksManager._isManaged, '_isManaged returns true').to.equal(true);
    chai.expect(ForksManager._isForksStackEmpty, '_isForksStackEmpty returns false').to.equal(false);
    chai.expect(ForksManager._wasMainProcessKilled, '_wasMainProcessKilled returns false').to.equal(false);
  });

  test('Check registerListener() for ForksManager._isManaged', function () {
    let actualResult = ForksManager.registerListener();

    chai.expect(actualResult, 'returns undefined').to.equal(undefined);
    chai.expect(ForksManager._isManaged, '_isManaged returns true').to.equal(true);
    chai.expect(ForksManager._isForksStackEmpty, '_isForksStackEmpty returns false').to.equal(false);
    chai.expect(ForksManager._wasMainProcessKilled, '_wasMainProcessKilled returns false').to.equal(false);
  });
});
