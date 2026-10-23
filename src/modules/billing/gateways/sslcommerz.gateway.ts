import { env } from '@/config/env.config';
import { AppError } from '@/shared/errors';
import { CheckoutRequest, PaymentGateway, VerifiedPayment } from './payment-gateway';

const BASE = env.SSLCOMMERZ_LIVE
  ? 'https://securepay.sslcommerz.com'
  : 'https://sandbox.sslcommerz.com';
const TIMEOUT_MS = 15_000;

class SslCommerzGateway implements PaymentGateway {
  readonly isConfigured = Boolean(env.SSLCOMMERZ_STORE_ID && env.SSLCOMMERZ_STORE_PASSWORD);

  private credentials() {
    return { store_id: env.SSLCOMMERZ_STORE_ID!, store_passwd: env.SSLCOMMERZ_STORE_PASSWORD! };
  }

  async createCheckout(r: CheckoutRequest): Promise<string> {
    const res = await fetch(`${BASE}/gwprocess/v4/api.php`, {
      method: 'POST',
      body: new URLSearchParams({
        ...this.credentials(),
        total_amount: r.amount.toFixed(2),
        currency: 'BDT',
        tran_id: r.tranId,
        success_url: r.successUrl,
        fail_url: r.failUrl,
        cancel_url: r.cancelUrl,
        ipn_url: r.ipnUrl,
        cus_name: r.customer.name,
        cus_email: r.customer.email,
        cus_phone: r.customer.phone,
        cus_add1: 'Jagannath University',
        cus_city: 'Dhaka',
        cus_country: 'Bangladesh',
        shipping_method: 'NO',
        product_name: r.productName,
        product_category: 'Hall fee',
        product_profile: 'non-physical-goods',
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = (await res.json()) as {
      status?: string;
      GatewayPageURL?: string;
      failedreason?: string;
    };
    if (body.status !== 'SUCCESS' || !body.GatewayPageURL) {
      throw new AppError(
        `Payment gateway refused the request: ${body.failedreason ?? 'unknown'}`,
        502,
      );
    }
    return body.GatewayPageURL;
  }

  async verify(validationId: string): Promise<VerifiedPayment> {
    const query = new URLSearchParams({
      val_id: validationId,
      ...this.credentials(),
      format: 'json',
    });
    const res = await fetch(`${BASE}/validator/api/validationserverAPI.php?${query}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = (await res.json()) as Record<string, string>;
    // VALIDATED = already validated once before; both mean a completed payment
    if (body.status !== 'VALID' && body.status !== 'VALIDATED') {
      throw new AppError('Payment could not be verified with the gateway', 400);
    }
    return {
      tranId: body.tran_id,
      amount: Number(body.amount),
      currency: body.currency_type ?? body.currency,
      method: body.card_type,
      raw: body,
    };
  }
}

export const sslCommerzGateway: PaymentGateway = new SslCommerzGateway();
