import { DEMO_BATCH, resetDemoData } from "./demo-utils";

async function main() {
  const result = await resetDemoData();

  console.info(
    `Reset demo batch "${DEMO_BATCH}" completed. Deleted ${result.deletedProfileCount} demo profiles and ${result.deletedCourseCount} demo courses.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
