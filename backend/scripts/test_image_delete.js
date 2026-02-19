
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testImageDelete = async () => {
    try {
        console.log('Connecting to DB...');
        // Mocking the delete logic for files
        // Backend usually uses fs.unlink
        const testFile = path.join(__dirname, '../uploads/test-delete.txt');
        fs.writeFileSync(testFile, 'test content');
        console.log('Created test file:', testFile);

        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile);
            console.log('Deleted test file successfully.');
        } else {
            console.error('Test file creation failed.');
        }

    } catch (e) {
        console.error('ERROR:', e);
    }
};

testImageDelete();
