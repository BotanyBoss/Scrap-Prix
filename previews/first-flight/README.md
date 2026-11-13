# First Flight: Broken Bridge Jump
From the repository root run `python previews/first-flight/build.py` and open
`dist/FIRST-FLIGHT.html`. The standalone HTML works offline. Production build and
save entrypoints do not import this workspace.

To install or refresh the local Art Forge workspace run
`python previews/first-flight/art_forge.py "<Art Forge project folder>"`.
Start Art Forge with its normal Vite dev command and open `#/race-director`.
The integration uses the existing Studio navigation and a sandboxed local iframe.

The seed selector opens a fresh temporary garage. At 7.2 seconds playback waits
for a route. Restart offers the choice again; Replay at the end retains the
chosen result. Seeking never bypasses an unresolved choice. Skip uses the
existing safe resolution if no choice was submitted. The report is for the
bridge event, not cumulative damage over the race.

For browser acceptance run `node previews/first-flight/capture.cjs` from the
repository root after building. It uses an existing Playwright installation
(`PLAYWRIGHT_MODULE`, default playwright-core) and Chromium (`CHROME_PATH`).
Screenshots default to `dist/first-flight-proof/`; override with `CAPTURE_DIR`.
