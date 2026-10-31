#!/usr/bin/env python3
"""Adds a spoken recording to every seeded consultation that doesn't have one yet.

Each transcript line ("Doctor: ..." / "Patient: ...") is spoken with a different voice,
the lines are joined with short pauses, compressed to AAC (.m4a), uploaded to Convex
storage and linked to the consultation, so it plays in the doctor's consultation page.

macOS only (uses the built-in `say` and `afconvert`). Run from anywhere, after seeding:
    npx convex run seed:seedDemoData
    python3 scripts/seed_audio.py
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
import wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCTOR_VOICES = ["Reed (English (US))", "Daniel", "Fred"]
FEMALE_VOICES = ["Samantha", "Karen", "Moira", "Tessa", "Shelley (English (US))", "Flo (English (US))"]
MALE_VOICES = ["Rishi", "Ralph", "Eddy (English (US))", "Fred", "Daniel"]
OTHER_VOICES = ["Sandy (English (US))", "Samantha"]
SAMPLE_RATE = 22050
PAUSE_SECONDS = 0.45
LINE = re.compile(r"^(Doctor|Patient):\s*(.+)$")


def convex(fn, args=None):
    out = subprocess.run(
        ["npx", "convex", "run", fn, json.dumps(args or {})],
        cwd=ROOT, capture_output=True, text=True,
    )
    if out.returncode != 0:
        sys.exit(f"`npx convex run {fn}` failed:\n{out.stderr.strip()}")
    # `convex run` prints server log lines before the JSON result
    body = "\n".join(l for l in out.stdout.splitlines() if not l.startswith("[CONVEX"))
    return json.loads(body)


def installed_voices():
    out = subprocess.run(["say", "-v", "?"], capture_output=True, text=True).stdout
    return {m.group(1).strip() for m in re.finditer(r"^(.+?)\s{2,}[a-z]{2}_[A-Z]{2}", out, re.M)}


def first_available(candidates, available, offset=0):
    usable = [v for v in candidates if v in available]
    if not usable:
        return None
    return usable[offset % len(usable)]


def synthesize(text, voice, path):
    subprocess.run(
        ["say", "-v", voice, "-o", path, "--file-format=WAVE", f"--data-format=LEI16@{SAMPLE_RATE}", text],
        check=True,
    )
    with wave.open(path, "rb") as w:
        assert w.getnchannels() == 1 and w.getsampwidth() == 2 and w.getframerate() == SAMPLE_RATE
        return w.readframes(w.getnframes())


def build_recording(item, voices, workdir):
    pcm = bytearray()
    silence = b"\x00\x00" * int(SAMPLE_RATE * PAUSE_SECONDS)
    for i, raw in enumerate(item["transcription"].splitlines()):
        m = LINE.match(raw.strip())
        if not m:
            continue
        speaker, text = m.groups()
        pcm += synthesize(text, voices[speaker], os.path.join(workdir, f"line{i}.wav"))
        pcm += silence
    wav_path = os.path.join(workdir, "visit.wav")
    with wave.open(wav_path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(bytes(pcm))
    m4a_path = os.path.join(workdir, "visit.m4a")
    subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "64000", wav_path, m4a_path], check=True)
    duration = len(pcm) / 2 / SAMPLE_RATE
    return m4a_path, duration


def upload(path):
    url = convex("seed:generateUploadUrl")
    with open(path, "rb") as f:
        req = urllib.request.Request(url, data=f.read(), method="POST", headers={"Content-Type": "audio/mp4"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())["storageId"]


def main():
    if not (shutil.which("say") and shutil.which("afconvert")):
        sys.exit("This script needs macOS (`say` and `afconvert`).")
    available = installed_voices()
    doctor_voice = first_available(DOCTOR_VOICES, available)
    if not doctor_voice:
        sys.exit("No suitable English voice found. Install one in System Settings > Accessibility > Spoken Content.")

    items = convex("seed:consultationsNeedingAudio")
    if not items:
        print("Every seeded consultation already has a recording. Nothing to do.")
        return
    print(f"Creating recordings for {len(items)} consultations (doctor voice: {doctor_voice})")

    for n, item in enumerate(items, 1):
        gender = (item.get("patientGender") or "").lower()
        pool = FEMALE_VOICES if gender == "female" else MALE_VOICES if gender == "male" else OTHER_VOICES
        patient_voice = first_available(pool, available, offset=sum(map(ord, item["patientName"]))) or doctor_voice
        if patient_voice == doctor_voice:
            patient_voice = first_available(pool + OTHER_VOICES, available, offset=1) or doctor_voice
        with tempfile.TemporaryDirectory() as workdir:
            path, duration = build_recording(item, {"Doctor": doctor_voice, "Patient": patient_voice}, workdir)
            size = os.path.getsize(path)
            storage_id = upload(path)
        convex("seed:attachAudio", {
            "consultationId": item["consultationId"],
            "storageId": storage_id,
            "fileName": f"{item['patientName'].lower().replace(' ', '-')}-{item['consultationId'][-6:]}.m4a",
            "fileType": "audio/mp4",
            "fileSize": size,
            "duration": round(duration, 1),
        })
        print(f"  [{n}/{len(items)}] {item['patientName']}: {duration:.0f}s, {size // 1024} KB ({patient_voice})")
    print("Done. Open a consultation from the doctor dashboard to listen.")


if __name__ == "__main__":
    main()
