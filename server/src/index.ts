import { buildApp } from "./server";
import { env } from "./config/env";

buildApp().then(app => {
  app.listen(env.PORT, () => {
    console.log(`API listening on :${env.PORT}`);
  });
}).catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
