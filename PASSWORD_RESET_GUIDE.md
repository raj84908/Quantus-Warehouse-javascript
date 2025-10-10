# 🔐 Password Reset Guide

## Quick Method: Using the Script

### Step 1: Run the Script
```bash
node scripts/update-password.js
```

### Step 2: Follow the Prompts
```
🔐 Update User Password

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Enter user email: john@example.com

✓ User found:
  Name: John Doe
  Email: john@example.com
  Organization: ABC Company
  Role: OWNER

Enter new password (min 8 characters): NewPassword123
Confirm new password: NewPassword123

⏳ Hashing password...
⏳ Updating database...

✅ Password updated successfully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ User can now login with:
  Email: john@example.com
  Password: NewPassword123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Alternative Method: Using Prisma Studio

### Step 1: Open Prisma Studio
```bash
npx prisma studio
```

This opens a GUI at `http://localhost:5555`

### Step 2: Navigate to AuthUser Table
1. Click on **AuthUser** in the left sidebar
2. Find the user by email
3. Click on the row to edit

### Step 3: Generate Password Hash
You need to hash the password first. Run this in Node.js:

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('NewPassword123', 12).then(hash => console.log(hash))"
```

Copy the output (starts with `$2b$12$...`)

### Step 4: Update Password Field
1. In Prisma Studio, paste the hash into the **password** field
2. Click **Save 1 change**

---

## Alternative Method: Direct Database Query

If you have database access:

```bash
# First, generate the hash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourNewPassword', 12).then(hash => console.log(hash))"

# Then run SQL (replace the hash and email)
psql $DATABASE_URL -c "UPDATE \"AuthUser\" SET password = '$2b$12$YOUR_HASH_HERE' WHERE email = 'user@example.com'"
```

---

## 🎯 Common Use Cases

### Reset Password for First Customer
```bash
node scripts/update-password.js
# Enter: admin@firstcustomer.com
# Enter new password
```

### Reset Admin Password
```bash
node scripts/update-password.js
# Enter: admin@quantus.com
# Enter new password
```

### Reset Any Customer's Password
1. Login to admin panel
2. Click "View Users" on their organization
3. Copy their email
4. Run: `node scripts/update-password.js`
5. Enter their email
6. Set new password

---

## 📧 How to Communicate New Password to User

### Option 1: Temporary Password
```
Hi [User],

I've reset your password to a temporary password:

Email: [their-email]
Temporary Password: TempPass123!

Please login and change this immediately in your settings.

Best regards
```

### Option 2: Phone Call
- Call them and verbally provide the new password
- Have them login while on the phone
- Guide them to change it immediately

### Option 3: Secure Message
- Use encrypted messaging (Signal, WhatsApp)
- Send password separately from email
- Delete message after they confirm login

---

## ⚠️ Security Best Practices

### DO:
- ✅ Use strong temporary passwords (min 12 characters)
- ✅ Tell users to change password immediately
- ✅ Verify identity before resetting (phone call, ID check)
- ✅ Keep a log of password resets

### DON'T:
- ❌ Send passwords via unencrypted email
- ❌ Use simple passwords like "password123"
- ❌ Reset passwords without verifying identity
- ❌ Share passwords in Slack/Discord/public channels

---

## 🔍 Troubleshooting

### "User not found"
- Double-check email spelling
- Check in admin panel if user exists
- Verify you're using the correct database

### "Password too short"
- Minimum 8 characters required
- Use longer passwords for better security

### "Passwords do not match"
- Retype carefully
- Watch for typos in confirmation

### Script won't run
```bash
# Make sure you're in the project directory
cd /Users/raj/Desktop/untitled\ folder/quantus-warehouse

# Install dependencies if needed
npm install

# Run the script
node scripts/update-password.js
```

---

## 📝 Password Requirements

Current requirements:
- ✅ Minimum 8 characters
- ✅ At least 1 lowercase letter
- ✅ At least 1 uppercase letter
- ✅ At least 1 number

Recommended:
- Use 12+ characters
- Include special characters (!@#$%^&*)
- Avoid common words
- Don't reuse old passwords

---

## 🎓 Examples

### Good Passwords:
- `MyCompany2024!`
- `Secure#Pass123`
- `Winter2024$ABC`

### Bad Passwords:
- `password` (too simple)
- `12345678` (no letters)
- `Password` (no numbers)
- `Pass123` (too short)

---

## 📞 Quick Reference

**Reset any user password:**
```bash
node scripts/update-password.js
```

**View all users:**
1. Login to admin: `http://localhost:3000/admin/login`
2. Click "View Users" on organization

**Generate password hash manually:**
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourPassword', 12).then(console.log)"
```

---

**Created:** January 2025
**Last Updated:** January 2025
