[![npm version](https://badge.fury.io/js/homebridge-raspberrypi-remote.svg)](https://badge.fury.io/js/homebridge-raspberrypi-remote)

# RPi remote control
This is Raspberry Pi Remote plugin for [Homebridge](https://github.com/nfarina/homebridge). 



### Features
* Display Raspberry Pi state.



### Installation
1. Install required packages.

   ```
   npm install -g homebridge-raspberrypi-remote
   ```

2. Check the OS of Raspberry Pi.

3. Add these values to `config.json`.

    ```
      "accessories": [
        {
          "accessory": "RaspberryPi",
          "name": "Raspberry Pi",
          "os": "linux",
          "interval": 5000,
          "showCpuUsage": false,
          "showMemoryUsage": false,
          "showTemperature": true,
          "enableReboot": true
        }
      ]
    ```

4. Restart Homebridge, and your Raspberry Pi will be added to Home app.



# License
MIT License
