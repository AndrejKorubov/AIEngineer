import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { batchCreated } from "@/inngest/batch";
import { jobRun } from "@/inngest/job";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [batchCreated, jobRun],
});
