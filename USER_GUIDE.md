# gMSA Request Portal - User Guide

Welcome to the gMSA Request Portal! This guide will walk you through requesting a Managed Service Account (MSA) or Group Managed Service Account (gMSA) for your application or service.

## Table of Contents

- [What is a gMSA?](#what-is-a-gmsa)
- [When to Use MSA vs gMSA](#when-to-use-msa-vs-gmsa)
- [Before You Start](#before-you-start)
- [Step-by-Step Request Guide](#step-by-step-request-guide)
- [After Submitting Your Request](#after-submitting-your-request)
- [Common Scenarios](#common-scenarios)
- [FAQ](#faq)

---

## What is a gMSA?

A **Group Managed Service Account (gMSA)** is a special type of Active Directory account designed for services and applications. It provides:

- ✅ **Automatic password management** - No need to manually change passwords
- ✅ **Enhanced security** - Passwords rotate automatically every 30 days (configurable)
- ✅ **Multiple server support** - Can be used across multiple servers (gMSA only)
- ✅ **Simplified administration** - No service interruptions for password changes

### MSA vs gMSA

| Feature | MSA | gMSA |
|---------|-----|------|
| **Use on multiple servers** | ❌ No | ✅ Yes |
| **Automatic passwords** | ✅ Yes | ✅ Yes |
| **Best for** | Single server | Clusters, farms, load-balanced apps |
| **Example use cases** | Standalone service | IIS web farms, clustered SQL |

**💡 Recommendation**: Choose **gMSA** for most scenarios, especially if you might need to scale to multiple servers in the future.

---

## When to Use MSA vs gMSA

### Choose **gMSA** when:
- Your service runs on **multiple servers** (web farms, clusters)
- You have **load-balanced applications**
- You want **flexibility to scale** in the future
- Your service uses **IIS application pools** across multiple servers
- You have **clustered SQL Server** instances

### Choose **MSA** when:
- Your service runs on **only one server**
- You will **never need to scale** to multiple servers
- You have **simple, standalone services**

---

## Before You Start

### Information You'll Need

Have the following information ready before starting your request:

#### 📋 Basic Information
- **Account Name**: A short, descriptive name (max 15 characters)
  - Example: `svc-webapp01`, `svc-sqlsrv01`
  - Use lowercase, hyphens allowed, no special characters
- **Display Name**: Full descriptive name
  - Example: "Web Application Service Account"
- **Business Justification**: Why you need this account (minimum 50 characters)
  - Explain what application/service will use it
  - Include business impact if applicable

#### 🔧 Service Information
- **Service Type**: What kind of service?
  - IIS Application Pool
  - SQL Server Service
  - Windows Service
  - Scheduled Task
  - Other/Custom
- **DNS Hostname** (gMSA only): Fully qualified domain name
  - Example: `webapp.domain.com`
- **Service Principal Names (SPNs)**: If required by your application
  - Example: `HTTP/webapp.domain.com`

#### 🖥️ Server Information (gMSA only)
- **Host Servers**: List of servers that will use this account
  - Examples: `webapp01.domain.com`, `webapp02.domain.com`
- **Security Group**: Name for the group of authorized computers
  - Example: `grp-webapp-servers`

#### 👤 Your Information
- Your full name
- Your email address
- Cost center or team name (for charge-back)

---

## Step-by-Step Request Guide

### Accessing the Portal

1. Open your web browser
2. Navigate to: `http://your-company-portal:3000`
3. Click **"New Request"** in the left sidebar

### Step 1: Choose Account Type

![Account Type Selection](https://via.placeholder.com/800x400?text=Account+Type+Selection)

**What to do:**
1. Select **gMSA** (recommended) or **MSA**
2. Review the features of each type
3. Click **"Next"**

**💡 Tip**: Most applications should use gMSA for future flexibility.

---

### Step 2: Enter Basic Information

![Basic Information Form](https://via.placeholder.com/800x400?text=Basic+Information+Form)

**What to do:**

1. **Account Name** (required)
   - Enter a short name (max 15 characters)
   - Use lowercase letters, numbers, and hyphens
   - Example: `svc-webapp01`
   - ⚠️ Do NOT add `$` at the end - it's added automatically

2. **Display Name** (required)
   - Full descriptive name
   - Example: "Production Web Application Service Account"

3. **Description** (required, min 50 characters)
   - Explain why you need this account
   - What service/application will use it
   - Business justification
   - Example: *"This gMSA is required for the customer portal web application running on IIS. It provides secure access to the backend SQL database and processes customer orders. Critical for business operations."*

4. **Requestor Name** (required)
   - Your full name

5. **Requestor Email** (required)
   - Your email address (for updates on your request)

6. **Cost Center / Team** (required)
   - Your department or cost center code
   - Example: "IT-12345" or "DevOps Team"

7. **Target OU** (required)
   - Select the organizational unit where the account will be created
   - Most users should select: **"OU=gMSA,OU=ServiceAccounts"**
   - Select "Custom" only if your admin provided a specific path

8. Click **"Next"**

---

### Step 3: Configure Service Settings

![Service Configuration](https://via.placeholder.com/800x400?text=Service+Configuration)

**What to do:**

1. **Service Type** (required)
   - Select what type of service will use this account
   - Common choices:
     - **IIS Application Pool** - For web applications
     - **SQL Server Service** - For database services
     - **Windows Service** - For custom Windows services
     - **Scheduled Task** - For automated tasks

2. **DNS Hostname** (gMSA only, required)
   - Enter the fully qualified domain name
   - Example: `webapp.domain.com`

3. **Service Principal Names (SPNs)** (optional)
   - Only needed if your application requires Kerberos authentication
   - Enter one SPN per line
   - Common formats:
     - `HTTP/webapp.domain.com` (for web apps)
     - `MSSQLSvc/sqlserver.domain.com:1433` (for SQL)
   - **💡 Tip**: Leave blank if unsure - your admin can add these later

4. **Password Change Interval** (optional)
   - Leave default (30 days) unless instructed otherwise

5. **Encryption Types** (required)
   - Leave defaults checked: **AES256** and **AES128**
   - ⚠️ Do NOT check RC4 (legacy and insecure)

6. **Kerberos Delegation** (advanced, optional)
   - Leave unchecked unless specifically required by your application
   - Consult with your security team if needed

7. Click **"Next"**

---

### Step 4: Specify Target Hosts

![Target Hosts Configuration](https://via.placeholder.com/800x400?text=Target+Hosts)

**What to do:**

1. **Security Group Name** (gMSA only, required)
   - Enter a name for the group of computers
   - Use format: `grp-<service>-servers`
   - Example: `grp-webapp-servers`

2. **Create new security group** (gMSA only)
   - ✅ Check if this is a new service (recommended)
   - ⬜ Uncheck if the group already exists

3. **Host Servers** (required)
   - Type the server name and press **Enter**
   - Add all servers that will use this account
   - Use fully qualified domain names
   - Examples:
     - `webapp01.domain.com` [Press Enter]
     - `webapp02.domain.com` [Press Enter]
   - **For MSA**: Add only ONE server
   - **For gMSA**: Add all servers that need access

4. Click **"Next"**

---

### Step 5: Review and Submit

![Review Page](https://via.placeholder.com/800x400?text=Review+Page)

**What to do:**

1. **Review all information**
   - Check that all details are correct
   - Verify server names are accurate
   - Ensure email address is correct

2. **View the PowerShell script**
   - Scroll down to see the script that will be generated
   - This is what the administrator will execute
   - You don't need to understand it - just verify your account details look right

3. **Confirm accuracy**
   - ✅ Check the box: *"I confirm all information is accurate..."*

4. **Submit**
   - Click **"Submit Request"**
   - You'll see a success message with a Request ID
   - Example: `REQ-ABC123XYZ`

---

## After Submitting Your Request

### What Happens Next?

1. **Request Submitted** ✅
   - Your request is saved with a unique ID
   - You'll be redirected to "My Requests"

2. **Admin Review** ⏳
   - An Active Directory administrator will review your request
   - They'll verify the information and business justification
   - Timeline: Usually 1-2 business days

3. **Script Execution** 🔧
   - If approved, the admin will run the generated PowerShell script
   - The gMSA will be created in Active Directory

4. **Installation on Servers** 🖥️
   - The admin will install the gMSA on your specified servers
   - Or they may provide instructions for you to complete installation

5. **Notification** 📧
   - You'll receive an email when the account is ready
   - Email includes:
     - Account name to use: `DOMAIN\svc-yourapp$`
     - Installation confirmation
     - Next steps for configuring your service

### Tracking Your Request

1. Click **"My Requests"** in the sidebar
2. View all your submitted requests
3. Check status:
   - 🟡 **Pending** - Awaiting admin review
   - 🟢 **Approved** - Admin approved, script ready
   - 🔵 **Completed** - Account created and ready to use
   - 🔴 **Rejected** - Request denied (email sent with reason)

### Downloading the Script

1. Go to **"My Requests"**
2. Click **"Script"** next to your request
3. The PowerShell script will download
4. Forward to your AD administrator if needed

---

## Common Scenarios

### Scenario 1: IIS Web Application on Multiple Servers

**What you need:**
- Service Type: **IIS Application Pool**
- Account Type: **gMSA**
- Host Servers: All web servers in your farm
- Security Group: `grp-webapp-iis`

**Example:**
```
Account Name: svc-webapp01
Service Type: IIS Application Pool
DNS Hostname: webapp.company.com
Servers: webapp01.domain.com, webapp02.domain.com
```

**After creation, configure IIS:**
1. Open IIS Manager
2. Select your Application Pool
3. Advanced Settings → Identity
4. Set to: `DOMAIN\svc-webapp01$`
5. No password needed!

---

### Scenario 2: SQL Server Service

**What you need:**
- Service Type: **SQL Server Service**
- Account Type: **gMSA** (for clustered) or **MSA** (standalone)
- SPNs: `MSSQLSvc/sqlserver.domain.com:1433`

**Example:**
```
Account Name: svc-sqlsrv01
Service Type: SQL Server Service
DNS Hostname: sqlserver.domain.com
SPNs: MSSQLSvc/sqlserver.domain.com:1433
```

**After creation, configure SQL:**
1. Open SQL Server Configuration Manager
2. SQL Server Services → Right-click SQL Server
3. Properties → Log On tab
4. Select "This account": `DOMAIN\svc-sqlsrv01$`
5. Leave password blank
6. Restart SQL Server service

---

### Scenario 3: Windows Scheduled Task

**What you need:**
- Service Type: **Scheduled Task**
- Account Type: **MSA** (if one server) or **gMSA** (multiple)

**After creation, configure Task:**
1. Open Task Scheduler
2. Create/Edit your task
3. General tab → Change User
4. Enter: `DOMAIN\svc-task01$`
5. Click "Check Names"
6. Security Options → "Do not store password"

---

## FAQ

### Q: What do I put for the account name?
**A:** Use a short, descriptive name in lowercase. Format: `svc-<app>-<number>`. Examples: `svc-webapp01`, `svc-sqlsrv01`, `svc-api01`. Maximum 15 characters.

### Q: Do I need to include the $ at the end of the account name?
**A:** No! The portal adds the `$` automatically. Just enter `svc-webapp01`, not `svc-webapp01$`.

### Q: What are SPNs and do I need them?
**A:** Service Principal Names are needed for Kerberos authentication. If you're not sure, leave this field empty. Your admin can add them later if needed. Common uses: web applications (HTTP), SQL Server (MSSQLSvc).

### Q: How long does approval take?
**A:** Typically 1-2 business days, depending on your organization's process. Check "My Requests" for status updates.

### Q: Can I modify a request after submitting?
**A:** No, but you can submit a new request with the correct information and ask your admin to disregard the old one. Include the old Request ID in your description.

### Q: Should I choose MSA or gMSA?
**A:** Choose gMSA unless you're absolutely certain your service will NEVER run on more than one server. gMSA provides more flexibility.

### Q: How many servers can I add for gMSA?
**A:** As many as needed! Add all servers that will use this service account.

### Q: What if I don't know the DNS hostname?
**A:** Use the fully qualified domain name of your primary service endpoint. For web apps, this is usually your website URL. For other services, use the server name. Example: `webapp.domain.com` or `server01.domain.com`.

### Q: Who can I contact for help?
**A:** Contact your Active Directory administrators or IT help desk. Provide your Request ID for faster assistance.

### Q: What happens if my request is rejected?
**A:** You'll receive an email explaining why. Common reasons include:
- Insufficient business justification
- Security policy concerns
- Missing information
- Duplicate request
You can submit a new request addressing the concerns.

### Q: How do I use the account after it's created?
**A:** Your admin will provide specific instructions. Generally:
1. Configure your service to run as `DOMAIN\accountname$`
2. Leave the password field empty (it's managed automatically)
3. Ensure your service is set to start automatically
4. Test the service starts correctly

### Q: Can I use the same gMSA for multiple different services?
**A:** Not recommended for security reasons. Each service should have its own dedicated gMSA. This follows the principle of least privilege and makes it easier to audit and manage permissions.

### Q: What if I need to add more servers later?
**A:** Submit a new request or contact your AD admin to update the existing gMSA's security group to include additional servers.

---

## Need Help?

- 📧 **Email**: ad-admins@company.com
- 💬 **Teams/Slack**: #ad-support channel
- 📞 **Phone**: IT Help Desk ext. 1234
- 📖 **Documentation**: [Internal Wiki Link]

**When contacting support, always include:**
- Your Request ID (e.g., REQ-ABC123XYZ)
- Account name you requested
- Service name/application affected
- Error messages (if any)

---

## Tips for Success

✅ **Do:**
- Provide detailed business justification
- Use descriptive account names
- List all servers that need access
- Double-check server names for typos
- Keep your email address current

❌ **Don't:**
- Use generic descriptions like "service account"
- Add the `$` to the account name
- Request test/dev accounts for production use
- Enable RC4 encryption
- Forget to specify all target servers

---

**Last Updated**: 2026-01-22  
**Portal Version**: 1.0.0
