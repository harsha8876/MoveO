import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, amount } = body;

    if (!name || !email || !amount) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const parsedAmount = Number.parseInt(String(amount), 10);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return Response.json({ error: "Invalid amount" }, { status: 400 });
    }

    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    const customer =
      existingCustomers.data[0] ??
      (await stripe.customers.create({
        name,
        email,
      }));

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2026-03-25.dahlia" },
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: parsedAmount * 100,
      currency: "inr",
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true
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
    console.error("Stripe payment route error:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create Stripe payment sheet.",
      },
      { status: 500 },
    );
  }
}
