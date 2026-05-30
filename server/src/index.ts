import { buildApp } from "./server.js";
import { env } from "./config/env.js";

buildApp().then(app => {
  app.listen(env.PORT, () => {
    console.log(`API listening on :${env.PORT}`);
  });
}).catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
