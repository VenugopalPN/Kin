// Turns the timed screencast frames into a constant-rate 1920x1080 video,
// lays the voice-over under it, adds soft English subtitles, and saves review
// stills. Output: output/kin-demo.mp4, output/kin-demo.srt, output/review/*.png
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpeg from 'ffmpeg-static';
import { SCENES, VIDEO } from './scenes.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORK = join(ROOT, 'work');
const OUT = join(ROOT, 'output');
const VIDEO_FILE = join(OUT, 'kin-demo.mp4');
const fwd = (p) => p.replace(/\\/g, '/');

for (const [file, hint] of [
  [join(WORK, 'frames.json'), 'node scripts/record.mjs'],
  [join(WORK, 'narration.wav'), 'node scripts/narrate.mjs'],
  [join(OUT, 'kin-demo.srt'), 'node scripts/narrate.mjs'],
]) {
  if (!existsSync(file)) throw new Error(`Missing ${file}; run ${hint} first.`);
}

function run(args) {
  const res = spawnSync(ffmpeg, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (res.status !== 0) throw new Error(`ffmpeg failed:\n${res.stderr.slice(-3000)}`);
  return res.stderr;
}

const frames = JSON.parse(readFileSync(join(WORK, 'frames.json'), 'utf8')).filter((f) => f.t < VIDEO.duration);
if (!frames.length) throw new Error('No frames were captured.');

const lines = ['ffconcat version 1.0'];
frames.forEach((frame, i) => {
  const start = i === 0 ? 0 : frame.t;
  const next = i + 1 < frames.length ? frames[i + 1].t : VIDEO.duration;
  lines.push(`file '${fwd(join(WORK, 'frames', frame.file))}'`, `duration ${Math.max(0.001, next - start).toFixed(4)}`);
});
lines.push(`file '${fwd(join(WORK, 'frames', frames.at(-1).file))}'`);
writeFileSync(join(WORK, 'frames.ffconcat'), `${lines.join('\n')}\n`);

mkdirSync(OUT, { recursive: true });
console.log(`Encoding ${frames.length} frames into ${VIDEO.duration}s at ${VIDEO.fps} fps ...`);
run([
  '-y',
  '-f', 'concat', '-safe', '0', '-i', join(WORK, 'frames.ffconcat'),
  '-i', join(WORK, 'narration.wav'),
  '-i', join(OUT, 'kin-demo.srt'),
  '-map', '0:v', '-map', '1:a', '-map', '2:s',
  '-vf', `scale=${VIDEO.width}:${VIDEO.height}:flags=lanczos,fps=${VIDEO.fps},format=yuv420p`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
  '-c:a', 'aac', '-b:a', '160k',
  '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng',
  '-t', String(VIDEO.duration),
  '-movflags', '+faststart',
  VIDEO_FILE,
]);

const info = run(['-hide_banner', '-i', VIDEO_FILE, '-f', 'null', '-']);
const duration = info.match(/Duration: ([\d:.]+)/)?.[1];
const size = info.match(/Stream #0:0.*?(\d{3,5}x\d{3,5})/)?.[1];
console.log(`Wrote ${VIDEO_FILE}\n  duration ${duration}, video ${size}`);

const review = join(OUT, 'review');
rmSync(review, { recursive: true, force: true });
mkdirSync(review, { recursive: true });
for (const scene of SCENES) {
  for (const [label, t] of [['a', scene.start + 1.2], ['b', (scene.start + scene.end) / 2 + 0.5], ['c', scene.end - 0.6]]) {
    run(['-y', '-ss', t.toFixed(2), '-i', VIDEO_FILE, '-frames:v', '1', join(review, `${scene.id}-${label}.png`)]);
  }
}
console.log(`Review stills in ${review}`);
