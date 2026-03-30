import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, amount } = body;

    if (!name || !email || !amount) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const parsedAmount = Number.parseInt(String(amount), 10);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return Response.json({ error: "Invalid amount" }, { status: 400 });
    }

    let customer;
    const doesCustomerExist = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (doesCustomerExist.data.length > 0) {
      customer = doesCustomerExist.data[0];
    } else {
      customer = await stripe.customers.create({
        name,
        email,
      });
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2024-06-20" },
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: parsedAmount * 100,
      currency: "inr",
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });

    return Response.json(
      {
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Stripe create payment error:", error);
    return Response.json(
      { error: "Unable to create Stripe payment sheet." },
      { status: 500 },
    );
  }
}
