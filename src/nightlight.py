"""
NightLight Python Module
Control Windows 10/11's Night Light feature programmatically.
"""

import winreg
from typing import Optional

# Registry paths for Night Light settings
STATE_KEY_PATH = r"Software\Microsoft\Windows\CurrentVersion\CloudStore\Store\DefaultAccount\Current\default$windows.data.bluelightreduction.bluelightreductionstate\windows.data.bluelightreduction.bluelightreductionstate"
SETTINGS_KEY_PATH = r"Software\Microsoft\Windows\CurrentVersion\CloudStore\Store\DefaultAccount\Current\default$windows.data.bluelightreduction.settings\windows.data.bluelightreduction.settings"

# Temperature constants
MIN_KELVIN = 1200  # Maximum warmth (100% strength)
MAX_KELVIN = 6500  # Neutral (0% strength)


class NightLight:
    """A class for controlling Windows 10/11's Night Light feature."""

    def __init__(self):
        """Initialize the NightLight controller."""
        self._state_key_path = STATE_KEY_PATH
        self._settings_key_path = SETTINGS_KEY_PATH

    def supported(self) -> bool:
        """Check if Night Light feature is supported on this system."""
        try:
            winreg.OpenKey(winreg.HKEY_CURRENT_USER, self._state_key_path, 0, winreg.KEY_READ)
            winreg.OpenKey(winreg.HKEY_CURRENT_USER, self._settings_key_path, 0, winreg.KEY_READ)
            return True
        except FileNotFoundError:
            return False

    def _get_data(self) -> Optional[bytes]:
        """Get the registry data for Night Light state."""
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, self._state_key_path, 0, winreg.KEY_READ)
            data, _ = winreg.QueryValueEx(key, "Data")
            winreg.CloseKey(key)
            return data
        except Exception:
            return None

    def _get_settings_data(self) -> Optional[bytes]:
        """Get the registry data for Night Light settings."""
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, self._settings_key_path, 0, winreg.KEY_READ)
            data, _ = winreg.QueryValueEx(key, "Data")
            winreg.CloseKey(key)
            return data
        except Exception:
            return None

    def enabled(self) -> bool:
        """Check if Night Light is currently enabled."""
        if not self.supported():
            return False

        data = self._get_data()
        if data is None:
            return False

        return data[18] == 0x15  # 21 in decimal

    def enable(self) -> None:
        """Enable Night Light."""
        if self.supported() and not self.enabled():
            self.toggle()

    def disable(self) -> None:
        """Disable Night Light."""
        if self.supported() and self.enabled():
            self.toggle()

    def toggle(self) -> None:
        """Toggle Night Light on/off."""
        if not self.supported():
            raise RuntimeError("Night Light feature is not supported on this system.")

        enabled = self.enabled()
        data = self._get_data()

        if data is None:
            raise RuntimeError("Could not retrieve Night Light data.")

        data = bytearray(data)

        if enabled:
            # Create a 41-element array filled with zeros
            new_data = bytearray(41)

            # Copy data[0-21] to new_data[0-21]
            new_data[0:22] = data[0:22]

            # Copy data[25-42] to new_data[23-40]
            if len(data) > 25:
                copy_length = min(len(data) - 25, 43 - 25)
                new_data[23:23 + copy_length] = data[25:25 + copy_length]

            new_data[18] = 0x13
        else:
            # Create a 43-element array filled with zeros
            new_data = bytearray(43)

            # Copy data[0-21] to new_data[0-21]
            new_data[0:22] = data[0:22]

            # Copy data[23-40] to new_data[25-42]
            if len(data) > 23:
                copy_length = min(len(data) - 23, 41 - 23)
                new_data[25:25 + copy_length] = data[23:23 + copy_length]

            new_data[18] = 0x15
            new_data[23] = 0x10
            new_data[24] = 0x00

        # Increment the first byte in the range 10-14 that isn't 0xff
        for i in range(10, 15):
            if new_data[i] != 0xff:
                new_data[i] = (new_data[i] + 1) % 256
                break

        # Update the registry
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, self._state_key_path, 0, winreg.KEY_SET_VALUE)
            winreg.SetValueEx(key, "Data", 0, winreg.REG_BINARY, bytes(new_data))
            winreg.CloseKey(key)
        except Exception as e:
            raise RuntimeError(f"Failed to update Night Light registry data: {e}")

    def _bytes_to_kelvin(self, lo_temp: int, hi_temp: int) -> float:
        """Convert bytes back to kelvin temperature."""
        return (hi_temp * 64) + ((lo_temp - 128) / 2)

    def _kelvin_to_percentage(self, kelvin: float) -> float:
        """Convert kelvin temperature to percentage."""
        return 100 - ((kelvin - MIN_KELVIN) / (MAX_KELVIN - MIN_KELVIN)) * 100

    def _percentage_to_kelvin(self, percentage: float) -> float:
        """Convert percentage to kelvin temperature."""
        return MAX_KELVIN - (percentage / 100) * (MAX_KELVIN - MIN_KELVIN)

    def get_strength(self) -> int:
        """Get current Night Light strength as percentage (0-100)."""
        if not self.supported():
            return 0

        data = self._get_settings_data()
        if data is None:
            return 0

        # Get temperature bytes from indices 0x23 and 0x24
        temp_lo = data[0x23]
        temp_hi = data[0x24]

        # Convert bytes to kelvin
        kelvin = self._bytes_to_kelvin(temp_lo, temp_hi)

        # Convert kelvin to percentage
        return round(self._kelvin_to_percentage(kelvin))

    def set_strength(self, percentage: int) -> None:
        """
        Set Night Light strength percentage.

        Args:
            percentage: Strength value between 0 (coolest) and 100 (warmest)
        """
        if not self.supported():
            raise RuntimeError("Night Light feature is not supported on this system.")

        # Clamp percentage between 0-100
        percentage = max(0, min(100, percentage))

        # Convert percentage to kelvin
        kelvin = self._percentage_to_kelvin(percentage)

        data = self._get_settings_data()
        if data is None:
            raise RuntimeError("Could not retrieve Night Light settings data.")

        # Create a copy of the current data
        new_data = bytearray(data)

        # Calculate bytes for the temperature
        temp_hi = int(kelvin // 64)
        temp_lo = int(((kelvin - (temp_hi * 64)) * 2) + 128)

        # Update temperature bytes (indices 0x23, 0x24)
        new_data[0x23] = temp_lo
        new_data[0x24] = temp_hi

        # Update timestamp bytes
        for i in range(10, 15):
            if new_data[i] != 0xff:
                new_data[i] = (new_data[i] + 1) % 256
                break

        # Update the registry
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, self._settings_key_path, 0, winreg.KEY_SET_VALUE)
            winreg.SetValueEx(key, "Data", 0, winreg.REG_BINARY, bytes(new_data))
            winreg.CloseKey(key)
        except Exception as e:
            raise RuntimeError(f"Failed to update Night Light strength: {e}")


# Example usage
if __name__ == "__main__":
    night_light = NightLight()

    print(f"Supported: {night_light.supported()}")
    print(f"Enabled: {night_light.enabled()}")
    print(f"Current strength: {night_light.get_strength()}%")
