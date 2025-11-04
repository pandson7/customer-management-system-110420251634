import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class CustomerManagementStack110420251634 extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const customersTable = new dynamodb.Table(this, 'CustomersTable110420251634', {
      tableName: 'Customers110420251634',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Enable auto scaling
    customersTable.autoScaleReadCapacity({
      minCapacity: 1,
      maxCapacity: 10
    });

    customersTable.autoScaleWriteCapacity({
      minCapacity: 1,
      maxCapacity: 10
    });

    // Lambda function
    const customerLambda = new lambda.Function(this, 'CustomerLambda110420251634', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.TABLE_NAME;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { httpMethod, path, pathParameters, body, queryStringParameters } = event;
    
    switch (httpMethod) {
      case 'GET':
        if (path === '/api/customers') {
          if (queryStringParameters?.q) {
            return await searchCustomers(queryStringParameters.q, headers);
          }
          return await getAllCustomers(headers);
        } else if (pathParameters?.email) {
          return await getCustomer(pathParameters.email, headers);
        }
        break;
        
      case 'POST':
        if (path === '/api/customers') {
          return await createCustomer(JSON.parse(body), headers);
        }
        break;
        
      case 'PUT':
        if (pathParameters?.email) {
          return await updateCustomer(pathParameters.email, JSON.parse(body), headers);
        }
        break;
        
      case 'DELETE':
        if (pathParameters?.email) {
          return await deleteCustomer(pathParameters.email, headers);
        }
        break;
    }
    
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};

async function getAllCustomers(headers) {
  const result = await docClient.send(new ScanCommand({ TableName: tableName }));
  return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
}

async function getCustomer(email, headers) {
  const result = await docClient.send(new GetCommand({
    TableName: tableName,
    Key: { email }
  }));
  
  if (!result.Item) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Customer not found' }) };
  }
  
  return { statusCode: 200, headers, body: JSON.stringify(result.Item) };
}

async function createCustomer(customer, headers) {
  if (!customer.name || !customer.email || !customer.phone || !customer.address) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
  }
  
  // Check if customer already exists
  try {
    const existing = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { email: customer.email }
    }));
    
    if (existing.Item) {
      return { statusCode: 409, headers, body: JSON.stringify({ error: 'Customer with this email already exists' }) };
    }
  } catch (error) {
    // Continue if customer doesn't exist
  }
  
  const now = new Date().toISOString();
  const newCustomer = {
    customerId: require('crypto').randomUUID(),
    ...customer,
    registrationDate: now,
    lastModified: now
  };
  
  await docClient.send(new PutCommand({
    TableName: tableName,
    Item: newCustomer
  }));
  
  return { statusCode: 201, headers, body: JSON.stringify(newCustomer) };
}

async function updateCustomer(email, updates, headers) {
  const now = new Date().toISOString();
  const updateExpression = [];
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};
  
  Object.keys(updates).forEach(key => {
    if (key !== 'email' && key !== 'customerId' && key !== 'registrationDate') {
      updateExpression.push(\`#\${key} = :\${key}\`);
      expressionAttributeNames[\`#\${key}\`] = key;
      expressionAttributeValues[\`:\${key}\`] = updates[key];
    }
  });
  
  updateExpression.push('#lastModified = :lastModified');
  expressionAttributeNames['#lastModified'] = 'lastModified';
  expressionAttributeValues[':lastModified'] = now;
  
  await docClient.send(new UpdateCommand({
    TableName: tableName,
    Key: { email },
    UpdateExpression: \`SET \${updateExpression.join(', ')}\`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  }));
  
  const result = await docClient.send(new GetCommand({
    TableName: tableName,
    Key: { email }
  }));
  
  return { statusCode: 200, headers, body: JSON.stringify(result.Item) };
}

async function deleteCustomer(email, headers) {
  await docClient.send(new DeleteCommand({
    TableName: tableName,
    Key: { email }
  }));
  
  return { statusCode: 200, headers, body: JSON.stringify({ message: 'Customer deleted successfully' }) };
}

async function searchCustomers(query, headers) {
  const result = await docClient.send(new ScanCommand({ TableName: tableName }));
  const customers = result.Items || [];
  
  const filtered = customers.filter(customer => 
    customer.name.toLowerCase().includes(query.toLowerCase()) ||
    customer.email.toLowerCase().includes(query.toLowerCase())
  );
  
  return { statusCode: 200, headers, body: JSON.stringify(filtered) };
}
      `),
      environment: {
        TABLE_NAME: customersTable.tableName
      }
    });

    // Grant Lambda permissions to access DynamoDB
    customersTable.grantReadWriteData(customerLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, 'CustomerApi110420251634', {
      restApiName: 'Customer Management API 110420251634',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key']
      }
    });

    const integration = new apigateway.LambdaIntegration(customerLambda);

    // API routes
    const apiResource = api.root.addResource('api');
    const customersResource = apiResource.addResource('customers');
    
    customersResource.addMethod('GET', integration);
    customersResource.addMethod('POST', integration);
    
    const customerResource = customersResource.addResource('{email}');
    customerResource.addMethod('GET', integration);
    customerResource.addMethod('PUT', integration);
    customerResource.addMethod('DELETE', integration);

    // Output API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Customer Management API URL'
    });
  }
}
