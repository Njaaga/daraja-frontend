

import AuthGuard from "@/app/components/AuthGuard";
import ApiSourceForm from "@/app/components/ApiSourceForm";
import Layout from "@/app/components/Layout";

export default function Page() {
  return (
    <Layout>
    <div className="p-10">
      <ApiSourceForm />
    </div>
    </Layout>
  );
}
