# Night Light CLI 🌓

> Control Windows 10/11's Night Light feature programmatically.

The binary format of the registry value was reverse engineered from
[`NightLight.cs`](https://github.com/Maclay74/tiny-screen/blob/eb829186159309f01b31fe6d4d5201b5e63e07bd/TinyScreen/Src/Services/NightLight.cs)
in the [`tiny-screen`](https://github.com/Maclay74/tiny-screen) project
by [Maclay74](https://github.com/Maclay74), and converted to Typescript with
help from ChatGPT.

For changing the scheduled Night Light settings via a slightly different
registry key, see this post: <https://superuser.com/a/1209192>.

## Compatibility

Windows Version | Status
--------------- | ----------
Windows 11 22H2 | ✅ Tested
Windows 10 21H2 | ❔ Untested but should work

Please open an issue if you find that this package does not work on your version
of Windows.

## Contribution

Since this works by modifying registry keys, it can be done in any
language. A few examples are implemented already.

### To Do

- [ ] Implement scheduled Night Light functionality

Language     | Status
------------ | ------
TypeScript   | ✅
CLI (NodeJS) | ✅
Powershell   | ✅
Python       | ✅
C#           | [⬆️ upstream](https://github.com/Maclay74/tiny-screen/blob/eb829186159309f01b31fe6d4d5201b5e63e07bd/TinyScreen/Src/Services/NightLight.cs)
Rust         | [✏️ Open a PR](https://github.com/nathanbabcock/nightlight-cli/compare)

Other        | [✏️ Open a PR](https://github.com/nathanbabcock/nightlight-cli/compare)

## Getting started (TypeScript)

```ts
const nightLight = new NightLight()

console.log('Supported:', nightLight.supported())

console.log('Enabled:', await nightLight.enabled())

// Toggle Night Light
console.log('Toggling')
await nightLight.toggle()

console.log('Enabled:', await nightLight.enabled())

// Control strength (0-100%)
console.log('Current strength:', await nightLight.getStrength(), '%')

// Set to 75% warmth
await nightlight.setStrength(75)
```

## Getting started (CLI)

```bash
npm i -g nightlight-cli

# Toggle Night Light on/off
nightlight toggle

# Get current strength
nightlight strength

# Set strength (0-100%)
nightlight strength 75
```

...or...

```bash
# Toggle Night Light
npx nightlight-cli toggle

# Get/set strength
npx nightlight-cli strength
npx nightlight-cli strength 75
```

## Getting started (Powershell)
```powershell
Import-Module <path_to_psm1_file>

# Check if Night Light is supported
Test-NightLightSupported

# Enable Night Light
Enable-NightLight

# Toggle/Switch Night Light
# If enabled, disables Night Light, and vice versa.
Switch-NightLight

# Disable NightLight
Disable-NightLight

# Get current strength (returns 0-100%)
Get-NightLightStrength

# Set strength (accepts 0-100%)
Set-NightLightStrength -Percentage 75
```

## Getting started (Python)

### As a module:
```python
from nightlight import NightLight

night_light = NightLight()

# Check if Night Light is supported
print(f"Supported: {night_light.supported()}")

# Check if Night Light is enabled
print(f"Enabled: {night_light.enabled()}")

# Enable Night Light
night_light.enable()

# Disable Night Light
night_light.disable()

# Toggle Night Light
night_light.toggle()

# Get current strength (returns 0-100%)
strength = night_light.get_strength()
print(f"Current strength: {strength}%")

# Set strength (accepts 0-100%)
night_light.set_strength(75)
```

## Strength Control

The Night Light strength can be controlled on a scale from 0% (coolest) to 100% (warmest). This corresponds to color temperatures from 6500K to 1200K. The strength can be controlled using any of the provided implementations:

- **CLI**: `nightlight strength [percentage]`
- **TypeScript**: `nightLight.getStrength()` and `nightLight.setStrength(percentage)`
- **PowerShell**: `Get-NightLightStrength` and `Set-NightLightStrength -Percentage value`
- **Python**: `night_light.get_strength()` and `night_light.set_strength(percentage)`
