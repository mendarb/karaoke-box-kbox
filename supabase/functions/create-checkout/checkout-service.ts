import { Stripe } from 'https://esm.sh/stripe@12.0.0?target=deno';
import { CheckoutData } from './types.ts';
import { createLineItem, createMetadata } from './stripe-config.ts';

export const createCheckoutSession = async (
  stripe: Stripe,
  data: CheckoutData,
  origin: string
): Promise<Stripe.Checkout.Session> => {
  console.log('Creating checkout session with data:', {
    originalPrice: data.price,
    finalPrice: data.finalPrice,
    promoCodeId: data.promoCodeId,
    promoCode: data.promoCode
  });

  const metadata = createMetadata(data);
  const isFreeBooking = data.finalPrice === 0;

  console.log('Creating session config with mode:', isFreeBooking ? 'setup' : 'payment');

  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    mode: isFreeBooking ? 'setup' : 'payment',
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}`,
    customer_email: data.userEmail,
    metadata,
    locale: 'fr',
    payment_intent_data: {
      metadata,
    },
    allow_promotion_codes: false,
  };

  if (isFreeBooking) {
    console.log('Configuring free booking session');
    sessionConfig.submit_type = 'auto';
  } else {
    console.log('Configuring paid booking session');
    sessionConfig.payment_method_types = ['card'];
    const lineItem = createLineItem(data);
    if (lineItem) {
      sessionConfig.line_items = [lineItem];
    }
  }

  console.log('Final session config:', {
    mode: sessionConfig.mode,
    lineItems: sessionConfig.line_items,
    finalPrice: data.finalPrice,
    isFreeBooking
  });

  return await stripe.checkout.sessions.create(sessionConfig);
};