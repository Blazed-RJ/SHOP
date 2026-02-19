import axios from 'axios';
import FormData from 'form-data';

const API_URL = 'http://localhost:5002/api';
const TOKEN = 'demo-token-bypass';
// Use the Category ID from the browser step: 699602d495149964d6fb343e
// But that ID might be dynamic or from a different run.
// I'll first fetch categories to find one to update.

async function testRemoveImage() {
    try {
        console.log('Starting Remove Image Test...');

        // 1. Get Categories to find a target
        const getRes = await axios.get(`${API_URL}/categories`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        const targetCategory = getRes.data.find(c => c.name.includes('API Test Category'));

        if (!targetCategory) {
            console.error('Target category "API Test Category" not found. Run upload test first.');
            return;
        }

        console.log('Target Category:', targetCategory.name, targetCategory._id);
        console.log('Current Image:', targetCategory.image);

        // 2. Send Update to Remove Image
        const formData = new FormData();
        formData.append('name', targetCategory.name); // Keep name same
        formData.append('description', targetCategory.description || '');
        formData.append('removeImage', 'true');

        // Parent category - keep it as is
        if (targetCategory.parentCategory) {
            formData.append('parentCategory', targetCategory.parentCategory._id || targetCategory.parentCategory);
        }

        const config = {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${TOKEN}`
            }
        };

        console.log('Sending PUT request to remove image...');
        const updateRes = await axios.put(`${API_URL}/categories/${targetCategory._id}`, formData, config);

        console.log('Update Successful!');
        console.log('New Image Value:', updateRes.data.image);

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

testRemoveImage();
