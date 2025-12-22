// ============================================================
// SMART HOME AUTOMATION SYSTEM
// Final Project Solution - JavaScript Mastery Program
// Msebetsi Solutions - Technology Education Division
// ============================================================

/**
 * @fileoverview Comprehensive Smart Home Automation System
 * @module SmartHome/Automation
 * @version 1.0.0
 * @author JavaScript Mastery Graduate
 * @license MIT
 */

// ==================== MAIN SMART HOME OBJECT ====================

/**
 * Main SmartHome controller object
 * Manages all devices, rooms, schedules, and energy monitoring
 * @namespace SmartHome
 */
const SmartHome = {
    /** @type {string} - Name of the smart home */
    name: 'Smart Residence',
    
    /** @type {Array<Room>} - List of rooms in the home */
    rooms: [],
    
    /** @type {Array<Device>} - List of all smart devices */
    devices: [],
    
    /** @type {Array<Schedule>} - List of automation schedules */
    schedules: [],
    
    /** @type {EnergyMonitor} - Energy consumption tracker */
    energyMonitor: null,
    
    /** @type {boolean} - System operational status */
    isSystemActive: false,
    
    // ==================== INITIALIZATION METHODS ====================
    
    /**
     * Initialize the smart home system
     * @method initialize
     * @returns {boolean} - Success status
     */
    initialize: function() {
        console.log(`🏠 Initializing ${this.name} Smart Home System...`);
        
        try {
            // Create energy monitor
            this.energyMonitor = Object.create(EnergyMonitor);
            this.energyMonitor.initialize();
            
            // Set up default rooms
            this.setupDefaultRooms();
            
            // Add sample devices
            this.addSampleDevices();
            
            // Create default schedules
            this.setupDefaultSchedules();
            
            this.isSystemActive = true;
            console.log('✅ Smart Home System initialized successfully!');
            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            return false;
        }
    },
    
    /**
     * Set up default rooms for the home
     * @method setupDefaultRooms
     */
    setupDefaultRooms: function() {
        const defaultRooms = [
            { name: 'Living Room', type: 'living', area: 25 },
            { name: 'Kitchen', type: 'kitchen', area: 15 },
            { name: 'Master Bedroom', type: 'bedroom', area: 20 },
            { name: 'Home Office', type: 'office', area: 12 }
        ];
        
        defaultRooms.forEach(roomData => {
            const room = Object.create(Room);
            room.initialize(roomData.name, roomData.type, roomData.area);
            this.rooms.push(room);
        });
        
        console.log(`✅ Created ${this.rooms.length} default rooms`);
    },
    
    // ==================== DEVICE MANAGEMENT ====================
    
    /**
     * Add a new device to the smart home
     * @method addDevice
     * @param {Device} device - The device object to add
     * @param {string} roomName - Name of room to place device in
     * @returns {boolean} - Success status
     */
    addDevice: function(device, roomName = 'Living Room') {
        // Input validation
        if (!device || typeof device.toggle !== 'function') {
            console.error('❌ Invalid device object provided');
            return false;
        }
        
        // Find the room
        const room = this.rooms.find(r => r.name === roomName);
        if (!room) {
            console.error(`❌ Room "${roomName}" not found`);
            return false;
        }
        
        // Add device to system
        this.devices.push(device);
        room.addDevice(device);
        
        // Register with energy monitor
        if (this.energyMonitor) {
            this.energyMonitor.registerDevice(device);
        }
        
        console.log(`✅ Added ${device.name} to ${roomName}`);
        return true;
    },
    
    /**
     * Add sample devices for demonstration
     * @method addSampleDevices
     */
    addSampleDevices: function() {
        const sampleDevices = [
            // Smart Lights
            Object.create(SmartLight).initialize('Living Room Light', 'living-room-light', 60),
            Object.create(SmartLight).initialize('Kitchen Light', 'kitchen-light', 40),
            
            // Thermostat
            Object.create(Thermostat).initialize('Main Thermostat', 'thermostat-1', 22),
            
            // Smart Plug
            Object.create(SmartPlug).initialize('Coffee Maker', 'plug-coffee', 800),
            
            // Security Camera
            Object.create(SecurityCamera).initialize('Front Door Camera', 'camera-front'),
        ];
        
        sampleDevices.forEach(device => {
            this.addDevice(device, this.getRoomForDevice(device));
        });
        
        console.log(`✅ Added ${sampleDevices.length} sample devices`);
    },
    
    /**
     * Determine appropriate room for a device based on its name/type
     * @method getRoomForDevice
     * @param {Device} device - The device to place
     * @returns {string} - Room name
     */
    getRoomForDevice: function(device) {
        const deviceName = device.name.toLowerCase();
        
        if (deviceName.includes('kitchen')) return 'Kitchen';
        if (deviceName.includes('living')) return 'Living Room';
        if (deviceName.includes('bedroom')) return 'Master Bedroom';
        if (deviceName.includes('office')) return 'Home Office';
        
        // Default to living room
        return 'Living Room';
    },
    
    /**
     * Remove a device from the system
     * @method removeDevice
     * @param {string} deviceId - ID of device to remove
     * @returns {boolean} - Success status
     */
    removeDevice: function(deviceId) {
        const deviceIndex = this.devices.findIndex(d => d.id === deviceId);
        
        if (deviceIndex === -1) {
            console.error(`❌ Device with ID "${deviceId}" not found`);
            return false;
        }
        
        const device = this.devices[deviceIndex];
        
        // Remove from energy monitor
        if (this.energyMonitor) {
            this.energyMonitor.unregisterDevice(deviceId);
        }
        
        // Remove from room
        this.rooms.forEach(room => {
            room.removeDevice(deviceId);
        });
        
        // Remove from devices array
        this.devices.splice(deviceIndex, 1);
        
        console.log(`✅ Removed device: ${device.name}`);
        return true;
    },
    
    /**
     * Find a device by its ID
     * @method findDevice
     * @param {string} deviceId - Device ID to search for
     * @returns {Device|undefined} - Found device or undefined
     */
    findDevice: function(deviceId) {
        return this.devices.find(d => d.id === deviceId);
    },
    
    /**
     * Toggle a device on/off
     * @method toggleDevice
     * @param {string} deviceId - ID of device to toggle
     * @returns {boolean} - New state of device (true = on)
     */
    toggleDevice: function(deviceId) {
        const device = this.findDevice(deviceId);
        
        if (!device) {
            console.error(`❌ Device "${deviceId}" not found`);
            return false;
        }
        
        if (typeof device.toggle !== 'function') {
            console.error(`❌ Device "${deviceId}" doesn't support toggle`);
            return false;
        }
        
        const newState = device.toggle();
        console.log(`✅ ${device.name} is now ${newState ? 'ON' : 'OFF'}`);
        
        // Update energy monitor
        if (this.energyMonitor) {
            this.energyMonitor.updateDeviceState(deviceId, newState);
        }
        
        return newState;
    },
    
    // ==================== ENERGY MANAGEMENT ====================
    
    /**
     * Calculate total energy consumption
     * @method calculateEnergyUsage
     * @returns {Object} - Energy usage statistics
     */
    calculateEnergyUsage: function() {
        if (!this.energyMonitor) {
            console.error('❌ Energy monitor not initialized');
            return { total: 0, byRoom: {}, byDevice: {} };
        }
        
        return this.energyMonitor.calculateTotalUsage();
    },
    
    /**
     * Get energy usage report
     * @method getEnergyReport
     * @returns {string} - Formatted energy report
     */
    getEnergyReport: function() {
        const usage = this.calculateEnergyUsage();
        
        let report = `📊 ENERGY USAGE REPORT - ${this.name}\n`;
        report += `================================\n`;
        report += `Total Consumption: ${usage.total.toFixed(2)} kWh\n\n`;
        
        report += `By Room:\n`;
        Object.entries(usage.byRoom).forEach(([room, energy]) => {
            report += `  ${room}: ${energy.toFixed(2)} kWh\n`;
        });
        
        report += `\nBy Device Type:\n`;
        Object.entries(usage.byDeviceType).forEach(([type, energy]) => {
            report += `  ${type}: ${energy.toFixed(2)} kWh\n`;
        });
        
        return report;
    },
    
    // ==================== SCHEDULING & AUTOMATION ====================
    
    /**
     * Set up default automation schedules
     * @method setupDefaultSchedules
     */
    setupDefaultSchedules: function() {
        const morningSchedule = Object.create(Schedule);
        morningSchedule.initialize('Morning Routine', '07:00', [
            { deviceId: 'living-room-light', action: 'on' },
            { deviceId: 'thermostat-1', action: 'set', value: 21 }
        ]);
        
        const nightSchedule = Object.create(Schedule);
        nightSchedule.initialize('Night Routine', '22:00', [
            { deviceId: 'living-room-light', action: 'off' },
            { deviceId: 'kitchen-light', action: 'off' },
            { deviceId: 'thermostat-1', action: 'set', value: 18 }
        ]);
        
        this.schedules.push(morningSchedule, nightSchedule);
        console.log(`✅ Created ${this.schedules.length} automation schedules`);
    },
    
    /**
     * Create a new automation schedule
     * @method createSchedule
     * @param {string} name - Schedule name
     * @param {string} time - Trigger time (HH:MM)
     * @param {Array} actions - List of actions to perform
     * @returns {Schedule} - Created schedule object
     */
    createSchedule: function(name, time, actions) {
        // Validate time format
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
            throw new Error('Invalid time format. Use HH:MM (24-hour)');
        }
        
        const schedule = Object.create(Schedule);
        schedule.initialize(name, time, actions);
        this.schedules.push(schedule);
        
        console.log(`✅ Created schedule: ${name} at ${time}`);
        return schedule;
    },
    
    /**
     * Trigger a schedule by name
     * @method triggerSchedule
     * @param {string} scheduleName - Name of schedule to trigger
     * @returns {boolean} - Success status
     */
    triggerSchedule: function(scheduleName) {
        const schedule = this.schedules.find(s => s.name === scheduleName);
        
        if (!schedule) {
            console.error(`❌ Schedule "${scheduleName}" not found`);
            return false;
        }
        
        console.log(`⏰ Triggering schedule: ${scheduleName}`);
        return schedule.execute(this);
    },
    
    // ==================== SYSTEM STATUS & REPORTING ====================
    
    /**
     * Get overall system status
     * @method getSystemStatus
     * @returns {Object} - System status information
     */
    getSystemStatus: function() {
        const activeDevices = this.devices.filter(d => d.isOn).length;
        const totalDevices = this.devices.length;
        
        return {
            systemActive: this.isSystemActive,
            totalRooms: this.rooms.length,
            totalDevices: totalDevices,
            activeDevices: activeDevices,
            inactiveDevices: totalDevices - activeDevices,
            totalSchedules: this.schedules.length,
            energyMonitorActive: !!this.energyMonitor
        };
    },
    
    /**
     * Generate a comprehensive system report
     * @method generateSystemReport
     * @returns {string} - Formatted system report
     */
    generateSystemReport: function() {
        const status = this.getSystemStatus();
        const energy = this.calculateEnergyUsage();
        
        let report = `🏠 SMART HOME SYSTEM REPORT\n`;
        report += `===========================\n\n`;
        
        report += `SYSTEM STATUS:\n`;
        report += `  System: ${status.systemActive ? 'Active ✅' : 'Inactive ❌'}\n`;
        report += `  Rooms: ${status.totalRooms}\n`;
        report += `  Devices: ${status.totalDevices} (${status.activeDevices} active)\n`;
        report += `  Schedules: ${status.totalSchedules}\n\n`;
        
        report += `ENERGY CONSUMPTION:\n`;
        report += `  Total: ${energy.total.toFixed(2)} kWh\n\n`;
        
        report += `ROOMS & DEVICES:\n`;
        this.rooms.forEach(room => {
            report += `  ${room.name} (${room.type}):\n`;
            room.devices.forEach(device => {
                report += `    - ${device.name}: ${device.isOn ? 'ON 💡' : 'OFF 🔌'}\n`;
            });
        });
        
        return report;
    },
    
    /**
     * Emergency shutdown of all devices
     * @method emergencyShutdown
     * @returns {number} - Number of devices turned off
     */
    emergencyShutdown: function() {
        console.log('🚨 EMERGENCY SHUTDOWN INITIATED');
        
        let devicesTurnedOff = 0;
        
        this.devices.forEach(device => {
            if (device.isOn && typeof device.turnOff === 'function') {
                device.turnOff();
                devicesTurnedOff++;
            }
        });
        
        console.log(`✅ Emergency shutdown complete. Turned off ${devicesTurnedOff} devices.`);
        return devicesTurnedOff;
    }
};

// ==================== ROOM OBJECT ====================

/**
 * Room object representing a physical room in the home
 * @namespace Room
 */
const Room = {
    /** @type {string} - Room name */
    name: '',
    
    /** @type {string} - Room type (bedroom, kitchen, etc.) */
    type: '',
    
    /** @type {number} - Room area in square meters */
    area: 0,
    
    /** @type {Array<Device>} - Devices in this room */
    devices: [],
    
    /**
     * Initialize a new room
     * @method initialize
     * @param {string} name - Room name
     * @param {string} type - Room type
     * @param {number} area - Room area in m²
     */
    initialize: function(name, type, area) {
        // Input validation
        if (!name || name.trim() === '') {
            throw new Error('Room name is required');
        }
        
        if (area <= 0) {
            throw new Error('Room area must be positive');
        }
        
        this.name = name;
        this.type = type;
        this.area = area;
        this.devices = [];
        
        console.log(`✅ Created room: ${name} (${type}, ${area}m²)`);
    },
    
    /**
     * Add a device to this room
     * @method addDevice
     * @param {Device} device - Device to add
     * @returns {boolean} - Success status
     */
    addDevice: function(device) {
        // Check if device already exists in room
        const exists = this.devices.some(d => d.id === device.id);
        
        if (exists) {
            console.warn(`⚠️ Device "${device.name}" already in room "${this.name}"`);
            return false;
        }
        
        this.devices.push(device);
        console.log(`✅ Added ${device.name} to ${this.name}`);
        return true;
    },
    
    /**
     * Remove a device from this room
     * @method removeDevice
     * @param {string} deviceId - ID of device to remove
     * @returns {boolean} - Success status
     */
    removeDevice: function(deviceId) {
        const initialLength = this.devices.length;
        this.devices = this.devices.filter(d => d.id !== deviceId);
        
        const removed = initialLength > this.devices.length;
        if (removed) {
            console.log(`✅ Removed device ${deviceId} from ${this.name}`);
        }
        
        return removed;
    },
    
    /**
     * Get all devices of a specific type in this room
     * @method getDevicesByType
     * @param {string} deviceType - Type of device to filter
     * @returns {Array<Device>} - Filtered devices
     */
    getDevicesByType: function(deviceType) {
        return this.devices.filter(d => d.type === deviceType);
    },
    
    /**
     * Calculate total energy consumption for this room
     * @method calculateRoomEnergy
     * @returns {number} - Total energy in kWh
     */
    calculateRoomEnergy: function() {
        return this.devices.reduce((total, device) => {
            return total + (device.calculateEnergyUsage ? device.calculateEnergyUsage() : 0);
        }, 0);
    }
};

// ==================== BASE DEVICE OBJECT ====================

/**
 * Base Device object - All smart devices inherit from this
 * @namespace Device
 */
const Device = {
    /** @type {string} - Device name */
    name: '',
    
    /** @type {string} - Unique device identifier */
    id: '',
    
    /** @type {string} - Device type */
    type: 'generic',
    
    /** @type {boolean} - Current power state */
    isOn: false,
    
    /** @type {number} - Power consumption in watts */
    powerRating: 0,
    
    /** @type {Date} - Last state change timestamp */
    lastStateChange: null,
    
    /**
     * Turn the device on
     * @method turnOn
     * @returns {boolean} - Success status
     */
    turnOn: function() {
        if (this.isOn) {
            console.log(`ℹ️ ${this.name} is already ON`);
            return true;
        }
        
        this.isOn = true;
        this.lastStateChange = new Date();
        console.log(`✅ ${this.name} turned ON`);
        return true;
    },
    
    /**
     * Turn the device off
     * @method turnOff
     * @returns {boolean} - Success status
     */
    turnOff: function() {
        if (!this.isOn) {
            console.log(`ℹ️ ${this.name} is already OFF`);
            return true;
        }
        
        this.isOn = false;
        this.lastStateChange = new Date();
        console.log(`✅ ${this.name} turned OFF`);
        return true;
    },
    
    /**
     * Toggle device state
     * @method toggle
     * @returns {boolean} - New state (true = on)
     */
    toggle: function() {
        this.isOn = !this.isOn;
        this.lastStateChange = new Date();
        console.log(`🔄 ${this.name} toggled ${this.isOn ? 'ON' : 'OFF'}`);
        return this.isOn;
    },
    
    /**
     * Calculate energy usage
     * @method calculateEnergyUsage
     * @returns {number} - Energy in kWh
     */
    calculateEnergyUsage: function() {
        if (!this.isOn || !this.lastStateChange) return 0;
        
        // Calculate hours since last state change
        const hoursOn = (new Date() - this.lastStateChange) / (1000 * 60 * 60);
        
        // Energy (kWh) = Power (kW) × Time (hours)
        return (this.powerRating / 1000) * hoursOn;
    },
    
    /**
     * Get device status
     * @method getStatus
     * @returns {Object} - Device status information
     */
    getStatus: function() {
        return {
            name: this.name,
            id: this.id,
            type: this.type,
            isOn: this.isOn,
            powerRating: this.powerRating,
            lastStateChange: this.lastStateChange,
            currentEnergyUsage: this.calculateEnergyUsage()
        };
    }
};

// ==================== SPECIFIC DEVICE TYPES ====================

/**
 * Smart Light Device
 * @namespace SmartLight
 */
const SmartLight = Object.create(Device);
SmartLight.type = 'light';
SmartLight.brightness = 100; // Percentage

SmartLight.initialize = function(name, id, powerRating) {
    this.name = name;
    this.id = id;
    this.powerRating = powerRating;
    this.isOn = false;
    return this;
};

SmartLight.setBrightness = function(level) {
    if (level < 0 || level > 100) {
        throw new Error('Brightness must be between 0-100%');
    }
    
    this.brightness = level;
    console.log(`💡 ${this.name} brightness set to ${level}%`);
    
    // Adjust power consumption based on brightness
    this.powerRating = Math.round((level / 100) * this.powerRating);
    return this.brightness;
};

/**
 * Thermostat Device
 * @namespace Thermostat
 */
const Thermostat = Object.create(Device);
Thermostat.type = 'thermostat';
Thermostat.currentTemp = 20; // Celsius
Thermostat.targetTemp = 22;
Thermostat.mode = 'cooling'; // heating/cooling/auto

Thermostat.initialize = function(name, id, initialTemp) {
    this.name = name;
    this.id = id;
    this.powerRating = 1500; // High power for HVAC
    this.currentTemp = initialTemp;
    this.targetTemp = initialTemp;
    return this;
};

Thermostat.setTemperature = function(temp) {
    if (temp < 10 || temp > 35) {
        throw new Error('Temperature must be between 10-35°C');
    }
    
    this.targetTemp = temp;
    console.log(`🌡️ ${this.name} target temperature set to ${temp}°C`);
    
    // Turn on if temperature needs adjustment
    if (Math.abs(this.currentTemp - temp) > 1) {
        this.turnOn();
    }
    
    return this.targetTemp;
};

Thermostat.updateCurrentTemp = function(newTemp) {
    this.currentTemp = newTemp;
    
    // Auto-adjust based on mode
    if (this.isOn) {
        if (this.mode === 'cooling' && this.currentTemp > this.targetTemp) {
            console.log(`❄️ ${this.name} cooling...`);
        } else if (this.mode === 'heating' && this.currentTemp < this.targetTemp) {
            console.log(`🔥 ${this.name} heating...`);
        } else {
            this.turnOff();
        }
    }
    
    return this.currentTemp;
};

/**
 * Smart Plug Device
 * @namespace SmartPlug
 */
const SmartPlug = Object.create(Device);
SmartPlug.type = 'plug';
SmartPlug.connectedDevice = '';

SmartPlug.initialize = function(name, id, powerRating) {
    this.name = name;
    this.id = id;
    this.powerRating = powerRating;
    return this;
};

SmartPlug.connectDevice = function(deviceName) {
    this.connectedDevice = deviceName;
    console.log(`🔌 ${this.name} connected to ${deviceName}`);
    return true;
};

/**
 * Security Camera Device
 * @namespace SecurityCamera
 */
const SecurityCamera = Object.create(Device);
SecurityCamera.type = 'camera';
SecurityCamera.isRecording = false;
SecurityCamera.motionDetected = false;

SecurityCamera.initialize = function(name, id) {
    this.name = name;
    this.id = id;
    this.powerRating = 50; // Low power for camera
    return this;
};

SecurityCamera.startRecording = function() {
    this.isRecording = true;
    console.log(`📹 ${this.name} started recording`);
    return true;
};

SecurityCamera.stopRecording = function() {
    this.isRecording = false;
    console.log(`📹 ${this.name} stopped recording`);
    return true;
};

SecurityCamera.detectMotion = function() {
    this.motionDetected = true;
    console.log(`🚨 MOTION DETECTED by ${this.name}`);
    
    // Auto-start recording if motion detected
    if (!this.isRecording) {
        this.startRecording();
    }
    
    return this.motionDetected;
};

// ==================== SCHEDULE OBJECT ====================

/**
 * Automation Schedule object
 * @namespace Schedule
 */
const Schedule = {
    /** @type {string} - Schedule name */
    name: '',
    
    /** @type {string} - Trigger time (HH:MM) */
    triggerTime: '',
    
    /** @type {Array} - Actions to perform */
    actions: [],
    
    /** @type {boolean} - Whether schedule is active */
    isActive: true,
    
    /**
     * Initialize a new schedule
     * @method initialize
     * @param {string} name - Schedule name
     * @param {string} triggerTime - Time to trigger (HH:MM)
     * @param {Array} actions - List of actions
     */
    initialize: function(name, triggerTime, actions) {
        this.name = name;
        this.triggerTime = triggerTime;
        this.actions = actions;
        this.isActive = true;
        
        console.log(`⏰ Created schedule: ${name} at ${triggerTime}`);
    },
    
    /**
     * Execute the schedule
     * @method execute
     * @param {SmartHome} smartHome - SmartHome instance
     * @returns {boolean} - Success status
     */
    execute: function(smartHome) {
        if (!this.isActive) {
            console.log(`⏰ Schedule "${this.name}" is inactive`);
            return false;
        }
        
        console.log(`⏰ Executing schedule: ${this.name}`);
        
        let successCount = 0;
        
        this.actions.forEach(action => {
            const device = smartHome.findDevice(action.deviceId);
            
            if (!device) {
                console.error(`❌ Device "${action.deviceId}" not found for schedule action`);
                return;
            }
            
            switch (action.action) {
                case 'on':
                    if (device.turnOn()) successCount++;
                    break;
                    
                case 'off':
                    if (device.turnOff()) successCount++;
                    break;
                    
                case 'toggle':
                    if (device.toggle()) successCount++;
                    break;
                    
                case 'set':
                    if (device.setTemperature && device.setTemperature(action.value)) {
                        successCount++;
                    }
                    break;
                    
                default:
                    console.error(`❌ Unknown action: ${action.action}`);
            }
        });
        
        console.log(`✅ Schedule "${this.name}" completed: ${successCount}/${this.actions.length} actions successful`);
        return successCount === this.actions.length;
    },
    
    /**
     * Enable or disable the schedule
     * @method setActive
     * @param {boolean} active - New active state
     */
    setActive: function(active) {
        this.isActive = active;
        console.log(`⏰ Schedule "${this.name}" ${active ? 'activated' : 'deactivated'}`);
    }
};

// ==================== ENERGY MONITOR OBJECT ====================

/**
 * Energy Monitor for tracking consumption
 * @namespace EnergyMonitor
 */
const EnergyMonitor = {
    /** @type {Object} - Registered devices with their power data */
    registeredDevices: {},
    
    /** @type {number} - Total energy consumption in kWh */
    totalEnergyConsumed: 0,
    
    /** @type {Date} - Start time of monitoring */
    monitoringStartTime: null,
    
    /**
     * Initialize the energy monitor
     * @method initialize
     */
    initialize: function() {
        this.registeredDevices = {};
        this.totalEnergyConsumed = 0;
        this.monitoringStartTime = new Date();
        console.log('🔋 Energy Monitor initialized');
    },
    
    /**
     * Register a device for energy monitoring
     * @method registerDevice
     * @param {Device} device - Device to register
     */
    registerDevice: function(device) {
        this.registeredDevices[device.id] = {
            device: device,
            powerRating: device.powerRating,
            isOn: device.isOn,
            lastUpdate: new Date(),
            energyConsumed: 0
        };
        
        console.log(`🔋 Registered ${device.name} for energy monitoring`);
    },
    
    /**
     * Unregister a device
     * @method unregisterDevice
     * @param {string} deviceId - ID of device to unregister
     */
    unregisterDevice: function(deviceId) {
        if (this.registeredDevices[deviceId]) {
            delete this.registeredDevices[deviceId];
            console.log(`🔋 Unregistered device ${deviceId} from energy monitoring`);
        }
    },
    
    /**
     * Update device state
     * @method updateDeviceState
     * @param {string} deviceId - Device ID
     * @param {boolean} isOn - New power state
     */
    updateDeviceState: function(deviceId, isOn) {
        const deviceData = this.registeredDevices[deviceId];
        
        if (deviceData) {
            // Calculate energy since last update
            const now = new Date();
            const hoursSinceUpdate = (now - deviceData.lastUpdate) / (1000 * 60 * 60);
            
            if (deviceData.isOn) {
                const energy = (deviceData.powerRating / 1000) * hoursSinceUpdate;
                deviceData.energyConsumed += energy;
                this.totalEnergyConsumed += energy;
            }
            
            deviceData.isOn = isOn;
            deviceData.lastUpdate = now;
        }
    },
    
    /**
     * Calculate total energy usage
     * @method calculateTotalUsage
     * @returns {Object} - Energy usage statistics
     */
    calculateTotalUsage: function() {
        const now = new Date();
        const result = {
            total: this.totalEnergyConsumed,
            byRoom: {},
            byDeviceType: {},
            devices: {}
        };
        
        // Calculate current energy for active devices
        Object.values(this.registeredDevices).forEach(deviceData => {
            const device = deviceData.device;
            
            // Add current session energy
            if (deviceData.isOn) {
                const hoursActive = (now - deviceData.lastUpdate) / (1000 * 60 * 60);
                const currentEnergy = (deviceData.powerRating / 1000) * hoursActive;
                
                deviceData.energyConsumed += currentEnergy;
                this.totalEnergyConsumed += currentEnergy;
                deviceData.lastUpdate = now;
            }
            
            // Organize by device type
            if (!result.byDeviceType[device.type]) {
                result.byDeviceType[device.type] = 0;
            }
            result.byDeviceType[device.type] += deviceData.energyConsumed;
            
            // Store per-device energy
            result.devices[device.id] = deviceData.energyConsumed;
        });
        
        return result;
    },
    
    /**
     * Get energy report
     * @method getReport
     * @returns {string} - Formatted energy report
     */
    getReport: function() {
        const usage = this.calculateTotalUsage();
        const hoursMonitoring = (new Date() - this.monitoringStartTime) / (1000 * 60 * 60);
        
        let report = `🔋 ENERGY MONITORING REPORT\n`;
        report += `============================\n`;
        report += `Monitoring Duration: ${hoursMonitoring.toFixed(1)} hours\n`;
        report += `Total Energy: ${usage.total.toFixed(2)} kWh\n\n`;
        
        report += `By Device Type:\n`;
        Object.entries(usage.byDeviceType).forEach(([type, energy]) => {
            const percentage = (energy / usage.total * 100).toFixed(1);
            report += `  ${type}: ${energy.toFixed(2)} kWh (${percentage}%)\n`;
        });
        
        return report;
    }
};

// ==================== DEMONSTRATION & TESTING ====================

/**
 * Demonstration function to showcase system capabilities
 * @function demonstrateSmartHome
 */
function demonstrateSmartHome() {
    console.log('🚀 STARTING SMART HOME DEMONSTRATION\n');
    
    // Initialize the smart home
    const mySmartHome = Object.create(SmartHome);
    mySmartHome.name = 'JavaScript Mastery Residence';
    
    if (!mySmartHome.initialize()) {
        console.error('Failed to initialize smart home');
        return;
    }
    
    console.log('\n📊 SYSTEM STATUS CHECK:');
    console.log(mySmartHome.getSystemStatus());
    
    console.log('\n💡 TESTING DEVICE CONTROL:');
    // Toggle a light
    mySmartHome.toggleDevice('living-room-light');
    
    // Check energy usage
    console.log('\n🔋 CHECKING ENERGY USAGE:');
    const energyReport = mySmartHome.getEnergyReport();
    console.log(energyReport);
    
    console.log('\n⏰ TESTING AUTOMATION SCHEDULE:');
    mySmartHome.triggerSchedule('Morning Routine');
    
    console.log('\n📋 GENERATING SYSTEM REPORT:');
    const systemReport = mySmartHome.generateSystemReport();
    console.log(systemReport);
    
    console.log('\n🚨 TESTING EMERGENCY SHUTDOWN:');
    const devicesTurnedOff = mySmartHome.emergencyShutdown();
    console.log(`Turned off ${devicesTurnedOff} devices`);
    
    console.log('\n✅ DEMONSTRATION COMPLETE!');
}

// ==================== INITIALIZATION ====================

// Uncomment to run demonstration
// demonstrateSmartHome();

// Export objects for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SmartHome,
        Room,
        Device,
        SmartLight,
        Thermostat,
        SmartPlug,
        SecurityCamera,
        Schedule,
        EnergyMonitor
    };
}

// ============================================================
// END OF SMART HOME AUTOMATION SYSTEM
// ============================================================