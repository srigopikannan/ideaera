import { getCompanies } from "@/services/companies";
import { ProblemSubmitForm } from "@/components/problems/ProblemSubmitForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Submit a Problem — IdeaEra",
  description: "Contribute real-world engineering problems and challenges to the IdeaEra ecosystem.",
};

export default async function SubmitProblemPage() {
  const companies = await getCompanies();

  return <ProblemSubmitForm companies={companies} />;
}
