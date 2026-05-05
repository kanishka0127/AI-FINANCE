<<<<<<< HEAD
# FinanceGuard - ML-Powered Financial Management Platform

A comprehensive financial management platform built with React, TypeScript, and Supabase, featuring ML-powered analytics, fraud detection, and intelligent financial insights.

## Features

### Data Acquisition Layer
- **SMS & Email Integration**: Process financial data from multiple sources
- **OCR Input Processing**: Extract transaction data from bills and receipts using Tesseract
- **Bank API Integration**: Connect to banking APIs for automatic transaction imports
- **Manual User Inputs**: Direct transaction entry with intuitive forms

### Preprocessing Layer
- **NLP Preprocessing**: BERT-powered natural language understanding
- **OCR Extraction**: Tesseract-based text extraction from documents
- **QR Code Processing**: Extract payment information from QR codes
- **Data Parsing & Cleaning**: Automated data normalization and validation

### Machine Learning Layer
- **BERT Transaction Classification**: Automatic transaction categorization
- **ARIMA Expense Forecasting**: Short-term expense predictions
- **LSTM Long-term Predictions**: Advanced financial forecasting
- **Behavior Analysis**: Spending pattern clustering and identification
- **Fraud Detection**: Isolation Forest and Anomaly Detection algorithms

### Application Layer
- **Unified Financial Dashboard**: Comprehensive overview of your finances
- **Budget Tracking**: Real-time budget monitoring with overspending alerts
- **Expense Analytics**: Detailed breakdowns and visualizations
- **Transaction Management**: Add, categorize, and track all transactions
- **AI Chatbot**: BERT-powered conversational assistant

### Security & Storage Layer
- **RSA & AES Encryption**: End-to-end data encryption
- **JWT & OAuth 2.0**: Secure authentication
- **Encrypted Database**: Supabase with Row Level Security (RLS)
- **GDPR & PCI Compliance**: Enterprise-grade security standards

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Auth
- **State Management**: React Hooks & Context

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase account

### Installation

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Follow the detailed guide in `FIREBASE_SETUP.md`
   - Create a Firebase project
   - Enable Authentication (Email/Password)
   - Create Firestore Database
   - Add default categories
   - Update `.env` with your Firebase config

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Features Overview

### Dashboard
- Real-time financial statistics
- Income vs. expense tracking
- Net balance calculation
- Budget usage monitoring

### Transaction Management
- Add transactions manually or import from various sources
- Automatic categorization using ML
- Transaction history with filtering
- Source tracking (Manual, Bank API, OCR, SMS, Email)

### Budget Tracking
- Set monthly budgets per category
- Real-time spending vs. budget monitoring
- Overspending alerts
- Visual progress indicators

### Analytics
- ML-powered expense forecasting (ARIMA)
- Long-term predictions (LSTM)
- Category-wise spending breakdown
- Monthly trend analysis
- Spending pattern identification

### Alerts & Notifications
- Overspending alerts
- Fraud detection notifications
- Budget threshold warnings
- Unusual activity detection

### AI Chatbot
- Natural language queries about your finances
- Transaction insights
- Budget recommendations
- Fraud alert explanations

## Database Schema

The application uses Firebase Realtime Database with this structure:
- `profiles/{userId}`: User profile information
- `categories`: Transaction categories (shared, read-only)
- `transactions/{userId}`: All financial transactions per user
- `budgets/{userId}`: Budget tracking per category per user
- `alerts/{userId}`: System alerts and notifications per user
- `fraud_alerts/{userId}`: ML-detected fraud and anomalies per user
- `predictions/{userId}`: Financial forecasts per user
- `spending_patterns/{userId}`: Behavior analysis results per user

All data syncs in real-time across all connected clients.

## Security Features

- Realtime Database Security Rules for data isolation
- User data isolation by userId path structure
- Firebase Authentication
- Real-time data synchronization
- Offline support with automatic sync
- OAuth 2.0 support

## Future Enhancements

- Real bank API integrations
- Advanced ML model training
- Mobile application
- Receipt OCR with Tesseract
- Voice input processing
- Multi-currency support
- Investment tracking
- Tax reporting

## License

MIT
=======
# AI-FINANCE
>>>>>>> ee1811b27300be21d4bf3f95bc17e383fc4372f8
