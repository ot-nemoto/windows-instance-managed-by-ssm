#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { WindowsInstanceManagedBySsmStack } from '../lib/windows-instance-managed-by-ssm-stack';

const app = new cdk.App();
new WindowsInstanceManagedBySsmStack(app, 'WindowsInstanceManagedBySsmStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
    vpcId: process.env.VPC_ID || 'vpc-0123456789abcdef0',
    keyPairName: process.env.KEY_PAIR_NAME || 'sandbox-key-pair',
});
