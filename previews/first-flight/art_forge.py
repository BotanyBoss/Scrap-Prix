"""Install/update the local Art Forge nav entry and its sandboxed viewer."""
import sys
from pathlib import Path
from build import build

def integrate(root):
    main, model = [root/'src'/p for p in ('main.tsx','model.ts')]
    edits = [
        (model, '"calibration" | "playmat";', '"calibration" | "playmat" | "race-director";'),
        (model, '"calibration","playmat"];', '"calibration","playmat","race-director"];'),
        (main, '  { id: "playmat",', '  { id: "race-director",title:"Scrap Prix → Race Director",Icon:SlidersHorizontal },\n  { id: "playmat",'),
        (main, ') : page === "playmat" ?', ') : page === "race-director" ? (<iframe title="Scrap Prix Race Director" sandbox="allow-scripts" src="./race-director/first-flight.html" style={{width:"100%",height:"79vh",border:0}} />) : page === "playmat" ?'),
    ]
    original = {p:p.read_bytes() for p in (main,model)}
    new = {p:b.decode('utf8') for p,b in original.items()}
    # Vite dev transforms React imports in source order. The old studio placed
    # lazy() initializers above this import, which produces a blank dev page.
    react = 'import { lazy, Suspense, useEffect, useState } from "react";'
    if react in new[main] and new[main].index(react)>new[main].index('const PlaymatLab'):
        new[main]=react+'\n'+new[main].replace(react,'',1)
    for p,a,b in edits:
        b=b.replace('\n','\r\n') if '\r\n' in new[p] else b
        if b in new[p]: continue
        if new[p].count(a)!=1: raise SystemExit(f'Unrecognized Art Forge navigation: {p}')
        new[p]=new[p].replace(a,b)
    html=build().read_bytes()
    target=root/'public'/'race-director'/'first-flight.html'
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_bytes(html)
    for p,s in new.items():
        if s.encode()!=original[p]:p.write_bytes(s.encode())
if __name__=='__main__':integrate(Path(sys.argv[1]).resolve())
