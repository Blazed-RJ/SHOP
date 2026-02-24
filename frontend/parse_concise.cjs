const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lint-report.json', 'utf8'));

data.forEach(file => {
    if (file.errorCount > 0 || file.warningCount > 0) {
        const filename = file.filePath.replace(/\\/g, '/').split('frontend/')[1] || file.filePath;
        file.messages.forEach(m => {
            console.log(`${filename}:${m.line} - ${m.ruleId} - ${m.message}`);
        });
    }
});
