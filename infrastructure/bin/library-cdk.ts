#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkPipeline } from '../lib/cdk-pipeline-stack';

const app = new cdk.App();
const builderToolsEnv: cdk.Environment = {
  account: '091940524711',
  region: 'us-east-1',
};

new CdkPipeline(app, 'ComponentLibraryStack', {
  env: builderToolsEnv,
});
