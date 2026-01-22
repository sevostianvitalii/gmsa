<#
.SYNOPSIS
    Verifies prerequisites for gMSA creation in Active Directory.
.DESCRIPTION
    Checks domain functional level, KDS Root Key, and AD PowerShell module.
.EXAMPLE
    .\Verify-Prerequisites.ps1
#>

#Requires -Modules ActiveDirectory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "gMSA Prerequisites Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# Check Domain Functional Level
Write-Host "Checking Domain Functional Level..." -ForegroundColor Yellow
try {
    $domain = Get-ADDomain
    $level = $domain.DomainMode
    Write-Host "  Domain: $($domain.DNSRoot)"
    Write-Host "  Functional Level: $level"
    
    $minLevel = "Windows2012Domain"
    if ($level -ge $minLevel) {
        Write-Host "  ✓ Domain level is sufficient for gMSA" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Domain level must be Windows Server 2012 or higher" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  ✗ Could not retrieve domain information: $_" -ForegroundColor Red
    $allPassed = $false
}
Write-Host ""

# Check KDS Root Key
Write-Host "Checking KDS Root Key..." -ForegroundColor Yellow
try {
    $kdsKey = Get-KdsRootKey
    if ($kdsKey) {
        Write-Host "  ✓ KDS Root Key exists" -ForegroundColor Green
        Write-Host "  Key ID: $($kdsKey.KeyId)"
        Write-Host "  Created: $($kdsKey.CreationTime)"
        Write-Host "  Effective: $($kdsKey.EffectiveTime)"
        
        if ($kdsKey.EffectiveTime -gt (Get-Date)) {
            Write-Host "  ⚠ Key not yet effective. Wait until: $($kdsKey.EffectiveTime)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ✗ KDS Root Key not found!" -ForegroundColor Red
        Write-Host "    Run: Add-KdsRootKey -EffectiveImmediately" -ForegroundColor Yellow
        Write-Host "    Note: In production, allow 10 hours for replication" -ForegroundColor Yellow
        $allPassed = $false
    }
} catch {
    Write-Host "  ✗ Could not check KDS Root Key: $_" -ForegroundColor Red
    $allPassed = $false
}
Write-Host ""

# Check AD PowerShell Module
Write-Host "Checking ActiveDirectory Module..." -ForegroundColor Yellow
$adModule = Get-Module -Name ActiveDirectory -ListAvailable
if ($adModule) {
    Write-Host "  ✓ ActiveDirectory module is available" -ForegroundColor Green
    Write-Host "  Version: $($adModule.Version)"
} else {
    Write-Host "  ✗ ActiveDirectory module not found" -ForegroundColor Red
    Write-Host "    Install: Add-WindowsFeature RSAT-AD-PowerShell" -ForegroundColor Yellow
    $allPassed = $false
}
Write-Host ""

# Check Current User Permissions
Write-Host "Checking Current User..." -ForegroundColor Yellow
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent()
Write-Host "  User: $($currentUser.Name)"

try {
    # Try to query a simple AD object to verify connectivity
    $testQuery = Get-ADObject -Filter {objectClass -eq "domain"} -Properties * -ResultSetSize 1 -ErrorAction Stop
    Write-Host "  ✓ AD connectivity verified" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Could not verify AD permissions: $_" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "All prerequisites passed! Ready to create gMSAs." -ForegroundColor Green
} else {
    Write-Host "Some prerequisites failed. Please address the issues above." -ForegroundColor Red
}
Write-Host "========================================" -ForegroundColor Cyan
