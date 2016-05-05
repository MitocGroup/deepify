/**
 * Created by CCristi on 5/5/16.
 */

'use strict';

module.exports = function(mainPath) {
  let inquirer = require('inquirer');
  let LambdaGenerator = require('../../lib.compiled/Generator/LambdaGenerator').LambdaGenerator;
  let MicroserviceGenerator = require('../../lib.compiled/Generator/MicroserviceGenerator').MicroserviceGenerator;
  let Property = require('deep-package-manager').Property_Instance;
  let Action = require('deep-package-manager').Microservice_Metadata_Action;
  let alphanumericalNotEmpty = require('./helper/inquirer-validators').alphanumericalNotEmpty;

  mainPath = this.normalizeInputPath(mainPath);
  let lambdaSchema = {};
  let microservice = this.opts.locate('microapp').value;
  let resource = this.opts.locate('resource').value;
  let property = new Property(mainPath);

  let promptLambdaSchema = (cb) => {
    let questionList = [];
    let microservices = property.microservices.map(m => m.identifier);

    if (microservice && microservices.indexOf(microservice) !== -1) {
      lambdaSchema.microservice = property.microservice(microservice);
    } else {
      questionList.push({
        type: 'list',
        name: 'microservice',
        message: 'Select the microservice: ',
        choices: microservices,
      });
    }

    if (resource && alphanumericalNotEmpty(resource) === true) {
      lambdaSchema.resource = resource;
    } else {
      questionList.push({
        type: 'input',
        name: 'resource',
        message: 'Enter the resource name: ',
        validate: alphanumericalNotEmpty,
      });
    }

    questionList.push({
      type: 'list',
      name: 'crud',
      message: 'Select the crud you\'d like to use: ',
      choices: LambdaGenerator.CRUDS,
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
      message: 'Enter the action name: ',
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
      new LambdaGenerator()
        .generate(mainPath, lambdaSchema, (error, path) => {
          if (error) {
            console.error(`Error while generating the lambda: ${error}`);
            return;
          }

          console.log(
            `'@${lambdaSchema.microservice.identifier}` + 
            `:${MicroserviceGenerator.identifier(lambdaSchema.resource)}` + 
            `:${MicroserviceGenerator.identifier(lambdaSchema.action)}' ` +
            `lambda has been successfully generated in '${path}'`
          );
        });
    });
  });
};
