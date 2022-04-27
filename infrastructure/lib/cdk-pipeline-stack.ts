import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { BuildStack } from './build-stack';
import {
  defaultBaseBranch,
  gitHub,
  pipelineName,
  primaryOutputDirectory,
  pullRequestProjectName,
  REPO_STRING,
} from './config/constants';
import { Construct } from 'constructs';
import { LintBuildspec } from './build-specs/LintBuildspec';
import { UnitTestBuildSpec } from './build-specs/UnitTestBuildspec';
import { PublishBuildSpec } from './build-specs/publishBuildspec';
import { changeVersionBuildSpec } from './build-specs/ChangeVersionBuildSpec';

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
    const synth = new pipelines.ShellStep('Synth', {
      input: pipelines.CodePipelineSource.gitHub(
        REPO_STRING,
        defaultBaseBranch
      ),
      commands: [
        'npm install -g npm@6.14.15',
        'npm install --global yarn',
        'yarn install',
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

    pipeline.addWave('QA', {
      pre: [
        new pipelines.CodeBuildStep('Lint', {
          partialBuildSpec: codebuild.BuildSpec.fromObject(LintBuildspec()),
          commands: [],
        }),
        new pipelines.CodeBuildStep('Test', {
          partialBuildSpec: codebuild.BuildSpec.fromObject(UnitTestBuildSpec()),
          commands: [],
        }),
      ],
    });

    pipeline.addWave('Publish', {
      pre: [new pipelines.ManualApprovalStep('Approval')],
      post: [
        new pipelines.CodeBuildStep('Change Version', {
          partialBuildSpec: codebuild.BuildSpec.fromObject(PublishBuildSpec()),
          commands: [],
        }),
        new pipelines.CodeBuildStep('publish', {
          partialBuildSpec: codebuild.BuildSpec.fromObject(
            changeVersionBuildSpec()
          ),
          commands: [],
        }),
      ],
    });
    // pipeline.addStage(new InfrastructureStage(this, 'InfraStage'), {
    //   pre: [new pipelines.ManualApprovalStep('Approval')],
    // });
  }
}
