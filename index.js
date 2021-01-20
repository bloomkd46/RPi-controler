'use strict';

const exec = require('child_process').exec;
const inherits = require('util').inherits;
const version = require('./package.json').version;
const count = Math.pow(10, 2);
let deviceInfo = {};
let Service;
let Characteristic;
let logger;

module.exports = function (homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;

	homebridge.registerAccessory('homebridge-raspberrypi-remote', 'RaspberryPi', RaspberryPi);
}

function initCustomService() {
	/**
	 * Service "RaspberryPi" Based on Service.Switch
	 */
	let raspberryPiUUID = '00000049-0000-1000-8000-0026BB765291';
	Service.RaspberryPi = function (displayName, subType) {
		Service.call(this, displayName, raspberryPiUUID, subType);

		// Required Characteristics
		this.addCharacteristic(Characteristic.On);

		// Optional Characteristics
		this.addOptionalCharacteristic(Characteristic.Name);
	}

	inherits(Service.RaspberryPi, Service);
	Service.RaspberryPi.UUID = raspberryPiUUID;
}

function getDeviceInfo() {
	exec('cat /proc/cpuinfo', function (error, stdout, stderr) {
		if (error) {
			logger(error);
		} else {
			if (stdout) {
				let revisionArr = stdout.match(/Revision\s*:\s*(.*)/);
				let serialArr = stdout.match(/Serial\s*:\s*(.*)/);
				let model = 'RespberryPi ';

				switch (revisionArr[1]) {
					case '0002':
					case '0003':
						// RAM size: 256MB
						model += 'Model B Rev 1';
						break;
					case '0004':
					case '0005':
					case '0006':
						// RAM size: 256MB
						model += 'Model B Rev 2';
						break;
					case '0007':
					case '0008':
					case '0009':
						// RAM size: 256MB
						model += 'Model A';
						break;
					case '000d':
					case '000e':
					case '000f':
						// RAM size: 512MB
						model += 'Model B Rev 2';
						break;
					case '0010':
					case '0013':
					case '900032':
						// RAM size: 512MB
						model += 'Model B+';
						break;
					case '0011':
					case '0014':
						// RAM size: 512MB
						model += 'Compute Module';
						break;
					case '0012':
					case '0015':
						// RAM size: 256MB
						model += 'Model A+';
						break;
					case 'a01041':
						// RAM size: 1GB
						model += '2 Model B v1.1';
						break;
					case 'a22042':
						// RAM size: 1GB
						model += '2 Model B v1.2';
						break;
					case '900092':
						// RAM size: 512MB
						model += 'Zero v1.2';
						break;
					case '900093':
						// RAM size: 512MB
						model += 'Zero v1.3';
						break;
					case '9000C1':
						// RAM size: 512MB
						model += 'Zero W';
						break;
					case 'a02082':
						// RAM size: 1GB
						model += '3 Model B';
						break;
					case 'a020d3':
					default:
						// RAM size: 1GB
						model += '3 Model B+';
						break;
				}

				deviceInfo = {
					model: model,
					serialNumber: serialArr[1]
				};
			}
		}
	});
}

function RaspberryPi(log, config) {
	logger = log;

	this.services = [];
	this.name = config.name || 'Respberry Pi';
	this.os = config.os || 'linux';
	this.interval = Number(config.interval) || 60000;
	this.showCpuUsage = config.showCpuUsage || false;
	this.showMemoryUsage = config.showMemoryUsage || false;
	this.showTemperature = config.showTemperature || false;
	this.enableReboot = config.enableReboot || false;
	this.operatingState = true;
	this.cpuUsage = undefined;
	this.memoryUsage = undefined;
	this.temperature = undefined;

	getDeviceInfo();
	initCustomService();

	this.service = new Service.RaspberryPi(this.name, 'Shutdown');
	this.serviceInfo = new Service.AccessoryInformation();

	this.service
		.getCharacteristic(Characteristic.On)
		.on('get', this.getPowerState.bind(this))
		.on('set', this.setPowerState.bind(this));

	this.serviceInfo
		.setCharacteristic(Characteristic.Manufacturer, 'Raspberry Pi Foundation')
		.setCharacteristic(Characteristic.Model, deviceInfo.model)
		.setCharacteristic(Characteristic.SerialNumber, deviceInfo.serialNumber)
		.setCharacteristic(Characteristic.FirmwareRevision, version);

	this.services.push(this.service);
	this.services.push(this.serviceInfo);

	if (this.showCpuUsage) {
		this.cpuSensorService = new Service.TemperatureSensor(this.name + ' CPU', 'CPU');
	
		this.cpuSensorService
			.getCharacteristic(Characteristic.CurrentTemperature)
			.on('get', this.getCpuUsage.bind(this));

		this.services.push(this.cpuSensorService);
	}

	if (this.showMemoryUsage) {
		this.memorySensorService = new Service.TemperatureSensor(this.name + ' Memory', 'Memory');
	
		this.memorySensorService
			.getCharacteristic(Characteristic.CurrentTemperature)
			.on('get', this.getMemoryUsage.bind(this));

		this.services.push(this.memorySensorService);
	}

	if (this.showTemperature) {
		this.temperatureSensorService = new Service.TemperatureSensor(this.name + ' Temperature', 'Temperature');
	
		this.temperatureSensorService
			.getCharacteristic(Characteristic.CurrentTemperature)
			.on('get', this.getTemperature.bind(this));

		this.services.push(this.temperatureSensorService);
	}

	if (this.enableReboot) {
		this.rebootService = new Service.Button(this.name + ' Reboot', 'Reboot');

		this.rebootService
			.getCharacteristic(Characteristic.On)
			.on('get', this.getRebootState.bind(this))
			.on('set', this.setRebootState.bind(this));

		this.services.push(this.rebootService);
	}
	
	this.discover();
}

RaspberryPi.prototype = {
	discover: function () {
		const that = this;

		setInterval(function () {
			that.updateCpuUsage();
			that.updateMemoryUsage();
			that.updateTemperature();
		}, that.interval);
	},

	getPowerState: function (callback) {
		callback(null, this.operatingState);
	},

	setPowerState: function (state, callback) {
		if (!this.operatingState) {
			return;
		}

		const that = this;
		
		exec('sudo poweroff', function (error, stdout, stderr) {
			if (error) {
				logger(error);
			} else {
				that.operatingState = false;
				
				logger.debug('operating state: %s', that.operatingState);

				callback(null, that.operatingState);
			}
		});
	},

	getRebootState: function (callback) {
		if (!this.operatingState) {
			return;
		}

		callback(null, !this.operatingState);
	},

	setRebootState: function (state, callback) {
		if (!this.operatingState) {
			return;
		}

		const that = this;
		
		exec('sudo reboot', function (error, stdout, stderr) {
			if (error) {
				logger(error);
			} else {
				that.operatingState = false;
				
				logger.debug('operating state: %s', that.operatingState);

				callback(null, that.operatingState);
			}
		});
	},

	getCpuUsage: function (callback) {
		logger.debug('getCpuUsage: %s', this.cpuUsage);

		callback(null, this.cpuUsage);
	},

	updateCpuUsage: function () {
		if (!this.showCpuUsage) {
			return;
		}

		const that = this;

		exec('top -n 1 | grep -i cpu\\(s\\)| awk \'{print $2}\'', function (error, stdout, stderr) {
			if (error) {
				logger(error);
			} else {
				let cpuUsage = Number(stdout);
				cpuUsage = Math.round(cpuUsage * count) / count;

				that.cpuUsage = cpuUsage;
				
				logger.debug('updateCpuUsage: %s', that.cpuUsage);
			}
		});
	},

	getMemoryUsage: function (callback) {
		logger.debug('getMemoryUsage: %s', this.memoryUsage);

		callback(null, this.memoryUsage);
	},

	updateMemoryUsage: function () {
		if (!this.showMemoryUsage) {
			return;
		}

		const that = this;

		exec('cat /proc/meminfo | grep Mem', function (error, stdout, stderr) {
			if (error) {
				logger(error);
			} else {
				let memTotalArr = stdout.match(/MemTotal\s*:\s*(\d*)/);
				let memFreeArr = stdout.match(/MemFree\s*:\s*(\d*)/);
				let memTotal = Number(memTotalArr[1]);
				let memFree = Number(memFreeArr[1]);
				let memUsage = (memTotal - memFree) / memTotal * 100;
				memUsage = Math.round(memUsage * count) / count;

				that.memoryUsage = memUsage;
				
				logger.debug('updateMemoryUsage: %s', that.memoryUsage);
			}
		});
	},

	getTemperature: function (callback) {
		logger.debug('getTemperature: %s', this.temperature);

		callback(null, this.temperature);
	},

	updateTemperature: function () {
		if (!this.showTemperature) {
			return;
		}

		const that = this;

		exec('/usr/lib/node_modules/homebridge-raspberrypi-remote/current_temperature.sh', function (error, stdout, stderr) {
			if (error) {
				logger(error);
			} else {
				if (stdout) {
					let temperatureArr = stdout.match(/(?!(CPU|GPU) : )(\d{1,3})(\.?\d*)(?='(C|F))/g);
					that.temperature = Number(temperatureArr[1]);
				}
				
				logger.debug('updateTemperature: %s', that.temperature);

				that.service.getCharacteristic(Characteristic.CurrentTemperature)
					.setProps({
						unit: Characteristic.Units.FAHRENHEIT
					})
					.updateValue(that.temperature);
			}
		});
	},

	identify: function (callback) {
		callback();
	},

	getServices: function () {
		return this.services;
	}
};
