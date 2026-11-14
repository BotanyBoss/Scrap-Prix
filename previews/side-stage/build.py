"""Bundle the shared side-stage playground and install its existing Art Forge route."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]

def build():
    sources=[]
    for number in [2,7,8,9]:
        text=next((ROOT/'src').glob(f'{number:02}-*.js')).read_text(encoding='utf8')
        if number==9:
            text='(function(Image){'+text+'})(undefined);'
        sources.append(text)
    sources.extend((ROOT/p).read_text(encoding='utf8') for p in [
        'previews/vehicle-pipeline/assembly.js','src/35-side-stage.js','previews/side-stage/viewer.js'])
    html=(HERE/'viewer.html').read_text(encoding='utf8').replace('<!-- modules -->',
        '\n'.join('<script>'+text+'</script>' for text in sources))
    out=ROOT/'dist/SIDE-STAGE.html'
    out.parent.mkdir(exist_ok=True)
    out.write_bytes(html.encode())
    return out

def install(root,out):
    # Validate every anchor before writing either navigation file.
    updates={}
    for name in ['main.tsx','model.ts']:
        path=root/'src'/name
        raw=path.read_bytes()
        text=raw.decode().replace('\r\n','\n')
        if '"side-stage"' in text:
            continue
        replacements=([
            ('  { id: "vehicle-pipeline",','  { id: "side-stage",title:"Scrap Prix Side Stage",Icon:SlidersHorizontal },\n  { id: "vehicle-pipeline",'),
            (') : page === "vehicle-pipeline" ?',') : page === "side-stage" ? (<iframe title="Scrap Prix Side Stage" sandbox="allow-scripts allow-downloads" src="./race-director/side-stage.html" style={{width:"100%",height:"84vh",border:0}} />) : page === "vehicle-pipeline" ?')
        ] if name=='main.tsx' else [
            ('"vehicle-pipeline";','"vehicle-pipeline" | "side-stage";'),
            ('"vehicle-pipeline"];','"vehicle-pipeline","side-stage"];')])
        for old,new in replacements:
            if text.count(old)!=1:
                raise ValueError('Unrecognised Art Forge navigation in '+str(path))
            text=text.replace(old,new)
        updates[path]=(text.replace('\n','\r\n') if b'\r\n' in raw else text).encode()
    target=root/'public/race-director/side-stage.html'
    target.parent.mkdir(parents=True,exist_ok=True)
    for path,data in updates.items():
        path.write_bytes(data)
    target.write_bytes(out.read_bytes())

if __name__=='__main__':
    out=build()
    if len(sys.argv)>1:
        install(Path(sys.argv[1]),out)
    print(out)
