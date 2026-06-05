<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PrivacyFilterMiddleware
{
    /**
     * Patterns to scrub from any raw OCR text before it reaches the AI pipeline.
     * These match common financial data found on Indonesian supermarket receipts.
     */
    private const SENSITIVE_PATTERNS = [
        // Credit/debit card numbers (Visa, Mastercard, etc.)
        '/\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/',
        // Bank transfer / transaction IDs (typically 12-20 digits)
        '/\b(TXN|REF|NO\.?|ID)[:\s#]?\d{10,20}\b/i',
        // EDC/terminal IDs
        '/\b(TERMINAL|MERCHANT|CASHIER)[:\s]?\w{4,20}\b/i',
        // Indonesian NPWP tax numbers (XX.XXX.XXX.X-XXX.XXX)
        '/\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}/',
        // Debit/credit keywords followed by amounts
        '/\b(DEBIT|CREDIT|TUNAI|KEMBALIAN)[:\s]+Rp\.?\s*[\d.,]+/i',
    ];

    /**
     * Handle an incoming request.
     * This middleware only acts on multipart/form-data uploads (receipt scans).
     * Raw text fields named `raw_text` will be sanitized before passing downstream.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // If raw OCR text is pre-sent in the request, sanitize it
        if ($request->has('raw_text')) {
            $sanitized = $this->scrub($request->input('raw_text'));
            $request->merge(['raw_text' => $sanitized]);
        }

        // Tag the request so downstream services know it's been filtered
        $request->headers->set('X-Privacy-Filtered', 'true');

        return $next($request);
    }

    /**
     * Apply all regex patterns to the given text and return sanitized output.
     */
    public function scrub(string $text): string
    {
        return preg_replace(self::SENSITIVE_PATTERNS, '[REDACTED]', $text);
    }
}
