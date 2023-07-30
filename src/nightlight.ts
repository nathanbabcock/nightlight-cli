import WinReg from 'winreg'

const keyPath =
  '\\Software\\Microsoft\\Windows\\CurrentVersion\\CloudStore\\Store\\DefaultAccount\\Current\\default$windows.data.bluelightreduction.bluelightreductionstate\\windows.data.bluelightreduction.bluelightreductionstate'

/**
 * A class for inspecting Windows 10/11's Night Light feature.
 */
class NightLight {
  private _registryKey: WinReg.Registry

  constructor() {
    this._registryKey = new WinReg({
      hive: WinReg.HKCU,
      key: keyPath,
    })
  }

  supported(): boolean {
    return this._registryKey != null
  }

  private getData(): Promise<WinReg.RegistryItem> {
    return new Promise<WinReg.RegistryItem>((resolve, reject) =>
      this._registryKey.get('Data', (err, result) =>
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
    if (this.supported() && (await this.enabled())) this.toggle()
  }

  async disable(): Promise<void> {
    if (this.supported() && !(await this.enabled())) this.toggle()
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
