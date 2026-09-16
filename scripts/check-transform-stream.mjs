// Regression for nodejs/node#62036, fixed by nodejs/node#62040.
import { TransformStream } from "node:stream/web";
import { setTimeout } from "node:timers/promises";
let internalErrors = 0;
for (let i = 0; i < 10; i++) {
  const stream = new TransformStream({ transform(chunk, controller) { controller.enqueue(chunk); } });
  await setTimeout(50);
  const reader = stream.readable.getReader();
  const writer = stream.writable.getWriter();
  const results = await Promise.allSettled([
    reader.read(), reader.cancel(new Error("client disconnected")), writer.write("late-write"),
  ]);
  for (const result of results) {
    if (result.status === "rejected" && String(result.reason).includes("transformAlgorithm")) internalErrors++;
  }
}
console.log(JSON.stringify({ node: process.version, attempts: 10, internalErrors }));
if (internalErrors) process.exitCode = 1;
