"""Build standalone game and previews using only Python's standard library."""
from pathlib import Path
import argparse,base64,hashlib,json,re
ROOT=Path(__file__).resolve().parents[1]
def read(path):return (ROOT/path).read_bytes().decode('utf-8')
def build():
    text=read('src/game.template.html')
    text=re.sub(r'\{\{(?:SCRIPT|STYLE):([^}]+)\}\}',lambda m:read(m[1]),text)
    manifest=json.loads(read('assets/manifest.json'))
    def embed(m):
        path=m[1]
        if path not in manifest:raise ValueError('Unknown asset: '+path)
        return 'data:'+manifest[path]['mime']+';base64,'+base64.b64encode((ROOT/path).read_bytes()).decode('ascii')
    text=re.sub(r'\{\{ASSET:([^}]+)\}\}',embed,text)
    if re.search(r'\{\{(?:SCRIPT|STYLE|ASSET):',text):raise ValueError('Unresolved build token')
    anchor=text[text.index('<a href="FOSSIL-TEST-DRIVE.html"'):]
    play=text.replace(anchor,'').replace('window.SCRAP_PRIX_DEV_MODE=true;','window.SCRAP_PRIX_DEV_MODE=false;')
    panel=read('previews/environment-panel.html').replace('\r\n','\n').replace("const c=$('canvas')", "$('env').value='street';const c=$('canvas')")
    outputs={'dev.html':text,'index.html':play,'STREET-PREVIEW.html':play+panel,'FOSSIL-TEST-DRIVE.html':play+read('previews/fossil-panel.html').replace('\r\n','\n')}
    dist=ROOT/'dist';dist.mkdir(exist_ok=True)
    for name,content in outputs.items():(dist/name).write_bytes(content.encode('utf-8'))
    return text
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check-import',action='store_true',help='Verify exact parity with the initial imported DEV build (initial handoff only).');args=parser.parse_args()
    dev=build()
    if args.check_import:
        baseline=json.loads(read('tests/import-baseline.json'))
        assert hashlib.sha256(dev.encode('utf-8')).hexdigest()==baseline['devSha256'],'Source differs from initial import; this check is only for the initial handoff.'
        print('PASS: DEV build is byte-for-byte identical to the latest imported Street build.')
    print('Built dist/index.html, dev.html and both standalone previews.')
