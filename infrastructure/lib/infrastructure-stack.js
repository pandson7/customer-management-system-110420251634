"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerManagementStack110420251634 = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
class CustomerManagementStack110420251634 extends cdk.Stack {
    constructor(scope, id, props) {
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
exports.CustomerManagementStack110420251634 = CustomerManagementStack110420251634;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mcmFzdHJ1Y3R1cmUtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmZyYXN0cnVjdHVyZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyxtRUFBcUQ7QUFDckQsK0RBQWlEO0FBQ2pELHVFQUF5RDtBQUl6RCxNQUFhLG1DQUFvQyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ2hFLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsaUJBQWlCO1FBQ2pCLE1BQU0sY0FBYyxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsNEJBQTRCLEVBQUU7WUFDNUUsU0FBUyxFQUFFLHVCQUF1QjtZQUNsQyxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNwRSxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXO1lBQzdDLFlBQVksRUFBRSxDQUFDO1lBQ2YsYUFBYSxFQUFFLENBQUM7WUFDaEIsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztTQUN6QyxDQUFDLENBQUM7UUFFSCxzQkFBc0I7UUFDdEIsY0FBYyxDQUFDLHFCQUFxQixDQUFDO1lBQ25DLFdBQVcsRUFBRSxDQUFDO1lBQ2QsV0FBVyxFQUFFLEVBQUU7U0FDaEIsQ0FBQyxDQUFDO1FBRUgsY0FBYyxDQUFDLHNCQUFzQixDQUFDO1lBQ3BDLFdBQVcsRUFBRSxDQUFDO1lBQ2QsV0FBVyxFQUFFLEVBQUU7U0FDaEIsQ0FBQyxDQUFDO1FBRUgsa0JBQWtCO1FBQ2xCLE1BQU0sY0FBYyxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsNEJBQTRCLEVBQUU7WUFDN0UsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsZUFBZTtZQUN4QixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BdUs1QixDQUFDO1lBQ0YsV0FBVyxFQUFFO2dCQUNYLFVBQVUsRUFBRSxjQUFjLENBQUMsU0FBUzthQUNyQztTQUNGLENBQUMsQ0FBQztRQUVILDhDQUE4QztRQUM5QyxjQUFjLENBQUMsa0JBQWtCLENBQUMsY0FBYyxDQUFDLENBQUM7UUFFbEQsY0FBYztRQUNkLE1BQU0sR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUseUJBQXlCLEVBQUU7WUFDbEUsV0FBVyxFQUFFLHNDQUFzQztZQUNuRCwyQkFBMkIsRUFBRTtnQkFDM0IsWUFBWSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVztnQkFDekMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVztnQkFDekMsWUFBWSxFQUFFLENBQUMsY0FBYyxFQUFFLFlBQVksRUFBRSxlQUFlLEVBQUUsV0FBVyxDQUFDO2FBQzNFO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsTUFBTSxXQUFXLEdBQUcsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLENBQUM7UUFFckUsYUFBYTtRQUNiLE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hELE1BQU0saUJBQWlCLEdBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUUvRCxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ2hELGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFakQsTUFBTSxnQkFBZ0IsR0FBRyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbEUsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztRQUMvQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQy9DLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFbEQsaUJBQWlCO1FBQ2pCLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFO1lBQ2hDLEtBQUssRUFBRSxHQUFHLENBQUMsR0FBRztZQUNkLFdBQVcsRUFBRSw2QkFBNkI7U0FDM0MsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBM09ELGtGQTJPQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGNsYXNzIEN1c3RvbWVyTWFuYWdlbWVudFN0YWNrMTEwNDIwMjUxNjM0IGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gRHluYW1vREIgVGFibGVcbiAgICBjb25zdCBjdXN0b21lcnNUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnQ3VzdG9tZXJzVGFibGUxMTA0MjAyNTE2MzQnLCB7XG4gICAgICB0YWJsZU5hbWU6ICdDdXN0b21lcnMxMTA0MjAyNTE2MzQnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdlbWFpbCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUFJPVklTSU9ORUQsXG4gICAgICByZWFkQ2FwYWNpdHk6IDUsXG4gICAgICB3cml0ZUNhcGFjaXR5OiA1LFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWVxuICAgIH0pO1xuXG4gICAgLy8gRW5hYmxlIGF1dG8gc2NhbGluZ1xuICAgIGN1c3RvbWVyc1RhYmxlLmF1dG9TY2FsZVJlYWRDYXBhY2l0eSh7XG4gICAgICBtaW5DYXBhY2l0eTogMSxcbiAgICAgIG1heENhcGFjaXR5OiAxMFxuICAgIH0pO1xuXG4gICAgY3VzdG9tZXJzVGFibGUuYXV0b1NjYWxlV3JpdGVDYXBhY2l0eSh7XG4gICAgICBtaW5DYXBhY2l0eTogMSxcbiAgICAgIG1heENhcGFjaXR5OiAxMFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRhIGZ1bmN0aW9uXG4gICAgY29uc3QgY3VzdG9tZXJMYW1iZGEgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdDdXN0b21lckxhbWJkYTExMDQyMDI1MTYzNCcsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMl9YLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUlubGluZShgXG5jb25zdCB7IER5bmFtb0RCQ2xpZW50IH0gPSByZXF1aXJlKCdAYXdzLXNkay9jbGllbnQtZHluYW1vZGInKTtcbmNvbnN0IHsgRHluYW1vREJEb2N1bWVudENsaWVudCwgR2V0Q29tbWFuZCwgUHV0Q29tbWFuZCwgVXBkYXRlQ29tbWFuZCwgRGVsZXRlQ29tbWFuZCwgU2NhbkNvbW1hbmQgfSA9IHJlcXVpcmUoJ0Bhd3Mtc2RrL2xpYi1keW5hbW9kYicpO1xuXG5jb25zdCBjbGllbnQgPSBuZXcgRHluYW1vREJDbGllbnQoe30pO1xuY29uc3QgZG9jQ2xpZW50ID0gRHluYW1vREJEb2N1bWVudENsaWVudC5mcm9tKGNsaWVudCk7XG5jb25zdCB0YWJsZU5hbWUgPSBwcm9jZXNzLmVudi5UQUJMRV9OQU1FO1xuXG5leHBvcnRzLmhhbmRsZXIgPSBhc3luYyAoZXZlbnQpID0+IHtcbiAgY29uc3QgaGVhZGVycyA9IHtcbiAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxuICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ0NvbnRlbnQtVHlwZScsXG4gICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnOiAnR0VULCBQT1NULCBQVVQsIERFTEVURSwgT1BUSU9OUydcbiAgfTtcblxuICBpZiAoZXZlbnQuaHR0cE1ldGhvZCA9PT0gJ09QVElPTlMnKSB7XG4gICAgcmV0dXJuIHsgc3RhdHVzQ29kZTogMjAwLCBoZWFkZXJzLCBib2R5OiAnJyB9O1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCB7IGh0dHBNZXRob2QsIHBhdGgsIHBhdGhQYXJhbWV0ZXJzLCBib2R5LCBxdWVyeVN0cmluZ1BhcmFtZXRlcnMgfSA9IGV2ZW50O1xuICAgIFxuICAgIHN3aXRjaCAoaHR0cE1ldGhvZCkge1xuICAgICAgY2FzZSAnR0VUJzpcbiAgICAgICAgaWYgKHBhdGggPT09ICcvYXBpL2N1c3RvbWVycycpIHtcbiAgICAgICAgICBpZiAocXVlcnlTdHJpbmdQYXJhbWV0ZXJzPy5xKSB7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgc2VhcmNoQ3VzdG9tZXJzKHF1ZXJ5U3RyaW5nUGFyYW1ldGVycy5xLCBoZWFkZXJzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IGdldEFsbEN1c3RvbWVycyhoZWFkZXJzKTtcbiAgICAgICAgfSBlbHNlIGlmIChwYXRoUGFyYW1ldGVycz8uZW1haWwpIHtcbiAgICAgICAgICByZXR1cm4gYXdhaXQgZ2V0Q3VzdG9tZXIocGF0aFBhcmFtZXRlcnMuZW1haWwsIGhlYWRlcnMpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBcbiAgICAgIGNhc2UgJ1BPU1QnOlxuICAgICAgICBpZiAocGF0aCA9PT0gJy9hcGkvY3VzdG9tZXJzJykge1xuICAgICAgICAgIHJldHVybiBhd2FpdCBjcmVhdGVDdXN0b21lcihKU09OLnBhcnNlKGJvZHkpLCBoZWFkZXJzKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgICAgXG4gICAgICBjYXNlICdQVVQnOlxuICAgICAgICBpZiAocGF0aFBhcmFtZXRlcnM/LmVtYWlsKSB7XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IHVwZGF0ZUN1c3RvbWVyKHBhdGhQYXJhbWV0ZXJzLmVtYWlsLCBKU09OLnBhcnNlKGJvZHkpLCBoZWFkZXJzKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgICAgXG4gICAgICBjYXNlICdERUxFVEUnOlxuICAgICAgICBpZiAocGF0aFBhcmFtZXRlcnM/LmVtYWlsKSB7XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IGRlbGV0ZUN1c3RvbWVyKHBhdGhQYXJhbWV0ZXJzLmVtYWlsLCBoZWFkZXJzKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHsgc3RhdHVzQ29kZTogNDA0LCBoZWFkZXJzLCBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnTm90IGZvdW5kJyB9KSB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiB7IHN0YXR1c0NvZGU6IDUwMCwgaGVhZGVycywgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSB9O1xuICB9XG59O1xuXG5hc3luYyBmdW5jdGlvbiBnZXRBbGxDdXN0b21lcnMoaGVhZGVycykge1xuICBjb25zdCByZXN1bHQgPSBhd2FpdCBkb2NDbGllbnQuc2VuZChuZXcgU2NhbkNvbW1hbmQoeyBUYWJsZU5hbWU6IHRhYmxlTmFtZSB9KSk7XG4gIHJldHVybiB7IHN0YXR1c0NvZGU6IDIwMCwgaGVhZGVycywgYm9keTogSlNPTi5zdHJpbmdpZnkocmVzdWx0Lkl0ZW1zIHx8IFtdKSB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRDdXN0b21lcihlbWFpbCwgaGVhZGVycykge1xuICBjb25zdCByZXN1bHQgPSBhd2FpdCBkb2NDbGllbnQuc2VuZChuZXcgR2V0Q29tbWFuZCh7XG4gICAgVGFibGVOYW1lOiB0YWJsZU5hbWUsXG4gICAgS2V5OiB7IGVtYWlsIH1cbiAgfSkpO1xuICBcbiAgaWYgKCFyZXN1bHQuSXRlbSkge1xuICAgIHJldHVybiB7IHN0YXR1c0NvZGU6IDQwNCwgaGVhZGVycywgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0N1c3RvbWVyIG5vdCBmb3VuZCcgfSkgfTtcbiAgfVxuICBcbiAgcmV0dXJuIHsgc3RhdHVzQ29kZTogMjAwLCBoZWFkZXJzLCBib2R5OiBKU09OLnN0cmluZ2lmeShyZXN1bHQuSXRlbSkgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlQ3VzdG9tZXIoY3VzdG9tZXIsIGhlYWRlcnMpIHtcbiAgaWYgKCFjdXN0b21lci5uYW1lIHx8ICFjdXN0b21lci5lbWFpbCB8fCAhY3VzdG9tZXIucGhvbmUgfHwgIWN1c3RvbWVyLmFkZHJlc3MpIHtcbiAgICByZXR1cm4geyBzdGF0dXNDb2RlOiA0MDAsIGhlYWRlcnMsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdNaXNzaW5nIHJlcXVpcmVkIGZpZWxkcycgfSkgfTtcbiAgfVxuICBcbiAgLy8gQ2hlY2sgaWYgY3VzdG9tZXIgYWxyZWFkeSBleGlzdHNcbiAgdHJ5IHtcbiAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IGRvY0NsaWVudC5zZW5kKG5ldyBHZXRDb21tYW5kKHtcbiAgICAgIFRhYmxlTmFtZTogdGFibGVOYW1lLFxuICAgICAgS2V5OiB7IGVtYWlsOiBjdXN0b21lci5lbWFpbCB9XG4gICAgfSkpO1xuICAgIFxuICAgIGlmIChleGlzdGluZy5JdGVtKSB7XG4gICAgICByZXR1cm4geyBzdGF0dXNDb2RlOiA0MDksIGhlYWRlcnMsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdDdXN0b21lciB3aXRoIHRoaXMgZW1haWwgYWxyZWFkeSBleGlzdHMnIH0pIH07XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIC8vIENvbnRpbnVlIGlmIGN1c3RvbWVyIGRvZXNuJ3QgZXhpc3RcbiAgfVxuICBcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICBjb25zdCBuZXdDdXN0b21lciA9IHtcbiAgICBjdXN0b21lcklkOiByZXF1aXJlKCdjcnlwdG8nKS5yYW5kb21VVUlEKCksXG4gICAgLi4uY3VzdG9tZXIsXG4gICAgcmVnaXN0cmF0aW9uRGF0ZTogbm93LFxuICAgIGxhc3RNb2RpZmllZDogbm93XG4gIH07XG4gIFxuICBhd2FpdCBkb2NDbGllbnQuc2VuZChuZXcgUHV0Q29tbWFuZCh7XG4gICAgVGFibGVOYW1lOiB0YWJsZU5hbWUsXG4gICAgSXRlbTogbmV3Q3VzdG9tZXJcbiAgfSkpO1xuICBcbiAgcmV0dXJuIHsgc3RhdHVzQ29kZTogMjAxLCBoZWFkZXJzLCBib2R5OiBKU09OLnN0cmluZ2lmeShuZXdDdXN0b21lcikgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gdXBkYXRlQ3VzdG9tZXIoZW1haWwsIHVwZGF0ZXMsIGhlYWRlcnMpIHtcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICBjb25zdCB1cGRhdGVFeHByZXNzaW9uID0gW107XG4gIGNvbnN0IGV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXMgPSB7fTtcbiAgY29uc3QgZXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzID0ge307XG4gIFxuICBPYmplY3Qua2V5cyh1cGRhdGVzKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgaWYgKGtleSAhPT0gJ2VtYWlsJyAmJiBrZXkgIT09ICdjdXN0b21lcklkJyAmJiBrZXkgIT09ICdyZWdpc3RyYXRpb25EYXRlJykge1xuICAgICAgdXBkYXRlRXhwcmVzc2lvbi5wdXNoKFxcYCNcXCR7a2V5fSA9IDpcXCR7a2V5fVxcYCk7XG4gICAgICBleHByZXNzaW9uQXR0cmlidXRlTmFtZXNbXFxgI1xcJHtrZXl9XFxgXSA9IGtleTtcbiAgICAgIGV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXNbXFxgOlxcJHtrZXl9XFxgXSA9IHVwZGF0ZXNba2V5XTtcbiAgICB9XG4gIH0pO1xuICBcbiAgdXBkYXRlRXhwcmVzc2lvbi5wdXNoKCcjbGFzdE1vZGlmaWVkID0gOmxhc3RNb2RpZmllZCcpO1xuICBleHByZXNzaW9uQXR0cmlidXRlTmFtZXNbJyNsYXN0TW9kaWZpZWQnXSA9ICdsYXN0TW9kaWZpZWQnO1xuICBleHByZXNzaW9uQXR0cmlidXRlVmFsdWVzWyc6bGFzdE1vZGlmaWVkJ10gPSBub3c7XG4gIFxuICBhd2FpdCBkb2NDbGllbnQuc2VuZChuZXcgVXBkYXRlQ29tbWFuZCh7XG4gICAgVGFibGVOYW1lOiB0YWJsZU5hbWUsXG4gICAgS2V5OiB7IGVtYWlsIH0sXG4gICAgVXBkYXRlRXhwcmVzc2lvbjogXFxgU0VUIFxcJHt1cGRhdGVFeHByZXNzaW9uLmpvaW4oJywgJyl9XFxgLFxuICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lczogZXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzLFxuICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IGV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXMsXG4gICAgUmV0dXJuVmFsdWVzOiAnQUxMX05FVydcbiAgfSkpO1xuICBcbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZG9jQ2xpZW50LnNlbmQobmV3IEdldENvbW1hbmQoe1xuICAgIFRhYmxlTmFtZTogdGFibGVOYW1lLFxuICAgIEtleTogeyBlbWFpbCB9XG4gIH0pKTtcbiAgXG4gIHJldHVybiB7IHN0YXR1c0NvZGU6IDIwMCwgaGVhZGVycywgYm9keTogSlNPTi5zdHJpbmdpZnkocmVzdWx0Lkl0ZW0pIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGRlbGV0ZUN1c3RvbWVyKGVtYWlsLCBoZWFkZXJzKSB7XG4gIGF3YWl0IGRvY0NsaWVudC5zZW5kKG5ldyBEZWxldGVDb21tYW5kKHtcbiAgICBUYWJsZU5hbWU6IHRhYmxlTmFtZSxcbiAgICBLZXk6IHsgZW1haWwgfVxuICB9KSk7XG4gIFxuICByZXR1cm4geyBzdGF0dXNDb2RlOiAyMDAsIGhlYWRlcnMsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgbWVzc2FnZTogJ0N1c3RvbWVyIGRlbGV0ZWQgc3VjY2Vzc2Z1bGx5JyB9KSB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBzZWFyY2hDdXN0b21lcnMocXVlcnksIGhlYWRlcnMpIHtcbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZG9jQ2xpZW50LnNlbmQobmV3IFNjYW5Db21tYW5kKHsgVGFibGVOYW1lOiB0YWJsZU5hbWUgfSkpO1xuICBjb25zdCBjdXN0b21lcnMgPSByZXN1bHQuSXRlbXMgfHwgW107XG4gIFxuICBjb25zdCBmaWx0ZXJlZCA9IGN1c3RvbWVycy5maWx0ZXIoY3VzdG9tZXIgPT4gXG4gICAgY3VzdG9tZXIubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHF1ZXJ5LnRvTG93ZXJDYXNlKCkpIHx8XG4gICAgY3VzdG9tZXIuZW1haWwudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxdWVyeS50b0xvd2VyQ2FzZSgpKVxuICApO1xuICBcbiAgcmV0dXJuIHsgc3RhdHVzQ29kZTogMjAwLCBoZWFkZXJzLCBib2R5OiBKU09OLnN0cmluZ2lmeShmaWx0ZXJlZCkgfTtcbn1cbiAgICAgIGApLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogY3VzdG9tZXJzVGFibGUudGFibGVOYW1lXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCBMYW1iZGEgcGVybWlzc2lvbnMgdG8gYWNjZXNzIER5bmFtb0RCXG4gICAgY3VzdG9tZXJzVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGN1c3RvbWVyTGFtYmRhKTtcblxuICAgIC8vIEFQSSBHYXRld2F5XG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnQ3VzdG9tZXJBcGkxMTA0MjAyNTE2MzQnLCB7XG4gICAgICByZXN0QXBpTmFtZTogJ0N1c3RvbWVyIE1hbmFnZW1lbnQgQVBJIDExMDQyMDI1MTYzNCcsXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsXG4gICAgICAgIGFsbG93TWV0aG9kczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9NRVRIT0RTLFxuICAgICAgICBhbGxvd0hlYWRlcnM6IFsnQ29udGVudC1UeXBlJywgJ1gtQW16LURhdGUnLCAnQXV0aG9yaXphdGlvbicsICdYLUFwaS1LZXknXVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgaW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihjdXN0b21lckxhbWJkYSk7XG5cbiAgICAvLyBBUEkgcm91dGVzXG4gICAgY29uc3QgYXBpUmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgnYXBpJyk7XG4gICAgY29uc3QgY3VzdG9tZXJzUmVzb3VyY2UgPSBhcGlSZXNvdXJjZS5hZGRSZXNvdXJjZSgnY3VzdG9tZXJzJyk7XG4gICAgXG4gICAgY3VzdG9tZXJzUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBpbnRlZ3JhdGlvbik7XG4gICAgY3VzdG9tZXJzUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgaW50ZWdyYXRpb24pO1xuICAgIFxuICAgIGNvbnN0IGN1c3RvbWVyUmVzb3VyY2UgPSBjdXN0b21lcnNSZXNvdXJjZS5hZGRSZXNvdXJjZSgne2VtYWlsfScpO1xuICAgIGN1c3RvbWVyUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBpbnRlZ3JhdGlvbik7XG4gICAgY3VzdG9tZXJSZXNvdXJjZS5hZGRNZXRob2QoJ1BVVCcsIGludGVncmF0aW9uKTtcbiAgICBjdXN0b21lclJlc291cmNlLmFkZE1ldGhvZCgnREVMRVRFJywgaW50ZWdyYXRpb24pO1xuXG4gICAgLy8gT3V0cHV0IEFQSSBVUkxcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpVXJsJywge1xuICAgICAgdmFsdWU6IGFwaS51cmwsXG4gICAgICBkZXNjcmlwdGlvbjogJ0N1c3RvbWVyIE1hbmFnZW1lbnQgQVBJIFVSTCdcbiAgICB9KTtcbiAgfVxufVxuIl19