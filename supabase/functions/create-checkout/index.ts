import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      price, 
      groupSize, 
      duration, 
      date, 
      timeSlot, 
      message, 
      userEmail, 
      userName, 
      userPhone,
      isTestMode,
      userId,
      promoCode
    } = await req.json()

    console.log('Creating checkout session with params:', {
      price,
      groupSize,
      duration,
      date,
      timeSlot,
      userEmail,
      isTestMode,
      userId,
      promoCode
    });

    const stripeSecretKey = isTestMode 
      ? Deno.env.get('STRIPE_TEST_SECRET_KEY')
      : Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      console.error('Missing Stripe secret key for mode:', isTestMode ? 'test' : 'live');
      throw new Error(isTestMode ? 'Test mode API key not configured' : 'Live mode API key not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    console.log('Creating Stripe session in', isTestMode ? 'TEST' : 'LIVE', 'mode');

    // Apply promo code if valid
    let finalPrice = price;
    if (promoCode === 'TEST2024') {
      console.log('Valid promo code TEST2024 applied, setting price to 0');
      finalPrice = 0;
    }

    console.log('Final price after promo code check:', finalPrice);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${isTestMode ? '[TEST] ' : ''}Réservation - ${date} ${timeSlot}`,
              description: `${groupSize} personnes - ${duration}h${promoCode === 'TEST2024' ? ' (Code promo TEST2024 appliqué)' : ''}`,
            },
            unit_amount: finalPrice * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}`,
      customer_email: userEmail,
      metadata: {
        date,
        timeSlot,
        duration,
        groupSize,
        message: message || '',
        userName,
        userPhone,
        isTestMode: String(isTestMode),
        userId,
        promoCode: promoCode === 'TEST2024' ? promoCode : undefined
      },
    })

    console.log('Checkout session created:', {
      sessionId: session.id,
      mode: isTestMode ? 'test' : 'live',
      email: userEmail,
      metadata: session.metadata,
      finalPrice
    });

    // Créer la réservation immédiatement si le code promo est appliqué
    if (promoCode === 'TEST2024') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('Missing Supabase credentials');
      }

      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

      const bookingData = {
        user_id: userId,
        date,
        time_slot: timeSlot,
        duration,
        group_size: groupSize,
        status: 'confirmed',
        price: finalPrice,
        message: message || null,
        user_email: userEmail,
        user_name: userName,
        user_phone: userPhone,
        payment_status: 'paid',
        is_test_booking: isTestMode
      };

      console.log('Creating booking with promo code:', bookingData);

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (bookingError) {
        console.error('Error creating booking:', bookingError);
        throw bookingError;
      }

      console.log('Booking created successfully:', booking);

      // Envoyer l'email de confirmation
      try {
        const { error: emailError } = await supabase.functions.invoke('send-booking-email', {
          body: { booking }
        });

        if (emailError) {
          console.error('Error sending confirmation email:', emailError);
        } else {
          console.log('Confirmation email sent successfully');
        }
      } catch (emailError) {
        console.error('Error invoking send-booking-email function:', emailError);
      }
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})