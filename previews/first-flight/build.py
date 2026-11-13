"""Bundle only the read-only viewer and its real game modules; no application boot/save code."""
from pathlib import Path
import base64, re

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
def build():
    chunks = []
    for n in [*range(2, 21), 26, 30, 31]:
        source, = (ROOT / 'src').glob(f'{n:02}-*.js')
        js = re.sub(r'\{\{ASSET:(assets/[\w./-]+\.png)\}\}',
                    lambda m: 'data:image/png;base64,' + base64.b64encode((ROOT/m[1]).read_bytes()).decode(), source.read_text(encoding='utf8'))
        chunks.append(js)
    chunks.extend((HERE/f).read_text(encoding='utf8') for f in ['camera.js','viewer.js'])
    html = (HERE/'viewer.html').read_text(encoding='utf8').replace('<!-- modules -->', '\n'.join('<script>'+s+'</script>' for s in chunks))
    out = ROOT/'dist'/'FIRST-FLIGHT.html'
    out.parent.mkdir(exist_ok=True)
    out.write_text(html, encoding='utf8')
    return out
if __name__ == '__main__':
    print(build())
