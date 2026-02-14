<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';
require_once 'senders.php';

// Получатели
$receivers = [
    'sms@telegram.org',
    'dmca@telegram.org',
    'abuse@telegram.org',
    'sticker@telegram.org',
    'support@telegram.org'
];

// Функция отправки email
function sendEmail($to, $from, $password, $subject, $body) {
    try {
        // Определяем SMTP сервер в зависимости от провайдера
        if (strpos($from, 'gmail.com') !== false) {
            $smtp_host = 'smtp.gmail.com';
            $smtp_port = 587;
        } elseif (strpos($from, 'rambler.ru') !== false) {
            $smtp_host = 'smtp.rambler.ru';
            $smtp_port = 587;
        } elseif (strpos($from, 'mail.ru') !== false) {
            $smtp_host = 'smtp.mail.ru';
            $smtp_port = 587;
        } else {
            return false;
        }
        
        // Формируем заголовки
        $headers = "From: $from\r\n";
        $headers .= "Reply-To: $from\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        
        // Отправляем через mail() - для реальной отправки нужно использовать библиотеку вроде PHPMailer
        // или настроить sendmail
        $success = mail($to, $subject, $body, $headers);
        
        if ($success) {
            writeLog("Email sent to $to from $from");
            return true;
        } else {
            writeLog("Failed to send email to $to from $)
            }
