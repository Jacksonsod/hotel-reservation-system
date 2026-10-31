<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Executive Operations & Analytics Report</title>
    <style>
        @page {
            margin: 28px 32px;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #1E293B;
            margin: 0;
            padding: 0;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #1B365D;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .logo-title {
            font-size: 18px;
            font-weight: bold;
            color: #1B365D;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .logo-sub {
            font-size: 9px;
            color: #64748B;
            margin-top: 2px;
        }
        .report-badge {
            background-color: #1B365D;
            color: #FFFFFF;
            font-weight: bold;
            font-size: 11px;
            padding: 6px 12px;
            border-radius: 4px;
            display: inline-block;
            text-align: right;
        }
        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #1B365D;
            border-bottom: 1.5px solid #E2E8F0;
            padding-bottom: 4px;
            margin-top: 14px;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .kpi-grid {
            width: 100%;
            margin-bottom: 14px;
        }
        .kpi-box {
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 8px 10px;
            text-align: center;
        }
        .kpi-value {
            font-size: 13px;
            font-weight: bold;
            color: #1B365D;
            margin-top: 2px;
        }
        .kpi-label {
            font-size: 8px;
            color: #64748B;
            text-transform: uppercase;
            font-weight: 600;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }
        table.data-table th {
            background-color: #1B365D;
            color: #FFFFFF;
            font-weight: bold;
            font-size: 8.5px;
            text-transform: uppercase;
            padding: 6px 8px;
            text-align: left;
            border: 1px solid #1B365D;
        }
        table.data-table td {
            padding: 5px 8px;
            border: 1px solid #E2E8F0;
            font-size: 8.5px;
        }
        table.data-table tr:nth-child(even) td {
            background-color: #F8FAFC;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .gold-highlight {
            color: #C59B27;
            font-weight: bold;
        }
        .footer {
            margin-top: 20px;
            border-top: 1px solid #CBD5E1;
            padding-top: 8px;
            font-size: 8px;
            color: #94A3B8;
            text-align: center;
        }
    </style>
</head>
<body>

    <!-- HEADER -->
    <table class="header-table">
        <tr>
            <td style="width: 60%;">
                <div class="logo-title">RP Hotels & Resorts Group</div>
                <div class="logo-sub">Republic of Rwanda | Hospitality Management & Analytics Center</div>
                <div class="logo-sub">Generated At: {{ $generated_at }} | System: RP-HMS Level 7 IT</div>
            </td>
            <td style="width: 40%; text-align: right;">
                <div class="report-badge">EXECUTIVE OPERATIONS AUDIT</div>
                <div class="logo-sub" style="margin-top: 4px;">Status: Certified Confidential</div>
            </td>
        </tr>
    </table>

    <!-- 1. EXECUTIVE KPIS STRIP -->
    <div class="section-title">1. Executive Overview & Hospitality KPIs</div>
    <table class="kpi-grid">
        <tr>
            <td style="width: 25%; padding-right: 6px;">
                <div class="kpi-box">
                    <div class="kpi-label">Total Period Revenue</div>
                    <div class="kpi-value gold-highlight">RWF {{ number_format($executive_kpis['total_revenue'], 0) }}</div>
                </div>
            </td>
            <td style="width: 25%; padding-right: 6px;">
                <div class="kpi-box">
                    <div class="kpi-label">Current Occupancy Rate</div>
                    <div class="kpi-value">{{ $executive_kpis['occupancy_rate_percent'] }}%</div>
                </div>
            </td>
            <td style="width: 25%; padding-right: 6px;">
                <div class="kpi-box">
                    <div class="kpi-label">Rooms (Occupied / Total)</div>
                    <div class="kpi-value">{{ $executive_kpis['occupied_rooms'] }} / {{ $executive_kpis['total_rooms'] }}</div>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="kpi-box">
                    <div class="kpi-label">Guest Satisfaction</div>
                    <div class="kpi-value">★ {{ $executive_kpis['avg_satisfaction_rating'] }} / 5.0</div>
                </div>
            </td>
        </tr>
    </table>

    <!-- 2. REVENUE & PERFORMANCE BY BRANCH -->
    <div class="section-title">2. Multi-Branch Operations & Performance Matrix</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Hotel Branch</th>
                <th>Location</th>
                <th class="text-center">Total Rooms</th>
                <th class="text-center">Occupied</th>
                <th class="text-center">Occupancy Rate</th>
                <th class="text-center">Bookings</th>
                <th class="text-center">Cancelled</th>
                <th class="text-right">Total Revenue (RWF)</th>
                <th class="text-center">Rating</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($revenue_by_branch as $b)
                <tr>
                    <td style="font-weight: bold;">{{ $b['hotel_name'] }}</td>
                    <td>{{ $b['location'] }}</td>
                    <td class="text-center">{{ $b['total_rooms'] }}</td>
                    <td class="text-center">{{ $b['occupied_rooms'] }}</td>
                    <td class="text-center" style="font-weight: bold;">{{ $b['occupancy_rate'] }}%</td>
                    <td class="text-center">{{ $b['reservations_count'] }}</td>
                    <td class="text-center">{{ $b['cancelled_count'] }}</td>
                    <td class="text-right" style="font-weight: bold;">{{ number_format($b['revenue'], 0) }}</td>
                    <td class="text-center">★ {{ $b['avg_rating'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- 3. FINANCIAL BREAKDOWN BY ROOM TYPE -->
    <div class="section-title">3. Room Type Revenue & Nightly Rate Distribution (SQL Aggregates)</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Room Type</th>
                <th class="text-center">Bookings Count</th>
                <th class="text-right">Average Nightly (RWF)</th>
                <th class="text-right">Minimum Rate (RWF)</th>
                <th class="text-right">Maximum Rate (RWF)</th>
                <th class="text-right">Gross Revenue (RWF)</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($revenue_by_room_type as $rt)
                <tr>
                    <td style="font-weight: bold;">{{ $rt['type_name'] }}</td>
                    <td class="text-center">{{ $rt['bookings_count'] }}</td>
                    <td class="text-right">{{ number_format($rt['avg_nightly_rate'], 0) }}</td>
                    <td class="text-right">{{ number_format($rt['min_rate'], 0) }}</td>
                    <td class="text-right">{{ number_format($rt['max_rate'], 0) }}</td>
                    <td class="text-right gold-highlight">{{ number_format($rt['revenue'], 0) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- 4. HOUSEKEEPING & MAINTENANCE -->
    <div class="section-title">4. Housekeeping Turnover & Engineering Maintenance</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Operational Sector</th>
                <th class="text-center">Pending / Dirty</th>
                <th class="text-center">In Progress / Cleaning</th>
                <th class="text-center">Completed / Resolved</th>
                <th class="text-center">Critical / Urgent</th>
                <th class="text-center">Completion Rate</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="font-weight: bold;">Housekeeping Cleaning Tasks</td>
                <td class="text-center">{{ $housekeeping_maintenance_stats['housekeeping']['dirty_count'] }}</td>
                <td class="text-center">{{ $housekeeping_maintenance_stats['housekeeping']['cleaning_count'] }}</td>
                <td class="text-center">{{ $housekeeping_maintenance_stats['housekeeping']['clean_count'] }}</td>
                <td class="text-center">—</td>
                <td class="text-center" style="font-weight: bold; color: #10B981;">{{ $housekeeping_maintenance_stats['housekeeping']['completion_rate_percent'] }}%</td>
            </tr>
            <tr>
                <td style="font-weight: bold;">Facility Maintenance & Repairs</td>
                <td class="text-center">{{ $housekeeping_maintenance_stats['maintenance']['pending_count'] }}</td>
                <td class="text-center">{{ $housekeeping_maintenance_stats['maintenance']['in_progress_count'] }}</td>
                <td class="text-center">{{ $housekeeping_maintenance_stats['maintenance']['resolved_count'] }}</td>
                <td class="text-center" style="color: #EF4444; font-weight: bold;">{{ $housekeeping_maintenance_stats['maintenance']['urgent_count'] }}</td>
                <td class="text-center" style="font-weight: bold;">
                    @php
                        $mTotal = $housekeeping_maintenance_stats['maintenance']['total_logs'];
                        $mRes = $housekeeping_maintenance_stats['maintenance']['resolved_count'];
                        echo $mTotal > 0 ? round(($mRes / $mTotal) * 100, 1) . '%' : '100%';
                    @endphp
                </td>
            </tr>
        </tbody>
    </table>

    <!-- 5. STAFF OPERATIONAL PERFORMANCE -->
    <div class="section-title">5. Staff Operational Performance & Service Delivery</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Staff Member</th>
                <th>Role</th>
                <th class="text-center">Check-Ins</th>
                <th class="text-center">Check-Outs</th>
                <th class="text-center">Cleanings Completed</th>
                <th class="text-center">Maintenance Logs</th>
                <th class="text-center">Total Actions</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($staff_performance as $sp)
                <tr>
                    <td style="font-weight: bold;">{{ $sp['name'] }}</td>
                    <td style="text-transform: capitalize;">{{ $sp['role'] }}</td>
                    <td class="text-center">{{ $sp['checkins_processed'] }}</td>
                    <td class="text-center">{{ $sp['checkouts_processed'] }}</td>
                    <td class="text-center">{{ $sp['cleaning_tasks_completed'] }}</td>
                    <td class="text-center">{{ $sp['maintenance_reported_or_resolved'] }}</td>
                    <td class="text-center" style="font-weight: bold; color: #1B365D;">{{ $sp['total_actions'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        RP Hotel Reservation System | ITLAW701 Advanced Web Technologies | Certified Executive Audit Document | Page 1 of 1
    </div>

</body>
</html>
