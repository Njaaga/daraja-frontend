"use client";

export default function PaymentMethodsList({ methods }) {
  if (!Array.isArray(methods)) return null;

  return (
    <ul className="space-y-2">
      {methods.map((pm) => (
        <li key={pm.id}>
          {pm.brand} **** {pm.last4} Exp: {pm.exp_month}/{pm.exp_year}
          {pm.is_default && <span className="ml-2 text-green-600">Default</span>}
        </li>
      ))}
    </ul>
  );
}
