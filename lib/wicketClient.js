// lib/wicketClient.js
export async function wicketFetch(endpoint, options = {}) {
  const url = `${process.env.NEXT_PUBLIC_WICKET_API_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.WICKET_JWT_SECRET}`,
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Wicket API Error: ${err}`);
  }
  return res.json();
}
