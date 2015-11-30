/**
 * Created by AlexanderC on 11/30/15.
 */

'use strict';

export default getV8Profiler();

function getV8Profiler() {
  let profiler = null;

  try {
    // @todo: avoid logged errors
    profiler = require('v8-profiler');
  } catch(e) {
    profiler = {
      startProfiling: () => {
      },
      stopProfiling: () => {
        return null;
      },
    };
  }

  return profiler;
}
