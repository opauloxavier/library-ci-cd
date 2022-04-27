import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';

import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { defaultBaseBranch } from './config/constants';
import { Construct } from 'constructs';

export interface BuildStackProps extends cdk.StackProps {
  readonly projectName: string;
  readonly gitHub: {
    repo: string;
    owner: string;
    webhookFilters?: codebuild.FilterGroup[];
  };
}

export class BuildStack extends cdk.Stack {
  private readonly logGroup: logs.LogGroup;
  private readonly buildProject: codebuild.Project;

  constructor(scope: Construct, id: string, props: BuildStackProps) {
    super(scope, id);

    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      retention: logs.RetentionDays.TWO_WEEKS,
    });
    this.buildProject = this.createBuildProject(props);
    this.buildProject.role?.addManagedPolicy(
      iam.ManagedPolicy.fromManagedPolicyArn(
        this,
        'SSMPolicy',
        'arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess'
      )
    );
  }

  private createBuildProject(props: BuildStackProps) {
    const { projectName, gitHub } = props;

    const logging = { logGroup: this.logGroup, prefix: projectName };
    const buildEnvironment = {
      buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
      computeType: codebuild.ComputeType.LARGE,
      privileged: true,
    };

    const filters: codebuild.FilterGroup[] =
      gitHub.webhookFilters ?? defaultWebhookFilters;
    const buildProject = new codebuild.Project(this, projectName, {
      projectName: projectName,
      buildSpec: BuildStack.getBuildSpec(),
      environment: buildEnvironment,
      source: codebuild.Source.gitHub({
        owner: gitHub.owner,
        repo: gitHub.repo,
        webhookFilters: defaultWebhookFilters,
      }),
      logging: { cloudWatch: logging },
    });
    return buildProject;
  }

  private static getBuildSpec() {
    const buildSpec = {
      version: 0.2,
      env: {
        shell: 'bash',
        variables: {
          CI: 'true',
        },
        'parameter-store': {
          GITHUB_TOKEN: '/cdk-bootstrap/github-token',
        },
      },
      phases: {
        install: {
          'runtime-versions': {
            nodejs: '14',
          },
          commands: ['yarn install'],
        },
        build: {
          commands: [
            'echo "COMMIT_SHA=${CODEBUILD_RESOLVED_SOURCE_VERSION}" > commit.txt',
          ],
        },
      },
    };
    return codebuild.BuildSpec.fromObjectToYaml(buildSpec);
  }
}

const defaultWebhookFilters = [
  codebuild.FilterGroup.inEventOf(
    codebuild.EventAction.PULL_REQUEST_CREATED,
    codebuild.EventAction.PULL_REQUEST_UPDATED,
    codebuild.EventAction.PULL_REQUEST_REOPENED
  ).andBaseBranchIs(defaultBaseBranch),
];
