import * as cdk from 'aws-cdk-lib';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { BuildStack } from './build-stack';
import { ReleaseStack } from './release-stack';
import {
  defaultBaseBranch,
  gitHub,
  pipelineName,
  primaryOutputDirectory,
  pullRequestProjectName,
  releaseProjectName,
} from './config/constants';
import { Construct } from 'constructs';

export class InfrastructureStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);
    new BuildStack(this, pullRequestProjectName, {
      gitHub,
      projectName: pullRequestProjectName,
    });
    // new ReleaseStack(this, releaseProjectName, {
    //   gitHub,
    //   projectName: releaseProjectName,
    // });
  }
}

export class CdkPipeline extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const oauth = cdk.SecretValue.secretsManager('my-github-token');
    const synth = new pipelines.ShellStep('Synth', {
      input: pipelines.CodePipelineSource.gitHub(
        'opauloxavier/library-ci-cd',
        defaultBaseBranch,
        {
          authentication: cdk.SecretValue.secretsManager(
            'arn:aws:secretsmanager:us-east-1:027483264577:secret:github-token-H7Y0In'
          ),
        }
      ),
      commands: [
        'npm install -g npm@latest',
        'cd infrastructure',
        'npm ci',
        'npm run build',
        'npx cdk synth',
      ],
      primaryOutputDirectory,
    });
    const pipeline = new pipelines.CodePipeline(this, 'CdkPipeline', {
      synth,
      pipelineName,
    });
    pipeline.addStage(new InfrastructureStage(this, 'InfraStage'), {
      pre: [new pipelines.ManualApprovalStep('Approval')],
    });
  }
}
