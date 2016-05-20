/**
 * Created by CCristi on 5/20/16.
 */

'use strict';

module.exports = function(mainPath) {
  let inquirer = require('inquirer');
  let ActionGenerator = require('../../../../lib.compiled/Generator/ActionGenerator').ActionGenerator;
  let MicroserviceGenerator = require('../../../../lib.compiled/Generator/MicroserviceGenerator').MicroserviceGenerator;
  let Property = require('deep-package-manager').Property_Instance;
  let alphanumericalNotEmpty = require('../../helper/inquirer-validators').alphanumericalNotEmpty;

  mainPath = this.normalizeInputPath(mainPath);
  let resourceSchema = {};
  let microservice = this.opts.locate('microapp').value;
  let resource = this.opts.locate('resource').value;
  let property = new Property(mainPath);
  let actionGenerator = new ActionGenerator();

  let promptResourceSchema = (cb) => {
    let questionList = [];
    let microservices = property.microservices.map(m => m.identifier);
    let methodsMap = {
      'create': ['PUT'],
      'update': ['POST'],
      'retrieve': ['GET'],
      'delete': ['DELETE']
    };

    if (microservice) {
      if (microservices.indexOf(microservice) === -1) {
        console.log(`Unknown microservice '${microservice}'. Available microservices: ${microservices.join(',')}`);
        this.exit(1);
      }

      resourceSchema.microservice = property.microservice(microservice);
    } else {
      questionList.push({
        type: 'list',
        name: 'microservice',
        message: 'Select the microservice: ',
        choices: microservices,
      });
    }

    if (resource) {
      let validationResult = alphanumericalNotEmpty(resource);
      if (validationResult !== true) {
        console.error(validationResult);
        this.exit(1);
      }

      resourceSchema.resource = resource;
    } else {
      questionList.push({
        type: 'input',
        name: 'resource',
        message: 'Enter the resource name (e.g. user): ',
        validate: alphanumericalNotEmpty,
      });
    }

    questionList.push({
      type: 'checkbox',
      name: 'cruds',
      message: 'Select the cruds you\'d like to use: ',
      // 'Custom' crud is available only for `deepify generate action`
      choices: ActionGenerator.CRUDS.slice(1).map(c => ({name: c, checked: true})),
    });

    inquirer.prompt(questionList).then((schema) => {
      if (schema.microservice) {
        schema.microservice = property.microservice(schema.microservice);
      }

      schema.cruds = schema.cruds.map(crud => ({
        name: crud,
        methods: methodsMap[crud.toLowerCase()],
      }));

      Object.assign(resourceSchema, schema);
      cb();
    });
  };

  promptResourceSchema(() => {
    for (let crud of resourceSchema.cruds) {
      let generationSchema = Object.assign(resourceSchema, {
        crud: crud.name,
        action: crud.name,
        methods: crud.methods
      });

      actionGenerator.generate(mainPath, generationSchema, (error, path) => {
        if (error) {
          console.error(`Error while generating the action: ${error}`);
          return;
        }

        console.log(
          `'@${resourceSchema.microservice.identifier}` +
          `:${MicroserviceGenerator.identifier(resourceSchema.resource)}` +
          `:${MicroserviceGenerator.identifier(crud.name)}' ` +
          `action has been successfully generated in '${path}'`
        );
      });
    }
  });
};
