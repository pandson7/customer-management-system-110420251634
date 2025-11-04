#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CustomerManagementStack110420251634 } from '../lib/infrastructure-stack';

const app = new cdk.App();
new CustomerManagementStack110420251634(app, 'CustomerManagementStack110420251634', {});
