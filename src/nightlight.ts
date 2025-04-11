import WinReg from 'winreg'

const STATE_KEY_PATH =
  '\\Software\\Microsoft\\Windows\\CurrentVersion\\CloudStore\\Store\\DefaultAccount\\Current\\default$windows.data.bluelightreduction.bluelightreductionstate\\windows.data.bluelightreduction.bluelightreductionstate'

const SETTINGS_KEY_PATH =
  '\\Software\\Microsoft\\Windows\\CurrentVersion\\CloudStore\\Store\\DefaultAccount\\Current\\default$windows.data.bluelightreduction.settings\\windows.data.bluelightreduction.settings'

const MIN_KELVIN = 1200 // Maximum warmth (100% strength)
const MAX_KELVIN = 6500 // Neutral (0% strength)

/**
 * A class for inspecting Windows 10/11's Night Light feature.
 */
export class NightLight {
  private _registryKey: WinReg.Registry
  private _settingsKey: WinReg.Registry

  constructor() {
    this._registryKey = new WinReg({
      hive: WinReg.HKCU,
      key: STATE_KEY_PATH,
    })
    this._settingsKey = new WinReg({
      hive: WinReg.HKCU,
      key: SETTINGS_KEY_PATH,
    })
  }

  supported(): boolean {
    return this._registryKey != null && this._settingsKey != null
  }

  private getData(): Promise<WinReg.RegistryItem> {
    return new Promise<WinReg.RegistryItem>((resolve, reject) =>
      this._registryKey.get('Data', (err, result) =>
        err ? reject(err) : resolve(result)
      )
    )
  }

  private getSettingsData(): Promise<WinReg.RegistryItem> {
    return new Promise<WinReg.RegistryItem>((resolve, reject) =>
      this._settingsKey.get('Data', (err, result) =>
        err ? reject(err) : resolve(result)
      )
    )
  }

  async enabled(): Promise<boolean> {
    if (!this.supported()) return false
    const data = await this.getData()
    if (!data) return false
    const bytes = hexToBytes(data.value)
    return bytes[18] === 0x15 // 21 in decimal
  }

  async enable(): Promise<void> {
    if (this.supported() && !(await this.enabled())) this.toggle()
  }

  async disable(): Promise<void> {
    if (this.supported() && (await this.enabled())) this.toggle()
  }

  async toggle(): Promise<void> {
    let newData: number[]
    const enabled = await this.enabled()
    const rawData = await this.getData()
    const data = hexToBytes(rawData.value)

    if (enabled) {
      newData = new Array(41).fill(0)
      newData.splice(0, 22, ...data.slice(0, 22))
      newData.splice(23, 43 - 25, ...data.slice(25, 43))
      newData[18] = 0x13
    } else {
      newData = new Array(43).fill(0)
      newData.splice(0, 22, ...data.slice(0, 22))
      newData.splice(25, 41 - 23, ...data.slice(23, 41))
      newData[18] = 0x15
      newData[23] = 0x10
      newData[24] = 0x00
    }

    for (let i = 10; i < 15; i++) {
      if (newData[i] !== 0xff) {
        newData[i]++
        break
      }
    }

    const newDataHex = bytesToHex(newData)
    return new Promise<void>((resolve, reject) =>
      this._registryKey.set('Data', WinReg.REG_BINARY, newDataHex, err => {
        err ? reject(err) : resolve()
      })
    )
  }

  async getStrength(): Promise<number> {
    if (!this.supported()) return 0
    const data = await this.getSettingsData()
    if (!data) return 0
    const bytes = hexToBytes(data.value)
    const kelvin = this.bytesToKelvin(bytes[0x23], bytes[0x24])
    return this.kelvinToPercentage(kelvin)
  }

  async setStrength(percentage: number): Promise<void> {
    if (!this.supported()) return
    
    // Clamp percentage between 0-100
    percentage = Math.max(0, Math.min(100, percentage))
    
    // Convert percentage to kelvin
    const kelvin = this.percentageToKelvin(percentage)
    
    const rawData = await this.getSettingsData()
    if (!rawData) return
    const data = hexToBytes(rawData.value)

    // Calculate bytes using the PowerShell script's formula
    const tempHi = Math.floor(kelvin / 64)
    const tempLo = ((kelvin - (tempHi * 64)) * 2) + 128

    // Update strength bytes (indices 0x23, 0x24)
    data[0x23] = tempLo
    data[0x24] = tempHi

    // Update timestamp bytes
    for (let i = 10; i < 15; i++) {
      if (data[i] !== 0xff) {
        data[i]++
        break
      }
    }

    const newDataHex = bytesToHex(data)
    return new Promise<void>((resolve, reject) =>
      this._settingsKey.set('Data', WinReg.REG_BINARY, newDataHex, err => {
        err ? reject(err) : resolve()
      })
    )
  }

  private bytesToKelvin(loTemp: number, hiTemp: number): number {
    // Convert bytes back to kelvin using the inverse of the PowerShell formula
    return (hiTemp * 64) + ((loTemp - 128) / 2)
  }

  private kelvinToPercentage(kelvin: number): number {
    // Inverse linear mapping from kelvin to percentage
    return 100 - ((kelvin - MIN_KELVIN) / (MAX_KELVIN - MIN_KELVIN)) * 100
  }

  private percentageToKelvin(percentage: number): number {
    // Linear mapping from percentage to kelvin
    return MAX_KELVIN - (percentage / 100) * (MAX_KELVIN - MIN_KELVIN)
  }
}

// Convert a hex string to a byte array
function hexToBytes(hex: string): number[] {
  let bytes = []
  for (let c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16))
  return bytes
}

// Convert a byte array to a hex string
function bytesToHex(bytes: number[]): string {
  let hex = []
  for (let i = 0; i < bytes.length; i++) {
    let current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i]
    hex.push((current >>> 4).toString(16))
    hex.push((current & 0xf).toString(16))
  }
  return hex.join('')
}

// Example usage:
// const nightLight = new NightLight()
// console.log('Supported:', nightLight.supported())
// console.log('Enabled:', await nightLight.enabled())
// console.log('Toggling')
// await nightLight.toggle()
// console.log('Enabled:', await nightLight.enabled())
