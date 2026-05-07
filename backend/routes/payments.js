const express = require('express');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const https = require('https');

const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'payment-orders.json');

const COURSES = {
    'grammar-chat': {
        title: 'Летние чаты грамотности',
        amount: 6000,
        labelPrefix: 'grammar-chat-2026',
        subject: 'Вы зачислены на курс «Летние чаты грамотности»'
    },
    'text-group': {
        title: 'Работа с текстом в мини-группе',
        amount: 15000,
        labelPrefix: 'text-group-2026',
        subject: 'Вы зачислены на курс «Работа с текстом»'
    }
};

function isValidEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function safeCourse(course) {
    return COURSES[course] ? course : null;
}

function buildLabel(prefix) {
    const suffix = crypto.randomBytes(6).toString('hex');
    return `${prefix}-${Date.now().toString(36)}-${suffix}`.slice(0, 64);
}

async function ensureDataFile() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
        await fs.access(ORDERS_FILE);
    } catch (_) {
        await fs.writeFile(ORDERS_FILE, JSON.stringify({ orders: {} }, null, 2), 'utf8');
    }
}

async function readOrders() {
    await ensureDataFile();
    const raw = await fs.readFile(ORDERS_FILE, 'utf8');
    try {
        const data = JSON.parse(raw);
        if (!data.orders || typeof data.orders !== 'object') return { orders: {} };
        return data;
    } catch (_) {
        return { orders: {} };
    }
}

async function writeOrders(data) {
    await ensureDataFile();
    const tmpFile = `${ORDERS_FILE}.tmp`;
    await fs.writeFile(tmpFile, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmpFile, ORDERS_FILE);
}

function buildSuccessUrl(siteOrigin, label) {
    const configuredBase = process.env.SITE_BASE_URL || siteOrigin || '';
    if (!configuredBase) return `/thank-you.html?order=${encodeURIComponent(label)}`;

    try {
        const base = new URL(configuredBase);
        return new URL(`/thank-you.html?order=${encodeURIComponent(label)}`, base).toString();
    } catch (_) {
        return `/thank-you.html?order=${encodeURIComponent(label)}`;
    }
}

function encodeRfc3986(value) {
    return encodeURIComponent(String(value ?? '')).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function buildYooMoneySignaturePayload(body) {
    return Object.keys(body)
        .filter((key) => key !== 'sign')
        .sort()
        .map((key) => `${key}=${encodeRfc3986(body[key])}`)
        .join('&');
}

function verifyYooMoneySignature(body) {
    const secret = process.env.YOOMONEY_NOTIFICATION_SECRET;
    if (!secret) {
        throw new Error('YOOMONEY_NOTIFICATION_SECRET is not configured');
    }

    const receivedSign = body.sign;
    if (!receivedSign) return false;

    const payload = buildYooMoneySignaturePayload(body);
    const expectedSign = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    const expectedBuffer = Buffer.from(expectedSign, 'hex');
    const receivedBuffer = Buffer.from(String(receivedSign).toLowerCase(), 'hex');

    return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function postJson(url, headers, payload) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(payload);
        const request = https.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                ...headers
            }
        }, (response) => {
            let responseBody = '';
            response.setEncoding('utf8');
            response.on('data', (chunk) => { responseBody += chunk; });
            response.on('end', () => {
                let parsed = null;
                try { parsed = responseBody ? JSON.parse(responseBody) : null; } catch (_) {}
                if (response.statusCode >= 200 && response.statusCode < 300) {
                    resolve({ statusCode: response.statusCode, body: parsed || responseBody });
                } else {
                    reject(new Error(`Brevo API error ${response.statusCode}: ${responseBody}`));
                }
            });
        });

        request.on('error', reject);
        request.write(body);
        request.end();
    });
}

async function sendEnrollmentEmail(order, notification) {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME || 'Вспомнить всё';
    const replyToEmail = process.env.BREVO_REPLY_TO_EMAIL || senderEmail;

    if (!apiKey || !senderEmail) {
        throw new Error('BREVO_API_KEY or BREVO_SENDER_EMAIL is not configured');
    }

    const course = COURSES[order.course];
    const paidAmount = notification?.withdraw_amount || notification?.amount || order.amount;
    const subject = course?.subject || 'Вы зачислены на курс';

    const htmlContent = `
        <html>
        <body style="margin:0;padding:0;background:#f7f8ff;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
            <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
                <div style="background:#ffffff;border-radius:20px;padding:28px;border:1px solid #e5e7eb;">
                    <h1 style="margin:0 0 16px;color:#4756ce;font-size:26px;line-height:1.2;">Спасибо за оплату!</h1>
                    <p style="font-size:16px;line-height:1.6;margin:0 0 14px;">Мы получили оплату и зачислили вас на курс.</p>
                    <div style="background:#f2edff;border-radius:16px;padding:18px;margin:20px 0;">
                        <p style="margin:0 0 8px;"><strong>Курс:</strong> ${escapeHtml(course?.title || order.targets || 'Летняя программа')}</p>
                        <p style="margin:0 0 8px;"><strong>Сумма:</strong> ${escapeHtml(String(paidAmount))} ₽</p>
                        <p style="margin:0;"><strong>Номер заявки:</strong> ${escapeHtml(order.label)}</p>
                    </div>
                    <p style="font-size:16px;line-height:1.6;margin:0 0 14px;">Ближе к старту вы получите организационную информацию по занятиям.</p>
                    <p style="font-size:14px;line-height:1.6;color:#6b7280;margin:20px 0 0;">Если письмо пришло по ошибке или вы хотите уточнить детали, ответьте на это сообщение.</p>
                </div>
            </div>
        </body>
        </html>`;

    const textContent = [
        'Спасибо за оплату!',
        `Курс: ${course?.title || order.targets || 'Летняя программа'}`,
        `Сумма: ${paidAmount} ₽`,
        `Номер заявки: ${order.label}`,
        'Мы получили оплату и зачислили вас на курс. Ближе к старту вы получите организационную информацию по занятиям.'
    ].join('\n');

    const payload = {
        sender: { email: senderEmail, name: senderName },
        to: [{ email: order.email }],
        subject,
        htmlContent,
        textContent,
        tags: ['summer-course-payment'],
        params: {
            courseTitle: course?.title || order.targets || 'Летняя программа',
            amount: paidAmount,
            label: order.label
        }
    };

    if (replyToEmail) {
        payload.replyTo = { email: replyToEmail, name: senderName };
    }

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (adminEmail) {
        payload.bcc = [{ email: adminEmail }];
    }

    const result = await postJson('https://api.brevo.com/v3/smtp/email', {
        'api-key': apiKey
    }, payload);

    return result.body;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

router.post('/orders', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const courseKey = safeCourse(req.body.course);

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Введите корректную почту для зачисления на курс.' });
        }

        if (!courseKey) {
            return res.status(400).json({ error: 'Неизвестный курс для оплаты.' });
        }

        const receiver = String(process.env.YOOMONEY_RECEIVER || '').trim();
        if (!receiver) {
            return res.status(500).json({ error: 'YOOMONEY_RECEIVER is not configured on the server.' });
        }

        const course = COURSES[courseKey];
        const label = buildLabel(course.labelPrefix);
        const now = new Date().toISOString();
        const order = {
            label,
            email,
            course: courseKey,
            courseTitle: course.title,
            amount: course.amount,
            targets: req.body.targets || course.title,
            status: 'created',
            createdAt: now,
            updatedAt: now,
            emailSentAt: null,
            brevoMessageId: null,
            notification: null
        };

        const data = await readOrders();
        data.orders[label] = order;
        await writeOrders(data);

        res.json({
            success: true,
            label,
            amount: order.amount,
            courseTitle: order.courseTitle,
            receiver,
            successUrl: buildSuccessUrl(req.body.siteOrigin, label)
        });
    } catch (error) {
        console.error('Payment order creation error:', error);
        res.status(500).json({ error: 'Не удалось подготовить оплату. Попробуйте ещё раз.' });
    }
});

router.post('/yoomoney-notification', async (req, res) => {
    try {
        const body = req.body || {};

        if (!verifyYooMoneySignature(body)) {
            console.warn('Invalid YooMoney notification signature', body);
            return res.status(403).send('invalid sign');
        }

        const label = body.label;
        if (!label) {
            return res.status(200).send('ok');
        }

        const data = await readOrders();
        const order = data.orders[label];
        if (!order) {
            console.warn(`YooMoney notification received for unknown label: ${label}`);
            return res.status(200).send('ok');
        }

        const isAccepted = String(body.unaccepted) !== 'true' && String(body.codepro) !== 'true';
        const paidBySender = Number(body.withdraw_amount || body.amount || 0);
        const expectedAmount = Number(order.amount || 0);
        const amountMatches = Math.abs(paidBySender - expectedAmount) < 0.01;
        const now = new Date().toISOString();

        order.notification = body;
        order.updatedAt = now;
        order.operationId = body.operation_id || order.operationId;

        if (!isAccepted) {
            order.status = 'payment_not_accepted';
            await writeOrders(data);
            return res.status(200).send('ok');
        }

        if (!amountMatches) {
            order.status = 'payment_amount_mismatch';
            order.amountMismatch = { expected: expectedAmount, received: paidBySender };
            await writeOrders(data);
            console.warn(`Payment amount mismatch for ${label}: expected ${expectedAmount}, received ${paidBySender}`);
            return res.status(200).send('ok');
        }

        order.status = 'paid';
        order.paidAt = body.datetime || now;

        if (!order.emailSentAt) {
            try {
                const brevoResult = await sendEnrollmentEmail(order, body);
                order.emailSentAt = new Date().toISOString();
                order.brevoMessageId = brevoResult?.messageId || brevoResult?.messageIds?.[0] || null;
                order.emailStatus = 'sent';
            } catch (emailError) {
                order.emailStatus = 'failed';
                order.emailError = emailError.message;
                console.error(`Brevo email error for ${label}:`, emailError);
            }
        }

        await writeOrders(data);
        res.status(200).send('ok');
    } catch (error) {
        console.error('YooMoney notification error:', error);
        res.status(500).send('error');
    }
});

router.get('/orders/:label', async (req, res) => {
    try {
        const data = await readOrders();
        const order = data.orders[req.params.label];
        if (!order) {
            return res.status(404).json({ error: 'Заявка не найдена.' });
        }

        res.json({
            label: order.label,
            courseTitle: order.courseTitle,
            status: order.status,
            email: order.email,
            emailStatus: order.emailStatus || null,
            paidAt: order.paidAt || null,
            createdAt: order.createdAt
        });
    } catch (error) {
        console.error('Payment order status error:', error);
        res.status(500).json({ error: 'Не удалось получить статус заявки.' });
    }
});

module.exports = router;
