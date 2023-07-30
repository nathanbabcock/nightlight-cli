Function Set-BlueLightReductionSettings {
    [CmdletBinding()]
    Param (
        [Parameter(Mandatory=$true)] [ValidateRange(0, 23)] [int]$StartHour,
        [Parameter(Mandatory=$true)] [ValidateSet(0, 15, 30, 45)] [int]$StartMinutes,
        [Parameter(Mandatory=$true)] [ValidateRange(0, 23)] [int]$EndHour,
        [Parameter(Mandatory=$true)] [ValidateSet(0, 15, 30, 45)] [int]$EndMinutes,
        [Parameter(Mandatory=$true)] [bool]$Enabled,
        [Parameter(Mandatory=$true)] [ValidateRange(1200, 6500)] [int]$NightColorTemperature
    )
    $data = (0x43, 0x42, 0x01, 0x00, 0x0A, 0x02, 0x01, 0x00, 0x2A, 0x06)
    $epochTime = [System.DateTimeOffset]::new((date)).ToUnixTimeSeconds()
    $data += $epochTime -band 0x7F -bor 0x80
    $data += ($epochTime -shr 7) -band 0x7F -bor 0x80
    $data += ($epochTime -shr 14) -band 0x7F -bor 0x80
    $data += ($epochTime -shr 21) -band 0x7F -bor 0x80
    $data += $epochTime -shr 28
    $data += (0x2A, 0x2B, 0x0E, 0x1D, 0x43, 0x42, 0x01, 0x00)
    If ($Enabled) {$data += (0x02, 0x01)}
    $data += (0xCA, 0x14, 0x0E)
    $data += $StartHour
    $data += 0x2E
    $data += $StartMinutes
    $data += (0x00, 0xCA, 0x1E, 0x0E)
    $data += $EndHour
    $data += 0x2E
    $data += $EndMinutes
    $data += (0x00, 0xCF, 0x28)
    $data += ($NightColorTemperature -band 0x3F) * 2 + 0x80
    $data += ($NightColorTemperature -shr 6)
    $data += (0xCA, 0x32, 0x00, 0xCA, 0x3C, 0x00, 0x00, 0x00, 0x00, 0x00)
    Set-ItemProperty -Path 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\CloudStore\Store\DefaultAccount\Current\default$windows.data.bluelightreduction.settings\windows.data.bluelightreduction.settings' -Name 'Data' -Value ([byte[]]$data) -Type Binary
}