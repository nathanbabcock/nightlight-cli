# Script to toggle windows night light on and off
# Save as .pyw instead of .py to avoid command-line window
 
import winreg, sys, subprocess
NLregkey_cmd = r"HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\CloudStore\Store\DefaultAccount\Current\default$windows.data.bluelightreduction.bluelightreductionstate\windows.data.bluelightreduction.bluelightreductionstate"
NLregkey = r"Software\Microsoft\Windows\CurrentVersion\CloudStore\Store\DefaultAccount\Current\default$windows.data.bluelightreduction.bluelightreductionstate\windows.data.bluelightreduction.bluelightreductionstate"
 
if "WindowsApps" in sys.executable: # if Python from the MS Store
    USE_CMD = True # use reg.exe -- slower and pops up command prompt
else:
    USE_CMD = False # use python's winreg module -- won't work on msix installs due to sandbox
    
if "pythonw.exe" in sys.executable: # if Python without cmd window
    NO_CMD = True # never offer command prompt
else:
    NO_CMD = False 
    
def get_NL_key():
# read value of night light key and check if it looks right
    access_key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, NLregkey)
    NLvalue = bytearray(winreg.EnumValue(access_key, 0)[1])
    winreg.CloseKey(access_key)
 
    # the registry key has the hex value 43 42 01 00 once in the
    # beginning of the key, once somewhere in the middle
 
    if NLvalue.count(b'CB\x01\x00') == 2: # if it roughly looks right
        return NLvalue
    elif NLvalue.count(b'CB\x01\x00') == 1:
        raise Exception("Registry key doesn't seem to match required format.\nHex sequence 43 42 01 00 appears only once instead of twice.\nIt is possible that Night Light hasn't been used before, please enable it manually.")
    else:
        raise Exception("Registry key doesn't seem to match required format.\nHex sequence 43 42 01 00 doesn't appear twice as it should.")
 
def check_NL_status(NLvalue=get_NL_key()):
# check whether NL is on/off based on registry key length (in bytes)
 
    if len(NLvalue) == 43:
        return True
    elif len(NLvalue) == 41:
        return False
    else:
        raise Exception("Registry key doesn't match required length. Should be either 41 or 43 bytes.")
 
def change_NL_value(NLvalue, whatdo="toggle"):
# changes input string (registry value) to the value matching the opposite state (on->off and v/v)
 
# there are 3 things that have to be done for the registry key to work:
 
# bytes 11 and 12 get incremented every time NL is toggled, idk why is that,
# but if you don't do that, it won't work. If they're at 255, they wrap around.
 
# byte 19 has value of either 19 or 21 (13 and 15 in hex), 19 is off and 21 is on.
 
# the sequence 16 0 (hex 10 00) is put in after byte 24.
# Its presence means on, its absence means off.
 
    NLisOn = check_NL_status(NLvalue) 
    
    if whatdo == "on": 
 
        if NLisOn: return(NLvalue) # if the value is already on, do nothing
        
        else:
            if NLvalue[11] == 255: NLvalue[11] = 0 # flip around
            else: NLvalue[11] += 1
 
            if NLvalue[10] == 255: NLvalue[10] = 0
            else: NLvalue[10] += 1
            
            if NLvalue[18] == 19: NLvalue[18] = 21
            else: raise Exception("Registry key doesn't seem to match required format. Byte 19 should be either 19 or 21 in decimal.")
 
            insbytes = (16, 0)
            NLvalue[23:23] = insbytes # insert bytes into value
 
            return(NLvalue)
            
    elif whatdo == "off":
        
        if not NLisOn: return(NLvalue)
 
        else:
            if NLvalue[11] == 255: NLvalue[11] = 0
            else: NLvalue[11] += 1
 
            if NLvalue[10] == 255: NLvalue[10] = 0
            else: NLvalue[10] += 1
            
            if NLvalue[18] == 21: NLvalue[18] = 19
            else: raise Exception("Registry key doesn't seem to match required format.  Byte 19 should be either 19 or 21 in decimal.")
 
            rembytes = b'\x10\x00'
            if NLvalue[23:25] == rembytes: del NLvalue[23:25]
            else: raise Exception("Registry key doesn't seem to match required format. Bytes 22 and 23 should be 16 and 0 in decimal.")
 
            
            return(NLvalue)
        
    elif whatdo == "toggle":
        if NLisOn: return change_NL_value(NLvalue, "off")
        else: return change_NL_value(NLvalue, "on")
 
def write_NL_value(NLvalue):
# pass value to the right writing function, based on settings
 
    if USE_CMD:
        write_NL_value_cmd(NLvalue)
    else:
        write_NL_value_P(NLvalue)
 
def write_NL_value_P(NLvalue):
# uses python to change the key
# won't work with packaged python so disabled by default
 
    NLvalue = bytes(NLvalue)
    access_key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, NLregkey, 0, winreg.KEY_WRITE)
    winreg.SetValueEx(access_key, "Data", 0, winreg.REG_BINARY, NLvalue)
    winreg.CloseKey(access_key)
 
def write_NL_value_cmd(NLvalue):
# passes command to system shell
# specifies conhost for people such as myself who have Windows Terminal set as default
# WT is nice but conhost is a lot faster to start, which is what we need here
 
    NLvalue = NLvalue.hex() # converts to one hex number -- suitable for reg
    #subprocess.run("reg query HKCU", stdout=subprocess.DEVNULL)
    cmdline = f"conhost reg add {NLregkey_cmd} /v Data /t REG_BINARY /d {NLvalue} /f"
    subprocess.run(cmdline)#, stdout=subprocess.DEVNULL)
 
def main():
 
    if len(sys.argv) == 1: # if no arguments, run in "interactive mode"
 
        if NO_CMD: # pythonw.exe
 
            write_NL_value(change_NL_value(get_NL_key())) # toggle NL
            
        else: # python.exe
            
            NLisOn = check_NL_status()
            if NLisOn:
                choice = input("Night light is enabled.\nDo you want to turn it off? (y/n) ")
            else:
                choice = input("Night light is disabled.\nDo you want to turn it on? (y/n) ")
 
            if choice.lower() == "y":
                write_NL_value(change_NL_value(get_NL_key()))
            else:
                exit()
 
    else:
        if sys.argv[1] == "-turnon":
            write_NL_value(change_NL_value(get_NL_key(), "on"))
        elif sys.argv[1] == "-turnoff":
            write_NL_value(change_NL_value(get_NL_key(), "off"))
        elif sys.argv[1] == "-toggle":
            write_NL_value(change_NL_value(get_NL_key(), "toggle"))
        elif sys.argv[1] == "-ison":
            print(check_NL_status())
        elif sys.argv[1] == "-h":
            print("""
Night Light Toggler
for Windows 10 and 11\n
List of possible arguments:
-turnon -- obvious...
-turnoff -- 
-toggle -- 
-ison -- check if NL is on or off
-h -- help
            """)
    
if(__name__ == "__main__"):
    main()