"use client";

import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4">
          Verify your email
        </h2>

        <p className="text-gray-700 mb-4">
          We’ve sent a verification link to your email address.
        </p>

        <p className="text-sm text-gray-600 mb-6">
          Please check your inbox (and spam folder) and click the link to
          activate your account before logging in.
        </p>

        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Go to Login
          </Link>

          <p className="text-xs text-gray-500">
            Didn’t receive the email? Please reach out to the support team.
          </p>
        </div>
      </div>
    </div>
  );
}
