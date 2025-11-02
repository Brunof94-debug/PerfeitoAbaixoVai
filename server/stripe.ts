import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Price IDs for subscription tiers (create these in Stripe Dashboard)
export const PRICE_IDS = {
  basic: null, // Free tier, no price ID needed
  pro: process.env.STRIPE_PRO_PRICE_ID || "price_pro_placeholder",
  expert: process.env.STRIPE_EXPERT_PRICE_ID || "price_expert_placeholder",
};

// Create checkout session for subscription
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  tier: "pro" | "expert",
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const priceId = PRICE_IDS[tier];
  
  if (!priceId) {
    throw new Error(`No price ID configured for tier: ${tier}`);
  }

  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    client_reference_id: userId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      tier,
    },
    subscription_data: {
      metadata: {
        userId,
        tier,
      },
    },
    customer_creation: 'always', // Always create customer
  });

  return session;
}

// Create billing portal session for existing customers
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

// Get customer by user ID (from metadata)
export async function getCustomerByUserId(userId: string): Promise<Stripe.Customer | null> {
  const customers = await stripe.customers.search({
    query: `metadata['userId']:'${userId}'`,
  });

  return customers.data[0] || null;
}
