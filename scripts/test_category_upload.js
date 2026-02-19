import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:5002/api';
const TOKEN = 'demo-token-bypass';
const IMAGE_PATH = 'C:/Users/Rajat Chauhan/.gemini/antigravity/brain/e1e42a39-2b21-4f97-8d69-202a88907449/folder_view_verification.png';

async function testUpload() {
    try {
        console.log('Starting Category Upload Test...');
        console.log('Image Path:', IMAGE_PATH);

        if (!fs.existsSync(IMAGE_PATH)) {
            console.error('ERROR: Test image not found at:', IMAGE_PATH);
            return;
        }

        const formData = new FormData();
        formData.append('name', 'API Test Category ' + Date.now());
        formData.append('description', 'Created via automated test script');

        // Ensure file stream is created correctly
        const fileStream = fs.createReadStream(IMAGE_PATH);
        formData.append('image', fileStream);

        const headers = formData.getHeaders();
        headers['Authorization'] = `Bearer ${TOKEN}`;

        console.log('Request Headers:', headers);
        console.log('Sending request to', `${API_URL}/categories`);

        const response = await axios.post(`${API_URL}/categories`, formData, { headers });

        console.log('Upload Successful!');
        console.log('Category ID:', response.data._id);
        console.log('Category Name:', response.data.name);
        console.log('Image Path:', response.data.image);

    } catch (error) {
        console.error('Test Failed:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('No response received:', error);
        }
    }
}

testUpload();
