<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Tax Invoice - {{ $invoice->invoice_number }}</title>
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
            border-bottom: 2px solid #1B365D;
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
        .info-grid {
            width: 100%;
            margin-bottom: 25px;
        }
        .info-col {
            width: 50%;
            vertical-align: top;
        }
        .info-box {
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 12px;
            margin-right: 10px;
        }
        .info-box h3 {
            margin: 0 0 8px 0;
            font-size: 11px;
            color: #1B365D;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #CBD5E1;
            padding-bottom: 4px;
        }
        .info-box p {
            margin: 2px 0;
            font-size: 12px;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        .table th {
            background-color: #1B365D;
            color: #FFFFFF;
            font-size: 11px;
            text-transform: uppercase;
            padding: 8px 10px;
            text-align: left;
            letter-spacing: 0.5px;
        }
        .table td {
            padding: 9px 10px;
            border-bottom: 1px solid #E2E8F0;
            font-size: 12px;
        }
        .table tr:nth-child(even) td {
            background-color: #F8FAFC;
        }
        .text-right {
            text-align: right;
        }
        .totals-table {
            width: 45%;
            margin-left: auto;
            border-collapse: collapse;
        }
        .totals-table td {
            padding: 6px 10px;
            font-size: 12px;
        }
        .totals-table tr.total-row td {
            border-top: 2px solid #1B365D;
            border-bottom: 2px solid #1B365D;
            font-size: 14px;
            font-weight: bold;
            color: #1B365D;
            background-color: #FEF3C7;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            font-size: 10px;
            font-weight: bold;
            border-radius: 4px;
            text-transform: uppercase;
        }
        .badge-paid {
            background-color: #D1FAE5;
            color: #065F46;
        }
        .badge-unpaid {
            background-color: #FEE2E2;
            color: #991B1B;
        }
        .badge-partial {
            background-color: #FEF3C7;
            color: #92400E;
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
            <p>{{ $reservation->room->hotel->name ?? 'Hospitality & Luxury Suites' }}</p>
        </div>
        <div class="doc-title">
            <h2>TAX INVOICE</h2>
            <p>{{ $invoice->invoice_number }}</p>
        </div>
    </div>

    <table class="info-grid">
        <tr>
            <td class="info-col">
                <div class="info-box" style="margin-right: 15px;">
                    <h3>Billed To (Guest)</h3>
                    <p><strong>{{ $reservation->user->name }}</strong></p>
                    <p>Email: {{ $reservation->user->email }}</p>
                    <p>Phone: {{ $reservation->user->phone }}</p>
                    <p>Confirmation: <strong style="font-family: 'Courier New', monospace;">{{ $reservation->confirmation_code }}</strong></p>
                </div>
            </td>
            <td class="info-col">
                <div class="info-box">
                    <h3>Hotel Branch & Booking Details</h3>
                    <p><strong>{{ $reservation->room->hotel->name ?? 'RP Hotel Branch' }}</strong></p>
                    <p>{{ $reservation->room->hotel->address ?? 'Rwanda' }}, {{ $reservation->room->hotel->location ?? '' }}</p>
                    <p>Stay: <strong>{{ \Carbon\Carbon::parse($reservation->check_in)->format('M d, Y') }}</strong> to <strong>{{ \Carbon\Carbon::parse($reservation->check_out)->format('M d, Y') }}</strong> ({{ max(1, \Carbon\Carbon::parse($reservation->check_in)->diffInDays(\Carbon\Carbon::parse($reservation->check_out))) }} nights)</p>
                    <p>Payment Status: 
                        @if($reservation->payment_status === 'paid')
                            <span class="badge badge-paid">PAID IN FULL</span>
                        @elseif($reservation->payment_status === 'partially_paid')
                            <span class="badge badge-partial">PARTIALLY PAID</span>
                        @else
                            <span class="badge badge-unpaid">UNPAID</span>
                        @endif
                    </p>
                </div>
            </td>
        </tr>
    </table>

    <table class="table">
        <thead>
            <tr>
                <th>Description</th>
                <th style="width: 80px; text-align: center;">Room #</th>
                <th style="width: 80px; text-align: center;">Nights / Qty</th>
                <th class="text-right" style="width: 120px;">Rate (RWF)</th>
                <th class="text-right" style="width: 120px;">Amount (RWF)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <strong>{{ $reservation->room->roomType->type_name ?? 'Accommodation' }}</strong><br>
                    <span style="color: #64748B; font-size: 11px;">Standard Room Booking (Capacity: {{ $reservation->room->capacity }} Guests)</span>
                </td>
                <td style="text-align: center; font-family: 'Courier New', monospace; font-weight: bold;">
                    {{ $reservation->room->room_number }}
                </td>
                <td style="text-align: center;">
                    {{ max(1, \Carbon\Carbon::parse($reservation->check_in)->diffInDays(\Carbon\Carbon::parse($reservation->check_out))) }}
                </td>
                <td class="text-right">
                    {{ number_format($reservation->room->price_per_night, 0) }}
                </td>
                <td class="text-right">
                    {{ number_format(max(1, \Carbon\Carbon::parse($reservation->check_in)->diffInDays(\Carbon\Carbon::parse($reservation->check_out))) * $reservation->room->price_per_night, 0) }}
                </td>
            </tr>

            @foreach($reservation->serviceOrders as $order)
                <tr>
                    <td>
                        <strong>{{ $order->service->service_name ?? 'Hotel Service' }}</strong><br>
                        <span style="color: #64748B; font-size: 11px;">Ordered at {{ $order->ordered_at?->format('M d, Y H:i') }}</span>
                    </td>
                    <td style="text-align: center;">—</td>
                    <td style="text-align: center;">{{ $order->quantity }}</td>
                    <td class="text-right">{{ number_format($order->unit_price, 0) }}</td>
                    <td class="text-right">{{ number_format($order->total_price, 0) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals-table">
        <tr>
            <td>Subtotal:</td>
            <td class="text-right" style="font-family: 'Courier New', monospace;">RWF {{ number_format($invoice->subtotal, 0) }}</td>
        </tr>
        @if($invoice->discount > 0)
            <tr style="color: #065F46;">
                <td>Loyalty Discount:</td>
                <td class="text-right" style="font-family: 'Courier New', monospace;">- RWF {{ number_format($invoice->discount, 0) }}</td>
            </tr>
        @endif
        <tr>
            <td>VAT (18%):</td>
            <td class="text-right" style="font-family: 'Courier New', monospace;">RWF {{ number_format($invoice->tax, 0) }}</td>
        </tr>
        <tr class="total-row">
            <td>Total Invoice Amount:</td>
            <td class="text-right" style="font-family: 'Courier New', monospace;">RWF {{ number_format($invoice->total_amount, 0) }}</td>
        </tr>
        @php
            $paidTotal = $reservation->payments()->where('payment_status', 'completed')->sum('amount');
            $balance = max(0, $invoice->total_amount - $paidTotal);
        @endphp
        <tr>
            <td>Total Paid to Date:</td>
            <td class="text-right" style="font-weight: bold; color: #065F46; font-family: 'Courier New', monospace;">RWF {{ number_format($paidTotal, 0) }}</td>
        </tr>
        <tr style="border-top: 1px dashed #CBD5E1;">
            <td><strong>Remaining Balance:</strong></td>
            <td class="text-right" style="font-weight: bold; color: {{ $balance > 0 ? '#991B1B' : '#065F46' }}; font-family: 'Courier New', monospace;">
                RWF {{ number_format($balance, 0) }}
            </td>
        </tr>
    </table>

    <div class="footer">
        <p>Thank you for choosing RP Hotels Resort. This is a computer-generated tax invoice valid under Rwandan tax regulations.</p>
        <p>RP Hotels & Resorts • contact@rphotels.rw • +250 788 000 000 • Issued on {{ \Carbon\Carbon::parse($invoice->issued_at)->format('F d, Y H:i:s') }}</p>
    </div>
</body>
</html>
