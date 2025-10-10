# 🔐 ADMIN PANEL - Complete Guide

## ✅ What's Been Built

Your Quantus Warehouse now has a **fully functional admin panel** with:

### 1. **Super Admin System**
- Separate admin authentication (not tied to any organization)
- JWT-based admin sessions
- Secure login at `/admin/login`

### 2. **Access Key System**
- Customers need a valid access key to sign up
- Keys can have usage limits and expiration dates
- Track which key was used for each organization

### 3. **Organization Management**
- View all customer organizations
- See user count, product count, order count for each
- Suspend/activate organizations
- Delete organizations (with all their data)

### 4. **Single Plan System**
- Removed plan selection from signup
- All customers get "STANDARD" plan
- Can be customized later if needed

---

## 🚀 Quick Start

### Step 1: Admin Credentials Created

**Super Admin Login:**
- URL: `http://localhost:3000/admin/login`
- Email: `admin@quantus.com`
- Password: `Admin@123`

⚠️ **CHANGE THIS PASSWORD IN PRODUCTION!**

### Step 2: Access Keys Created

Three access keys were automatically generated:
1. `QW-E45F4009BDF15987`
2. `QW-F254D3D552675EF0`
3. `QW-C871DE4C60BC826C`

These keys are **unlimited use** and **never expire**.

---

## 📋 How to Use

### For Admin (You):

#### 1. **Login to Admin Panel**
```
1. Go to http://localhost:3000/admin/login
2. Enter: admin@quantus.com / Admin@123
3. Access admin dashboard
```

#### 2. **View All Organizations**
- See list of all customer organizations
- View stats: users, products, orders
- See which access key they used to sign up

#### 3. **Manage Organizations**
- **Suspend**: Temporarily disable an organization (customers can't login)
- **Activate**: Re-enable a suspended organization
- **Delete**: Permanently remove organization and ALL their data
  - Deletes users, products, orders, everything
  - Cannot be undone!

#### 4. **Manage Access Keys**
- **View All Keys**: Click "View All" to see all access keys
- **Create New Key**: Click "Create New Key" to generate a new access key
- **Track Usage**: See how many times each key has been used
- Keys show: `Used: X / Y (or unlimited)`

### For Customers:

#### 1. **Signup Process (Changed)**
```
1. Customer goes to http://localhost:3000/auth/signup
2. Fills in:
   - Business Name
   - Name
   - Email
   - Password
   - Access Key ← NEW! Required field
3. If key is valid, account created
4. Auto-login to dashboard
```

#### 2. **Access Key Validation**
The system checks:
- ✅ Key exists in database
- ✅ Key is active (not deactivated by admin)
- ✅ Key hasn't expired (if expiration date set)
- ✅ Usage limit not reached (if limit set)

#### 3. **What They Get**
- Fresh organization with STANDARD plan
- Empty dashboard (no data)
- Complete isolation from other customers
- Their access key is recorded in their org record

---

## 🎯 Admin Panel Features

### Dashboard Overview

**Stats Cards:**
- Total Organizations
- Active Access Keys
- Suspended Organizations

**Organizations List:**
Each organization shows:
- Name and slug
- Number of users
- Number of products
- Suspended status (if applicable)
- Actions: Suspend/Activate, Delete

**Access Keys Section:**
- Quick view of recent keys
- Create new keys button
- View all keys dialog
- Shows usage stats for each key

### Organization Actions

**Suspend Organization:**
```javascript
// Customer experience when suspended:
- Cannot login (authentication fails)
- Session invalidated
- Data preserved but inaccessible
```

**Delete Organization:**
```javascript
// What gets deleted (CASCADE):
- Organization record
- All users (AuthUser)
- All products
- All orders
- All categories
- All people/staff
- All Shopify connections
- All invoice settings
- All reports
- Everything!
```

---

## 🔑 Access Key Management

### Key Properties

```javascript
{
  key: "QW-XXXXXXXXXXXXXXXX",  // Unique key
  isActive: true,              // Can be deactivated
  maxUses: null,               // null = unlimited
  currentUses: 0,              // Tracks usage
  expiresAt: null,             // null = never expires
  createdBy: "admin@quantus.com",
  notes: "Purpose or description"
}
```

### Key Types You Can Create

**1. Unlimited Key**
```javascript
{
  maxUses: null,
  expiresAt: null
}
// Use case: General signups, no restrictions
```

**2. Limited Use Key**
```javascript
{
  maxUses: 10,
  expiresAt: null
}
// Use case: Promotional campaign, first 10 customers
```

**3. Time-Limited Key**
```javascript
{
  maxUses: null,
  expiresAt: "2024-12-31"
}
// Use case: Valid until year end
```

**4. Both Limited**
```javascript
{
  maxUses: 5,
  expiresAt: "2024-12-31"
}
// Use case: Special offer, 5 uses before year end
```

---

## 🛠️ Technical Details

### Database Schema Changes

**Organization Model:**
```prisma
model Organization {
  plan            String   @default("STANDARD") // Single plan
  isSuspended     Boolean  @default(false)      // Suspension flag
  accessKeyUsed   String?                       // Which key used for signup
}
```

**New Models:**
```prisma
model SuperAdmin {
  email    String @unique
  password String
  name     String
}

model AccessKey {
  key          String   @unique
  isActive     Boolean
  maxUses      Int?
  currentUses  Int
  expiresAt    DateTime?
  createdBy    String?
  notes        String?
}
```

### API Routes

**Admin Routes:**
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/organizations` - List all orgs
- `DELETE /api/admin/organizations/[id]` - Delete org
- `POST /api/admin/organizations/[id]/toggle-suspend` - Suspend/activate
- `GET /api/admin/access-keys` - List keys
- `POST /api/admin/access-keys` - Create new key

**Modified Routes:**
- `POST /api/auth/signup` - Now requires `accessKey` field

### Security

**Admin Token:**
```javascript
// JWT token with 24h expiry
{
  adminId: "...",
  email: "admin@quantus.com",
  name: "Super Administrator"
}
```

**Authorization:**
- Admin token stored in `localStorage`
- Sent as `Authorization: Bearer <token>` header
- Server verifies JWT before allowing admin actions
- Regular users cannot access admin routes

---

## 📊 Usage Scenarios

### Scenario 1: New Customer Signup
```
1. You create/share an access key with customer
2. Customer visits signup page
3. Customer enters key + their details
4. System validates key
5. Organization created with STANDARD plan
6. Key usage incremented
7. Customer auto-logged in
```

### Scenario 2: Suspend Troublesome Customer
```
1. Login to admin panel
2. Find organization in list
3. Click "Suspend"
4. Customer immediately can't login
5. Their data is preserved
6. Later, click "Activate" to restore access
```

### Scenario 3: Delete Customer Who Cancelled
```
1. Login to admin panel
2. Find organization
3. Click "Delete"
4. Confirm deletion (shows what will be deleted)
5. All customer data permanently removed
6. Organization slot freed up
```

### Scenario 4: Limited Campaign
```
1. Create new access key with maxUses: 50
2. Set expiration: end of month
3. Share key in marketing campaign
4. Track usage in admin panel
5. Key auto-expires when 50 signups reached or month ends
```

---

## 🔄 Migration from Old System

### Existing Customers

The existing "First Customer" organization:
- Already has STANDARD plan (automatically set)
- Not suspended
- No access key recorded (was created before key system)

### Updating Existing Orgs

If needed, run this to update existing organizations:

```javascript
// In Prisma Studio or a script:
await prisma.organization.updateMany({
  where: { plan: { not: 'STANDARD' } },
  data: { plan: 'STANDARD' }
})
```

---

## 🚨 Important Notes

### Security Considerations

1. **Change Default Admin Password**
   - Current: `Admin@123`
   - Change to strong password in production

2. **Protect Access Keys**
   - Don't commit keys to git
   - Don't share publicly
   - Rotate keys periodically

3. **Monitor Admin Access**
   - Admin token expires in 24h
   - All admin actions should be logged (future enhancement)

### Data Safety

1. **Deletion is Permanent**
   - No soft delete
   - No backup/restore (yet)
   - Always confirm before deleting

2. **Suspension is Reversible**
   - Use suspension for temporary issues
   - Use deletion only when necessary

### Performance

1. **Pagination** (Future)
   - Currently loads all orgs
   - Add pagination when > 100 orgs

2. **Search** (Future)
   - Add search/filter for organizations
   - Filter by plan, status, date

---

## 🎉 What You Can Do Now

### As Admin:
✅ Login to admin panel at `/admin/login`
✅ View all customer organizations
✅ Suspend/activate organizations
✅ Delete organizations and their data
✅ View all access keys and usage
✅ Create new access keys
✅ Track signups by access key

### As Customer:
✅ Sign up with access key
✅ Get STANDARD plan automatically
✅ Complete data isolation
✅ Cannot see admin panel

---

## 📝 Next Steps (Optional Enhancements)

1. **Admin Activity Log**
   - Track all admin actions
   - See who deleted what and when

2. **Advanced Key Features**
   - Deactivate specific keys
   - Set custom key names
   - Bulk key generation

3. **Organization Details View**
   - Click on org to see full details
   - View all users in organization
   - See product list
   - View order history

4. **Email Notifications**
   - Notify customers when suspended
   - Send access keys via email
   - Alert on organization deletion

5. **Billing Integration**
   - Track organization sizes
   - Set pricing tiers
   - Automated billing

---

## 🔗 Important URLs

**Admin Panel:**
- Login: `http://localhost:3000/admin/login`
- Dashboard: `http://localhost:3000/admin/dashboard`

**Customer Portal:**
- Login: `http://localhost:3000/auth/signin`
- Signup: `http://localhost:3000/auth/signup`

**API Endpoints:**
- Admin Login: `POST /api/admin/login`
- Organizations: `GET /api/admin/organizations`
- Access Keys: `GET /api/admin/access-keys`

---

## 📞 Quick Reference

**Login as Admin:**
```
URL: /admin/login
Email: admin@quantus.com
Password: Admin@123
```

**Access Keys (Use for Customer Signup):**
```
QW-E45F4009BDF15987
QW-F254D3D552675EF0
QW-C871DE4C60BC826C
```

**Create New Admin (If Needed):**
```bash
node scripts/create-admin.js
```

---

**Created**: January 2025
**Status**: ✅ Fully Functional
**Version**: 1.0
