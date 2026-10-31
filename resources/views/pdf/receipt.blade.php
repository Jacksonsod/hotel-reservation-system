<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Payment Receipt - {{ $payment->transaction_reference }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #0F172A;
            margin: 0;
            padding: 30px;
            font-size: 13px;
            line-height: 1.5;
        }
        .header {
            border-bottom: 2px solid #C59B27;
            padding-bottom: 15px;
            margin-bottom: 25px;
        }
        .logo-section h1 {
            color: #1B365D;
            font-size: 24px;
            margin: 0 0 4px 0;
            letter-spacing: -0.5px;
        }
        .logo-section p {
            color: #C59B27;
            font-weight: bold;
            font-size: 12px;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .doc-title {
            text-align: right;
            margin-top: -45px;
        }
        .doc-title h2 {
            font-size: 20px;
            color: #1B365D;
            margin: 0;
            text-transform: uppercase;
        }
        .doc-title p {
            color: #64748B;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            margin: 4px 0 0 0;
        }
        .highlight-box {
            background-color: #F0FDF4;
            border: 2px solid #10B981;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin-bottom: 25px;
        }
        .highlight-box .amount-label {
            font-size: 12px;
            text-transform: uppercase;
            color: #065F46;
            font-weight: bold;
            letter-spacing: 1px;
        }
        .highlight-box .amount-value {
            font-size: 32px;
            color: #065F46;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            margin: 5px 0;
        }
        .highlight-box .status-text {
            color: #059669;
            font-weight: bold;
            font-size: 13px;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        .details-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #E2E8F0;
            font-size: 13px;
        }
        .details-table td.label {
            width: 35%;
            color: #64748B;
            font-weight: 500;
        }
        .details-table td.value {
            font-weight: 600;
        }
        .footer {
            margin-top: 40px;
            border-top: 1px solid #E2E8F0;
            padding-top: 15px;
            text-align: center;
            font-size: 11px;
            color: #64748B;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-section">
            <h1>RP HOTELS RESORT</h1>
            <p>{{ $payment->reservation->room->hotel->name ?? 'Luxury Accommodation' }}</p>
        </div>
        <div class="doc-title">
            <h2>OFFICIAL RECEIPT</h2>
            <p>{{ $payment->transaction_reference }}</p>
        </div>
    </div>

    <div class="highlight-box">
        <div class="amount-label">Payment Received In Full</div>
        <div class="amount-value">RWF {{ number_format($payment->amount, 0) }}</div>
        <div class="status-text">✓ TRANSACTION COMPLETED SUCCESSFULLY</div>
    </div>

    <table class="details-table">
        <tr>
            <td class="label">Transaction Reference</td>
            <td class="value" style="font-family: 'Courier New', monospace; color: #1B365D;">{{ $payment->transaction_reference }}</td>
        </tr>
        <tr>
            <td class="label">Payment Date & Time</td>
            <td class="value">{{ \Carbon\Carbon::parse($payment->paid_at)->format('F d, Y • H:i:s') }}</td>
        </tr>
        <tr>
            <td class="label">Payment Method</td>
            <td class="value" style="text-transform: uppercase;">{{ str_replace('_', ' ', $payment->payment_method) }}</td>
        </tr>
        <tr>
            <td class="label">Guest Name</td>
            <td class="value">{{ $payment->reservation->user->name }}</td>
        </tr>
        <tr>
            <td class="label">Guest Email & Phone</td>
            <td class="value">{{ $payment->reservation->user->email }} • {{ $payment->reservation->user->phone }}</td>
        </tr>
        <tr>
            <td class="label">Reservation Confirmation</td>
            <td class="value" style="font-family: 'Courier New', monospace; color: #1B365D;">{{ $payment->reservation->confirmation_code }}</td>
        </tr>
        <tr>
            <td class="label">Hotel Branch & Room</td>
            <td class="value">
                {{ $payment->reservation->room->hotel->name ?? 'Hotel Branch' }} — Room {{ $payment->reservation->room->room_number }} ({{ $payment->reservation->room->roomType->type_name ?? 'Room' }})
            </td>
        </tr>
        <tr>
            <td class="label">Dates of Stay</td>
            <td class="value">
                {{ \Carbon\Carbon::parse($payment->reservation->check_in)->format('M d, Y') }} to {{ \Carbon\Carbon::parse($payment->reservation->check_out)->format('M d, Y') }}
                ({{ max(1, \Carbon\Carbon::parse($payment->reservation->check_in)->diffInDays(\Carbon\Carbon::parse($payment->reservation->check_out))) }} nights)
            </td>
        </tr>
        <tr>
            <td class="label">Total Reservation Cost</td>
            <td class="value" style="font-family: 'Courier New', monospace;">RWF {{ number_format($payment->reservation->total_amount, 0) }}</td>
        </tr>
        @php
            $paidTotal = $payment->reservation->payments()->where('payment_status', 'completed')->sum('amount');
            $remaining = max(0, $payment->reservation->total_amount - $paidTotal);
        @endphp
        <tr>
            <td class="label">Outstanding Balance Remaining</td>
            <td class="value" style="font-family: 'Courier New', monospace; color: {{ $remaining > 0 ? '#991B1B' : '#065F46' }};">
                RWF {{ number_format($remaining, 0) }}
            </td>
        </tr>
    </table>

    <div class="footer">
        <p>This document certifies the receipt of payment at RP Hotels & Resorts.</p>
        <p>RP Hotels & Resorts • contact@rphotels.rw • +250 788 000 000 • Kigali / Rubavu / Karongi, Rwanda</p>
    </div>
</body>
</html>
