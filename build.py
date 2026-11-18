"""Build Maket from src/.  Run:  python build.py
Outputs:
  index.html + app.js        -> the public site (GitHub Pages: https://roden57.github.io/maket/)
  dist/claude-artifact.html  -> single-file version for the Claude artifact
The helper modules (MODULES below) stay as separate files next to index.html;
the single-file artifact gets them inlined.
"""
import os, time
D = os.path.dirname(os.path.abspath(__file__))
R = lambda p: open(os.path.join(D, p), encoding='utf-8').read()
S = lambda f: R(os.path.join('src', f))
h, b, js = S('head.html'), S('body.html'), S('app.src.js')
full = (js.replace('__INIT__', S('init.json')).replace('__SK2__', S('sketch2.json'))
          .replace('__SK3__', S('sketch3.json')).replace('__SK4__', S('sketch4.json')))
# Loaded in this order, after three.js / d3 and before app.js
MODULES = ['areas-logic', 'shadow-heatmap-logic', 'section-logic', 'site-logic', 'facade-logic',
           'mass-logic', 'analysis-studio-logic', 'snap-guides-logic', 'i18n', 'occupancy-chart',
           'unsaved-logic']
SB_URL = 'https://kwoftzpxtytcgahsgjro.supabase.co'
SB_KEY = 'sb_publishable_YHx-GmgyEdNhCqhf98Ds2w_oCZAMMDp'
ver = str(int(time.time()))
T = lambda ar, en: "(window.L?L('%s','%s'):'%s')" % (ar, en, ar)
loader = '''<script>
(function(){var q=new URLSearchParams(location.search).get('r');function go(){var s=document.createElement('script');s.src='app.js?v=%s';document.body.appendChild(s)}
if(!q)return go();var ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#f1f3f5;color:#0f172a;z-index:99;font:600 16px "IBM Plex Sans Arabic",Tajawal,sans-serif';ov.textContent=%s;document.body.appendChild(ov);
fetch('%s/rest/v1/reviews?select=*&id=eq.'+encodeURIComponent(q),{headers:{apikey:'%s'}}).then(function(r){return r.json()}).then(function(j){if(j&&j[0])window.MC3D_REVIEW={name:j[0].name,st:j[0].st,key:q,remote:true};else alert(%s)}).catch(function(){alert(%s)}).then(function(){ov.remove();go()})})();
</script>
</body>
</html>
''' % (ver, T('جارٍ فتح التصميم…', 'Opening design…'), SB_URL, SB_KEY,
       T('هذا الرابط غير صالح — يُرجى التحقق من الرابط', 'Invalid review link — please check the URL'),
       T('تعذّر فتح التصميم — يُرجى التحقق من الاتصال بالإنترنت', 'Unable to open design — check your internet connection'))
hp = h.replace('<title>', '<title>ماكيت Maket — ', 1)
tags = ''.join('<script src="%s.js?v=%s"></script>\n' % (m, ver) for m in MODULES)
inline = ''.join('<script>\n%s\n</script>\n' % R(m + '.js') for m in MODULES)
W = lambda p, s: open(os.path.join(D, p), 'w', encoding='utf-8', newline='\n').write(s)
W('index.html', hp + b + tags + loader)
W('app.js', full)
os.makedirs(os.path.join(D, 'dist'), exist_ok=True)
W(os.path.join('dist', 'claude-artifact.html'), h + b + inline + '<script>\n' + full + '</script></body></html>')
print('built: index.html, app.js, dist/claude-artifact.html')
