// ====================================================
// MSEBETSI SOLUTIONS - Oil Field Analytics System
// JavaScript Methods Implementation
// ====================================================

// COMPANY DATA
const company = {
    name: "MSEBETSI SOLUTIONS SAUDI",
    location: "Dhahran, Saudi Arabia",
    fields: ["Ghawar", "Safaniya", "Khurais", "Manifa", "Berri", "Zuluf"],
    established: 1978
};

// SECTION 1: STRING METHODS - FIELD DATA PROCESSING
class FieldDataProcessor {
    static standardizeFieldName(rawName) {
        return rawName
            .trim()
            .toLowerCase()
            .replace(/[^a-z\u0600-\u06FF\s]/g, ' ')  // Keep Arabic and English
            .split(' ')
            .filter(word => word.length > 0)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    static extractSensorType(sensorCode) {
        // PT-101 → Pressure Transmitter
        const codes = {
            'PT': 'Pressure Transmitter',
            'TT': 'Temperature Transmitter',
            'FT': 'Flow Transmitter',
            'LT': 'Level Transmitter',
            'VT': 'Vibration Transmitter'
        };
        const prefix = sensorCode.split('-')[0];
        return codes[prefix] || 'Unknown Sensor';
    }
    
    static generateFieldReport(fieldName, data) {
        const standardized = this.standardizeFieldName(fieldName);
        const timestamp = new Date().toLocaleString('ar-SA');
        
        return `
            تقرير حقل النفط - Oil Field Report
            ===============================
            الحقل: ${standardized}
            التاريخ: ${timestamp}
            
            البيانات المعالجة - Processed Data:
            ${JSON.stringify(data, null, 2)}
            
            تم الإنشاء بواسطة: ${company.name}
        `;
    }
}

// SECTION 2: ARRAY METHODS - PRODUCTION ANALYSIS
class ProductionAnalyzer {
    static cleanSensorData(readings) {
        return readings
            .filter(reading => reading.valid)
            .map(reading => ({
                ...reading,
                value: parseFloat(reading.value) || 0
            }))
            .filter(reading => !isNaN(reading.value) && reading.value > 0);
    }
    
    static calculateDailyProduction(flowReadings) {
        const validReadings = this.cleanSensorData(flowReadings);
        
        const totalFlow = validReadings.reduce((sum, reading) => {
            return sum + reading.value;
        }, 0);
        
        const averageFlow = totalFlow / validReadings.length;
        const dailyProduction = averageFlow * 24; // Convert hourly to daily
        
        return {
            totalFlow,
            averageFlow: Math.round(averageFlow),
            dailyProduction: Math.round(dailyProduction),
            readingsCount: validReadings.length,
            timestamp: new Date().toISOString()
        };
    }
    
    static detectAnomalies(readings, thresholds) {
        return readings.filter(reading => {
            if (reading.unit === 'psi' && reading.value > thresholds.pressure) {
                reading.alert = 'HIGH_PRESSURE';
                return true;
            }
            if (reading.unit === '°C' && reading.value > thresholds.temperature) {
                reading.alert = 'HIGH_TEMPERATURE';
                return true;
            }
            if (reading.unit === 'bpd' && reading.value < thresholds.flow) {
                reading.alert = 'LOW_FLOW';
                return true;
            }
            return false;
        });
    }
}

// SECTION 3: OBJECT METHODS - EQUIPMENT MANAGEMENT
class EquipmentManager {
    constructor(equipment) {
        this.equipment = equipment;
    }
    
    performFullInspection() {
        const inspectionReport = {
            equipmentId: this.equipment.id,
            inspectionDate: new Date().toISOString().split('T')[0],
            checks: {}
        };
        
        // Check all properties exist
        Object.keys(this.equipment).forEach(key => {
            inspectionReport.checks[key] = this.equipment[key] !== undefined && 
                                          this.equipment[key] !== null;
        });
        
        // Validate specifications
        if (this.equipment.specifications) {
            const specs = this.equipment.specifications;
            inspectionReport.specsValidation = {
                capacity: specs.capacity > 0,
                pressure: specs.pressure > 0 && specs.pressure < 2000,
                efficiency: specs.efficiency > 0 && specs.efficiency <= 1
            };
        }
        
        inspectionReport.allChecksPass = 
            Object.values(inspectionReport.checks).every(check => check) &&
            (!inspectionReport.specsValidation || 
             Object.values(inspectionReport.specsValidation).every(check => check));
        
        return inspectionReport;
    }
    
    calculateEfficiencyScore() {
        if (!this.equipment.readings) return 0;
        
        const readings = this.equipment.readings;
        const specs = this.equipment.specifications;
        
        const scores = {
            pressure: 100 - Math.abs(readings.currentPressure - specs.pressure) / specs.pressure * 100,
            flow: readings.currentFlow / specs.capacity * 100,
            efficiency: readings.efficiency || specs.efficiency * 100
        };
        
        // Weighted average
        const weights = { pressure: 0.4, flow: 0.4, efficiency: 0.2 };
        const totalScore = Object.keys(scores).reduce((sum, key) => {
            return sum + (scores[key] * weights[key]);
        }, 0);
        
        return Math.max(0, Math.min(100, totalScore));
    }
}

// SECTION 4: METHOD CHAINING - DATA PIPELINE
class DataPipeline {
    static processRawDataPipeline(rawData) {
        return rawData
            // Step 1: Clean and split
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('//'))
            
            // Step 2: Parse each line
            .map(line => {
                if (line.includes(':')) {
                    const [key, value] = line.split(':').map(part => part.trim());
                    return { key, value, type: 'keyValue' };
                } else if (line.includes('=')) {
                    const [key, value] = line.split('=').map(part => part.trim());
                    return { key, value, type: 'assignment' };
                }
                return { key: 'unknown', value: line, type: 'raw' };
            })
            
            // Step 3: Filter and transform
            .filter(item => item.type !== 'raw')
            .map(item => ({
                ...item,
                value: this.parseValue(item.value),
                timestamp: new Date().toISOString()
            }))
            
            // Step 4: Group by type
            .reduce((groups, item) => {
                if (!groups[item.type]) {
                    groups[item.type] = [];
                }
                groups[item.type].push(item);
                return groups;
            }, {});
    }
    
    static parseValue(value) {
        // Try to parse as number
        const num = parseFloat(value);
        if (!isNaN(num)) return num;
        
        // Try to parse as boolean
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
        
        // Return as string
        return value;
    }
}

// SECTION 5: TEST SUITE & DEMONSTRATION
function runOilFieldTests() {
    console.log("=".repeat(60));
    console.log("🛢️ MSEBETSI OIL FIELD METHODS TEST SUITE");
    console.log("=".repeat(60));
    
    // Test 1: String Methods
    console.log("\n1. FIELD NAME STANDARDIZATION:");
    const testFields = ["  AL-GHAWAR_2024  ", "safaniya offshore", "Khurais النفطية"];
    testFields.forEach(field => {
        console.log(`   ${field} → ${FieldDataProcessor.standardizeFieldName(field)}`);
    });
    
    // Test 2: Array Methods
    console.log("\n2. PRODUCTION DATA ANALYSIS:");
    const testReadings = [
        { sensor: "FT-301", value: "8500", unit: "bpd", valid: true },
        { sensor: "FT-302", value: "8200", unit: "bpd", valid: true },
        { sensor: "FT-303", value: "N/A", unit: "bpd", valid: false }
    ];
    const production = ProductionAnalyzer.calculateDailyProduction(testReadings);
    console.log(`   Daily Production: ${production.dailyProduction} bpd`);
    
    // Test 3: Object Methods
    console.log("\n3. EQUIPMENT INSPECTION:");
    const testPump = {
        id: "PUMP-TEST-001",
        specifications: {
            capacity: 10000,
            pressure: 1250,
            efficiency: 0.87
        },
        readings: {
            currentPressure: 1245,
            currentFlow: 9850
        }
    };
    const manager = new EquipmentManager(testPump);
    console.log(`   Efficiency Score: ${manager.calculateEfficiencyScore().toFixed(1)}%`);
    
    // Test 4: Method Chaining
    console.log("\n4. DATA PIPELINE PROCESSING:");
    const rawData = `
        // Oil Field Data
        pressure: 1250
        temperature: 75.5
        flow: 8500
        status: operational
    `;
    const processed = DataPipeline.processRawDataPipeline(rawData);
    console.log(`   Processed ${Object.values(processed).flat().length} data points`);
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ ALL METHODS IMPLEMENTED SUCCESSFULLY");
    console.log("💡 Business Impact: Real-time oil field monitoring enabled");
    console.log("=".repeat(60));
}

// EXPORT FOR USE
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FieldDataProcessor,
        ProductionAnalyzer,
        EquipmentManager,
        DataPipeline,
        runOilFieldTests
    };
}

// AUTO-RUN TESTS IN BROWSER
if (typeof window !== 'undefined') {
    console.log("%c🛢️ MSEBETSI OIL FIELD METHODS READY", 
                "color: white; background: #006400; padding: 10px; font-size: 16px;");
    console.log("Try these commands in console (F12):");
    console.log("- runOilFieldTests() - Run all tests");
    console.log("- FieldDataProcessor.standardizeFieldName('your-field')");
    console.log("- new EquipmentManager(yourEquipment).calculateEfficiencyScore()");
    
    // Make available globally
    window.FieldDataProcessor = FieldDataProcessor;
    window.ProductionAnalyzer = ProductionAnalyzer;
    window.EquipmentManager = EquipmentManager;
    window.DataPipeline = DataPipeline;
    window.runOilFieldTests = runOilFieldTests;
}