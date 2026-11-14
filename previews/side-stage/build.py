"""Bundle the shared side-stage playground and install its existing Art Forge route."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]

def build():
    # The engine and timeline are embedded only in this isolated preview. The
    # production game is untouched; all review facts come from a seeded run.
    modules=[
        'src/02-catalogue.js','src/03-engine.js','src/04-cosmetic-surprises.js',
        'src/05-presentation.js','src/07-raster.js','src/08-gag-recipes.js',
        'src/09-vehicle-art.js','src/12-event-director.js',
        'src/30-race-manifest.js','src/31-race-director.js','src/32-ordinary-timeline.js',
        'previews/vehicle-pipeline/assembly.js','previews/vehicle-pipeline/render.js',
        'src/33-race-frames.js','src/35-side-stage.js','src/34-ordinary-film.js',
        'previews/side-stage/race-fixture.js','previews/side-stage/viewer.js',
        'previews/side-stage/race-review.js']
    sources=[]
    for p in modules:
        text=(ROOT/p).read_text(encoding='utf8')
        if p=='src/09-vehicle-art.js':
            text='(function(Image){'+text+'})(undefined);'
        sources.append(text)
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

def refresh_existing(root,out):
    # Intentionally leaves the approved Art Forge navigation and route models alone.
    for name in ['main.tsx','model.ts']:
        path=root/'src'/name
        if not path.exists() or '"side-stage"' not in path.read_text(encoding='utf8'):
            raise ValueError('Existing Side Stage route not found: '+str(path))
    target=root/'public/race-director/side-stage.html'
    if not target.exists():
        raise ValueError('Existing Side Stage preview not found: '+str(target))
    target.write_bytes(out.read_bytes())
    print('Refreshed existing Side Stage HTML without touching navigation:',target)

if __name__=='__main__':
    out=build()
    if len(sys.argv)>1:
        if len(sys.argv)==3 and sys.argv[1]=='--refresh':
            refresh_existing(Path(sys.argv[2]),out)
        elif len(sys.argv)==2:
            install(Path(sys.argv[1]),out)
        else:
            raise SystemExit('Usage: build.py [--refresh ART_FORGE_ROOT | ART_FORGE_ROOT]')
    print(out)
