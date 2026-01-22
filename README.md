# gMSA Request Portal

A web-based tool to automate the creation of Managed Service Accounts (MSA) and Group Managed Service Accounts (gMSA) in Active Directory.

![gMSA Portal](https://img.shields.io/badge/Platform-Windows%20AD-blue) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- **Multi-step Request Form** - Guided wizard to collect all prerequisites
- **MSA & gMSA Support** - Create both account types with appropriate validation
- **PowerShell Script Generation** - Automatically generates ready-to-run scripts
- **Request Tracking** - Track and manage submitted requests
- **Utility Scripts** - Prerequisite verification, KDS key creation, and validation scripts
- **Modern UI** - Dark/light theme, responsive design

## Prerequisites

### For the Portal
- Node.js 18+ or Docker

### For gMSA Creation (AD Environment)
- Windows Server 2012+ Domain Functional Level
- KDS Root Key (one-time setup)
- PowerShell with ActiveDirectory module
- Domain Admin or delegated permissions

## Quick Start

### Option 1: Podman (Recommended for Enterprise)

```bash
# Using podman-compose
podman-compose -f podman-compose.yml up -d --build

# Or using podman directly
podman build -t gmsa-portal .
podman run -d --name gmsa-portal -p 3000:3000 -v ./data:/app/data:Z gmsa-portal
```

See [PODMAN_DEPLOYMENT.md](file:///home/user/git/gmsa/PODMAN_DEPLOYMENT.md) for detailed instructions.

### Option 2: Docker

```bash
docker-compose up -d
```

### Option 3: Node.js

```bash
cd backend
npm install
npm start
```

Access at: http://localhost:3000

## Form Fields

The request form collects all necessary information for MSA/gMSA creation:

| Category | Fields |
|----------|--------|
| **Account Type** | MSA or gMSA |
| **Basic Info** | Account Name, Display Name, Description, Requestor, Cost Center, Target OU |
| **Service Config** | Service Type, DNS Hostname, SPNs, Password Interval, Encryption Types |
| **Target Hosts** | Security Group, Host Servers (gMSA), Delegation Settings |

## PowerShell Scripts

### Included Scripts

| Script | Purpose |
|--------|---------|
| `Verify-Prerequisites.ps1` | Check AD environment readiness |
| `Create-KdsRootKey.ps1` | One-time KDS root key setup |
| `Validate-gMSA.ps1` | Test gMSA installation on hosts |

### Generated Scripts

Each request generates a custom PowerShell script that:
1. Checks prerequisites
2. Creates security group (if needed)
3. Adds computers to the group
4. Creates the MSA/gMSA account
5. Configures SPNs and delegation

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/requests` | List all requests |
| GET | `/api/requests/:id` | Get request details |
| POST | `/api/requests` | Submit new request |
| PATCH | `/api/requests/:id/status` | Update request status |
| GET | `/api/requests/:id/script` | Download generated script |
| GET | `/api/scripts/:type` | Download utility scripts |

## Project Structure

```
gmsa/
├── frontend/           # Web UI
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── backend/            # Node.js API
│   ├── server.js
│   └── package.json
├── scripts/            # PowerShell templates
│   ├── Verify-Prerequisites.ps1
│   ├── Create-KdsRootKey.ps1
│   └── Validate-gMSA.ps1
├── data/               # Request storage
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Usage Workflow

1. **Verify Prerequisites** - Download and run `Verify-Prerequisites.ps1` on a DC
2. **Create KDS Key** (if needed) - Run `Create-KdsRootKey.ps1` once per domain
3. **Submit Request** - Fill out the form with all required information
4. **Review & Approve** - Admin reviews request and generated script
5. **Execute Script** - Run the PowerShell script on a DC or management workstation
6. **Install on Hosts** - Run `Install-ADServiceAccount` on each target server
7. **Validate** - Use `Validate-gMSA.ps1` to confirm setup

## Security Notes

- The portal generates scripts but does **not** connect directly to AD
- Scripts should be reviewed before execution
- Store generated scripts securely (they contain configuration details)
- Consider implementing approval workflows in production

## License

MIT License
