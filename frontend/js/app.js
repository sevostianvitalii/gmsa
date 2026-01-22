// State management
const state = {
    currentStep: 1,
    totalSteps: 5,
    accountType: null,
    hostServers: [],
    requests: JSON.parse(localStorage.getItem('gmsaRequests') || '[]')
};

// DOM Elements
const form = document.getElementById('gmsaRequestForm');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const themeToggle = document.getElementById('themeToggle');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initFormHandlers();
    initTheme();
    loadRequests();
});

// Navigation between views
function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const view = item.dataset.view;
            showView(view);
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewName + 'View').classList.add('active');
    if (viewName === 'requests') loadRequests();
}

// Theme
function initTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.dataset.theme = saved;
    themeToggle.textContent = saved === 'dark' ? '☀️' : '🌙';
    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.dataset.theme;
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        localStorage.setItem('theme', next);
        themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
    });
}

// Form handlers
function initFormHandlers() {
    // Account type selection
    document.querySelectorAll('input[name="accountType"]').forEach(radio => {
        radio.addEventListener('change', e => {
            state.accountType = e.target.value;
            updateAccountTypeUI();
        });
    });

    // Target OU custom option
    document.getElementById('targetOU').addEventListener('change', e => {
        document.getElementById('customOUGroup').classList.toggle('hidden', e.target.value !== 'custom');
    });

    // Delegation toggle
    document.getElementById('enableDelegation').addEventListener('change', e => {
        document.querySelectorAll('.delegation-options').forEach(el => el.classList.toggle('hidden', !e.target.checked));
    });

    // Host server input
    const hostInput = document.getElementById('hostServerInput');
    hostInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addHostServer(hostInput.value.trim());
            hostInput.value = '';
        }
    });

    // Navigation buttons
    prevBtn.addEventListener('click', () => navigateStep(-1));
    nextBtn.addEventListener('click', () => navigateStep(1));

    // Form submission
    form.addEventListener('submit', handleSubmit);
}

function updateAccountTypeUI() {
    const isGmsa = state.accountType === 'gmsa';
    document.querySelectorAll('.gmsa-only').forEach(el => el.classList.toggle('hidden', !isGmsa));
    document.querySelectorAll('.msa-only').forEach(el => el.classList.toggle('hidden', isGmsa));

    // Update required attributes
    document.getElementById('dnsHostname').required = isGmsa;
    document.getElementById('securityGroupName').required = isGmsa;
}

function addHostServer(hostname) {
    if (!hostname) return;
    if (state.accountType === 'msa' && state.hostServers.length >= 1) {
        showToast('MSA only allows one host server', 'error');
        return;
    }
    if (state.hostServers.includes(hostname)) {
        showToast('Host already added', 'error');
        return;
    }
    state.hostServers.push(hostname);
    renderHostTags();
    document.getElementById('hostServers').value = state.hostServers.join(',');
}

function removeHostServer(hostname) {
    state.hostServers = state.hostServers.filter(h => h !== hostname);
    renderHostTags();
    document.getElementById('hostServers').value = state.hostServers.join(',');
}

function renderHostTags() {
    const container = document.getElementById('hostTags');
    container.innerHTML = state.hostServers.map(h =>
        `<span class="host-tag">${h}<button type="button" onclick="removeHostServer('${h}')">×</button></span>`
    ).join('');
}

// Step navigation
function navigateStep(direction) {
    const newStep = state.currentStep + direction;
    if (newStep < 1 || newStep > state.totalSteps) return;

    // Validate current step before moving forward
    if (direction > 0 && !validateStep(state.currentStep)) return;

    state.currentStep = newStep;
    updateStepUI();

    if (state.currentStep === state.totalSteps) {
        updateReview();
    }
}

function validateStep(step) {
    const section = document.querySelector(`.form-section[data-step="${step}"]`);
    const inputs = section.querySelectorAll('input[required], select[required], textarea[required]');
    let valid = true;

    inputs.forEach(input => {
        if (input.classList.contains('hidden') || input.closest('.hidden')) return;
        if (!input.value || !input.checkValidity()) {
            valid = false;
            input.classList.add('error');
            showToast(`Please fill in ${input.previousElementSibling?.textContent || 'required field'}`, 'error');
        } else {
            input.classList.remove('error');
        }
    });

    // Step-specific validation
    if (step === 1 && !state.accountType) {
        showToast('Please select an account type', 'error');
        return false;
    }

    if (step === 4 && state.hostServers.length === 0) {
        showToast('Please add at least one host server', 'error');
        return false;
    }

    return valid;
}

function updateStepUI() {
    // Update sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.toggle('hidden', parseInt(section.dataset.step) !== state.currentStep);
    });

    // Update progress
    document.querySelectorAll('.progress-step').forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        step.classList.remove('active', 'completed');
        if (stepNum === state.currentStep) step.classList.add('active');
        else if (stepNum < state.currentStep) step.classList.add('completed');
    });

    // Update buttons
    prevBtn.disabled = state.currentStep === 1;
    nextBtn.classList.toggle('hidden', state.currentStep === state.totalSteps);
    submitBtn.classList.toggle('hidden', state.currentStep !== state.totalSteps);
}

function updateReview() {
    const formData = new FormData(form);

    // Account details
    document.getElementById('reviewAccountDetails').innerHTML = `
        <dt>Account Type</dt><dd>${state.accountType?.toUpperCase()}</dd>
        <dt>Account Name</dt><dd>${formData.get('accountName')}$</dd>
        <dt>Display Name</dt><dd>${formData.get('displayName')}</dd>
        <dt>Requestor</dt><dd>${formData.get('requestorName')} (${formData.get('requestorEmail')})</dd>
        <dt>Cost Center</dt><dd>${formData.get('costCenter')}</dd>
        <dt>Target OU</dt><dd>${formData.get('targetOU') === 'custom' ? formData.get('customOU') : formData.get('targetOU')}</dd>
    `;

    // Service config
    const encTypes = formData.getAll('encryptionTypes').join(', ') || 'None selected';
    document.getElementById('reviewServiceConfig').innerHTML = `
        <dt>Service Type</dt><dd>${formData.get('serviceType')}</dd>
        ${state.accountType === 'gmsa' ? `<dt>DNS Hostname</dt><dd>${formData.get('dnsHostname')}</dd>` : ''}
        <dt>Password Interval</dt><dd>${formData.get('passwordInterval')} days</dd>
        <dt>Encryption</dt><dd>${encTypes}</dd>
        <dt>SPNs</dt><dd>${formData.get('spns') || 'None'}</dd>
    `;

    // Target hosts (gMSA only)
    if (state.accountType === 'gmsa') {
        document.getElementById('reviewTargetHosts').innerHTML = `
            <dt>Security Group</dt><dd>${formData.get('securityGroupName')}</dd>
            <dt>Create Group</dt><dd>${formData.get('createSecurityGroup') ? 'Yes' : 'No'}</dd>
            <dt>Host Servers</dt><dd>${state.hostServers.join(', ')}</dd>
        `;
    }

    // Generate script preview
    document.getElementById('scriptPreview').querySelector('code').textContent = generateScript(formData);
}

function generateScript(formData) {
    const accountName = formData.get('accountName');
    const targetOU = formData.get('targetOU') === 'custom' ? formData.get('customOU') : formData.get('targetOU');
    const encTypes = formData.getAll('encryptionTypes');
    const spns = formData.get('spns')?.split('\n').filter(s => s.trim()) || [];

    if (state.accountType === 'gmsa') {
        return `# gMSA Creation Script
# Generated: ${new Date().toISOString()}
# Account: ${accountName}$

# Prerequisites Check
$kdsKey = Get-KdsRootKey
if (-not $kdsKey) {
    Write-Error "KDS Root Key not found. Run Create-KdsRootKey.ps1 first."
    exit 1
}

# Create Security Group (if needed)
$groupName = "${formData.get('securityGroupName')}"
${formData.get('createSecurityGroup') ? `
if (-not (Get-ADGroup -Filter {Name -eq $groupName} -ErrorAction SilentlyContinue)) {
    New-ADGroup -Name $groupName -GroupScope Global -GroupCategory Security -Path "${targetOU}"
    Write-Host "Created security group: $groupName" -ForegroundColor Green
}` : '# Using existing group'}

# Add computers to security group
$hostServers = @(${state.hostServers.map(h => `"${h}"`).join(', ')})
foreach ($server in $hostServers) {
    $computer = Get-ADComputer -Filter {Name -eq $server} -ErrorAction SilentlyContinue
    if ($computer) {
        Add-ADGroupMember -Identity $groupName -Members $computer
        Write-Host "Added $server to $groupName" -ForegroundColor Green
    }
}

# Create gMSA
$gmsaParams = @{
    Name = "${accountName}"
    DNSHostName = "${formData.get('dnsHostname')}"
    PrincipalsAllowedToRetrieveManagedPassword = $groupName
    ManagedPasswordIntervalInDays = ${formData.get('passwordInterval')}
    KerberosEncryptionType = @(${encTypes.map(e => `"${e}"`).join(', ')})
    Path = "${targetOU}"
}
New-ADServiceAccount @gmsaParams
Write-Host "Created gMSA: ${accountName}$" -ForegroundColor Green

${spns.length > 0 ? `# Set SPNs
$spns = @(${spns.map(s => `"${s}"`).join(', ')})
Set-ADServiceAccount -Identity "${accountName}" -ServicePrincipalNames @{Add=$spns}` : '# No SPNs specified'}

# Install gMSA on target hosts (run on each host)
Write-Host "\\nTo install on target hosts, run:" -ForegroundColor Yellow
Write-Host "Install-ADServiceAccount -Identity ${accountName}" -ForegroundColor Cyan
`;
    } else {
        return `# MSA Creation Script
# Generated: ${new Date().toISOString()}
# Account: ${accountName}$

# Create MSA
$msaParams = @{
    Name = "${accountName}"
    RestrictToSingleComputer = $true
    Path = "${targetOU}"
}
New-ADServiceAccount @msaParams
Write-Host "Created MSA: ${accountName}$" -ForegroundColor Green

# Associate with computer
$hostComputer = "${state.hostServers[0]}"
Add-ADComputerServiceAccount -Identity $hostComputer -ServiceAccount "${accountName}"

# Install on target (run on the host)
Write-Host "\\nTo install on target host, run:" -ForegroundColor Yellow
Write-Host "Install-ADServiceAccount -Identity ${accountName}" -ForegroundColor Cyan
`;
    }
}

// Form submission
async function handleSubmit(e) {
    e.preventDefault();
    if (!document.getElementById('confirmAccuracy').checked) {
        showToast('Please confirm the information is accurate', 'error');
        return;
    }

    const formData = new FormData(form);
    const request = {
        id: 'REQ-' + Date.now().toString(36).toUpperCase(),
        accountType: state.accountType,
        accountName: formData.get('accountName'),
        displayName: formData.get('displayName'),
        description: formData.get('description'),
        requestorName: formData.get('requestorName'),
        requestorEmail: formData.get('requestorEmail'),
        costCenter: formData.get('costCenter'),
        targetOU: formData.get('targetOU') === 'custom' ? formData.get('customOU') : formData.get('targetOU'),
        serviceType: formData.get('serviceType'),
        dnsHostname: formData.get('dnsHostname'),
        spns: formData.get('spns'),
        passwordInterval: formData.get('passwordInterval'),
        encryptionTypes: formData.getAll('encryptionTypes'),
        enableDelegation: formData.get('enableDelegation') === 'on',
        delegationType: formData.get('delegationType'),
        delegatedServices: formData.get('delegatedServices'),
        securityGroupName: formData.get('securityGroupName'),
        createSecurityGroup: formData.get('createSecurityGroup') === 'on',
        hostServers: state.hostServers,
        status: 'pending',
        createdAt: new Date().toISOString(),
        script: generateScript(formData)
    };

    // Save to local storage (in production, send to backend)
    state.requests.push(request);
    localStorage.setItem('gmsaRequests', JSON.stringify(state.requests));

    showToast(`Request ${request.id} submitted successfully!`, 'success');

    // Reset form
    form.reset();
    state.currentStep = 1;
    state.accountType = null;
    state.hostServers = [];
    updateStepUI();
    renderHostTags();

    // Show requests view
    setTimeout(() => showView('requests'), 1500);
}

// Load and display requests
function loadRequests() {
    const tbody = document.getElementById('requestsTableBody');
    const empty = document.getElementById('emptyRequests');

    if (state.requests.length === 0) {
        tbody.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }

    empty.classList.add('hidden');
    tbody.innerHTML = state.requests.map(req => `
        <tr>
            <td><strong>${req.id}</strong></td>
            <td>${req.accountName}$</td>
            <td>${req.accountType?.toUpperCase()}</td>
            <td><span class="status-badge status-${req.status}">${req.status}</span></td>
            <td>${new Date(req.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-secondary" onclick="viewRequest('${req.id}')">View</button>
                <button class="btn btn-secondary" onclick="downloadRequestScript('${req.id}')">Script</button>
            </td>
        </tr>
    `).join('');
}

function viewRequest(id) {
    const req = state.requests.find(r => r.id === id);
    if (!req) return;

    document.getElementById('modalTitle').textContent = `Request ${req.id}`;
    document.getElementById('modalBody').innerHTML = `
        <dl class="review-list" style="display:grid;grid-template-columns:1fr 2fr;gap:0.5rem;">
            <dt>Account</dt><dd>${req.accountName}$ (${req.accountType?.toUpperCase()})</dd>
            <dt>Display Name</dt><dd>${req.displayName}</dd>
            <dt>Requestor</dt><dd>${req.requestorName}</dd>
            <dt>Status</dt><dd><span class="status-badge status-${req.status}">${req.status}</span></dd>
            <dt>Created</dt><dd>${new Date(req.createdAt).toLocaleString()}</dd>
            <dt>Description</dt><dd>${req.description}</dd>
            <dt>Host Servers</dt><dd>${req.hostServers?.join(', ')}</dd>
        </dl>
    `;
    document.getElementById('modalFooter').innerHTML = `<button class="btn btn-secondary" onclick="closeModal()">Close</button>`;
    document.getElementById('modalOverlay').classList.remove('hidden');
}

function downloadRequestScript(id) {
    const req = state.requests.find(r => r.id === id);
    if (!req) return;

    const blob = new Blob([req.script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Create-${req.accountType?.toUpperCase()}-${req.accountName}.ps1`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Script downloaded', 'success');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
}

// Download utility scripts
function downloadScript(type) {
    const scripts = {
        prerequisites: `# Verify-gMSA-Prerequisites.ps1
# Run this script on a Domain Controller or management workstation

Write-Host "Checking gMSA Prerequisites..." -ForegroundColor Cyan

# Check Domain Functional Level
$domain = Get-ADDomain
$level = $domain.DomainMode
Write-Host "Domain Functional Level: $level"
if ($level -lt "Windows2012Domain") {
    Write-Error "Domain functional level must be Windows Server 2012 or higher for gMSA"
} else {
    Write-Host "✓ Domain level OK" -ForegroundColor Green
}

# Check KDS Root Key
$kdsKey = Get-KdsRootKey
if ($kdsKey) {
    Write-Host "✓ KDS Root Key exists (Created: $($kdsKey.CreationTime))" -ForegroundColor Green
} else {
    Write-Warning "KDS Root Key not found! Run Create-KdsRootKey.ps1"
}

# Check AD PowerShell Module
if (Get-Module -ListAvailable ActiveDirectory) {
    Write-Host "✓ ActiveDirectory PowerShell module available" -ForegroundColor Green
} else {
    Write-Error "ActiveDirectory PowerShell module not installed"
}

Write-Host "\\nPrerequisite check complete!" -ForegroundColor Cyan
`,
        kds: `# Create-KdsRootKey.ps1
# Run this script ONCE on a Domain Controller
# Requires Domain Admin privileges

Write-Host "Creating KDS Root Key for gMSA..." -ForegroundColor Cyan

# Check if key already exists
$existingKey = Get-KdsRootKey
if ($existingKey) {
    Write-Host "KDS Root Key already exists!" -ForegroundColor Yellow
    Write-Host "Created: $($existingKey.CreationTime)"
    exit 0
}

# For PRODUCTION: Use this (takes 10 hours to replicate)
# Add-KdsRootKey -EffectiveImmediately

# For LAB/TEST: Use this (immediate, NOT for production)
Add-KdsRootKey -EffectiveTime ((Get-Date).AddHours(-10))

Write-Host "KDS Root Key created successfully!" -ForegroundColor Green
Write-Host "Note: In production, wait 10 hours for replication before creating gMSAs"
`,
        validate: `# Validate-gMSA.ps1
# Run this on target hosts to verify gMSA installation

param(
    [Parameter(Mandatory=$true)]
    [string]$gMSAName
)

Write-Host "Validating gMSA: $gMSAName" -ForegroundColor Cyan

# Test if gMSA can retrieve password
$result = Test-ADServiceAccount -Identity $gMSAName

if ($result) {
    Write-Host "✓ gMSA is properly installed and can retrieve password" -ForegroundColor Green
} else {
    Write-Error "gMSA validation failed. Ensure:"
    Write-Host "  1. This computer is in the security group for the gMSA"
    Write-Host "  2. Install-ADServiceAccount -Identity $gMSAName was run"
    Write-Host "  3. AD replication has completed"
}
`
    };

    const content = scripts[type];
    if (!content) return;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'prerequisites' ? 'Verify-Prerequisites.ps1' :
        type === 'kds' ? 'Create-KdsRootKey.ps1' : 'Validate-gMSA.ps1';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Script downloaded', 'success');
}

// Toast notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}
