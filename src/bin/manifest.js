/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

var path = require('path');
var jsonFile = require('jsonfile');

var packageConfig = jsonFile.readFileSync(path.join(__dirname, '../package.json'));

module.exports = {
  version: packageConfig.version,
  description: 'DEEP CLI',
  commandsPath: './commands',
  commands: {
    helloworld: {
      example: 'deepify helloworld path/to/web_app',
      description: 'Dump the "Hello World" sample web app',
      opts: {
      },
      args: {
        path: {
          description: 'The path to dump the sample web app to',
          required: true,
        },
      },
    },
    server: {
      example: 'deepify server path/to/web_app -o',
      description: 'Run local development server',
      opts: {
        profiling: {
          alias: 'd',
          description: 'Enable Lambdas profiling',
          required: false,
        },
        'build-path': {
          alias: 'b',
          description: 'The path to the build (in order to pick up config)',
          required: false,
        },
        'skip-frontend-build': {
          alias: 'f',
          description: 'Skip picking up _build path from the microservices Frontend',
          required: false,
        },
        'skip-backend-build': {
          alias: 's',
          description: 'Skip building backend (dependencies installation in Lambdas and linking aws-sdk)',
          required: false,
        },
        'skip-build-hook': {
          alias: 'h',
          description: 'Skip running build hook (hook.build.js)',
          required: false,
        },
        port: {
          alias: 'p',
          description: 'Port to listen to',
          required: false,
        },
        'db-server': {
          alias: 'l',
          description: 'Local DynamoDB server implementation (ex. LocalDynamo, Dynalite)',
          required: false,
        },
        'open-browser': {
          alias: 'o',
          description: 'Open browser after the server starts',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the Lambda (directory of handler itself)',
          required: true,
        },
      },
    },
    lambda: {
      example: 'deepify lambda path/to/the/lambda -e=\'{"Name":"John Doe"}\'',
      description: 'Run Lambda function locally',
      opts: {
        event: {
          alias: 'e',
          description: 'JSON string used as the Lambda payload',
          required: false,
        },
        'skip-frontend-build': {
          alias: 'f',
          description: 'Skip picking up _build path from the microservices Frontend',
          required: false,
        },
        'db-server': {
          alias: 'l',
          description: 'Local DynamoDB server implementation (ex. LocalDynamo, Dynalite)',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the Lambda (directory of handler itself)',
          required: true,
        },
      },
    },
    deploy: {
      example: 'deepify deploy path/to/web_app',
      description: 'Deploy an web app',
      opts: {
        'cfg-bucket': {
          alias: 'b',
          description: 'AWS S3 system bucket name where the deploy config was persisted (ex. deep.prod.system.db0c09cc)',
          required: false,
        },
        'dry-run': {
          alias: 'd',
          description: 'Work locally, without provisioning or publishing the code and data',
          required: false,
        },
        'dump-local': {
          alias: 'l',
          description: 'Dump built web app locally into the specified directory',
          required: false,
        },
        'pull-deps': {
          alias: 'p',
          description: 'Pull dependencies from the remote repository',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the web app',
          required: true,
        },
      },
    },
    undeploy: {
      example: 'deepify undeploy path/to/web_app',
      description: 'Remove web app provisioning and uploaded data',
      opts: {
        'cfg-bucket': {
          alias: 'b',
          description: 'AWS S3 system bucket name where the deploy config was persisted (ex. deep.prod.system.db0c09cc)',
          required: false,
        },
        dirty: {
          alias: 'd',
          description: 'Force cleaning up all resources if .cfg.deeploy.json file missing',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the web app',
          required: true,
        },
      },
    },
    'pull-deps': {
      example: 'deepify pull-deps path/to/web_app',
      description: 'Pull web app microservices\' dependencies',
      opts: {
        'dry-run': {
          alias: 'd',
          description: 'Work locally, without pulling dependencies from the remote repository',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the web app',
          required: true,
        },
      },
    },
    'push-deps': {
      example: 'deepify push-deps path/to/web_app',
      description: 'Publish microservices from within the given web app',
      opts: {
        'dry-run': {
          alias: 'd',
          description: 'Work locally, without pushing microservices to the remote repository',
          required: false,
        },
      },
      args: {
        path: {
          description: 'The path to the web app',
          required: true,
        },
      },
    },
  },
};
