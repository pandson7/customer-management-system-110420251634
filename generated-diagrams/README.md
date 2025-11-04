# Generated Diagrams

This folder contains architectural diagrams and visual representations of the customer management system.

## Files

- `qr-code-customer-management-system-110420251634.png` - QR code for quick access to the project
- Additional architecture diagrams can be added here

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   API Gateway   │    │   Lambda        │
│   (Frontend)    │◄──►│   (REST API)    │◄──►│   (Backend)     │
│   Port 3000     │    │   HTTPS         │    │   Node.js 22.x  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                              ┌─────────────────┐
                                              │   DynamoDB      │
                                              │   (Database)    │
                                              │   NoSQL         │
                                              └─────────────────┘
```

## Components

1. **Frontend (React)**: User interface for customer management
2. **API Gateway**: RESTful API endpoints with CORS support
3. **Lambda Function**: Business logic and data processing
4. **DynamoDB**: NoSQL database for customer data storage

## Data Flow

1. User interacts with React frontend
2. Frontend makes HTTP requests to API Gateway
3. API Gateway routes requests to Lambda function
4. Lambda function processes requests and interacts with DynamoDB
5. Response flows back through the same path to the user
