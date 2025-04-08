# NightLight.ps1
# PowerShell script for controlling Windows 10/11 Night Light feature

# Registry path for Night Light settings
$keyPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\CloudStore\Store\DefaultAccount\Current\default`$windows.data.bluelightreduction.bluelightreductionstate\windows.data.bluelightreduction.bluelightreductionstate"

# Check if Night Light feature is supported
function Test-NightLightSupported {
    return Test-Path -Path $keyPath
}

# Get the registry data
function Get-NightLightData {
    if (-not (Test-NightLightSupported)) {
        return $null
    }
    
    try {
        $regItem = Get-ItemProperty -Path $keyPath -Name "Data" -ErrorAction Stop
        return $regItem.Data
    }
    catch {
        Write-Error "Failed to read Night Light registry data: $_"
        return $null
    }
}

# Check if Night Light is enabled
function Test-NightLightEnabled {
    if (-not (Test-NightLightSupported)) {
        return $false
    }
    
    $data = Get-NightLightData
    if ($null -eq $data) {
        return $false
    }
    
    return $data[18] -eq 0x15  # 21 in decimal
}

# Enable Night Light
function Enable-NightLight {
    if ((Test-NightLightSupported) -and (-not (Test-NightLightEnabled))) {
        Switch-NightLight
    }
}

# Disable Night Light
function Disable-NightLight {
    if ((Test-NightLightSupported) -and (Test-NightLightEnabled)) {
        Switch-NightLight
    }
}

# Switch Night Light state
function Switch-NightLight {
    if (-not (Test-NightLightSupported)) {
        Write-Error "Night Light feature is not supported on this system."
        return
    }
    
    $enabled = Test-NightLightEnabled
    $data = Get-NightLightData
    
    if ($null -eq $data) {
        Write-Error "Could not retrieve Night Light data."
        return
    }
    
    if ($enabled) {
        # Create a 41-element array filled with zeros
        $newData = New-Object byte[] 41
        
        # Copy data[0-21] to newData[0-21]
        [Array]::Copy($data, 0, $newData, 0, [Math]::Min(22, $data.Length))
        
        # Copy data[25-42] to newData[23-40]
        if ($data.Length -gt 25) {
            $copyLength = [Math]::Min($data.Length - 25, 43 - 25)
            [Array]::Copy($data, 25, $newData, 23, $copyLength)
        }
        
        $newData[18] = 0x13
    }
    else {
        # Create a 43-element array filled with zeros
        $newData = New-Object byte[] 43
        
        # Copy data[0-21] to newData[0-21]
        [Array]::Copy($data, 0, $newData, 0, [Math]::Min(22, $data.Length))
        
        # Copy data[23-40] to newData[25-42]
        if ($data.Length -gt 23) {
            $copyLength = [Math]::Min($data.Length - 23, 41 - 23)
            [Array]::Copy($data, 23, $newData, 25, $copyLength)
        }
        
        $newData[18] = 0x15
        $newData[23] = 0x10
        $newData[24] = 0x00
    }
    
    # Increment the first byte in the range 10-14 that isn't 0xff
    for ($i = 10; $i -lt 15; $i++) {
        if ($newData[$i] -ne 0xff) {
            $newData[$i]++
            break
        }
    }
    
    # Update the registry
    try {
        Set-ItemProperty -Path $keyPath -Name "Data" -Value $newData -Type Binary
    }
    catch {
        Write-Error "Failed to update Night Light registry data: $_"
    }
}

# Export functions when used as a module
Export-ModuleMember -Function Test-NightLightSupported, Test-NightLightEnabled, Enable-NightLight, Disable-NightLight, Switch-NightLight