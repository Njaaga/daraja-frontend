"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { apiClient } from "@/lib/apiClient";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CardFormInner({ tenantSubdomain, onCardAdded }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleAddCard = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setError("Stripe not loaded yet.");
      setLoading(false);
      return;
    }

    try {
      const res = await apiClient("/api/subscription/create-setup-intent/", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const clientSecret = res.clientSecret;
      if (!clientSecret) throw new Error("Missing clientSecret from backend");

      const cardElement = elements.getElement(CardElement);
      const setupResult = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (setupResult.error) {
        setError(setupResult.error.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      cardElement.clear();
      onCardAdded?.(); // reload billing data
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to add card");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAddCard} className="space-y-4">
      <CardElement options={{ hidePostalCode: true }} />
      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-600">Card added successfully!</p>}
      <button
        type="submit"
        disabled={loading || !stripe}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add Card"}
      </button>
    </form>
  );
}

export default function AddCardForm({ tenantSubdomain, onCardAdded }) {
  return (
    <Elements stripe={stripePromise}>
      <CardFormInner tenantSubdomain={tenantSubdomain} onCardAdded={onCardAdded} />
    </Elements>
  );
}
