// routes/tests.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * GET /api/tests/types
 * Получить все типы тестов
 */
router.get('/types', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                test_type_id,
                test_name,
                test_name_ru,
                description,
                icon,
                is_active
            FROM test_types
            WHERE is_active = TRUE
            ORDER BY test_type_id
        `);
        
        res.json({
            success: true,
            count: result.rows.length,
            test_types: result.rows
        });
    } catch (error) {
        console.error('Error fetching test types:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/tests/variants/:testType
 * Получить все варианты для типа теста
 */
router.get('/variants/:testType', async (req, res) => {
    const { testType } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT 
                tv.variant_id,
                tv.variant_number,
                tv.variant_data,
                tv.difficulty_level,
                tt.test_name_ru
            FROM test_variants tv
            JOIN test_types tt ON tv.test_type_id = tt.test_type_id
            WHERE tt.test_name = $1
            ORDER BY tv.variant_number
        `, [testType]);
        
        res.json({
            success: true,
            count: result.rows.length,
            variants: result.rows
        });
    } catch (error) {
        console.error('Error fetching variants:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/tests/variant/:variantId
 * Получить конкретный вариант теста
 */
router.get('/variant/:variantId', async (req, res) => {
    const { variantId } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT 
                tv.variant_id,
                tv.variant_number,
                tv.variant_data,
                tv.difficulty_level,
                tt.test_name,
                tt.test_name_ru
            FROM test_variants tv
            JOIN test_types tt ON tv.test_type_id = tt.test_type_id
            WHERE tv.variant_id = $1
        `, [variantId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Variant not found' 
            });
        }
        
        res.json({
            success: true,
            variant: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching variant:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/tests/submit
 * Отправить результат теста
 */
router.post('/submit', async (req, res) => {
    const { 
        username, 
        variant_id, 
        total_questions, 
        correct_answers, 
        incorrect_answers,
        user_answers,
        time_spent_seconds 
    } = req.body;
    
    // Валидация
    if (!username || !variant_id || total_questions === undefined || 
        correct_answers === undefined || incorrect_answers === undefined) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing required fields' 
        });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Получаем или создаем пользователя
        const userResult = await client.query(`
            INSERT INTO users (username) 
            VALUES ($1)
            ON CONFLICT (username) DO UPDATE 
            SET last_active = CURRENT_TIMESTAMP
            RETURNING user_id
        `, [username]);
        
        const userId = userResult.rows[0].user_id;
        
        // Сохраняем попытку
        const attemptResult = await client.query(`
            INSERT INTO test_attempts (
                user_id, variant_id, total_questions, 
                correct_answers, incorrect_answers, 
                user_answers, time_spent_seconds
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING attempt_id, accuracy
        `, [
            userId, 
            variant_id, 
            total_questions, 
            correct_answers, 
            incorrect_answers, 
            JSON.stringify(user_answers), 
            time_spent_seconds
        ]);
        
        await client.query('COMMIT');
        
        // Обновляем ранги в leaderboard
        await pool.query('SELECT update_leaderboard_ranks()');
        
        res.json({
            success: true,
            attempt_id: attemptResult.rows[0].attempt_id,
            accuracy: attemptResult.rows[0].accuracy,
            user_id: userId
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error submitting test:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

/**
 * GET /api/tests/history/:username
 * Получить историю попыток пользователя
 */
router.get('/history/:username', async (req, res) => {
    const { username } = req.params;
    const limit = req.query.limit || 20;
    
    try {
        const result = await pool.query(`
            SELECT 
                ta.attempt_id,
                tt.test_name_ru,
                tv.variant_number,
                ta.total_questions,
                ta.correct_answers,
                ta.incorrect_answers,
                ta.accuracy,
                ta.time_spent_seconds,
                ta.completed_at
            FROM test_attempts ta
            JOIN users u ON ta.user_id = u.user_id
            JOIN test_variants tv ON ta.variant_id = tv.variant_id
            JOIN test_types tt ON tv.test_type_id = tt.test_type_id
            WHERE u.username = $1
            ORDER BY ta.completed_at DESC
            LIMIT $2
        `, [username, limit]);
        
        res.json({
            success: true,
            count: result.rows.length,
            history: result.rows
        });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
