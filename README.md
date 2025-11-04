# Customer Management System

A full-stack customer information management system built with React, Node.js, and AWS services. This application provides complete CRUD operations for managing customer data with a professional web interface.

## 🚀 Features

- **Complete CRUD Operations**: Create, read, update, and delete customer records
- **Search Functionality**: Real-time search with debounced input
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Data Validation**: Comprehensive client and server-side validation
- **Error Handling**: User-friendly error messages and loading states
- **Confirmation Dialogs**: Safe deletion with confirmation prompts
- **Professional UI**: Clean, modern interface with intuitive navigation

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Custom CSS** with responsive design
- **Debounced search** for optimal performance

### Backend
- **AWS Lambda** (Node.js 22.x runtime)
- **API Gateway** with CORS support
- **DynamoDB** for data persistence
- **AWS CDK** for infrastructure as code

### AWS Resources
- DynamoDB Table: `Customers110420251634`
- Lambda Function: `CustomerLambda110420251634`
- API Gateway: `CustomerApi110420251634`
- CloudFormation Stack: `CustomerManagementStack110420251634`

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | Retrieve all customers |
| GET | `/api/customers/{email}` | Retrieve specific customer |
| POST | `/api/customers` | Create new customer |
| PUT | `/api/customers/{email}` | Update existing customer |
| DELETE | `/api/customers/{email}` | Delete customer |
| GET | `/api/customers?q={query}` | Search customers |

**Base URL**: `https://dkmxi2x441.execute-api.us-east-1.amazonaws.com/prod`

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- AWS CLI configured with appropriate permissions
- AWS CDK CLI installed globally

### Backend Deployment

1. **Navigate to infrastructure directory**:
   ```bash
   cd infrastructure
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Deploy AWS infrastructure**:
   ```bash
   cdk bootstrap  # First time only
   cdk deploy
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

4. **Open browser**: Navigate to `http://localhost:3000`

## 📱 Usage

### Creating a Customer
1. Click "Add New Customer" button
2. Fill in the required information:
   - First Name (required)
   - Last Name (required)
   - Email (required, must be unique)
   - Phone Number (optional)
   - Address (optional)
3. Click "Create Customer" to save

### Viewing Customers
- All customers are displayed in a responsive table
- Use the search bar to filter customers by name or email
- Click on any customer row to view detailed information

### Updating a Customer
1. Click on a customer to view details
2. Click "Edit" button
3. Modify the information as needed
4. Click "Update Customer" to save changes
5. Click "Cancel" to discard changes

### Deleting a Customer
1. Click the "Delete" button (available in list view or detail view)
2. Confirm deletion in the popup dialog
3. Customer will be permanently removed

## 🧪 Testing

The system has been thoroughly tested including:

- ✅ All CRUD operations
- ✅ Input validation (client and server-side)
- ✅ Error handling scenarios
- ✅ Search functionality
- ✅ Responsive design
- ✅ Edge cases and boundary conditions

### Sample Test Data
The system has been tested with various customer records including validation of:
- Required field enforcement
- Email format validation
- Duplicate email prevention
- Phone number formatting
- Special character handling

## 🔒 Security Features

- **Input Sanitization**: All user inputs are sanitized to prevent XSS attacks
- **Email Validation**: Server-side email format validation
- **Error Handling**: Secure error messages that don't expose system internals
- **CORS Configuration**: Properly configured for secure cross-origin requests

## 📊 Data Model

### Customer Schema
```typescript
interface Customer {
  email: string;        // Primary key, required
  firstName: string;    // Required
  lastName: string;     // Required
  phoneNumber?: string; // Optional
  address?: string;     // Optional
  createdAt: string;    // Auto-generated timestamp
  updatedAt: string;    // Auto-updated timestamp
}
```

## 🚀 Deployment

### Production Deployment
1. **Backend**: Already deployed to AWS using CDK
2. **Frontend**: Can be deployed to:
   - AWS S3 + CloudFront
   - Netlify
   - Vercel
   - Any static hosting service

### Environment Configuration
Update the API base URL in the frontend configuration for production deployment.

## 📁 Project Structure

```
customer-management-system-110420251634/
├── README.md                    # This file
├── PROJECT_SUMMARY.md          # Detailed project summary
├── task-description.md         # Original requirements
├── jira-stories-summary.md     # JIRA stories breakdown
├── infrastructure/             # AWS CDK infrastructure
│   ├── lib/
│   │   └── infrastructure-stack.ts
│   ├── bin/
│   │   └── infrastructure.ts
│   ├── package.json
│   └── cdk.json
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── CustomerList.tsx
│   │   │   ├── CustomerForm.tsx
│   │   │   ├── CustomerDetail.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   ├── types/
│   │   │   └── Customer.ts    # TypeScript interfaces
│   │   ├── App.tsx           # Main application
│   │   ├── App.css           # Styling
│   │   └── index.tsx         # Entry point
│   ├── public/
│   └── package.json
├── specs/                     # Project specifications
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── pricing/                   # Cost analysis
│   ├── pricing-summary.md
│   └── detailed-pricing-analysis.md
└── qr-code/                  # QR code for easy access
    └── qr-code-customer-management-system-110420251634.png
```

## 💰 Cost Analysis

The system is designed to be cost-effective with AWS's pay-as-you-go model:

- **DynamoDB**: On-demand billing for low-traffic scenarios
- **Lambda**: Pay per request with generous free tier
- **API Gateway**: Pay per API call
- **Estimated Monthly Cost**: $5-20 for typical usage

See `pricing/` directory for detailed cost analysis.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check the PROJECT_SUMMARY.md for detailed implementation notes
2. Review the specs/ directory for requirements and design decisions
3. Open an issue for bugs or feature requests

## 🎯 Success Metrics

- ✅ All 10 project requirements successfully implemented
- ✅ Comprehensive testing completed
- ✅ Professional UI/UX design
- ✅ Robust error handling and validation
- ✅ Scalable AWS architecture
- ✅ Complete documentation

---

**Built with ❤️ using React, AWS, and modern web technologies**
