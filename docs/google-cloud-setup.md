# Google Cloud Console Setup for TSB Bouncy Castle Hire Admin

## 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `tsb-bouncy-castle-admin`
4. Click "Create"

## 2. Enable Required APIs

1. Navigate to "APIs & Services" → "Library"
2. Search for and enable the following APIs:
   - **Google Calendar API** ⭐ (Primary requirement for calendar integration)
   - **Google+ API** (for OAuth user authentication)
   - **People API** (for user profile data)

### Important: Google Calendar API Setup

The **Google Calendar API** is essential for the admin management system. After enabling:

1. Go to "APIs & Services" → "Credentials"
2. Ensure your OAuth 2.0 client has the following scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.readonly` (for reading calendar data)

3. For service account access (for server-side calendar operations):
   - The service account created in step 3 will need Calendar API access
   - Make sure to share your calendar with the service account email

## 3. Configure OAuth 2.0 Credentials

### Create OAuth 2.0 Client ID

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. If prompted, configure the OAuth consent screen first:
   - User Type: "Internal" (if using Google Workspace) or "External"
   - Application name: "TSB Bouncy Castle Admin"
   - User support email: `tsbouncycastlehire@gmail.com`
   - Developer contact: `matt.mpdee@gmail.com`
   - Scopes: Add `../auth/calendar` and `../auth/userinfo.email`
   - Test users: Add both admin emails

### Configure Client ID

1. Application type: "Web application"
2. Name: "TSB Admin Dashboard"
3. Authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `https://your-domain.com` (for production)
4. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)

### Create Service Account (for Calendar API)

**Important: Service accounts are required for server-side calendar operations**

1. Click "Create Credentials" → "Service Account"
2. Service account name: "TSB Calendar Service"
3. Service account ID: `tsb-calendar-service`
4. Service account description: "Service account for TSB Bouncy Castle calendar integration"
5. Click "Create and Continue"

6. **Grant appropriate roles:**
   - Skip role assignment for now (we'll use direct calendar sharing)
   - Click "Continue" → "Done"

7. **Generate and download service account key:**
   - Click on the created service account
   - Go to "Keys" tab → "Add Key" → "Create new key"
   - Choose **JSON format** and download the key file
   - **Important:** Store this file securely and never commit it to version control

8. **Note the service account email:**
   - It will look like: `tsb-calendar-service@your-project-id.iam.gserviceaccount.com`
   - You'll need this email for calendar sharing and environment variables

### Service Account Security Notes:
- The downloaded JSON file contains private keys - treat it like a password
- Store the JSON content in your environment variables (see .env.local.example)
- Never commit the JSON file to your repository
- Consider using Google Cloud Secret Manager for production deployments

## 4. Share Calendar with Service Account

1. Open Google Calendar with the primary account (`tsbouncycastlehire@gmail.com`)
2. Go to calendar settings
3. Share the calendar with the service account email (from step 3.7)
4. Give "Make changes to events" permission

## 5. Save Credentials

After completing the setup, you'll have:
- OAuth 2.0 Client ID and Secret
- Service Account JSON key file

Add these to your environment variables as shown in the `.env.local.example` file.