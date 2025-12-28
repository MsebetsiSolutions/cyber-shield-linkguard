// script.js - Msebetsi Solutions External JavaScript File
// This file demonstrates external JavaScript best practices

console.log("External Script: Connected to script.js");

// Business Information
const companyName = "Msebetsi Solutions";
const location = "Johannesburg, South Africa";

// Display Company Info
console.log(`Company: ${companyName}`);
console.log(`Location: ${location}`);
console.log("Established: 2020");

// Client Information
const clientName = "ABSA Bank";
const projectType = "Mobile Banking Application";
const projectBudget = 750000;

// Display Client Info
console.log("=== CLIENT DETAILS ===");
console.log(`Client: ${clientName}`);
console.log(`Project: ${projectType}`);
console.log(`Budget: R${projectBudget.toLocaleString()}`);

// Project Timeline
const startDate = "2024-01-15";
const deadline = "2024-06-30";

console.log("=== PROJECT TIMELINE ===");
console.log(`Start Date: ${startDate}`);
console.log(`Deadline: ${deadline}`);

// Team Members
const teamMembers = ["Thabo", "Lerato", "James", "Nomsa"];
console.log("=== DEVELOPMENT TEAM ===");
teamMembers.forEach((member, index) => {
    console.log(`${index + 1}. ${member}`);
});

// Final Message
console.log("🎯 Learning Objective: External JavaScript files help organize code!");
console.log("✅ Lesson Complete: You've mastered script tags and console logging!");