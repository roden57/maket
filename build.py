"""Build Maket from src/.  Run:  python3 build.py
Outputs:
  index.html + app.js        -> the public site (GitHub Pages: https://roden57.github.io/maket/)
  dist/claude-artifact.html  -> single-file version for the Claude artifact
"""
import os, time
D = os.path.dirname(os.path.abspath(__file__))
S = lambda f: open(os.path.join(D, 'src', f), encoding='utf-8').read()
h, b, js = S('head.html'), S('body.html'), S('app.src.js')
full = (js.replace('__INIT__', S('init.json')).replace('__SK2__', S('sketch2.json'))
          .replace('__SK3__', S('sketch3.json')).replace('__SK4__', S('sketch4.json')))
SB_URL = 'https://kwoftzpxtytcgahsgjro.supabase.co'
SB_KEY = 'sb_publishable_YHx-GmgyEdNhCqhf98Ds2w_oCZAMMDp'
ver = str(int(time.time()))
loader = '''<script>
(function(){var q=new URLSearchParams(location.search).get('r');function go(){var s=document.createElement('script');s.src='app.js?v=%s';document.body.appendChild(s)}
if(!q)return go();var ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#f4f2ee;z-index:99;font:600 18px Tajawal,sans-serif';ov.textContent='⏳ جاري فتح التصميم…';document.body.appendChild(ov);
fetch('%s/rest/v1/reviews?select=*&id=eq.'+encodeURIComponent(q),{headers:{apikey:'%s'}}).then(function(r){return r.json()}).then(function(j){if(j&&j[0])window.MC3D_REVIEW={name:j[0].name,st:j[0].st,key:q,remote:true};else alert('هذا الرابط ما يشتغل — اطلب رابط جديد من الطالب')}).catch(function(){alert('ما كدرت أفتح التصميم — تأكد من الإنترنت')}).then(function(){ov.remove();go()})})();
</script>''' % (ver, SB_URL, SB_KEY)
hp = h.replace('<title>', '<title>ماكيت Maket — ', 1)
open(os.path.join(D, 'index.html'), 'w', encoding='utf-8').write(hp + b + loader + '</body></html>')
open(os.path.join(D, 'app.js'), 'w', encoding='utf-8').write(full)
os.makedirs(os.path.join(D, 'dist'), exist_ok=True)
open(os.path.join(D, 'dist', 'claude-artifact.html'), 'w', encoding='utf-8').write(h + b + '<script>\n' + full + '</script></body></html>')
print('built: index.html, app.js, dist/claude-artifact.html')
