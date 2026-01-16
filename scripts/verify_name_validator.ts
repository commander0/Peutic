
import { NameValidator } from '../services/nameValidator';

// Simple test runner
const runTests = () => {
    console.log("🔍 Starting NameValidator Verification...");
    
    const testCases = [
        // EXPECT VALID
        { name: "John Doe", expect: true },
        { name: "Jane", expect: true },
        { name: "O'Connor", expect: true },
        { name: "Jean-Luc", expect: true },
        { name: "Zoë", expect: true }, // Accent
        { name: "José", expect: true }, // Accent
        { name: "Dr. Dre", expect: true },
        
        // EXPECT INVALID
        { name: "J", expect: false, reason: "Too short" },
        { name: "User123", expect: false, reason: "Numbers" },
        { name: "!!!", expect: false, reason: "Symbols" },
        { name: "   ", expect: false, reason: "Empty" },
        { name: "-John", expect: false, reason: "Starts with symbol" },
        { name: "Jooooohn", expect: false, reason: "Repeating chars" }, // 5 'o's
        { name: "AbcdefghijklmnopqrstuvwxyzAbcdefghijklmnopqrstuvwxyz", expect: false, reason: "Too long" }, // > 50
        { name: "...", expect: false, reason: "Only punctuation" }
    ];

    let passed = 0;
    let failed = 0;

    testCases.forEach((test, index) => {
        const result = NameValidator.validate(test.name);
        const isSuccess = result.valid === test.expect;

        if (isSuccess) {
            passed++;
            // console.log(`✅ Test ${index + 1}: "${test.name}" -> ${result.valid ? 'Valid' : 'Invalid'} (Expected)`);
        } else {
            failed++;
            console.error(`❌ Test ${index + 1}: "${test.name}"`);
            console.error(`   Expected: ${test.expect}, Got: ${result.valid}`);
            console.error(`   Validator Error: ${result.error}`);
            console.error(`   Test Reason: ${test.reason || 'N/A'}`);
        }
    });

    console.log("\n--- RESULTS ---");
    console.log(`Total: ${testCases.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed === 0) {
        console.log("✨ All name validation tests passed!");
    } else {
        console.error("⚠️ Some tests failed. Please review logic.");
        (process as any).exit(1);
    }
};

runTests();