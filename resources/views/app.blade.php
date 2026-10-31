<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>RP Hotels & Resorts | Luxury Hospitality & Convention</title>

    <!-- Google Fonts: Inter, Plus Jakarta Sans, JetBrains Mono -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet">

    @viteReactRefresh
    @vite(['resources/js/main.jsx'])
</head>
<body style="margin: 0; padding: 0; box-sizing: border-box;">
    <div id="root"></div>
</body>
</html>
