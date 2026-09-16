import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import vision from '@google-cloud/vision';
import sharp from 'sharp';

test('Vision client and protobuf request encoding remain compatible', async () => {
  const client = new vision.ImageAnnotatorClient();
  try {
    assert.equal(typeof client.textDetection, 'function');
    const request = vision.protos.google.cloud.vision.v1.AnnotateImageRequest;
    const input = { image: { content: Buffer.from('image bytes') }, features: [{ type: 5 }] };
    const output = request.decode(request.encode(input).finish());
    assert.deepEqual(Buffer.from(output.image.content), input.image.content);
    assert.equal(output.features[0].type, 5);
  } finally {
    await client.close();
  }
});

test('Sharp supports the OCR preprocessing operations', async () => {
  const input = await sharp({ create: { width: 20, height: 10, channels: 3, background: '#fff' } }).png().toBuffer();
  const output = await sharp(input).resize(1000).grayscale().normalise().png().toBuffer();
  const metadata = await sharp(output).metadata();
  assert.equal(metadata.width, 1000);
  assert.equal(metadata.height, 500);
  assert.equal(metadata.format, 'png');
});

test('server rejects missing files and malformed uploads and remains responsive', { timeout: 20000 }, async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'mathsolver-test-'));
  await mkdir(path.join(directory, 'uploads'));
  const server = spawn(process.execPath, [fileURLToPath(new URL('../index.js', import.meta.url))], {
    cwd: directory,
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  server.stderr.on('data', chunk => { logs += chunk; });
  t.after(async () => {
    if (server.exitCode === null) {
      const exited = once(server, 'exit');
      server.kill();
      await exited;
    }
    await rm(directory, { recursive: true, force: true });
  });
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Server startup timed out: ${logs}`)), 10000);
    server.once('error', error => { clearTimeout(timer); reject(error); });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited ${code}: ${logs}`)); });
    let stdout = '';
    server.stdout.on('data', chunk => {
      stdout += chunk;
      const match = stdout.match(/Server is running on port (\d+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
  });
  const endpoint = `http://127.0.0.1:${port}/solve`;
  let response = await fetch(endpoint, { method: 'POST' });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).message, 'No file uploaded');

  const invalidFile = new FormData();
  invalidFile.append('image', new Blob(['not an image']), 'file.txt');
  response = await fetch(endpoint, { method: 'POST', body: invalidFile });
  assert.equal(response.status, 500);
  assert.match(await response.text(), /Only image files are allowed/);

  response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data; boundary=test' },
    body: '--test\r\nContent-Disposition: form-data; name="image"; filename="image.png"\r\nContent-Type: image/png\r\n\r\ntruncated',
  });
  assert.equal(response.status, 500);
  await response.text();

  const oversizedFile = new FormData();
  oversizedFile.append('image', new Blob([Buffer.alloc(5 * 1024 * 1024 + 1)]), 'large.png');
  response = await fetch(endpoint, { method: 'POST', body: oversizedFile });
  assert.equal(response.status, 500);
  assert.match(await response.text(), /File too large/);

  response = await fetch(endpoint, { method: 'POST' });
  assert.equal(response.status, 400);
  await response.text();
});
