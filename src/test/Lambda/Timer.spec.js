'use strict';

import {expect} from 'chai';
import {Timer} from '../../lib/Lambda/Timer';

suite('Lambda/Timer', () => {
  let name = 'testName';
  let timer = null;
  let approxStartTime = null;
  let approxStoptTime = null;

  test('Class Timer exists in Lambda/Timer', () => {
    expect(Timer).to.be.an('function');
  });

  test('Check constructor sets _name, _startTime, _stopTime', () => {
    timer = new Timer(name);

    expect(timer).to.be.an.instanceOf(Timer);
    expect(timer.name).to.equal(name);
    expect(timer.startTime).to.equal(null);
    expect(timer.startTimeSec).to.equal(null);
    expect(timer.stopTime).to.equal(null);
    expect(timer.stopTimeSec).to.equal(null);
  });

  test('Check start()', () => {
    approxStartTime = new Date().getTime();

    let actualResult = timer.start();

    expect(timer).to.be.an.instanceOf(Timer);
    expect(actualResult.startTime).to.be.at.least(approxStartTime);
    expect(actualResult.startTimeSec).to.be.at.least(
      parseFloat((approxStartTime / 1000).toFixed(2))
    );
  });

  test('Check stop()', () => {
    let actualResult = timer.stop();

    approxStoptTime = new Date().getTime();

    expect(timer).to.be.an.instanceOf(Timer);
    expect(approxStoptTime).to.be.at.least(actualResult.stopTime);
    expect(
      parseFloat((approxStoptTime / 1000).toFixed(2))
    ).to.be.at.least(actualResult.stopTimeSec);
  });

  test('Check time getter', () => {
    let expectedResult = approxStoptTime - approxStartTime;

    expect(expectedResult).to.be.at.least(timer.time);
    expect(
      parseFloat((expectedResult / 1000).toFixed(2))
    ).to.be.at.least(timer.timeSec);
  });

  test('Check toString() for sec', () => {
    expect(timer.toString()).to.equal(
      `Timing for ${name}: ${timer.timeSec} seconds`
    );
  });

  test('Check toString() for !sec', () => {
    expect(timer.toString(false)).to.equal(
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
    expect(expectedResult).to.be.at.least(actualResult);
  });
});
