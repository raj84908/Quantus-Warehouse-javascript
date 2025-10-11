# Shipment Tracking Integration Setup Guide

This guide will help you set up **FREE** UPS and FedEx shipment tracking in your Quantus Warehouse application.

---

## 🚀 Features

- ✅ **Real-time tracking** for UPS and FedEx shipments
- ✅ **Detailed tracking history** with timestamps and locations
- ✅ **Estimated delivery dates**
- ✅ **Current location** and status updates
- ✅ **Fallback to carrier websites** if API not configured
- ✅ **100% FREE** with carrier developer accounts

---

## 📋 Prerequisites

- A Quantus Warehouse application
- Internet connection
- Email address for developer account registration

---

## 🔧 Setup Instructions

### Step 1: Register for UPS Developer Account (FREE)

1. **Go to UPS Developer Portal**: https://developer.ups.com/
2. **Sign Up**:
   - Click "Get Started" or "Sign Up"
   - Fill in your information
   - Verify your email address
3. **Create an App**:
   - Log in to your developer account
   - Navigate to "My Apps"
   - Click "Create an App"
   - Fill in app details:
     - **App Name**: Quantus Warehouse
     - **Description**: Warehouse management shipment tracking
4. **Get API Credentials**:
   - After creating the app, you'll receive:
     - **Client ID** (also called API Key)
     - **Client Secret**
   - Copy these values - you'll need them later
5. **Enable Tracking API**:
   - In your app settings, enable "Tracking API"
   - Accept the terms of service

### Step 2: Register for FedEx Developer Account (FREE)

1. **Go to FedEx Developer Portal**: https://developer.fedex.com/
2. **Sign Up**:
   - Click "Get Started" or "Register"
   - Fill in your information
   - Verify your email address
3. **Create a Project**:
   - Log in to your developer account
   - Click "Create a Project" or "New Project"
   - Fill in project details:
     - **Project Name**: Quantus Warehouse
     - **Description**: Shipment tracking for warehouse management
4. **Get API Credentials**:
   - Navigate to your project
   - Go to "Production Keys" or "API Keys"
   - You'll receive:
     - **API Key** (Client ID)
     - **Secret Key** (Client Secret)
   - Copy these values
5. **Enable Tracking API**:
   - In your project, enable "Track API"
   - Review and accept the terms

### Step 3: Add API Credentials to Your Application

1. **Open your `.env` file** (or create one from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. **Add the credentials**:
   ```env
   # UPS Tracking API
   UPS_CLIENT_ID=your_ups_client_id_here
   UPS_CLIENT_SECRET=your_ups_client_secret_here

   # FedEx Tracking API
   FEDEX_CLIENT_ID=your_fedex_api_key_here
   FEDEX_CLIENT_SECRET=your_fedex_secret_key_here
   ```

3. **Save the file**

4. **Restart your application**:
   ```bash
   npm run dev
   ```

---

## ✅ Testing the Integration

### Test with UPS Tracking

1. Go to **Shipments** page in your application
2. Click the **Track** button (🔍) on any UPS shipment
3. You should see:
   - Current status
   - Current location
   - Estimated delivery date
   - Full tracking history

### Test with FedEx Tracking

1. Go to **Shipments** page in your application
2. Click the **Track** button (🔍) on any FedEx shipment
3. You should see the same detailed tracking information

### If API is Not Configured

- The system will **automatically open the carrier's website** instead
- You'll see a notification explaining that the API is not configured
- You can still track packages manually on the carrier website

---

## 🎯 How to Use

### Track a Shipment

1. **From Shipments Table**:
   - Click the 🔍 (Search) icon in the Actions column
   - View detailed tracking modal with history

2. **Using Tracking Number Search**:
   - Enter tracking number in the search bar at the top
   - Click "Track Package"
   - View results in modal

3. **Open Carrier Website**:
   - Click the 🔗 (External Link) icon
   - Opens carrier's official tracking page

### Supported Carriers

- ✅ **UPS** - Full API integration (free)
- ✅ **FedEx** - Full API integration (free)
- 🔗 **USPS** - Fallback to website
- 🔗 **DHL** - Fallback to website
- 🔗 **Canada Post** - Fallback to website
- 🔗 **Other carriers** - Google search fallback

---

## 🔒 Security Notes

1. **Never commit your `.env` file** to version control
2. **Keep API credentials secret** - treat them like passwords
3. **Use different credentials** for development and production
4. **Rotate credentials regularly** for security
5. **Monitor API usage** in your developer portals

---

## 📊 API Limits (FREE Tier)

### UPS Developer Account
- **Free Tier**: Unlimited tracking requests
- **Rate Limit**: Reasonable usage (not officially published)
- **No credit card required**

### FedEx Developer Account
- **Free Tier**: Unlimited tracking requests
- **Rate Limit**: 5,000 requests per day (more than enough)
- **No credit card required**

---

## 🐛 Troubleshooting

### "API not configured" Error
- **Cause**: API credentials missing or incorrect
- **Solution**: Double-check credentials in `.env` file and restart app

### "Authentication failed" Error
- **Cause**: Invalid credentials
- **Solution**:
  1. Verify credentials in developer portal
  2. Ensure no extra spaces in `.env` file
  3. Regenerate credentials if needed

### "No tracking information found"
- **Cause**: Tracking number doesn't exist or is invalid
- **Solution**: Verify tracking number is correct

### Tracking Works on Website but Not in App
- **Cause**: API might be in test mode or not activated
- **Solution**: Check developer portal to ensure API is in production mode

---

## 💡 Tips

1. **Test with real tracking numbers** from your actual shipments
2. **Use Test Mode** during development (available in both UPS and FedEx portals)
3. **Monitor your API usage** in the developer portals
4. **Enable webhooks** (optional) for automatic status updates
5. **Cache tracking data** to reduce API calls

---

## 🆘 Need Help?

### UPS Support
- Developer Portal: https://developer.ups.com/
- Documentation: https://developer.ups.com/api/reference
- Support: Use the "Contact Support" in the developer portal

### FedEx Support
- Developer Portal: https://developer.fedex.com/
- Documentation: https://developer.fedex.com/api/en-us/catalog.html
- Support: developer@fedex.com

---

## 🎉 You're All Set!

Your shipment tracking is now integrated and ready to use. Enjoy real-time tracking updates completely FREE!

---

## 📝 Additional Notes

- Both APIs are **production-ready** and used by thousands of applications
- No maintenance fees or recurring costs
- APIs are **stable and reliable**
- Perfect for small to medium-sized warehouses
- Can handle hundreds of tracking requests per day

**Happy Tracking! 📦**
