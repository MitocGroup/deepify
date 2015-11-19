/**
 * Created by AlexanderC on 8/7/15.
 */

'use strict';

module.exports = function(mainPath) {
  var aws = require('aws-sdk');
  var path = require('path');
  var tmp = require('tmp');
  var os = require('os');
  var fs = require('fs');
  var fse = require('fs-extra');
  var Core = require('deep-core');
  var Config = require('deep-package-manager').Property_Config;
  var AbstractService = require('deep-package-manager').Provisioning_Service_AbstractService;
  var AwsRequestSyncStack = require('deep-package-manager').Helpers_AwsRequestSyncStack;
  var WaitFor = require('deep-package-manager').Helpers_WaitFor;
  var exec = require('child_process').exec;
  var AwsApiGatewayClient = require('aws-api-gw-client').Client;

  // @todo: hook to avoid TypeError: Super expression must either be null or a function, not undefined
  require('deep-package-manager').Provisioning_Instance;

  var dirtyMode = this.opts.locate('dirty').exists;
  var cfgBucket = this.opts.locate('cfg-bucket').value;
  var rawResource = this.opts.locate('resource').value;

  var resource = null;
  var skipDirtyCheck = false;

  if (rawResource) {
    resource = AbstractService.extractBaseHashFromResourceName(rawResource);
    skipDirtyCheck = true;

    if (!resource) {
      console.error('Unable to extract base hash from ' + rawResource);
      this.exit(1);
    }
  }

  if (mainPath.indexOf('/') !== 0) {
    mainPath = path.join(process.cwd(), mainPath);
  }

  var configFile = path.join(mainPath, Config.DEFAULT_FILENAME);
  var configExists = fs.existsSync(configFile);

  if (!configExists) {
    console.error('Missing ' + Config.DEFAULT_FILENAME + ' configuration file in ' + mainPath);
    this.exit(1);
  }

  var config = Config.createFromJsonFile(configFile).extract();

  aws.config.update(config.aws);

  function getDeployConfigFile(cb) {
    var deployConfigFile = path.join(mainPath, '.cfg.deeploy.json');

    if (fs.existsSync(deployConfigFile)) {
      cb.bind(this)(JSON.parse(fs.readFileSync(deployConfigFile)));
    } else if (cfgBucket) {
      var s3 = new aws.S3();

      var payload = {
        Bucket: cfgBucket,
        Key: '.cfg.deeploy.json',
      };

      s3.getObject(payload, function(error, data) {
        cb.bind(this)(error ? null : JSON.parse(data.Body.toString()));
      }.bind(this));
    } else {
      cb.bind(this)(null);
    }
  }

  getDeployConfigFile.bind(this)(function(rawDeployConfig) {
    var deployConfig = null;

    if (!rawDeployConfig) {
      if (!skipDirtyCheck) {
        if (!dirtyMode) {
          console.log('If \'.cfg.deeploy.json\' is missing you have to specify enable mode explicitly (add \'--dirty\' flag)');
          console.log(os.EOL, 'BE AWARE! THIS DELETES ALL THE THINGS FOUND! RECOVERAGE IMPOSSIBLE!', os.EOL);

          this.exit(1);
        }

        console.log(os.EOL, ' Dirty mode on!!!', os.EOL);
      }
    } else {
      var deployConfigFile = path.join(mainPath, '.cfg.deeploy.json');
      var deployProvisioning = rawDeployConfig.provisioning || {};

      var objectValues = function(obj) {
        var keys = Object.keys(obj);
        var vector = [];

        for (var i = 0; i < keys.length; i++) {
          var val = obj[keys[i]];

          vector.push(val);
        }

        return vector;
      };

      var i; // init globally

      deployConfig = {
        DynamoDB: [],
        S3: [],
        CognitoIdentity: [],
        IAM: [],
        Lambda: [],
        CloudFront: [],
        APIGateway: [],
      };

      if (deployProvisioning.apigateway && deployProvisioning.apigateway.api) {
        deployConfig.APIGateway.push(deployProvisioning.apigateway.api.id);
      }

      if (deployProvisioning.dynamodb && deployProvisioning.dynamodb.tablesNames) {
        deployConfig.DynamoDB = objectValues(deployProvisioning.dynamodb.tablesNames);
      }

      if (deployProvisioning['cognito-identity'] && deployProvisioning['cognito-identity'].identityPool
        && deployProvisioning['cognito-identity'].identityPool.IdentityPoolId) {
        deployConfig.CognitoIdentity.push(deployProvisioning['cognito-identity'].identityPool.IdentityPoolId);
      }

      if (deployProvisioning.cloudfront && deployProvisioning.cloudfront.id) {
        deployConfig.CloudFront.push(deployProvisioning.cloudfront.id);
      }

      if (deployProvisioning.s3 && deployProvisioning.s3.buckets) {
        var s3Objects = objectValues(deployProvisioning.s3.buckets);
        for (i = 0; i < s3Objects.length; i++) {
          var s3BucketName = s3Objects[i].name;

          deployConfig.S3.push(s3BucketName);
        }
      }

      if (deployProvisioning['cognito-identity'] && deployProvisioning['cognito-identity'].roles) {
        var identityPoolRoles = deployProvisioning['cognito-identity'].roles;
        deployConfig.IAM.push(identityPoolRoles.authenticated.RoleName);
        deployConfig.IAM.push(identityPoolRoles.unauthenticated.RoleName);
      }

      if (deployProvisioning.lambda && deployProvisioning.lambda.executionRoles) {
        var lambdaExecRolesVector = objectValues(deployProvisioning.lambda.executionRoles);
        for (i = 0; i < lambdaExecRolesVector.length; i++) {
          var lambdaExecRoles = objectValues(lambdaExecRolesVector[i]);

          for (var j = 0; j < lambdaExecRoles.length; j++) {
            deployConfig.IAM.push(lambdaExecRoles[j].RoleName);
          }
        }
      }

      if (deployProvisioning.lambda && deployProvisioning.lambda.names) {
        var lambdaNamesVector = objectValues(deployProvisioning.lambda.names);

        for (i = 0; i < lambdaNamesVector.length; i++) {
          var lambdaNamesChunk = objectValues(lambdaNamesVector[i]);

          deployConfig.Lambda = deployConfig.Lambda.concat(lambdaNamesChunk);
        }
      }

      var deployConfigFileBck = deployConfigFile + '.' + (new Date().getTime()) + '.bck';

      if (fs.existsSync(deployConfigFile)) {
        fse.move(deployConfigFile, deployConfigFileBck, function(error) {
          if (error) {
            console.error('Error moving \'.cfg.deeploy.json\' file: ' + error);
            return;
          }

          console.log('Config file \'.cfg.deeploy.json\' moved to ' + deployConfigFileBck);
        }.bind(this));
      } else {
        fs.writeFile(deployConfigFileBck, JSON.stringify(rawDeployConfig), function(error) {
          if (error) {
            console.error('Error persisting remote version of \'.cfg.deeploy.json\' file: ' + error);
            return;
          }

          console.log('Remote config file \'.cfg.deeploy.json\' persisted to ' + deployConfigFileBck);
        }.bind(this));
      }
    }

    function matchResourceName(resourceName) {
      if (dirtyMode || deployConfig) {
        return true;
      }

      return resource
        ? AbstractService.extractBaseHashFromResourceName(resourceName) === resource
        : false;
    }

    function matchAwsResource(serviceName, item) {
      if (dirtyMode || resource) {
        return true;
      }

      return -1 !== deployConfig[serviceName].indexOf(item);
    }

    var incOpTimeout = 0;

    function pushQueue(callback, args) {
      setTimeout(function() {
        callback.apply(this, args);
      }, incOpTimeout);

      incOpTimeout += 400;
    }

    function deepAwsService(name) {
      var service = require('deep-package-manager')['Provisioning_Service_' + name + 'Service'];

      var appropriateRegion = Core.AWS.Region.getAppropriateAwsRegion(
        config.aws.region,
        service.AVAILABLE_REGIONS
      );

      // @todo: replace with native API when ready
      if (name === 'APIGateway') {
        return new AwsApiGatewayClient({
          accessKeyId: config.aws.accessKeyId,
          secretAccessKey: config.aws.secretAccessKey,
          region: appropriateRegion,
        });
      }

      return new aws[name]({
        region: appropriateRegion,
      });
    }

    console.log('=== API Gateway ===');

    var apiGateway = deepAwsService('APIGateway');

    var deleteApiChain = function(apiId) {
      console.log('--> Removing API Gateway ' + apiId);

      apiGateway.deleteRestapi({restapiId: apiId})
        .catch(function(error) {
          console.error('Error while removing API Gateway ' + apiId + ': ' + error);
        }.bind(this));
    };

    apiGateway.listRestapis()
      .then(function(data) {
        for (var i in data) {
          if (!data.hasOwnProperty(i)) {
            continue;
          }

          var source = data[i].source;
          var apiId = source.id;
          var apiName = source.name;

          if (matchAwsResource('APIGateway', apiId) && matchResourceName(apiName)) {
            pushQueue(deleteApiChain, [apiId]);
          }
        }
      }.bind(this))
      .catch(function(error) {
        console.error('Error while listing API Gateway: ' + error);
      }.bind(this));

    console.log('=== IAM ===');

    var iam = deepAwsService('IAM');

    var deleteIamRole = function(roleName) {
      iam.deleteRole({
        RoleName: roleName,
      }, function(error, data) {
        if (error) {
          // remove inline policies...
          if (error.code === 'DeleteConflict') {
            console.log('--> Removing inline policies for IAM Role ' + roleName);

            iam.listRolePolicies({
              RoleName: roleName,
              MaxItems: 1000,
            }, function(error, data) {
              if (error) {
                console.error('Error while listing inline policies of the IAM role: ' + error);

                return;
              }

              var awsStack = new AwsRequestSyncStack();

              for (var i = 0; i < data.PolicyNames.length; i++) {
                var inlinePolicyName = data.PolicyNames[i];

                console.log('--> Deleting inline IAM Policy ' + inlinePolicyName + ' for IAM Role ' + roleName);

                awsStack.push(iam.deleteRolePolicy({
                  RoleName: roleName,
                  PolicyName: inlinePolicyName,
                }), function(error, data) {
                  if (error) {
                    console.error('Error deleting inline IAM Policy: ' + error);
                  }
                });
              }

              awsStack.join().ready(function() {
                deleteIamRole(roleName);
              });
            });

            return;
          }

          console.error('Error deleting IAM role: ' + error);
        }
      });
    };

    var removeRoleChain = function(roleName) {
      console.log('--> Deleting IAM Role ' + roleName);

      iam.listAttachedRolePolicies({
        RoleName: roleName,
        MaxItems: 1000,
      }, function(error, data) {
        if (error) {
          console.error('Error while listing attached policies of the IAM role: ' + error);
          return;
        }

        if (data.AttachedPolicies.length <= 0) {
          deleteIamRole(roleName);
        } else {
          var awsStack = new AwsRequestSyncStack();

          for (var i = 0; i < data.AttachedPolicies.length; i++) {
            var policyData = data.AttachedPolicies[i];

            var policyArn = policyData.PolicyArn;

            console.log('--> Detaching IAM Policy ' + policyArn + ' from IAM Role ' + roleName);

            awsStack.push(iam.detachRolePolicy({
              PolicyArn: policyArn,
              RoleName: roleName,
            }), function(error, data) {
              if (error) {
                console.error('Error while detaching IAM role policy: ' + error);
              }
            });

            console.log('--> Deleting IAM Policy ' + policyArn);

            // @todo: do not try to delete foreign policies...
            iam.deletePolicy({
              PolicyArn: policyArn,
            }, function(error, data) {
              if (error) {
                console.error('Error while deleting IAM policy: ' + error);
              }
            });
          }

          awsStack.join().ready(function() {
            deleteIamRole(roleName);
          });
        }
      });
    };

    iam.listRoles({
      MaxItems: 1000,
    }, function(error, data) {
      if (error) {
        console.error('Error while retrieving IAM roles: ' + error);
        return;
      }

      for (var i = 0; i < data.Roles.length; i++) {
        var roleData = data.Roles[i];
        var roleName = roleData.RoleName;

        if (matchAwsResource('IAM', roleName) && matchResourceName(roleName)) {
          pushQueue(removeRoleChain, [roleName]);
        }
      }
    });

    console.log('=== CognitoIdentity ===');

    var cognitoidentity = deepAwsService('CognitoIdentity');

    function removeIdentityPoolChain(identityPoolId) {
      console.log('--> Deleting Cognito Identity Pool ' + identityPoolId);

      cognitoidentity.deleteIdentityPool({
        IdentityPoolId: identityPoolId,
      }, function(error, data) {
        if (error) {
          console.error('Error while deleting Cognito Identity Pool: ' + error);
        }
      });
    }

    cognitoidentity.listIdentityPools({
      MaxResults: 60,
    }, function(error, data) {
      if (error) {
        console.error('Error while retrieving Cognito Identity Pools: ' + error);
        return;
      }

      for (var i = 0; i < data.IdentityPools.length; i++) {
        var identityPoolData = data.IdentityPools[i];
        var identityPoolId = identityPoolData.IdentityPoolId;
        var identityPoolName = identityPoolData.IdentityPoolName;

        if (matchAwsResource('CognitoIdentity', identityPoolId) && matchResourceName(identityPoolName)) {
          pushQueue(removeIdentityPoolChain, [identityPoolId]);
        }
      }
    });

    console.log('=== Lambda ===');

    var lambda = deepAwsService('Lambda');

    function removeLambdaChain(functionName) {
      console.log('--> Deleting Lambda function ' + functionName);

      lambda.deleteFunction({
        FunctionName: functionName,
      }, function(error, data) {
        if (error) {
          console.error('Error while deleting Lambda function: ' + error);
        }
      });
    }

    lambda.listFunctions({
      MaxItems: 1000,
    }, function(error, data) {
      if (error) {
        console.error('Error while retrieving Lambda functions: ' + error);
        return;
      }

      for (var i = 0; i < data.Functions.length; i++) {
        var lambdaData = data.Functions[i];
        var functionName = lambdaData.FunctionName;

        if (matchAwsResource('Lambda', functionName) && matchResourceName(functionName)) {
          pushQueue(removeLambdaChain, [functionName]);
        }
      }
    });

    console.log('=== CloudFront ===');

    var cf = deepAwsService('CloudFront');

    function removeCfDistribution(distId) {
      console.log('--> Deleting CloudFront distribution ' + distId);

      cf.getDistributionConfig({
        Id: distId,
      }, function(error, data) {
        if (error) {
          console.error('Error while retrieving CloudFront distribution config: ' + error);
          return;
        }

        var distConfig = data.DistributionConfig;

        if (!distConfig.Enabled) {
          var isDeployed = data.DistributionConfig.Status === 'Deployed';
          var addMsg = '...';

          if (!isDeployed) {
            addMsg = ' but not yet deployed. Waiting...';
          }

          console.error('The CloudFront distribution '
            + distId + ' is already disabled' + addMsg);

          if (!isDeployed) {
            waitForCfDistDisabled(distId, data.ETag, function(distId, eTag) {
              cf.deleteDistribution({
                Id: distId,
                IfMatch: eTag,
              }, function(error, data) {
                if (error) {
                  console.error('Error while removing CloudFront distribution: ' + error);
                }
              }.bind(this));
            }.bind(this));
          } else {
            cf.deleteDistribution({
              Id: distId,
              IfMatch: data.ETag,
            }, function(error, data) {
              if (error) {
                console.error('Error while removing CloudFront distribution: ' + error);
              }
            }.bind(this));
          }

          return;
        }

        distConfig.Enabled = false;

        cf.updateDistribution({
          Id: distId,
          IfMatch: data.ETag,
          DistributionConfig: distConfig,
        }, function(error, data) {
          if (error) {
            console.error('Error while updating CloudFront distribution: ' + error);
            return;
          }

          waitForCfDistDisabled(distId, data.ETag, function(distId, eTag) {
            cf.deleteDistribution({
              Id: distId,
              IfMatch: eTag,
            }, function(error, data) {
              if (error) {
                console.error('Error while removing CloudFront distribution: ' + error);
              }
            }.bind(this));
          }.bind(this));
        }.bind(this));
      }.bind(this));
    }

    function waitForCfDistDisabled(distId, eTag, cb, estTime) {
      if (typeof estTime === 'undefined') {
        estTime = 15 * 60; // 15 minutes
      }

      cf.getDistribution({
        Id: distId,
      }, function(error, data) {
        if (error) {
          console.error('Error while retrieving CloudFront distribution status: ' + error);
          return;
        }

        var status = data.Distribution.Status;

        if (status !== 'Deployed') {
          var estTimeMinutes = (estTime / 60);

          if (estTimeMinutes < 0) {
            estTimeMinutes = '...';
          }

          console.log(
            'Waiting for CloudFront distribution ' +
            distId + ' to be disabled (currently ' + status + ', ETC ' + estTimeMinutes + ' min.)'
          );

          setTimeout(function() {
            waitForCfDistDisabled(distId, eTag, cb, estTime - 30);
          }.bind(this), 1000 * 30);

          return;
        }

        cb(distId, eTag);
      }.bind(this));
    }

    function listCfDistributions(nextMarker) {
      var payload = {
        MaxItems: '100',
      };

      if (nextMarker) {
        payload.Marker = nextMarker;
      }

      cf.listDistributions(payload, function(error, data) {
        if (error) {
          console.error('Error while retrieving CloudFront distributions: ' + error);
          return;
        }

        for (var i = 0; i < data.DistributionList.Items.length; i++) {
          var cfData = data.DistributionList.Items[i];
          var distId = cfData.Id;
          var comment = cfData.Comment;

          if (matchAwsResource('CloudFront', distId) && matchResourceName(comment)) {
            pushQueue(removeCfDistribution, [distId]);
          }
        }

        if (data.DistributionList.IsTruncated) {
          var marker = data.DistributionList.NextMarker;

          console.log('Retrieve next set of CloudFront distributions (#' + marker + ')');

          listCfDistributions(marker);
        }
      }.bind(this));
    }

    listCfDistributions.bind(this)();

    console.log('=== DynamoDB ===');

    var dynamodb = deepAwsService('DynamoDB');

    function removeDynamoDbTableChain(tableName) {
      console.log('--> Deleting DynamoDB table ' + tableName);

      dynamodb.deleteTable({
        TableName: tableName,
      }, function(error, data) {
        if (error) {
          console.error('Error while deleting DynamoDB table: ' + error);
        }
      });
    }

    dynamodb.listTables({
      Limit: 100,
    }, function(error, data) {
      if (error) {
        console.error('Error while retrieving DynamoDB tables: ' + error);
        return;
      }

      for (var i = 0; i < data.TableNames.length; i++) {
        var tableName = data.TableNames[i];

        if (matchAwsResource('DynamoDB', tableName) && matchResourceName(tableName)) {
          pushQueue(removeDynamoDbTableChain, [tableName]);
        }
      }
    });

    console.log('=== S3 ===');

    var s3 = deepAwsService('S3');

    function removeS3BucketChain(bucketName) {
      console.log('--> Deleting S3 bucket ' + bucketName);

      s3.deleteBucketWebsite({
        Bucket: bucketName,
      }, function(error, data) {
        if (error) {
          console.log('No public website bound to ' + bucketName + '. Skipping...');
        }

        // @todo: remove this hook when fixing s3 sync functionality
        tmp.tmpName(function(error, credentialsFile) {
          if (error) {
            console.error('Error while creating tmp credentials file for deleting S3 bucket: ' + error);
            return;
          }

          var credentials = '[profile deep]' + os.EOL;
          credentials += 'aws_access_key_id=' + config.aws.accessKeyId + os.EOL;
          credentials += 'aws_secret_access_key=' + config.aws.secretAccessKey + os.EOL;
          credentials += 'region=' + config.aws.region + os.EOL;

          fs.writeFile(credentialsFile, credentials, function(error) {
            if (error) {
              console.error('Error while persisting tmp credentials into ' + credentialsFile + ' for deleting S3 bucket: ' + error);
              return;
            }

            var removeCommand = 'export AWS_CONFIG_FILE=' + credentialsFile + '; ';
            removeCommand += 'aws --profile deep s3 rb --force \'s3://' + bucketName + '\'';

            exec(removeCommand, function(error, stdout, stderr) {
              if (error) {
                console.error('Error while executing S3 bucket remove command (' + removeCommand + '): ' + stderr);
              }

              fs.unlink(credentialsFile);
            });
          });
        });

        // todo: does not work because of buckets' objects...
        //s3.deleteBucket({
        //  Bucket: bucketName,
        //}, function(error, data) {
        //  if (error) {
        //    console.error('Error while deleting S3 bucket: ' + error);
        //  }
        //});
      });
    }

    s3.listBuckets(function(error, data) {
      if (error) {
        console.error('Error while retrieving S3 buckets: ' + error);
        return;
      }

      for (var i = 0; i < data.Buckets.length; i++) {
        var bucketData = data.Buckets[i];
        var bucketName = bucketData.Name;

        if (matchAwsResource('S3', bucketName) && matchResourceName(bucketName)) {
          pushQueue(removeS3BucketChain, [bucketName]);
        }
      }
    });
  }.bind(this));
};
