// Builds the voice-over with the offline Windows speech engine (System.Speech),
// one WAV per sentence, then lays the sentences onto the 39-second timeline.
// Outputs: work/narration.wav, work/cues.json, output/kin-demo.srt,
// narration/scene-timings.md. No network, no paid service.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENES, VIDEO } from './scenes.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORK = join(ROOT, 'work');
const VOICE_DIR = join(WORK, 'voice');
const OUT = join(ROOT, 'output');
const VOICE = process.env.VOICE || 'Microsoft Zira Desktop';
const BASE_RATE = Number(process.env.VOICE_RATE ?? 1);
const SAMPLE_RATE = 44100;
const LEAD_IN = 0.35;
const SENTENCE_GAP = 0.2;
const TAIL = 0.3;

mkdirSync(VOICE_DIR, { recursive: true });
mkdirSync(OUT, { recursive: true });

function parseScript(text) {
  const scenes = new Map();
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('## ')) {
      current = line.slice(3).trim();
      scenes.set(current, []);
    } else if (line && current && !line.startsWith('#')) {
      const m = line.match(/^\{(.+)\|(.+)\}$/);
      scenes.get(current).push(m ? { shown: m[1], spoken: m[2] } : { shown: line, spoken: line });
    }
  }
  return scenes;
}

function synthesize(jobs) {
  const ps1 = join(WORK, 'speak.ps1');
  const list = join(WORK, 'speak.json');
  writeFileSync(list, JSON.stringify(jobs));
  writeFileSync(
    ps1,
    `Add-Type -AssemblyName System.Speech
$jobs = Get-Content -Raw -LiteralPath '${list}' | ConvertFrom-Json
$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(${SAMPLE_RATE}, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
foreach ($job in $jobs) {
  $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $s.SelectVoice('${VOICE}')
  $s.Rate = [int]$job.rate
  $s.SetOutputToWaveFile($job.file, $fmt)
  $s.Speak([string]$job.text)
  $s.Dispose()
}
`,
  );
  const res = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Windows speech failed (voice "${VOICE}"): ${res.stderr || res.stdout}`);
  }
}

function readWav(file) {
  const buf = readFileSync(file);
  let offset = 12;
  let fmt = null;
  while (offset < buf.length - 8) {
    const id = buf.toString('ascii', offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === 'fmt ') {
      fmt = { channels: buf.readUInt16LE(offset + 10), rate: buf.readUInt32LE(offset + 12), bits: buf.readUInt16LE(offset + 22) };
    } else if (id === 'data') {
      if (!fmt || fmt.channels !== 1 || fmt.rate !== SAMPLE_RATE || fmt.bits !== 16) {
        throw new Error(`${file}: expected ${SAMPLE_RATE} Hz 16-bit mono`);
      }
      const pcm = buf.subarray(offset + 8, offset + 8 + size);
      return { pcm, seconds: pcm.length / 2 / SAMPLE_RATE };
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error(`${file}: no data chunk`);
}

function writeWav(file, pcm) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  writeFileSync(file, Buffer.concat([header, pcm]));
}

const srtTime = (s) => {
  const ms = Math.round(s * 1000);
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

function main() {
  const script = parseScript(readFileSync(join(ROOT, 'narration', 'script.md'), 'utf8'));
  for (const scene of SCENES) {
    if (!script.get(scene.id)?.length) throw new Error(`narration/script.md has no lines for scene "${scene.id}"`);
  }

  const cues = [];
  for (const scene of SCENES) {
    const lines = script.get(scene.id);
    const window = scene.end - scene.start - LEAD_IN - TAIL;
    let placed = null;
    for (let rate = BASE_RATE; rate <= BASE_RATE + 4 && !placed; rate += 1) {
      const jobs = lines.map((line, i) => ({ text: line.spoken, rate, file: join(VOICE_DIR, `${scene.id}-${i + 1}.wav`) }));
      synthesize(jobs);
      const clips = jobs.map((job) => readWav(job.file));
      const total = clips.reduce((sum, c) => sum + c.seconds, 0) + SENTENCE_GAP * (clips.length - 1);
      console.log(`${scene.id}: ${total.toFixed(2)}s of speech at rate ${rate} (window ${window.toFixed(2)}s)`);
      if (total <= window) placed = { clips, rate };
    }
    if (!placed) throw new Error(`Narration for "${scene.id}" does not fit ${scene.start}-${scene.end}s; shorten the lines.`);
    let t = scene.start + LEAD_IN;
    placed.clips.forEach((clip, i) => {
      cues.push({ scene: scene.id, start: t, end: t + clip.seconds, shown: lines[i].shown, spoken: lines[i].spoken, pcm: clip.pcm, rate: placed.rate });
      t += clip.seconds + SENTENCE_GAP;
    });
  }

  const mix = Buffer.alloc(Math.round(VIDEO.duration * SAMPLE_RATE) * 2);
  for (const cue of cues) cue.pcm.copy(mix, Math.round(cue.start * SAMPLE_RATE) * 2);
  writeWav(join(WORK, 'narration.wav'), mix);

  const plain = cues.map(({ pcm, ...rest }) => rest);
  writeFileSync(join(WORK, 'cues.json'), JSON.stringify(plain, null, 2));
  writeFileSync(
    join(OUT, 'kin-demo.srt'),
    plain.map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.shown}\n`).join('\n'),
  );

  const rows = SCENES.map((scene) => {
    const lines = plain.filter((c) => c.scene === scene.id);
    const said = lines.map((c) => `${c.start.toFixed(2)}–${c.end.toFixed(2)}s ${c.spoken}`).join('<br>');
    return `| \`${scene.id}\` | ${scene.start}–${scene.end}s | ${said} |`;
  });
  writeFileSync(
    join(ROOT, 'narration', 'scene-timings.md'),
    `# Scene timings\n\nGenerated by \`scripts/narrate.mjs\` (voice: ${VOICE}). Do not edit by hand.\n\n| Scene | Window | Narration |\n| --- | --- | --- |\n${rows.join('\n')}\n`,
  );
  console.log(`Wrote work/narration.wav (${VIDEO.duration}s), ${plain.length} subtitle cues.`);
}

main();
