import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Verifying...</div>}>
      <VerifyEmailClient />
    </Suspense>
  );
}
