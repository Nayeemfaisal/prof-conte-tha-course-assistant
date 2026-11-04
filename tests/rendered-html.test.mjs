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
  assert.match(html,/Professor-controlled course communication/);
  assert.match(html,/theme-color" content="#ff0350"/);
  assert.match(html,/Write to Prof\. Dr\. Conte/);
  assert.doesNotMatch(html,/name="sendWhatsApp"/);
  assert.doesNotMatch(script,/window\.open\('about:blank'/);
  assert.match(script,/Meta WhatsApp Cloud API connected/);
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
  assert.match(api,/Invalid Meta webhook signature/);
  assert.match(api,/\/api\/webhooks\/meta/);
  assert.match(api,/professor_reply_emailed/);
});
