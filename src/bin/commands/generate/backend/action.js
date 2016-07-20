/**
 * Created by CCristi on 5/5/16.
 */

'use strict';

module.exports = function(mainPath) {
  let inquirer = require('inquirer');
  let ActionGenerator = require('../../../../lib.compiled/Generator/ActionGenerator').ActionGenerator;
  let MicroserviceGenerator = require('../../../../lib.compiled/Generator/MicroserviceGenerator').MicroserviceGenerator;
  let Property = require('deep-package-manager').Property_Instance;
  let Action = require('deep-package-manager').Microservice_Metadata_Action;
  let alphanumericalNotEmpty = require('../../helper/inquirer-validators').alphanumericalNotEmpty;

  mainPath = this.normalizeInputPath(mainPath);
  let lambdaSchema = {};
  let microservice = this.opts.locate('microapp').value;
  let resource = this.opts.locate('resource').value;
  let property = Property.create(mainPath);

  let promptLambdaSchema = (cb) => {
    let questionList = [];
    let microservices = property.microservices.filter(m => !m.isRoot).map(m => m.identifier);

    if (microservices.length === 1) {
      microservice = microservices[0];
    }

    if (microservice) {
      if (microservices.indexOf(microservice) === -1) {
        console.error(`Unknown microservice '${microservice}'. Available microservices: ${microservices.join(',')}`);
        this.exit(1);
      }

      lambdaSchema.microservice = property.microservice(microservice);
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

      lambdaSchema.resource = resource;
    } else {
      questionList.push({
        type: 'input',
        name: 'resource',
        message: 'Enter the resource name (e.g. user): ',
        validate: alphanumericalNotEmpty,
      });
    }

    questionList.push({
      type: 'list',
      name: 'crud',
      message: 'Select the crud you\'d like to use: ',
      choices: ActionGenerator.CRUDS,
    });

    inquirer.prompt(questionList).then((schema) => {
      if (schema.microservice) {
        schema.microservice = property.microservice(schema.microservice);
      }

      Object.assign(lambdaSchema, schema);
      cb();
    });
  };

  let promptLambdaMethods = (cb) => {
    switch (lambdaSchema.crud) {
    case 'Create':
      lambdaSchema.methods = ['PUT'];
      lambdaSchema.action = 'Create';
      break;
    case 'Retrieve':
      lambdaSchema.methods = ['GET'];
      lambdaSchema.action = 'Retrieve';
      break;
    case 'Update':
      lambdaSchema.methods = ['POST'];
      lambdaSchema.action = 'Update';
      break;
    case 'Delete':
      lambdaSchema.methods = ['DELETE'];
      lambdaSchema.action = 'Delete';
      break;
    }

    if (lambdaSchema.crud !== 'Custom') {
      return cb();
    }

    inquirer.prompt([{
      type: 'input',
      name: 'action',
      message: 'Enter the action name (e.g. create): ',
      validate: alphanumericalNotEmpty,
    }, {
      type: 'checkbox',
      message: 'Select allowed methods for your lambda: ',
      name: 'methods',
      choices: Action.HTTP_VERBS.map(v => ({name: v, checked: v === 'GET'})),
    }]).then((schema) => {
      Object.assign(lambdaSchema, schema);

      cb();
    });
  };

  promptLambdaSchema(() => {
    promptLambdaMethods(() => {
      new ActionGenerator()
        .generate(mainPath, lambdaSchema, (error, path) => {
          if (error) {
            console.error(`Error while generating the action: ${error}`);
            return;
          }

          console.info(
            `'@${lambdaSchema.microservice.identifier}` +
            `:${MicroserviceGenerator.identifier(lambdaSchema.resource)}` +
            `:${MicroserviceGenerator.identifier(lambdaSchema.action)}' ` +
            `action has been successfully generated in '${path}'`
          );
        });
    });
  });
};
