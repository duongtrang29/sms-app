import { seedDemoData } from "./demo-seed";

seedDemoData().catch((error) => {
  console.error(error);
  process.exit(1);
});
