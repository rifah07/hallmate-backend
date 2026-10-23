// The billing service talks to this interface, never to a gateway's HTTP API.
// Swapping SSLCommerz for another provider, or for a fake in tests, touches
// one file (the Adapter pattern).

export interface CheckoutRequest {
  tranId: string;
  amount: number;
  productName: string;
  customer: { name: string; email: string; phone: string };
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
}

/** What the gateway itself confirms about a payment (server to server). */
export interface VerifiedPayment {
  tranId: string;
  amount: number;
  currency: string;
  method?: string; // e.g. "BKASH-BKash", "VISA-Dutch Bangla"
  raw: Record<string, unknown>;
}

export interface PaymentGateway {
  readonly isConfigured: boolean;
  /** Starts a checkout session; returns the page to send the payer to. */
  createCheckout(request: CheckoutRequest): Promise<string>;
  /** Asks the gateway whether this validation id is a real, completed payment. */
  verify(validationId: string): Promise<VerifiedPayment>;
}
