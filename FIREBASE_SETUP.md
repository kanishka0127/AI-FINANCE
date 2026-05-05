# Firebase Realtime Database Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name (e.g., "FinanceGuard")
4. Follow the setup wizard

## Step 2: Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable "Email/Password" sign-in method
4. Click "Save"

## Step 3: Create Realtime Database

1. In Firebase Console, go to "Realtime Database"
2. Click "Create Database"
3. Choose a location closest to your users
4. Start in "Test mode" for now (we'll add rules later)
5. Click "Enable"

## Step 4: Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (</>)
4. Register your app with a nickname
5. Copy the configuration values
6. **IMPORTANT**: Also copy the "databaseURL" value (it looks like: https://your-project-id-default-rtdb.firebaseio.com)

## Step 5: Update .env File

Replace the values in your `.env` file with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Step 6: Set Up Realtime Database Security Rules

In Realtime Database > Rules, paste these rules:

```json
{
  "rules": {
    "profiles": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "categories": {
      ".read": "auth != null",
      ".write": false
    },
    "transactions": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        "$transactionId": {
          ".validate": "newData.hasChildren(['amount', 'transaction_date', 'user_id']) && newData.child('user_id').val() === auth.uid"
        }
      }
    },
    "budgets": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        "$budgetId": {
          ".validate": "newData.hasChildren(['amount', 'period', 'category_id']) && newData.child('user_id').val() === auth.uid"
        }
      }
    },
    "alerts": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "fraud_alerts": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "predictions": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": false
      }
    },
    "spending_patterns": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": false
      }
    }
  }
}
```

## Step 7: Add Default Categories

Go to Realtime Database in Firebase Console and manually add this data structure:

Click on the "+" icon next to your database root and add:

```json
{
  "categories": {
    "cat_salary": {
      "name": "Salary",
      "icon": "dollar-sign",
      "color": "#10B981",
      "type": "income"
    },
    "cat_investment": {
      "name": "Investment",
      "icon": "trending-up",
      "color": "#059669",
      "type": "income"
    },
    "cat_freelance": {
      "name": "Freelance",
      "icon": "briefcase",
      "color": "#34D399",
      "type": "income"
    },
    "cat_groceries": {
      "name": "Groceries",
      "icon": "shopping-cart",
      "color": "#3B82F6",
      "type": "expense"
    },
    "cat_utilities": {
      "name": "Utilities",
      "icon": "zap",
      "color": "#6366F1",
      "type": "expense"
    },
    "cat_transportation": {
      "name": "Transportation",
      "icon": "car",
      "color": "#8B5CF6",
      "type": "expense"
    },
    "cat_entertainment": {
      "name": "Entertainment",
      "icon": "tv",
      "color": "#EC4899",
      "type": "expense"
    },
    "cat_healthcare": {
      "name": "Healthcare",
      "icon": "heart",
      "color": "#EF4444",
      "type": "expense"
    },
    "cat_shopping": {
      "name": "Shopping",
      "icon": "shopping-bag",
      "color": "#F59E0B",
      "type": "expense"
    },
    "cat_dining": {
      "name": "Dining",
      "icon": "coffee",
      "color": "#F97316",
      "type": "expense"
    },
    "cat_education": {
      "name": "Education",
      "icon": "book",
      "color": "#14B8A6",
      "type": "expense"
    },
    "cat_travel": {
      "name": "Travel",
      "icon": "plane",
      "color": "#06B6D4",
      "type": "expense"
    }
  }
}
```

**Alternative**: You can import this JSON directly:
1. Click the three dots menu in Realtime Database
2. Select "Import JSON"
3. Upload a file with the above JSON structure

## Step 8: Install Dependencies and Run

```bash
npm install
npm run dev
```

## Realtime Database Structure

Your Firebase Realtime Database will have this structure:

```
root/
├── profiles/
│   └── {userId}/
│       ├── email
│       ├── full_name
│       ├── created_at
│       └── updated_at
├── categories/
│   └── {categoryId}/
│       ├── name
│       ├── icon
│       ├── color
│       └── type
├── transactions/
│   └── {userId}/
│       └── {transactionId}/
│           ├── amount
│           ├── description
│           ├── category_id
│           ├── merchant
│           ├── transaction_date
│           ├── source
│           ├── confidence_score
│           ├── created_at
│           └── updated_at
├── budgets/
│   └── {userId}/
│       └── {budgetId}/
│           ├── amount
│           ├── period
│           ├── category_id
│           ├── start_date
│           └── end_date
├── alerts/
│   └── {userId}/
│       └── {alertId}/
│           ├── type
│           ├── title
│           ├── message
│           ├── severity
│           ├── is_read
│           └── created_at
├── fraud_alerts/
│   └── {userId}/
│       └── {alertId}/
│           ├── transaction_id
│           ├── anomaly_score
│           ├── detection_method
│           ├── risk_level
│           └── status
├── predictions/
│   └── {userId}/
│       └── {predictionId}/
│           ├── prediction_type
│           ├── category_id
│           ├── predicted_amount
│           ├── confidence_interval
│           └── prediction_date
└── spending_patterns/
    └── {userId}/
        └── {patternId}/
            ├── pattern_name
            ├── characteristics
            └── identified_at
```

## Benefits of Realtime Database

- **Real-time sync**: Data updates instantly across all connected clients
- **Offline support**: Works offline and syncs when connection is restored
- **Simple structure**: JSON-based, easy to understand and query
- **Fast queries**: Optimized for real-time applications
- **Automatic scaling**: Handles traffic spikes automatically

## Notes

- All user data is automatically isolated by userId
- Security rules ensure users can only access their own data
- Categories are shared across all users (read-only)
- Data syncs in real-time - no need to refresh
- Keep your Firebase config in .env file secure
- Never commit .env file to version control

## Troubleshooting

If you see "Permission denied" errors:
1. Check that your security rules are published
2. Verify you're authenticated
3. Ensure the userId in the path matches auth.uid

If data doesn't appear:
1. Check browser console for errors
2. Verify your databaseURL in .env is correct
3. Make sure categories are added to the database
