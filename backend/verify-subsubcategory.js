// Quick verification script for sub-sub-category feature
// Run this with: node verify-subsubcategory.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Sub-Sub-Category Feature Verification\n');
console.log('='.repeat(60));

let allPassed = true;

// Test 1: Check Product Model
console.log('\n📦 Test 1: Product Model Schema');
try {
    const modelPath = path.join(__dirname, 'models', 'Product.js');
    const modelContent = fs.readFileSync(modelPath, 'utf8');

    if (modelContent.includes('subSubCategory')) {
        console.log('   ✅ subSubCategory field exists in Product model');
    } else {
        console.log('   ❌ subSubCategory field MISSING in Product model');
        allPassed = false;
    }
} catch (error) {
    console.log('   ❌ Error reading Product model:', error.message);
    allPassed = false;
}

// Test 2: Check Product Controller
console.log('\n📦 Test 2: Product Controller');
try {
    const controllerPath = path.join(__dirname, 'controllers', 'productController.js');
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');

    if (controllerContent.includes('subSubCategory,') &&
        controllerContent.match(/subSubCategory.*=.*req\.body/)) {
        console.log('   ✅ Controller extracts subSubCategory from request');
    } else {
        console.log('   ❌ Controller NOT extracting subSubCategory');
        allPassed = false;
    }

    if (controllerContent.includes('console.log') &&
        controllerContent.includes('Creating product')) {
        console.log('   ✅ Debug logging present');
    } else {
        console.log('   ⚠️  Debug logging not found (optional)');
    }
} catch (error) {
    console.log('   ❌ Error reading Product controller:', error.message);
    allPassed = false;
}

// Test 3: Frontend Component Check
console.log('\n📦 Test 3: Frontend Inventory Component');
try {
    const frontendPath = path.join(__dirname, '../frontend/src/pages/Inventory.jsx');
    const frontendContent = fs.readFileSync(frontendPath, 'utf8');

    if (frontendContent.includes('subSubCategory') ||
        frontendContent.includes('subSubCategories')) {
        console.log('   ✅ Frontend component includes subSubCategory state');
    } else {
        console.log('   ❌ Frontend component MISSING subSubCategory');
        allPassed = false;
    }

    if (frontendContent.match(/Sub-Sub-Category|sub-sub-category/i)) {
        console.log('   ✅ Sub-Sub-Category label found in UI');
    } else {
        console.log('   ❌ Sub-Sub-Category UI element MISSING');
        allPassed = false;
    }

    // Check for useEffect that loads sub-sub-categories
    if (frontendContent.includes('fetchSubSubCategories') ||
        frontendContent.match(/useEffect.*subSubCategories/)) {
        console.log('   ✅ Sub-sub-category loading logic present');
    } else {
        console.log('   ❌ Sub-sub-category loading logic MISSING');
        allPassed = false;
    }
} catch (error) {
    console.log('   ❌ Error reading Inventory component:', error.message);
    allPassed = false;
}

// Summary
console.log('\n' + '='.repeat(60));
if (allPassed) {
    console.log('✅ ALL CHECKS PASSED - Feature is properly implemented!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Hard refresh browser (Ctrl + Shift + R)');
    console.log('   2. Create test categories with sub-sub-categories');
    console.log('   3. Test adding a product with 3 category levels');
    console.log('   4. Verify blue badge appears in SUB-SUB-CAT column');
} else {
    console.log('❌ SOME CHECKS FAILED - Review errors above');
    console.log('\n💡 Possible fixes:');
    console.log('   - Ensure all files are saved');
    console.log('   - Restart dev servers');
    console.log('   - Check file paths are correct');
}

console.log('\n' + '='.repeat(60) + '\n');
