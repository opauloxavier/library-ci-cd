import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import {
  defaultBaseBranch,
  domainName,
  repositoryName,
} from './config/constants';
import { Construct } from 'constructs';

export interface ReleaseStackProps extends cdk.StackProps {
  readonly projectName: string;
  readonly gitHub: { repo: string; owner: string; branchOrRef?: string };
  readonly packageRepo?: PackageRepoProps;
}

interface PackageRepoProps {
  readonly domain: string;
  readonly repo: string;
  readonly owner: string;
  readonly region: string;
}

export class ReleaseStack extends cdk.Stack {
  private readonly logGroup: logs.LogGroup;
  private readonly buildProject: codebuild.Project;

  constructor(scope: Construct, id: string, props: ReleaseStackProps) {
    super(scope, id);

    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      retention: logs.RetentionDays.TWO_WEEKS,
    });
    this.buildProject = this.createBuildProject(props);
    this.buildProject.role?.addManagedPolicy(
      iam.ManagedPolicy.fromManagedPolicyArn(
        this,
        'CodeArtifactPolicy',
        'arn:aws:iam::aws:policy/AWSCodeArtifactAdminAccess'
      )
    );
    this.buildProject.role?.addManagedPolicy(
      iam.ManagedPolicy.fromManagedPolicyArn(
        this,
        'SSMPolicy',
        'arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess'
      )
    );
  }

  private createBuildProject(props: ReleaseStackProps) {
    const { projectName, gitHub } = props;

    const logging = { logGroup: this.logGroup, prefix: projectName };
    const buildEnvironment = {
      buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
      privileged: true,
    };
    const buildProject = new codebuild.Project(this, projectName, {
      projectName: projectName,
      buildSpec: this.getBuildSpec(props),
      environment: buildEnvironment,
      source: codebuild.Source.gitHub({
        owner: gitHub.owner,
        repo: gitHub.repo,
        branchOrRef: gitHub.branchOrRef || defaultBaseBranch,
      }),
      logging: { cloudWatch: logging },
    });
    return buildProject;
  }

  private getBuildSpec(props: ReleaseStackProps) {
    const repoProps = props.packageRepo ?? {
      domain: domainName,
      repo: repositoryName,
      owner: this.account,
      region: this.region,
    };
    const buildSpec = {
      version: 0.2,
      env: {
        shell: 'bash',
        variables: {
          CI: 'true',
          NPM_DIST_TAG: 'latest',
          TWINE_USERNAME: 'aws',
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
          commands: [
            'curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg',
            'echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null',
            'apt-get update',
            'apt-get install gh',
            'npm install -g npm@latest publib@latest',
            'pip3 install --upgrade pip --user --no-warn-script-location',
            'pip3 install packaging --user --no-warn-script-location',
          ],
        },
        build: {
          commands: [
            'npm ci',
            'npm run release',
            'gh release create v$(cat dist/version.txt) -F dist/changelog.md -t v$(cat dist/version.txt)',
          ].concat(getReleaseCommands(repoProps)),
        },
      },
    };
    return codebuild.BuildSpec.fromObjectToYaml(buildSpec);
  }
}

function getReleaseCommands(props: PackageRepoProps): string[] {
  const { domain, repo, owner, region } = props;
  let commands: string[] = [];
  const registry = `${domain}-${owner}.d.codeartifact.${region}.amazonaws.com`;
  commands.push(
    `export NPM_REGISTRY=${registry}`,
    `export TWINE_REPOSITORY_URL=https://${registry}/pypi/${repo}`,
    `codeartifact_token=$(aws codeartifact get-authorization-token --domain ${domain} --domain-owner ${owner} --query authorizationToken --output text)`,
    'export NPM_TOKEN=$codeartifact_token TWINE_PASSWORD=$codeartifact_token',
    `printf 'registry=https://${registry}/npm/${repo}/\n` +
      `//${registry}/npm/${repo}/:always-auth=true\n` +
      `//${registry}/npm/${repo}/:_authToken=%s' \${NPM_TOKEN} > .npmrc`,
    'publib-npm',
    'publib-pypi',
    'unset NPM_REGISTRY NPM_TOKEN TWINE_REPOSITORY_URL TWINE_PASSWORD'
  );
  return commands;
}
