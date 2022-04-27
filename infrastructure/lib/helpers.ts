import * as iam from '@aws-cdk/aws-iam';
import { builderToolsSharedAccount } from './config/constants';

export const privatePackageProfile = [
  `export NPM_TOKEN=$(aws codeartifact get-authorization-token --domain junglescout --domain-owner ${builderToolsSharedAccount} \
    --query authorizationToken --output text)`,
  `cp .js-npmrc .npmrc | true`,
];

export function createPrivatePackagePolicyStatements(): iam.PolicyStatement[] {
  return [
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'codeartifact:Describe*',
        'codeartifact:Get*',
        'codeartifact:List*',
        'codeartifact:ReadFromRepository',
      ],
      resources: ['*'],
    }),
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sts:GetServiceBearerToken'],
      resources: ['*'],
    }),
  ];
}
