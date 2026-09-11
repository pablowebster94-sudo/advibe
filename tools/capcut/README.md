# CapCut timeline tooling

Read-only helpers for inspecting a CapCut (macOS) draft timeline without
opening the app.

The timeline of a project lives in:

```
<CapCut>/User Data/Projects/com.lveditor.draft/<project>/Timelines/<main_timeline_id>/draft_info.json
```

`main_timeline_id` is declared in `<project>/Timelines/project.json`.

## dump_timeline.py

```bash
python3 tools/capcut/dump_timeline.py "<.../Timelines/<UUID>>"       # analysis only
python3 tools/capcut/dump_timeline.py "<.../Timelines/<UUID>>" bk    # backup first, then analysis
```

Prints project settings, tracks, a clip-by-clip table of the main video track
(start, duration, in-point, speed, transition, source file), audio and text
segments, pacing statistics, repeated source files and any gaps/overlaps.

With `bk` it first copies the whole project folder to
`~/Desktop/BACKUP_<project>_<timestamp>` (JSON structure only when the project
exceeds 600 MB) plus a standalone copy of `draft_info.json`. It never writes
inside the project folder.

## Cross-reference with the source footage folder

```bash
python3 tools/capcut/dump_timeline.py "<.../Timelines/<UUID>>" ~/Desktop/boda bk
```

A second positional argument pointing at the raw footage folder adds an
inventory of which source files the edit uses, which are still unused, and
which the timeline references but are missing from that folder. Pass `-` to
skip it. `bk` stays optional and can go in either position.
