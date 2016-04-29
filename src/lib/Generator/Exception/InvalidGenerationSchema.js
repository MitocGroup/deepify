/**
 * Created by CCristi <ccovali@mitocgroup.com> on 4/28/16.
 */

'use strict';

/**
 * Invalid Generator Schema
 */
export class InvalidGenerationSchema extends Error {
  constructor(generatorName, errors) {
    super(`Got invalid generation schema for '${generatorName}': ${errors}`);
  }
}
