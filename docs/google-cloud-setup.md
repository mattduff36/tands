# Google Cloud Console Setup for TSB Bouncy Castle Hire Admin

## 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `tsb-bouncy-castle-admin`
4. Click "Create"

## 2. Enable Required APIs

1. Navigate to "APIs & Services" → "Library"
2. Search for and enable the following APIs:
   - **Google Calendar API**
   - **Google+ API** (for OAuth)
   - **People API** (for user profile data)

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

1. Click "Create Credentials" → "Service Account"
2. Service account name: "calendar-service"
3. Service account ID: `calendar-service`
4. Click "Create and Continue"
5. Grant roles: "Editor" or "Calendar Admin"
6. Click "Done"
7. Click on the created service account
8. Go to "Keys" tab → "Add Key" → "Create new key"
9. Choose JSON format and download the key file

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