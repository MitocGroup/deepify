/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

import {Program} from './Program';
import {ProgramInstanceRequiredException} from './Exception/ProgramInstanceRequiredException';
import OS from 'os';

export class Help {
  /**
   * @param {Program} program
   */
  constructor(program) {
    this._program = program;

    if (!program instanceof Program) {
      throw new ProgramInstanceRequiredException();
    }
  }

  /**
   * @returns {Program}
   */
  get program() {
    return this._program;
  }

  /**
   * @param {String} matchCommand
   * @param {Boolean} sortByKeys
   * @returns {Help}
   *
   * @todo: split this functionality into a separate class
   */
  printAutoCompletion(matchCommand, sortByKeys = false) {
    let commandNames = [];
    let commands = this._program.commands;

    if (sortByKeys) {
      commands.sort((a, b) => {
        if (a.name > b.name) {
          return 1;
        }
        if (a.name < b.name) {
          return -1;
        }

        return 0;
      });
    }

    for (let i in commands) {
      if (!commands.hasOwnProperty(i)) {
        continue;
      }

      let cmd = commands[i];

      commandNames.push(cmd.name);
    }

    console.log(Help._findSuitableCommand(matchCommand, commandNames).join(OS.EOL));

    return this;
  }

  /**
   * @param {String} search
   * @param {String[]} cmdVector
   * @returns {String[]}
   * @private
   */
  static _findSuitableCommand(search, cmdVector) {
    if (!search) {
      return cmdVector;
    }

    let scores = {};

    for (let cmdName of cmdVector) {
      let score = Help._numRound2(Help._scoreSimilarWord(cmdName, search));

      if (!scores.hasOwnProperty(score)) {
        scores[score] = [];
      }

      scores[score].push(cmdName);
    }

    let scoreKeys = Object.keys(scores);
    let minScoreKey = Math.max(...scoreKeys);

    return scores[`${minScoreKey}`];
  }

  /**
   * @param {Number} num
   * @returns {Number}
   * @private
   */
  static _numRound2(num) {
    return +(Math.round(num + "e+2")  + "e-2");
  }

  /**
   * @param {String} string
   * @param {String} word
   * @param {Number} fuzziness
   * @returns {Number}
   * @private
   */
  static _scoreSimilarWord(string, word, fuzziness = null) {
    // If the string is equal to the word, perfect match.
    if (string === word || string.indexOf(word) === 0) {
      return 1;
    } else if (!word) {
      return 0;
    }

    let runningScore = 0;
    let charScore = null;
    let finalScore = null;
    let lString = string.toLowerCase();
    let strLength = string.length;
    let lWord = word.toLowerCase();
    let wordLength = word.length;
    let idxOf =  null;
    let startAt = 0;
    let fuzzies = 1;
    let fuzzyFactor;

    // Cache fuzzyFactor for speed increase
    if (fuzziness) {
      fuzzyFactor = 1 - fuzziness;
    }

    // Walk through word and add up scores.
    // Code duplication occurs to prevent checking fuzziness inside for loop
    if (fuzziness) {
      for (let i = 0; i < wordLength; i += 1) {

        // Find next first case-insensitive match of a character.
        idxOf = lString.indexOf(lWord[i], startAt);

        if (idxOf === -1) {
          fuzzies += fuzzyFactor;
        } else {
          if (startAt === idxOf) {
            // Consecutive letter & start-of-string Bonus
            charScore = 0.7;
          } else {
            charScore = 0.1;

            // Acronym Bonus
            // Weighing Logic: Typing the first character of an acronym is as if you
            // preceded it with two perfect character matches.
            if (string[idxOf - 1] === ' ') {
              charScore += 0.8;
            }
          }

          // Same case bonus.
          if (string[idxOf] === word[i]) {
            charScore += 0.1;
          }

          // Update scores and startAt position for next round of indexOf
          runningScore += charScore;
          startAt = idxOf + 1;
        }
      }
    } else {
      for (let i = 0; i < wordLength; i += 1) {
        idxOf = lString.indexOf(lWord[i], startAt);

        if (-1 === idxOf) {
          return 0;
        }

        if (startAt === idxOf) {
          charScore = 0.7;
        } else {
          charScore = 0.1;
          if (string[idxOf - 1] === ' ') {
            charScore += 0.8;
          }
        }
        if (string[idxOf] === word[i]) {
          charScore += 0.1;
        }

        runningScore += charScore;
        startAt = idxOf + 1;
      }
    }

    // Reduce penalty for longer strings.
    finalScore = 0.5 * (runningScore / strLength + runningScore / wordLength) / fuzzies;

    if ((lWord[0] === lString[0]) && (finalScore < 0.85)) {
      finalScore += 0.15;
    }

    return finalScore;
  }

  /**
   * @returns {Help}
   */
  print() {
    this
      ._printHead()
      ._printExample()
      ._printArgs()
      ._printOpts()
      ._printCommands()
    ;

    return this;
  }

  /**
   * @param {Boolean} sortByKeys
   * @returns {Help}
   * @private
   */
  _printCommands(sortByKeys = false) {
    if (this._program.hasCommands) {
      let commands = this._program.commands;

      if (sortByKeys) {
        commands.sort((a, b) => {
          if (a.name > b.name) {
            return 1;
          }
          if (a.name < b.name) {
            return -1;
          }

          return 0;
        });
      }

      console.log('Available commands: ');

      for (let i in commands) {
        if (!commands.hasOwnProperty(i)) {
          continue;
        }

        let cmd = commands[i];

        console.log(`   ${cmd.name}: ${Help._stringify(cmd.description)}`);
      }
    }

    console.log('');

    return this;
  }

  /**
   * @returns {Help}
   * @private
   */
  _printOpts() {
    let opts = this._program.opts.list();

    console.log('Options:', opts.length <= 0 ? 'None' : '');

    if (opts.length > 0) {
      for (let i in opts) {
        if (!opts.hasOwnProperty(i)) {
          continue;
        }

        let opt = opts[i];

        if (opt.hidden) {
          continue;
        }

        let add = '';

        if (opt.alias) {
          add = `|-${opt.alias}`;
        }

        console.log(`   --${opt.name}${add}: ${Help._stringify(opt.description)}`);
      }

      console.log('');
    }

    return this;
  }

  /**
   * @returns {Help}
   * @private
   */
  _printArgs() {
    let args = this._program.args.list();

    console.log('Arguments:', args.length <= 0 ? 'None' : '');

    if (args.length > 0) {
      for (let i in args) {
        if (!args.hasOwnProperty(i)) {
          continue;
        }

        let arg = args[i];

        if (arg.hidden) {
          continue;
        }

        console.log(`   ${Help._stringify(arg.name)}: ${Help._stringify(arg.description)}`);
      }

      console.log('');
    }

    return this;
  }

  /**
   * @returns {Help}
   * @private
   */
  _printExample() {
    if (this._program.example) {
      console.log(`Usage example: ${this._program.example}`);
      console.log('');
    }

    return this;
  }

  /**
   * @returns {Help}
   * @private
   */
  _printHead() {
    console.log('');
    console.log(
      `${Help._stringify(this._program.name)}@${Help._stringify(this._program.version)} -`,
      Help._stringify(this._program.description)
    );
    console.log('');

    return this;
  }

  /**
   * @param {*} value
   * @returns {*}
   * @private
   */
  static _stringify(value) {
    if (value === undefined || value === null) {
      return 'unknown';
    } else if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    return value.toString();
  }
}
