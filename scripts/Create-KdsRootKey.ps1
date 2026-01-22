<#
.SYNOPSIS
    Creates the KDS Root Key required for gMSA password generation.
.DESCRIPTION
    This script creates the Key Distribution Services (KDS) Root Key in Active Directory.
    This is a one-time setup required before any gMSA can be created.
.PARAMETER LabMode
    If specified, creates the key with immediate effect (for lab/test environments only).
    In production, the key requires 10 hours to replicate to all DCs.
.EXAMPLE
    # Production (wait 10 hours before creating gMSAs)
    .\Create-KdsRootKey.ps1
    
    # Lab/Test (immediate, NOT for production)
    .\Create-KdsRootKey.ps1 -LabMode
#>

param(
    [switch]$LabMode
)

#Requires -Modules ActiveDirectory
#Requires -RunAsAdministrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "KDS Root Key Creation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running on Domain Controller
$dcRole = (Get-WmiObject Win32_ComputerSystem).DomainRole
if ($dcRole -lt 4) {
    Write-Warning "This script should typically be run on a Domain Controller."
    Write-Host "Current machine role: $dcRole (4=Backup DC, 5=Primary DC)" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') { exit }
}

# Check for existing key
Write-Host "Checking for existing KDS Root Key..." -ForegroundColor Yellow
$existingKey = Get-KdsRootKey -ErrorAction SilentlyContinue

if ($existingKey) {
    Write-Host ""
    Write-Host "KDS Root Key already exists!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Key ID:      $($existingKey.KeyId)"
    Write-Host "Created:     $($existingKey.CreationTime)"
    Write-Host "Effective:   $($existingKey.EffectiveTime)"
    Write-Host "========================================" -ForegroundColor Cyan
    
    if ($existingKey.EffectiveTime -gt (Get-Date)) {
        $remaining = $existingKey.EffectiveTime - (Get-Date)
        Write-Host ""
        Write-Host "⚠ Key is not yet effective!" -ForegroundColor Yellow
        Write-Host "Time remaining: $($remaining.Hours) hours, $($remaining.Minutes) minutes"
    } else {
        Write-Host ""
        Write-Host "✓ Key is effective and ready for use." -ForegroundColor Green
    }
    exit 0
}

# Create new key
Write-Host ""
Write-Host "Creating new KDS Root Key..." -ForegroundColor Yellow

try {
    if ($LabMode) {
        Write-Host "⚠ LAB MODE: Creating key with immediate effect" -ForegroundColor Yellow
        Write-Host "  This bypasses the 10-hour replication wait." -ForegroundColor Yellow
        Write-Host "  DO NOT use this in production!" -ForegroundColor Red
        Write-Host ""
        
        # Create key effective 10 hours ago (bypasses replication wait)
        $key = Add-KdsRootKey -EffectiveTime ((Get-Date).AddHours(-10))
    } else {
        Write-Host "Creating key for production use..." -ForegroundColor Cyan
        Write-Host "The key will be effective in 10 hours to allow for replication." -ForegroundColor Yellow
        Write-Host ""
        
        $key = Add-KdsRootKey -EffectiveImmediately
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✓ KDS Root Key created successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Key ID:      $($key.KeyId)"
    Write-Host "Effective:   $($key.EffectiveTime)"
    Write-Host ""
    
    if (-not $LabMode) {
        $effective = $key.EffectiveTime
        Write-Host "IMPORTANT:" -ForegroundColor Yellow
        Write-Host "Wait until $effective before creating gMSAs." -ForegroundColor Yellow
        Write-Host "This allows time for the key to replicate to all Domain Controllers." -ForegroundColor Yellow
    } else {
        Write-Host "You can now create gMSAs immediately (lab mode)." -ForegroundColor Green
    }
    
} catch {
    Write-Host ""
    Write-Host "✗ Failed to create KDS Root Key!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common causes:" -ForegroundColor Yellow
    Write-Host "  - Insufficient permissions (require Domain Admin)"
    Write-Host "  - Not running on a Domain Controller"
    Write-Host "  - AD Web Services not running"
    exit 1
}
