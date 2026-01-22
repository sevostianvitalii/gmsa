<#
.SYNOPSIS
    Validates that a gMSA is correctly installed and functional on a target host.
.DESCRIPTION
    Tests if the specified gMSA can be used on the current computer by:
    1. Checking if the gMSA exists in AD
    2. Verifying the computer is in the allowed principals group
    3. Testing password retrieval
    4. Optionally installing the gMSA if needed
.PARAMETER Identity
    The name of the gMSA to validate (without the $ suffix).
.PARAMETER Install
    If specified, attempts to install the gMSA on this computer.
.EXAMPLE
    # Validate only
    .\Validate-gMSA.ps1 -Identity "svc-webapp01"
    
    # Validate and install if needed
    .\Validate-gMSA.ps1 -Identity "svc-webapp01" -Install
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Identity,
    
    [switch]$Install
)

#Requires -Modules ActiveDirectory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "gMSA Validation: $Identity" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# Get current computer info
$computerName = $env:COMPUTERNAME
$computerFQDN = [System.Net.Dns]::GetHostByName($computerName).HostName
Write-Host "Current Computer: $computerFQDN" -ForegroundColor Yellow
Write-Host ""

# Step 1: Check if gMSA exists in AD
Write-Host "Step 1: Checking if gMSA exists in AD..." -ForegroundColor Yellow
try {
    $gmsa = Get-ADServiceAccount -Identity $Identity -Properties PrincipalsAllowedToRetrieveManagedPassword, DNSHostName, Created -ErrorAction Stop
    Write-Host "  ✓ gMSA found in Active Directory" -ForegroundColor Green
    Write-Host "    Name: $($gmsa.Name)$"
    Write-Host "    DNS Hostname: $($gmsa.DNSHostName)"
    Write-Host "    Created: $($gmsa.Created)"
} catch {
    Write-Host "  ✗ gMSA not found: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "The gMSA '$Identity' does not exist in Active Directory." -ForegroundColor Red
    Write-Host "Please verify the account name and ensure it has been created." -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 2: Check if current computer is allowed to retrieve password
Write-Host "Step 2: Checking password retrieval permissions..." -ForegroundColor Yellow
$allowedPrincipals = $gmsa.PrincipalsAllowedToRetrieveManagedPassword

if ($allowedPrincipals) {
    Write-Host "  Allowed principals:"
    foreach ($principal in $allowedPrincipals) {
        try {
            $obj = Get-ADObject -Identity $principal -Properties Name, ObjectClass
            Write-Host "    - $($obj.Name) ($($obj.ObjectClass))"
        } catch {
            Write-Host "    - $principal"
        }
    }
    
    # Check if current computer or its group is in the list
    $currentComputer = Get-ADComputer -Identity $computerName -ErrorAction SilentlyContinue
    if ($currentComputer) {
        $computerGroups = Get-ADPrincipalGroupMembership -Identity $currentComputer | Select-Object -ExpandProperty DistinguishedName
        
        $isAllowed = $false
        foreach ($principal in $allowedPrincipals) {
            if ($principal -eq $currentComputer.DistinguishedName -or $computerGroups -contains $principal) {
                $isAllowed = $true
                break
            }
        }
        
        if ($isAllowed) {
            Write-Host "  ✓ This computer is authorized to retrieve the password" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ This computer may not be authorized" -ForegroundColor Yellow
            Write-Host "    Ensure $computerName is a member of the authorized group" -ForegroundColor Yellow
            $allPassed = $false
        }
    }
} else {
    Write-Host "  ⚠ No principals configured for password retrieval" -ForegroundColor Yellow
    $allPassed = $false
}
Write-Host ""

# Step 3: Install gMSA if requested
if ($Install) {
    Write-Host "Step 3: Installing gMSA on this computer..." -ForegroundColor Yellow
    try {
        Install-ADServiceAccount -Identity $Identity -ErrorAction Stop
        Write-Host "  ✓ gMSA installed successfully" -ForegroundColor Green
    } catch {
        if ($_.Exception.Message -like "*already installed*") {
            Write-Host "  ✓ gMSA is already installed" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Installation failed: $_" -ForegroundColor Red
            $allPassed = $false
        }
    }
    Write-Host ""
}

# Step 4: Test gMSA functionality
Write-Host "Step 4: Testing gMSA password retrieval..." -ForegroundColor Yellow
try {
    $testResult = Test-ADServiceAccount -Identity $Identity -ErrorAction Stop
    
    if ($testResult) {
        Write-Host "  ✓ gMSA test PASSED!" -ForegroundColor Green
        Write-Host "    This computer can successfully retrieve the gMSA password." -ForegroundColor Green
    } else {
        Write-Host "  ✗ gMSA test FAILED" -ForegroundColor Red
        Write-Host "    The computer cannot retrieve the gMSA password." -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  ✗ gMSA test error: $_" -ForegroundColor Red
    $allPassed = $false
    
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Ensure this computer is in the gMSA's security group"
    Write-Host "  2. Run: Install-ADServiceAccount -Identity $Identity"
    Write-Host "  3. Wait for AD replication if recently added to group"
    Write-Host "  4. Reboot this computer if recently added to group"
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "✓ gMSA validation PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "The gMSA '$Identity' is ready for use on this computer." -ForegroundColor Green
    Write-Host ""
    Write-Host "To use this gMSA:" -ForegroundColor Cyan
    Write-Host "  - Service Account: $env:USERDOMAIN\$Identity$"
    Write-Host "  - Password: Leave blank (managed automatically)"
} else {
    Write-Host "⚠ gMSA validation completed with warnings/errors" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please address the issues noted above." -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
