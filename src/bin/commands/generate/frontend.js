/**
 * Created by CCristi on 5/19/16.
 */

'use strict';

module.exports = function (mainPath) {
  let inquirer = require('inquirer');
  let AngularFrontendGenerator = require('../../../lib.compiled/Generator/AngularFrontendGenerator')
    .AngularFrontendGenerator;
  let VanillaFrontendGenerator = require('../../../lib.compiled/Generator/VanillaFrontendGenerator')
    .VanillaFrontendGenerator;
  let MicroserviceGenerator = require('../../../lib.compiled/Generator/MicroserviceGenerator').MicroserviceGenerator;
  let Property = require('deep-package-manager').Property_Instance;
  let FS = require('fs');

  mainPath = this.normalizeInputPath(mainPath);
  let property = new Property(mainPath);
  let microservice = null;
  let engines = [];

  let frontendGenerator = (engine) => {
    let GeneratorClass = null;

    switch (engine) {

      case 'angular':
        GeneratorClass = AngularFrontendGenerator;
        break;

      case 'vanilla':
        GeneratorClass = VanillaFrontendGenerator;
        break;

      default:
        console.error(`Unknown frontend engine: ${engine}`);
        this.exit(1);
    }

    return new GeneratorClass();
  };

  let generateFrontend = (cb, engineIndex) => {
    engineIndex = engineIndex || 0;
    let engine = engines[engineIndex];
    let frontendPath = microservice.autoload.frontend;
    let generationObj = {
      name: microservice.config.name,
      identifier: microservice.identifier,
    };

    frontendGenerator(engine).generate(frontendPath, generationObj, (error) => {
      if (error) {
        cb(error);
        return;
      }

      engineIndex++;

      if (engineIndex < engines.length) {
        generateFrontend(cb, engineIndex);
      } else {
        cb(null);

        return;
      }
    });
  };


  inquirer.prompt([
    {
      type: 'list',
      name: 'microservice',
      message: 'Select the microservice: ',
      choices: property.microservices.map(m => m.identifier),
    },
    {
      type: 'checkbox',
      name: 'engines',
      message: 'Select the frontend engines you\'d like to use: ',
      choices: MicroserviceGenerator.ALLOWED_ENGINES.map(e => ({name: e, checked: e === 'angular'})),
    },
  ]).then((schema) => {
    microservice = property.microservice(schema.microservice);
    engines = schema.engines;

    if (microservice.isRoot) {
      console.error('Cannot generate frontend for root microservices');
      this.exit(1);
    }

    if (FS.existsSync(microservice.autoload.frontend)) {
      console.error(`Frontend folder already exists in ${microservice.autoload.frontend}`);
      this.exit(1);
    }

    generateFrontend((error) => {
      if (error) {
        console.error(`Error while generating frontend: ${error}`);
        this.exit(1);
      }

      console.info(`Microservice frontend has been successfully generating in: ${microservice.autoload.frontend}`);
      this.exit(0);
    });
  });
};
