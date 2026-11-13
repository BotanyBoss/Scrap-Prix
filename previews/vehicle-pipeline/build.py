"""Bundle the isolated workshop for offline review, optionally install into Art Forge."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
def build():
    scripts=[]
    for n in [2,7,8,9]:
        text=next((ROOT/'src').glob(f'{n:02}-*.js')).read_text(encoding='utf8')
        # This workspace loads modular geometry only; bypass the unrelated Fossil PNG loader.
        if n==9:text='(function(Image){'+text+'})(undefined);'
        scripts.append(text)
    scripts.extend((HERE/f).read_text(encoding='utf8') for f in ['assembly.js','render.js','viewer.js'])
    html=(HERE/'viewer.html').read_text(encoding='utf8').replace('<!-- modules -->','\n'.join('<script>'+s+'</script>' for s in scripts))
    out=ROOT/'dist'/'VEHICLE-PIPELINE.html'
    out.parent.mkdir(exist_ok=True)
    out.write_bytes(html.encode())
    return out
def install(root,out):
    files={p:p.read_text(encoding='utf8') for p in [root/'src/main.tsx',root/'src/model.ts']}
    for p,s in files.items():
        if '"vehicle-pipeline"' in s:continue
        replacements=([
            ('  { id: "race-director",','  { id: "vehicle-pipeline",title:"Vehicle Pipeline",Icon:SlidersHorizontal },\n  { id: "race-director",'),
            (') : page === "race-director" ?',') : page === "vehicle-pipeline" ? (<iframe title="Vehicle pipeline" sandbox="allow-scripts allow-downloads" src="./race-director/vehicle-pipeline.html" style={{width:"100%",height:"80vh",border:0}} />) : page === "race-director" ?')
        ] if p.suffix=='.tsx' else [('"race-director";','"race-director" | "vehicle-pipeline";'),('"race-director"];','"race-director","vehicle-pipeline"];')])
        for a,b in replacements:
            if s.count(a)!=1:raise ValueError(f'Unrecognized Race Director integration in {p}')
            s=s.replace(a,b)
        files[p]=s
    for p,s in files.items():
        old=p.read_bytes()
        if old.decode().replace('\r\n','\n')!=s:
            p.write_bytes((s.replace('\n','\r\n') if b'\r\n' in old else s).encode())
    (root/'public/race-director/vehicle-pipeline.html').write_bytes(out.read_bytes())
if __name__=='__main__':
    out=build()
    if len(sys.argv)>1:install(Path(sys.argv[1]),out)
    print(out)
