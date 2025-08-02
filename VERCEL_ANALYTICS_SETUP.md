# 🚀 Vercel Analytics Integration Setup

## ✅ Current Status
- ✅ Vercel Analytics package is installed (`@vercel/analytics`)
- ✅ Analytics component is active in your layout
- ✅ API endpoint is ready for real data
- ✅ Admin dashboard component is ready

## 🔧 What You Need To Do

### Step 1: Create Environment Variables File

Create `.env.local` in your project root with:

```bash
# Vercel Analytics API Configuration  
VERCEL_ACCESS_TOKEN=your_actual_api_token_here
VERCEL_TEAM_ID=your_vercel_username_here  
VERCEL_PROJECT_ID=tands
```

### Step 2: Find Your Vercel Details

1. **Go to**: https://vercel.com/dashboard
2. **Select your T&S project**
3. **Look at the URL**: `https://vercel.com/[YOUR-USERNAME]/tands`
   - `[YOUR-USERNAME]` = Your **VERCEL_TEAM_ID**
   - `tands` = Your **VERCEL_PROJECT_ID** ✅

### Step 3: Add Your Values

Replace in `.env.local`:
- `your_actual_api_token_here` → Paste your API token
- `your_vercel_username_here` → Your username from step 2

### Step 4: Restart Development Server

```bash
npm run dev
```

### Step 5: Test the Integration

1. **Go to**: http://localhost:3000/admin/reports
2. **Check browser console** (F12) for status messages:
   - ✅ `Successfully loaded live Vercel analytics data` = Working!  
   - ⚠️ `Using fallback analytics data` = Check your config

## 🔍 Troubleshooting

### No Data Showing?
- Your website needs some traffic first
- Analytics data might take a few hours to appear in Vercel's API
- Check your website has real visitors (not just localhost)

### API Token Issues?
- Make sure token has access to "All Projects"
- Check token is not expired
- Verify team ID matches your dashboard URL

### Still Using Fallback Data?
- Double-check `.env.local` file exists in project root
- Verify all environment variables are set correctly
- Restart your development server after changes

## 🎯 Expected Results

Once working, you'll see:
- **Real page view counts** from your website
- **Actual visitor data** from Vercel Analytics  
- **Device breakdowns** from real users
- **Geographic data** from your visitors
- **Top pages** based on actual traffic

## ⚡ Quick Test

After setup, run this in your browser console on `/admin/reports`:
```javascript
fetch('/api/admin/analytics/vercel?timeRange=30d')
  .then(r => r.json())
  .then(data => console.log('Analytics Status:', data.dataSource))
```

Should show: `Analytics Status: "live"` ✅