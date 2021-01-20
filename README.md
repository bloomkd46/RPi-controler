[![npm version](https://badge.fury.io/js/homebridge-raspberrypi-remote.svg)](https://badge.fury.io/js/homebridge-raspberrypi-remote)

# RPi-Controller
This is Raspberry Pi Remote plugin for [Homebridge](https://github.com/nfarina/homebridge). 



### Features
* Display Raspberry Pi state.
* Turn off Raspberry Pi.
* Reboot Raspberry Pi.
* Get Raspberry Pi tempature in fahrenheit.



### Installation
1. Install required packages.

   ```
   npm install -g homebridge-rpi-controller
   ```

2. Check the OS of Raspberry Pi.

3. Add these values to `config.json`.

    ```
      "accessories": [
        {
          "accessory": "RaspberryPi",
          "name": "Raspberry Pi",
          "os": "linux",
          "showTemperature": true,
          "enableReboot": true,
          "accessory": "RaspberryPiTemperature",
          "name": "RaspberryPi CPU Temperature",
          "temperatureMeasurement": "celsius",
          "updateInterval": 1000
        }
      ]
    ```

4. Restart Homebridge, and your Raspberry Pi will be added to Home app.



# License
MIT License

# Credit

Original By [Clauzewitz](https://github.com/clauzewitz).

Temperature Unit By [YingHangCode](https://github.com/YinHangCode/homebridge-raspberrypi-temperature).
