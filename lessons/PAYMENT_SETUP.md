# Настройка оплаты ЮMoney и писем Brevo

## Что добавлено

1. На лендинге у каждой кнопки оплаты пользователь вводит email.
2. Перед переходом в ЮMoney сайт создаёт заявку через `POST /api/payments/orders`.
3. В ЮMoney передаётся `label` заявки и `successURL` на `/thank-you.html`.
4. После оплаты ЮMoney отправляет HTTP-уведомление на backend.
5. Backend проверяет подпись `sign`, находит заявку по `label` и отправляет письмо через Brevo API.
6. После возврата из ЮMoney пользователь видит страницу `thank-you.html`.

## Что настроить в `.env`

Номер кошелька ЮMoney теперь хранится только в `.env`:

```env
YOOMONEY_RECEIVER=41001XXXXXXXXXXXX
```

Замените `41001XXXXXXXXXXXX` на реальный номер кошелька. В `index.html` руками его проставлять не нужно: backend вернёт это значение при создании заявки на оплату.

## Что настроить в ЮMoney

В настройках кошелька включите HTTP-уведомления и укажите URL:

```text
https://ВАШ_ДОМЕН/api/payments/yoomoney-notification
```

Секретный ключ из настроек HTTP-уведомлений положите в `.env`:

```env
YOOMONEY_NOTIFICATION_SECRET=...
```

## Что настроить в Brevo

В `.env` задайте:

```env
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=hello@example.com
BREVO_SENDER_NAME=Вспомнить всё
BREVO_REPLY_TO_EMAIL=hello@example.com
```

`BREVO_SENDER_EMAIL` должен быть подтверждённым отправителем в Brevo.

## Локальный запуск

```bash
npm install
cp .env.example .env
npm start
```

Откройте:

```text
http://localhost:3000/
```

## Важно

Страница `thank-you.html` показывает возврат после оплаты, но зачисление и письмо выполняются только по HTTP-уведомлению ЮMoney. Это сделано специально: редирект пользователя нельзя считать надёжным подтверждением платежа.
