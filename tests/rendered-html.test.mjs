import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root=new URL("../",import.meta.url);

test("ships the installable Professor Conte application",async()=>{
  const [html,script,manifest,worker]=await Promise.all([
    readFile(new URL("public/index.html",root),"utf8"),
    readFile(new URL("public/app.js",root),"utf8"),
    readFile(new URL("public/manifest.webmanifest",root),"utf8").then(JSON.parse),
    readFile(new URL("public/service-worker.js",root),"utf8"),
  ]);
  assert.match(html,/Prof\. Conte's Course Assistant/);
  assert.match(html,/Send inside the app/);
  assert.match(html,/Message Prof\. Conte/);
  assert.doesNotMatch(html,/name="sendWhatsApp"/);
  assert.doesNotMatch(script,/window\.open\('about:blank'/);
  assert.match(script,/In-app messaging active/);
  assert.match(html,/manifest\.webmanifest/);
  assert.equal(manifest.display,"standalone");
  assert.ok(manifest.icons.some(icon=>icon.sizes==="512x512"));
  assert.match(worker,/conte-assistant-v3/);
});

test("cloud API preserves persistence and approval controls",async()=>{
  const api=await readFile(new URL("app/api/[[...path]]/route.ts",root),"utf8");
  assert.match(api,/CREATE TABLE IF NOT EXISTS questions/);
  assert.match(api,/Professor login required/);
  assert.match(api,/answer_published_whatsapp/);
  assert.match(api,/Invalid OpenWA webhook signature/);
});
