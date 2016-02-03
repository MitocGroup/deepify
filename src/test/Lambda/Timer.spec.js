'use strict';

import chai from 'chai';
import {Timer} from '../../lib/Lambda/Timer';

suite('Lambda/Timer', () => {
  let name = 'testName';
  let timer = null;
  let approxStartTime = null;
  let approxStoptTime = null;

  test('Class Timer exists in Lambda/Timer', () => {
    chai.expect(Timer).to.be.an('function');
  });

  test('Check constructor sets _name, _startTime, _stopTime', () => {
    timer = new Timer(name);

    chai.expect(timer).to.be.an.instanceOf(Timer);
    chai.expect(timer.name).to.equal(name);
    chai.expect(timer.startTime).to.equal(null);
    chai.expect(timer.startTimeSec).to.equal(null);
    chai.expect(timer.stopTime).to.equal(null);
    chai.expect(timer.stopTimeSec).to.equal(null);
  });

  test('Check start()', () => {
    approxStartTime = new Date().getTime();

    let actualResult = timer.start();

    chai.expect(timer).to.be.an.instanceOf(Timer);
    chai.expect(actualResult.startTime).to.be.at.least(approxStartTime);
    chai.expect(actualResult.startTimeSec).to.be.at.least(
      parseFloat((approxStartTime / 1000).toFixed(2))
    );
  });

  test('Check stop()', () => {
    let actualResult = timer.stop();

    approxStoptTime = new Date().getTime();

    chai.expect(timer).to.be.an.instanceOf(Timer);
    chai.expect(approxStoptTime).to.be.at.least(actualResult.stopTime);
    chai.expect(
      parseFloat((approxStoptTime / 1000).toFixed(2))
    ).to.be.at.least(actualResult.stopTimeSec);
  });

  test('Check time getter', () => {
    let expectedResult = approxStoptTime - approxStartTime;

    chai.expect(expectedResult).to.be.at.least(timer.time);
    chai.expect(
      parseFloat((expectedResult / 1000).toFixed(2))
    ).to.be.at.least(timer.timeSec);
  });

  test('Check toString() for sec', () => {
    chai.expect(timer.toString()).to.equal(
      `Timing for ${name}: ${timer.timeSec} seconds`
    );
  });

  test('Check toString() for !sec', () => {
    chai.expect(timer.toString(false)).to.equal(
      `Timing for ${name}: ${timer.time} miliseconds`
    );
  });

  test('Check time for !startTime', () => {
    //arrange
    approxStartTime = new Date().getTime();

    timer = new Timer(name);

    //act
    let actualResult = timer.time;

    approxStoptTime = new Date().getTime();
    let expectedResult = approxStoptTime - approxStartTime;

    //assert
    chai.expect(expectedResult).to.be.at.least(actualResult);
  });
});
