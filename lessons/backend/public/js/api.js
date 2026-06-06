// public/js/api.js
// Конфигурация API
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Утилита для API запросов
 */
class RussianTestsAPI {
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Общий метод для запросов
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // ========== USERS ==========
    
    /**
     * Получить всех пользователей
     */
    async getUsers() {
        return this.request('/users');
    }

    /**
     * Получить пользователя по имени
     */
    async getUser(username) {
        return this.request(`/users/${username}`);
    }

    /**
     * Создать пользователя
     */
    async createUser(username, email = null) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify({ username, email })
        });
    }

    // ========== TESTS ==========
    
    /**
     * Получить типы тестов
     */
    async getTestTypes() {
        return this.request('/tests/types');
    }

    /**
     * Получить варианты теста
     */
    async getTestVariants(testType) {
        return this.request(`/tests/variants/${testType}`);
    }

    /**
     * Получить конкретный вариант
     */
    async getVariant(variantId) {
        return this.request(`/tests/variant/${variantId}`);
    }

    /**
     * Отправить результат теста
     */
    async submitTest(data) {
        return this.request('/tests/submit', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Получить историю попыток пользователя
     */
    async getUserHistory(username, limit = 20) {
        return this.request(`/tests/history/${username}?limit=${limit}`);
    }

    // ========== LEADERBOARD ==========
    
    /**
     * Получить leaderboard для типа теста
     */
    async getLeaderboard(testType, limit = 10) {
        return this.request(`/leaderboard/${testType}?limit=${limit}`);
    }

    /**
     * Получить топ пользователей по всем тестам
     */
    async getTopUsers(limit = 10) {
        return this.request(`/leaderboard/all/top?limit=${limit}`);
    }

    /**
     * Получить позицию пользователя
     */
    async getUserRank(username) {
        return this.request(`/leaderboard/user/${username}/rank`);
    }

    /**
     * Обновить ранги
     */
    async updateRanks() {
        return this.request('/leaderboard/update-ranks', {
            method: 'POST'
        });
    }

    // ========== STATS ==========
    
    /**
     * Получить статистику пользователя
     */
    async getUserStats(username) {
        return this.request(`/stats/user/${username}`);
    }

    /**
     * Получить последние попытки
     */
    async getRecentAttempts(limit = 20) {
        return this.request(`/stats/recent?limit=${limit}`);
    }

    /**
     * Получить обзор тестов
     */
    async getTestsOverview() {
        return this.request('/stats/tests/overview');
    }

    /**
     * Получить статистику для dashboard
     */
    async getDashboard() {
        return this.request('/stats/dashboard');
    }

    /**
     * Получить активных пользователей
     */
    async getActiveUsers(days = 7) {
        return this.request(`/stats/active-users?days=${days}`);
    }
}

// Создаём глобальный экземпляр API
const api = new RussianTestsAPI();

// Экспортируем для использования
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RussianTestsAPI, api };
}
