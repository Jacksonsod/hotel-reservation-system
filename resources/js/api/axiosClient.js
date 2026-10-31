import axios from 'axios';

const applyAuthInterceptor = (instance) => {
    instance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            const lang = localStorage.getItem('appLang') || 'en';
            config.headers['Accept-Language'] = lang;

            // If instance has baseURL '/api/v1' and URL also starts with '/api/v1/', normalize it
            if (config.baseURL === '/api/v1' && config.url && config.url.startsWith('/api/v1/')) {
                config.url = config.url.substring(7);
            }

            return config;
        },
        (error) => Promise.reject(error)
    );

    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('authUser');
                if (
                    typeof window !== 'undefined' &&
                    !window.location.pathname.startsWith('/login') &&
                    !window.location.pathname.startsWith('/register')
                ) {
                    window.location.href = '/login';
                }
            }
            return Promise.reject(error);
        }
    );
};

// Apply interceptors to the global default axios instance
applyAuthInterceptor(axios);

const axiosClient = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Apply interceptors to custom axiosClient instance
applyAuthInterceptor(axiosClient);

export default axiosClient;
