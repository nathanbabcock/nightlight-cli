# Night Light CLI 🌓

> Control Windows 10/11's Night Light feature programatically.

The binary format of the registry value was reverse engineered from
[`NightLight.cs`](https://github.com/Maclay74/tiny-screen/blob/eb829186159309f01b31fe6d4d5201b5e63e07bd/TinyScreen/Src/Services/NightLight.cs)
in the [`tiny-screen`](https://github.com/Maclay74/tiny-screen) project
by [Maclay74](https://github.com/Maclay74), and converted to Typescript with
help from ChatGPT.

For changing the scheduled Night Light settings via a slightly different
registry key, see this post: <https://superuser.com/a/1209192>.

## Compatibility & Contribution

Windows Version | Status
--------------- | ----------
Windows 11 22H2 | ✅ Tested
Windows 10 21H2 | ❔ Untested but should work

Please open an issue if you find that this package does not work on your version
of Windows.

Also feel free to make a PR with other languages or CLI wrappers.

## Getting started (Node.js)

```ts
const nightLight = new NightLight()
console.log('Supported:', nightLight.supported())
console.log('Enabled:', await nightLight.enabled())
console.log('Toggling')
await nightLight.toggle()
console.log('Enabled:', await nightLight.enabled())
```

## Getting started (CLI)

```bash
# TODO
```
