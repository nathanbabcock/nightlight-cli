import WinReg from 'winreg'

const keyPath =
  '\\Software\\Microsoft\\Windows\\CurrentVersion\\CloudStore\\Store\\DefaultAccount\\Current\\default$windows.data.bluelightreduction.bluelightreductionstate\\windows.data.bluelightreduction.bluelightreductionstate'

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
    // console.log('getData')
    // console.log(this._registryKey.hive)
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
    const buffer = Buffer.from(data.value)
    return buffer[18] === 0x15
  }

  async setEnabled(value: boolean): Promise<void> {
    if (this.supported() && (await this.enabled()) !== value) this.toggle()
  }

  async toggle(): Promise<void> {
    const data = await this.getData()
    if (!data) return

    const buffer = Buffer.from(data.value)
    const newData = Buffer.alloc(43)
    if (await this.enabled()) {
      const existingData = buffer.subarray(0, 22)
      existingData.copy(newData, 0)
      const remainingData = buffer.subarray(25)
      remainingData.copy(newData, 23)
      newData[18] = 0x13
    } else {
      const existingData = buffer.subarray(0, 22)
      existingData.copy(newData, 0)
      const remainingData = buffer.subarray(23)
      remainingData.copy(newData, 25)
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

    return new Promise<void>((resolve, reject) =>
      this._registryKey.set(
        'Data',
        WinReg.REG_BINARY,
        newData.toString(),
        err => {
          err ? reject(err) : resolve()
        }
      )
    )
  }

  // close(): void {
  //   this._registryKey.destroy
  // }
}

// Example usage:
console.log('starting...')
const nightLight = new NightLight()
console.log('Supported:', nightLight.supported())
console.log('Enabled:', await nightLight.enabled())

// Close the registry key when you're done using it
// nightLight.close();
