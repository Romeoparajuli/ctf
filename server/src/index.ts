import { createApp } from "./app.js";
import { runMigrations } from "./db/connection.js";
import { env } from "./config/env.js";

runMigrations();

const app = createApp();

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Nepal CTF API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});
