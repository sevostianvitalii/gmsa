const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Data directory
const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper functions
function getRequestsFile() {
    return path.join(DATA_DIR, 'requests.json');
}

function loadRequests() {
    const file = getRequestsFile();
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveRequests(requests) {
    fs.writeFileSync(getRequestsFile(), JSON.stringify(requests, null, 2));
}

// API Routes

// Get all requests
app.get('/api/requests', (req, res) => {
    const requests = loadRequests();
    res.json(requests);
});

// Get single request
app.get('/api/requests/:id', (req, res) => {
    const requests = loadRequests();
    const request = requests.find(r => r.id === req.params.id);
    if (!request) {
        return res.status(404).json({ error: 'Request not found' });
    }
    res.json(request);
});

// Create new request
app.post('/api/requests', (req, res) => {
    const requests = loadRequests();
    const newRequest = {
        id: 'REQ-' + uuidv4().split('-')[0].toUpperCase(),
        ...req.body,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // Generate PowerShell script
    newRequest.script = generateScript(newRequest);

    requests.push(newRequest);
    saveRequests(requests);

    res.status(201).json(newRequest);
});

// Update request status
app.patch('/api/requests/:id/status', (req, res) => {
    const requests = loadRequests();
    const index = requests.findIndex(r => r.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Request not found' });
    }

    requests[index].status = req.body.status;
    requests[index].updatedAt = new Date().toISOString();
    if (req.body.notes) {
        requests[index].notes = req.body.notes;
    }

    saveRequests(requests);
    res.json(requests[index]);
});

// Download script for request
app.get('/api/requests/:id/script', (req, res) => {
    const requests = loadRequests();
    const request = requests.find(r => r.id === req.params.id);
    if (!request) {
        return res.status(404).json({ error: 'Request not found' });
    }

    const filename = `Create-${request.accountType.toUpperCase()}-${request.accountName}.ps1`;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(request.script);
});

// Download utility scripts
app.get('/api/scripts/:type', (req, res) => {
    const scriptsDir = path.join(__dirname, '../scripts');
    const scripts = {
        prerequisites: 'Verify-Prerequisites.ps1',
        kds: 'Create-KdsRootKey.ps1',
        validate: 'Validate-gMSA.ps1'
    };

    const filename = scripts[req.params.type];
    if (!filename) {
        return res.status(404).json({ error: 'Script not found' });
    }

    const filepath = path.join(scriptsDir, filename);
    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: 'Script file not found' });
    }

    res.download(filepath, filename);
});

// Generate PowerShell script
function generateScript(request) {
    const { accountType, accountName, targetOU, dnsHostname, securityGroupName,
        createSecurityGroup, hostServers, passwordInterval, encryptionTypes, spns } = request;

    const spnList = spns ? spns.split('\n').filter(s => s.trim()) : [];

    if (accountType === 'gmsa') {
        return `# gMSA Creation Script
# Generated: ${new Date().toISOString()}
# Request ID: ${request.id}
# Account: ${accountName}$

<#
.SYNOPSIS
    Creates a Group Managed Service Account (gMSA) in Active Directory.
.DESCRIPTION
    This script creates the gMSA "${accountName}" with the specified configuration.
    Run on a Domain Controller or management workstation with RSAT-AD-PowerShell.
.NOTES
    Requestor: ${request.requestorName} (${request.requestorEmail})
    Purpose: ${request.description}
#>

#Requires -Modules ActiveDirectory

# Prerequisites Check
Write-Host "Checking prerequisites..." -ForegroundColor Cyan

$kdsKey = Get-KdsRootKey -ErrorAction SilentlyContinue
if (-not $kdsKey) {
    Write-Error "KDS Root Key not found! Run Create-KdsRootKey.ps1 first."
    exit 1
}
Write-Host "✓ KDS Root Key exists" -ForegroundColor Green

# Variables
$AccountName = "${accountName}"
$DNSHostName = "${dnsHostname}"
$SecurityGroup = "${securityGroupName}"
$TargetOU = "${targetOU}"
$PasswordInterval = ${passwordInterval || 30}
$EncryptionTypes = @(${(encryptionTypes || ['AES256']).map(e => `"${e}"`).join(', ')})
$HostServers = @(${(hostServers || []).map(h => `"${h}"`).join(', ')})

${createSecurityGroup ? `
# Create Security Group
Write-Host "Creating security group: $SecurityGroup" -ForegroundColor Cyan
$existingGroup = Get-ADGroup -Filter {Name -eq $SecurityGroup} -ErrorAction SilentlyContinue
if (-not $existingGroup) {
    New-ADGroup -Name $SecurityGroup \\
                -GroupScope Global \\
                -GroupCategory Security \\
                -Path "$TargetOU" \\
                -Description "Computers allowed to use gMSA: $AccountName"
    Write-Host "✓ Security group created" -ForegroundColor Green
} else {
    Write-Host "Security group already exists" -ForegroundColor Yellow
}
` : '# Using existing security group: $SecurityGroup'}

# Add computers to security group
Write-Host "Adding computers to security group..." -ForegroundColor Cyan
foreach ($server in $HostServers) {
    try {
        $computer = Get-ADComputer -Filter {Name -eq $server} -ErrorAction Stop
        Add-ADGroupMember -Identity $SecurityGroup -Members $computer -ErrorAction SilentlyContinue
        Write-Host "✓ Added $server" -ForegroundColor Green
    } catch {
        Write-Warning "Could not find computer: $server"
    }
}

# Wait for AD replication (optional)
Write-Host "Waiting 5 seconds for AD replication..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Create gMSA
Write-Host "Creating gMSA: $AccountName" -ForegroundColor Cyan
$gmsaParams = @{
    Name = $AccountName
    DNSHostName = $DNSHostName
    PrincipalsAllowedToRetrieveManagedPassword = $SecurityGroup
    ManagedPasswordIntervalInDays = $PasswordInterval
    KerberosEncryptionType = $EncryptionTypes
    Path = $TargetOU
    Enabled = $true
}

try {
    New-ADServiceAccount @gmsaParams
    Write-Host "✓ gMSA created successfully!" -ForegroundColor Green
} catch {
    Write-Error "Failed to create gMSA: $_"
    exit 1
}

${spnList.length > 0 ? `
# Set Service Principal Names
$SPNs = @(${spnList.map(s => `"${s}"`).join(', ')})
Write-Host "Setting SPNs..." -ForegroundColor Cyan
Set-ADServiceAccount -Identity $AccountName -ServicePrincipalNames @{Add=$SPNs}
Write-Host "✓ SPNs configured" -ForegroundColor Green
` : ''}

# Summary
Write-Host "\\n========================================" -ForegroundColor Cyan
Write-Host "gMSA Creation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Account Name: $AccountName$"
Write-Host "DNS Hostname: $DNSHostName"
Write-Host "Security Group: $SecurityGroup"
Write-Host "Host Servers: $($HostServers -join ', ')"

Write-Host "\\nNext Steps:" -ForegroundColor Yellow
Write-Host "1. On each target server, run:"
Write-Host "   Install-ADServiceAccount -Identity $AccountName" -ForegroundColor Cyan
Write-Host "2. Test the installation:"
Write-Host "   Test-ADServiceAccount -Identity $AccountName" -ForegroundColor Cyan
Write-Host "3. Configure your service to use: DOMAIN\\\\$AccountName$" -ForegroundColor Cyan
`;
    } else {
        return `# MSA Creation Script
# Generated: ${new Date().toISOString()}
# Request ID: ${request.id}
# Account: ${accountName}$

<#
.SYNOPSIS
    Creates a Managed Service Account (MSA) in Active Directory.
.DESCRIPTION
    This script creates the MSA "${accountName}" for use on a single computer.
.NOTES
    Requestor: ${request.requestorName} (${request.requestorEmail})
    Purpose: ${request.description}
#>

#Requires -Modules ActiveDirectory

# Variables
$AccountName = "${accountName}"
$TargetOU = "${targetOU}"
$HostComputer = "${(hostServers || [])[0] || 'SERVER01'}"

# Create MSA
Write-Host "Creating MSA: $AccountName" -ForegroundColor Cyan
$msaParams = @{
    Name = $AccountName
    RestrictToSingleComputer = $true
    Path = $TargetOU
    Enabled = $true
}

try {
    New-ADServiceAccount @msaParams
    Write-Host "✓ MSA created successfully!" -ForegroundColor Green
} catch {
    Write-Error "Failed to create MSA: $_"
    exit 1
}

# Associate with computer
Write-Host "Associating MSA with computer: $HostComputer" -ForegroundColor Cyan
try {
    Add-ADComputerServiceAccount -Identity $HostComputer -ServiceAccount $AccountName
    Write-Host "✓ MSA associated with $HostComputer" -ForegroundColor Green
} catch {
    Write-Error "Failed to associate MSA: $_"
}

# Summary
Write-Host "\\n========================================" -ForegroundColor Cyan
Write-Host "MSA Creation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Account Name: $AccountName$"
Write-Host "Target Computer: $HostComputer"

Write-Host "\\nNext Steps:" -ForegroundColor Yellow
Write-Host "1. On the target server ($HostComputer), run:"
Write-Host "   Install-ADServiceAccount -Identity $AccountName" -ForegroundColor Cyan
Write-Host "2. Test the installation:"
Write-Host "   Test-ADServiceAccount -Identity $AccountName" -ForegroundColor Cyan
`;
    }
}

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`gMSA Portal running at http://localhost:${PORT}`);
});
