var Accessory, Service, Characteristic, UUIDGen;

function RaspberryPi(log, config) {
	logger = log;

	this.services = [];
	this.name = config.name || 'Respberry Pi';
	this.os = config.os || 'linux';
	this.interval = Number(config.interval) || 60000;
	this.showTemperature = config.showTemperature || false;
	this.enableReboot = config.enableReboot || false;
	this.operatingState = true;
	this.temperature = undefined;
    
    
    
const fs = require('fs');
const packageFile = require("./package.json");

module.exports = function(homebridge) {
    if(!isConfig(homebridge.user.configPath(), "accessories", "RaspberryPiTemperature")) {
        return;
    }

    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerAccessory('homebridge-raspberrypi-temperature', 'RaspberryPiTemperature', RaspberryPiTemperature);
}

function isConfig(configFile, type, name) {
    var config = JSON.parse(fs.readFileSync(configFile));
    if("accessories" === type) {
        var accessories = config.accessories;
        for(var i in accessories) {
            if(accessories[i]['accessory'] === name) {
                return true;
            }
        }
    } else if("platforms" === type) {
        var platforms = config.platforms;
        for(var i in platforms) {
            if(platforms[i]['platform'] === name) {
                return true;
            }
        }
    } else {
    }

    return false;
}

if (this.showTemperature) function RaspberryPiTemperature(log, config) {
    if(null == config) {
        return;
    }

    this.log = log;
    this.name = config["name"];
    if(config["file"]) {
        this.readFile = config["file"];
    } else {
        this.readFile = "/sys/class/thermal/thermal_zone0/temp";
    }
    if(config["updateInterval"] && config["updateInterval"] > 0) {
        this.updateInterval = config["updateInterval"];
    } else {
        this.updateInterval = null;
    }
    this.multiplier = config["multiplier"] || 1000;
    this.temperatureMeasurement = (typeof config["temperatureMeasurement"] === 'undefined') ? 'fahrenheit' : config["temperatureMeasurement"];
}
    
    if (this.enableReboot) {
		this.rebootService = new Service.Switch(this.name + ' Reboot', 'Reboot');

		this.rebootService
			.getCharacteristic(Characteristic.On)
			.on('get', this.getRebootState.bind(this))
			.on('set', this.setRebootState.bind(this));

		this.services.push(this.rebootService);
	}
}

RaspberryPiTemperature.prototype = {
    getServices: function() {
        var that = this;

        var infoService = new Service.AccessoryInformation();
        infoService
            .setCharacteristic(Characteristic.Manufacturer, "RaspberryPi")
            .setCharacteristic(Characteristic.Model, "3B")
            .setCharacteristic(Characteristic.SerialNumber, "Undefined")
            .setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);

        var raspberrypiService = new Service.TemperatureSensor(that.name);
        var currentTemperatureCharacteristic = raspberrypiService.getCharacteristic(Characteristic.CurrentTemperature);
        function getCurrentTemperature() {
            var data = fs.readFileSync(that.readFile, "utf-8");
            var temperatureVal = parseFloat(data) / that.multiplier;
            that.log.debug("update currentTemperatureCharacteristic value: " + temperatureVal);
            return (that.temperatureMeasurement === 'celsius') ? fahrenheitToCelsius(temperatureVal) : temperatureVal;
        }
        function fahrenheitToCelsius(fahrenheit) {
            return Math.round((fahrenheit - 32) / 1.8, 3);
        }
        currentTemperatureCharacteristic.updateValue(getCurrentTemperature());
        if(that.updateInterval) {
            setInterval(() => {
                currentTemperatureCharacteristic.updateValue(getCurrentTemperature());
            }, that.updateInterval);
        }
        currentTemperatureCharacteristic.on('get', (callback) => {
            callback(null, getCurrentTemperature());
        });

        return [infoService, raspberrypiService];
    }
}
