# Stripe Integration Setup Guide

## Overview
HealthHub now includes full Stripe Checkout integration for secure payment processing.

## Environment Variables Required

Add these to your `.env` file:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_... # Your Stripe Secret Key (test or live)
STRIPE_WEBHOOK_SECRET=whsec_... # Your Stripe Webhook Secret
FRONTEND_URL=http://localhost:3000 # Your frontend URL for redirects
```

## API Endpoints

### 1. Create Checkout Session
**POST** `/api/stripe/create-checkout-session`
- **Auth Required**: Yes (Bearer token)
- **Body**:
  ```json
  {
    "userMembershipId": "65f1234567890abcdef12345"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/..."
  }
  ```
- **Usage**: Redirect user to `url` to complete payment

### 2. Verify Payment Status
**GET** `/api/stripe/verify-payment/:sessionId`
- **Auth Required**: No
- **Response**:
  ```json
  {
    "success": true,
    "paid": true,
    "payment": { ... }
  }
  ```
- **Usage**: Poll this endpoint after redirect to check payment status

### 3. Webhook Endpoint
**POST** `/api/stripe/webhook`
- **Auth Required**: No (Stripe signature verification instead)
- **Usage**: Configure this URL in Stripe Dashboard → Webhooks

## Webhook Events Handled

1. `checkout.session.completed` - Payment successful
2. `checkout.session.async_payment_succeeded` - Async payment succeeded
3. `checkout.session.async_payment_failed` - Async payment failed
4. `payment_intent.payment_failed` - Payment failed
5. `charge.refunded` - Refund processed

## Stripe Dashboard Setup

1. **Get API Keys**:
   - Go to https://dashboard.stripe.com/apikeys
   - Copy your **Secret Key** → `STRIPE_SECRET_KEY`
   - Copy your **Publishable Key** (for frontend if needed)

2. **Configure Webhook**:
   - Go to https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://your-backend.com/api/stripe/webhook`
   - Select events:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
     - `payment_intent.payment_failed`
     - `charge.refunded`
   - Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

3. **Test Mode**:
   - Use test cards: https://stripe.com/docs/testing
   - Example: `4242 4242 4242 4242` (any future expiry, any CVC)

## Testing Flow

1. User creates membership → gets `userMembershipId`
2. Call `/api/stripe/create-checkout-session` with `userMembershipId`
3. Redirect user to returned `url`
4. User completes payment on Stripe
5. Stripe redirects to `success_url` or `cancel_url`
6. Webhook automatically updates payment status
7. Frontend can poll `/api/stripe/verify-payment/:sessionId` as backup

## Payment Flow

1. **Pending**: Payment created, awaiting completion
2. **Completed**: Payment successful, membership activated
3. **Failed**: Payment failed
4. **Refunded**: Payment refunded, membership deactivated
5. **Canceled**: User canceled checkout

## Security Notes

- Webhook signature verification prevents fake webhook calls
- User ownership verification prevents unauthorized access
- Checkout sessions are one-time use
- Payment records are immutable (status updates only)

## Troubleshooting

**Webhook not receiving events**:
- Check webhook URL is accessible (use ngrok for local testing)
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check server logs for signature verification errors

**Payment not activating membership**:
- Check webhook is configured correctly
- Verify payment record exists in database
- Check `userMembershipId` is valid

**"Invalid session" errors**:
- Ensure session ID matches Stripe checkout session
- Check session hasn't expired (usually 24 hours)



