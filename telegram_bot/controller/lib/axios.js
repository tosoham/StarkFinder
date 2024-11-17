const axios = require('axios');
const MY_TOKEN = process.env.MY_TOKEN || '';
const BASE_URL = `https://api.telegram.org/bot${MY_TOKEN}`;

function getAxiosInstance() {
    return {
        get(method, params) {
            try {
                return axios.get(`/${method}`, {
                    baseURL: BASE_URL,
                    params,
                });
            } catch (error) {
                console.error(`Axios GET error for method ${method}:`, 
                    error.response?.data || error.message);
                throw error;
            }
        },
        post(method, data) {
            try {
                return axios.post(`/${method}`, data, {
                    baseURL: BASE_URL,
                    data,
                });
            } catch (error) {
                console.error(`Axios POST error for method ${method}:`, 
                    error.response?.data || error.message);
                throw error;
            }
        },
    };
}

module.exports = { axiosInstance: getAxiosInstance() };