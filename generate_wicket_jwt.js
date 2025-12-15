// filename: fetch_wicket_data.js
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

// --- CONFIG ---
const SECRET_KEY = "2ee58aba6bafcef568d7b58d357477a0d4bfbd143668539be5d646c628957";
const ADMIN_UUID = "517ea00d-lc47-4d5a-b5f2-b8b2d9ff4b39";
const API_URL = "https://cchl-api.wicketcloud.com"; // API endpoint

// --- JWT GENERATION ---
function generateJWT() {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: ADMIN_UUID,
    aud: API_URL,
    iat: now,
    exp: now + 3600, // token valid for 1 hour
    iss: API_URL // recommended to match API domain
  };
  return jwt.sign(payload, SECRET_KEY, { algorithm: "HS256" });
}

// --- FETCH FUNCTION ---
async function fetchWicket(endpoint) {
  const token = generateJWT();

  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} - ${text}`);
  }

  return res.json();
}

// --- MAIN ---
async function main() {
  try {

    console.log("\nFetching People...");
    const people = await fetchWicket("/people/");
    console.log("People:", people);


  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
