<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Reservation;
use App\Services\AuditLoggerService;
use App\Services\BillingService;
use App\Traits\ApiResponse;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentInvoiceController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected BillingService $billingService
    ) {}

    /**
     * Display a listing of payments and invoices.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'guest') {
            $payments = Payment::with([
                'reservation.room.hotel',
                'reservation.room.roomType',
                'reservation.invoice',
            ])
                ->whereHas('reservation', function ($rq) use ($user) {
                    $rq->where('user_id', $user->user_id);
                })
                ->latest('payment_id')
                ->get();

            return $this->successResponse($payments, 'Payment history retrieved successfully.');
        }

        // Staff & Admin
        $query = Payment::with([
            'reservation.user',
            'reservation.room.hotel',
            'reservation.room.roomType',
        ])->latest('payment_id');

        if ($request->filled('hotel_id')) {
            $query->whereHas('reservation.room', function ($rq) use ($request) {
                $rq->where('hotel_id', $request->input('hotel_id'));
            });
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->input('payment_method'));
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->input('payment_status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('transaction_reference', 'like', "%{$search}%")
                    ->orWhereHas('reservation', function ($rq) use ($search) {
                        $rq->where('confirmation_code', 'like', "%{$search}%");
                    })
                    ->orWhereHas('reservation.user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $totalCollected = (clone $query)->where('payment_status', 'completed')->sum('amount');

        if ($request->has('page') || $request->has('per_page')) {
            $perPage = (int) $request->input('per_page', 10);
            $paginator = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Payments retrieved successfully.',
                'data' => $paginator->items(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'kpis' => [
                        'total_transactions' => $paginator->total(),
                        'total_collected_rwf' => $totalCollected,
                    ],
                ],
            ]);
        }

        return $this->successResponse($query->get(), 'Payments retrieved successfully.', 200, [
            'kpis' => [
                'total_transactions' => $query->count(),
                'total_collected_rwf' => $totalCollected,
            ],
        ]);
    }

    /**
     * Record a payment against an existing reservation.
     */
    public function storePayment(Request $request, int $reservationId): JsonResponse
    {
        $reservation = Reservation::find($reservationId);

        if (! $reservation) {
            return $this->errorResponse('Reservation not found.', 404);
        }

        $user = $request->user();
        if ($user->role === 'guest' && (int) $reservation->user_id !== (int) $user->user_id) {
            return $this->errorResponse('Unauthorized to make payments for this reservation.', 403);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|gt:0',
            'payment_method' => 'required|in:cash,card,mobile_money',
        ]);

        $amount = round((float) $validated['amount'], 2);

        // 1. Calculate outstanding balance
        $paidSoFar = (float) $reservation->payments()->where('payment_status', 'completed')->sum('amount');
        $outstandingBalance = round((float) $reservation->total_amount - $paidSoFar, 2);

        if ($amount > $outstandingBalance) {
            return $this->errorResponse(
                'Payment amount cannot exceed outstanding balance of RWF '.number_format($outstandingBalance, 0),
                422
            );
        }

        // 2. Duplicate payment guard: identical amount within 10 seconds
        $recentDuplicate = Payment::where('reservation_id', $reservation->reservation_id)
            ->where('amount', $amount)
            ->where('paid_at', '>=', now()->subSeconds(10))
            ->exists();

        if ($recentDuplicate) {
            return $this->errorResponse('A duplicate payment with the exact same amount was recently submitted. Please wait a moment.', 422);
        }

        return DB::transaction(function () use ($reservation, $amount, $validated, $paidSoFar, $user) {
            // Unique transaction reference: PAY-YYYYMMDD-XXXXXX
            $transactionRef = 'PAY-'.date('Ymd').'-'.strtoupper(Str::random(6));

            $payment = Payment::create([
                'reservation_id' => $reservation->reservation_id,
                'amount' => $amount,
                'payment_method' => $validated['payment_method'],
                'transaction_reference' => $transactionRef,
                'payment_status' => 'completed',
                'paid_at' => now(),
            ]);

            // Update reservation payment status
            $newPaidTotal = round($paidSoFar + $amount, 2);
            if ($newPaidTotal >= (float) $reservation->total_amount) {
                $reservation->update(['payment_status' => 'paid']);
            } else {
                $reservation->update(['payment_status' => 'partially_paid']);
            }

            // Sync invoice
            $this->billingService->syncOrGenerateInvoice($reservation);

            // Send notification
            Notification::create([
                'user_id' => $reservation->user_id,
                'title' => 'Payment Received',
                'message' => 'Payment of RWF '.number_format($amount, 0)." recorded for reservation #{$reservation->confirmation_code} via ".strtoupper(str_replace('_', ' ', $validated['payment_method'])).'.',
                'notification_type' => 'payment',
                'is_read' => false,
                'created_at' => now(),
            ]);

            AuditLoggerService::log('create', 'payments', $payment->payment_id, $user->user_id);

            return $this->successResponse(
                $payment->load('reservation'),
                'Payment processed successfully.',
                201
            );
        });
    }

    /**
     * Download or stream Tax Invoice PDF.
     */
    public function downloadInvoicePdf(Request $request, int $reservationId): Response|JsonResponse
    {
        $reservation = Reservation::with([
            'user',
            'room.hotel',
            'room.roomType',
            'serviceOrders.service',
            'payments',
            'invoice',
        ])->find($reservationId);

        if (! $reservation) {
            return $this->errorResponse('Reservation not found.', 404);
        }

        $user = $request->user();
        if ($user && $user->role === 'guest' && (int) $reservation->user_id !== (int) $user->user_id) {
            return $this->errorResponse('Unauthorized to view this invoice.', 403);
        }

        $invoice = $reservation->invoice ?? $this->billingService->syncOrGenerateInvoice($reservation);

        $pdf = Pdf::loadView('pdf.invoice', [
            'reservation' => $reservation,
            'invoice' => $invoice,
        ]);

        return $pdf->download("Invoice-{$reservation->confirmation_code}.pdf");
    }

    /**
     * Download or stream Official Payment Receipt PDF.
     */
    public function downloadReceiptPdf(Request $request, int $paymentId): Response|JsonResponse
    {
        $payment = Payment::with([
            'reservation.user',
            'reservation.room.hotel',
            'reservation.room.roomType',
            'reservation.payments',
        ])->find($paymentId);

        if (! $payment) {
            return $this->errorResponse('Payment record not found.', 404);
        }

        $user = $request->user();
        if ($user && $user->role === 'guest' && (int) $payment->reservation->user_id !== (int) $user->user_id) {
            return $this->errorResponse('Unauthorized to view this receipt.', 403);
        }

        $pdf = Pdf::loadView('pdf.receipt', [
            'payment' => $payment,
        ]);

        return $pdf->download("Receipt-{$payment->transaction_reference}.pdf");
    }
}
