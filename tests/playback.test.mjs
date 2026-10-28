import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
async function loadPureModule(path) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
    return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
const { playbackPosition } = await loadPureModule('../lib/playback.ts');
const { extractVideoId } = await loadPureModule('../lib/videos.ts');
const now = Date.parse('2026-10-28T12:00:00Z');
const room = { is_playing: true, playback_seconds: 20, playback_updated_at: new Date(now - 15000).toISOString() };
test('late joiners seek to persisted position plus elapsed server time', () => {
    assert.equal(playbackPosition(room, now), 35);
});
test('paused room never advances its playback clock', () => {
    assert.equal(playbackPosition({ ...room, is_playing: false }, now + 60000), 20);
});
test('clock skew never causes a negative elapsed position', () => {
    assert.equal(playbackPosition(room, now - 30000), 20);
});
test('a new track starts at zero rather than inheriting previous timing', () => {
    assert.equal(playbackPosition({ ...room, playback_seconds: 0, playback_updated_at: new Date(now).toISOString() }, now), 0);
});
test('video parser supports standard, shortened, Shorts and live URLs', () => {
    for (const url of ['https://youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ?t=30', 'https://www.youtube.com/shorts/dQw4w9WgXcQ', 'https://youtube.com/live/dQw4w9WgXcQ', 'https://music.youtube.com/watch?v=dQw4w9WgXcQ']) assert.equal(extractVideoId(url), 'dQw4w9WgXcQ');
});
test('rejects deceptive domains, unsafe schemes and malformed IDs', () => {
    for (const url of ['https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ', 'https://evil.test/youtu.be/dQw4w9WgXcQ', 'javascript:alert(1)', 'ftp://youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtube.com/watch?v=short', 'garbage']) assert.equal(extractVideoId(url), null);
});
const { clampSeek, formatPlaybackTime } = await loadPureModule('../lib/playback.ts');
test('timeline seeks stay inside the video and reject nonfinite values', () => {
    assert.equal(clampSeek(999, 120), 119.8);
    assert.equal(clampSeek(-4, 120), 0);
    assert.equal(clampSeek(30, 120), 30);
    assert.equal(clampSeek(Infinity, 120), 0);
    assert.equal(clampSeek(30, NaN), 0);
    assert.equal(clampSeek(30, 0), 0);
    assert.equal(clampSeek(1, 0.1), 0);
});
test('timeline labels support short videos, hours, and unknown times', () => {
    assert.equal(formatPlaybackTime(0), '0:00');
    assert.equal(formatPlaybackTime(65.9), '1:05');
    assert.equal(formatPlaybackTime(3665), '1:01:05');
    assert.equal(formatPlaybackTime(NaN), '0:00');
});
