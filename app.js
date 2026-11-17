const PAGE_SRC=(()=>{try{return '<!DOCTYPE html>\n'+document.documentElement.outerHTML}catch(e){return ''}})();
const REV=window.MC3D_REVIEW||null;
let WAS_FRESH=false;try{WAS_FRESH=!localStorage.getItem('mc3d_designs')&&!localStorage.getItem('mc3d_cur')}catch(e){}
const L=(ar,en)=>window.L?window.L(ar,en):ar;
const dn=(g,k,fb)=>window.MC3D_I18N?window.MC3D_I18N.dn(g,k,fb):fb;
const FNS={
 main:{n:'فضاءات رئيسية',c:'#2563EB',t:1500},
 pub:{n:'عام واستقبال',c:'#0D9488',t:1000},
 spec:{n:'تخصصي / خاص',c:'#D97706',t:1200},
 adm:{n:'إدارة وخدمات',c:'#64748B',t:800},
 circ:{n:'حركة ومفاصل',c:'#7C3AED',t:500},
 '':{n:'غير محدد',c:'#94A3B8',t:0}
};
const fnName=k=>dn('fns',k,(FNS[k]&&FNS[k].n)||'');
function applyCustomPalette(p){if(!p||!p.zones)return;Object.keys(FNS).forEach(k=>{if(p.zones[k])FNS[k].c=p.zones[k]})}
if(window.MC3D_OCC_CHART&&typeof MC3D_OCC_CHART.getPalette==='function'){applyCustomPalette(MC3D_OCC_CHART.getPalette());if(MC3D_OCC_CHART.setOnPaletteChange)MC3D_OCC_CHART.setOnPaletteChange(p=>{applyCustomPalette(p);if(typeof refresh==='function')refresh()})}
const LEGACY_FN={sim:'spec',edu:'main',know:'pub',obs:'circ'};
const CITIES={
 baghdad:{n:'بغداد',lat:33.31,lon:44.36,tz:3,wind:315},
 basra:{n:'البصرة',lat:30.51,lon:47.78,tz:3,wind:315},
 erbil:{n:'أربيل',lat:36.19,lon:44.01,tz:3,wind:315},
 riyadh:{n:'الرياض',lat:24.71,lon:46.68,tz:3,wind:340},
 jeddah:{n:'جدة',lat:21.49,lon:39.19,tz:3,wind:335},
 dubai:{n:'دبي',lat:25.20,lon:55.27,tz:4,wind:315},
 cairo:{n:'القاهرة',lat:30.04,lon:31.24,tz:2,wind:0},
 amman:{n:'عمّان',lat:31.95,lon:35.93,tz:3,wind:270},
 beirut:{n:'بيروت',lat:33.89,lon:35.50,tz:2,wind:240},
 kuwait:{n:'الكويت',lat:29.38,lon:47.98,tz:3,wind:315},
 doha:{n:'الدوحة',lat:25.29,lon:51.53,tz:3,wind:330},
 istanbul:{n:'إسطنبول',lat:41.01,lon:28.98,tz:3,wind:45},
 london:{n:'لندن',lat:51.51,lon:-0.13,tz:0,wind:225},
 custom:{n:'مخصص (إحداثيات يدوية)',lat:30.0,lon:35.0,tz:3,wind:315}
};
const MATS={brick:{n:'طابوق',c:'#c4683f'},glass:{n:'زجاج',c:'#8ec3e6'},concrete:{n:'خرسانة',c:'#cfcac0'},stone:{n:'حجر',c:'#e3d3b5'},white:{n:'أبيض',c:'#f4f4f0'},joint:{n:'مفصل (أزرق)',c:'#2f4fa8'},green:{n:'فناء / خضرة',c:'#9cc58a'},paving:{n:'تبليط',c:'#d9d2c3'},asphalt:{n:'شارع / إسفلت',c:'#55585d'},water:{n:'ماء',c:'#7fb7d9'},context:{n:'مبنى مجاور (سياق)',c:'#b4b6ba'}};
const FLAT=['green','paving','asphalt','water'];
const SHAPES={box:'مستطيل',poly:'مضلع حر (نقاط)',cyl:'أسطوانة',tri:'مثلث',L:'حرف L',U:'حرف U',vault:'قبو',pyr:'هرم',ring:'حلقة',court:'كتلة بفناء وسطي',gate:'كتلة ببوابة (ممر)',gable:'سقف جملون',shed:'سقف مائل',riwaq:'رواق أعمدة',tree:'شجرة',person:'شخص (مقياس)',car:'سيارة'};
const PROPS={tree:[5,5],person:[.6,.6],car:[4.5,1.9]};
const isProp=b=>!!PROPS[b.shape],isFlat=b=>FLAT.includes(b.mat);
const counts=b=>!isProp(b)&&!isFlat(b)&&b.shape!=='riwaq'&&b.mat!=='context';
const clone=o=>JSON.parse(JSON.stringify(o));
const IC=n=>'<svg class="ic"><use href="#i-'+n+'"/></svg>';
const LS={get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}};
if(REV){const mem={},rk=k=>'mc3d_rv_'+REV.key+'_'+k,pk=['mc3d_cur','mc3d_rq','mc3d_rvname'];const rd=k=>{try{return JSON.parse(localStorage.getItem(rk(k)))}catch(e){return null}};
 mem.mc3d_cur=rd('mc3d_cur')||REV.st;mem.mc3d_name=REV.name;mem.mc3d_designs={};mem.mc3d_mig=9;mem.mc3d_tour=1;mem.mc3d_lastbk=Date.now();mem.mc3d_sheets=null;
 LS.get=k=>{if(pk.includes(k)&&k!=='mc3d_cur')return rd(k);return mem[k]===undefined||mem[k]===null?null:clone(mem[k])};
 LS.set=(k,v)=>{mem[k]=v===undefined?null:clone(v);if(pk.includes(k)){try{localStorage.setItem(rk(k),JSON.stringify(v))}catch(e){}}return true};WAS_FRESH=false}
const RQ=Object.assign({tex:false,ao:false,sky:false},LS.get('mc3d_rq')||{});
function norm(b){const r=Object.assign({name:'كتلة',shape:'box',mat:'brick',fn:'',x:0,z:0,w:10,d:10,f:2,y0:0,ry:0,rot:0},b);if(r.fn&&LEGACY_FN[r.fn])r.fn=LEGACY_FN[r.fn];if(r.fn&&!FNS[r.fn])r.fn='';return r}
function ensureIds(s){const seen=new Set();let n=0;(s.blocks||[]).forEach(b=>{if(!b.id||seen.has(b.id)){while(seen.has('k'+n)||(s.blocks||[]).some(o=>o!==b&&o.id==='k'+n))n++;b.id='k'+n}seen.add(b.id)});return s}
function normState(s){ensureIds(s);s.site=Object.assign({w:100,d:100,sb:0,north:0,city:'baghdad',lat:33.31,lon:44.36,tz:3,wind:315},s.site||{});
 s.meta=Object.assign({title:'مشروع معماري',designer:'',org:'',location:''},s.meta||{});
 s.fh=s.fh||4;s.blocks=(s.blocks||[]).map(norm);
 s.sun=Object.assign({on:false,date:'2026-06-21',hour:14},s.sun||{});s.img=s.img||null;s.v=Math.max(s.v||0,9);return s}
function tplCourtyard(){return normState({v:9,site:{w:100,d:100,sb:5,north:0,city:'baghdad',lat:33.31,lon:44.36,tz:3,wind:315},fh:4,blocks:[
 norm({name:'ساحة المدخل',mat:'paving',x:0,z:28,w:42,d:14,f:1}),
 norm({name:'الفناء الوسطي',mat:'green',x:0,z:0,w:30,d:22,f:1}),
 norm({name:'الرواق المحيط',shape:'riwaq',mat:'white',x:0,z:0,w:29,d:21,f:1}),
 norm({name:'الجناح الرئيسي',mat:'stone',fn:'main',x:-23,z:0,w:14,d:38,f:3}),
 norm({name:'الجناح التخصصي',mat:'brick',fn:'spec',x:23,z:0,w:14,d:38,f:3}),
 norm({name:'بهو الاستقبال',mat:'white',fn:'pub',x:0,z:16,w:32,d:10,f:2}),
 norm({name:'جناح الإدارة والخدمات',mat:'concrete',fn:'adm',x:0,z:-17,w:36,d:11,f:2}),
 norm({name:'مفصل حركة 1',mat:'joint',fn:'circ',x:-14,z:15,w:7,d:9,f:4}),
 norm({name:'مفصل حركة 2',mat:'joint',fn:'circ',x:14,z:-15,w:7,d:9,f:4})
]})}
function tplCluster(){return normState({v:9,site:{w:100,d:100,sb:5,north:0,city:'baghdad',lat:33.31,lon:44.36,tz:3,wind:315},fh:4,blocks:[
 norm({name:'المسار الرئيسي',mat:'paving',x:0,z:0,w:66,d:12,f:1}),
 norm({name:'حديقة مركزية',mat:'green',x:0,z:-22,w:28,d:20,f:1}),
 norm({name:'كتلة رئيسية أ',mat:'brick',fn:'main',x:-22,z:16,w:22,d:16,f:3}),
 norm({name:'كتلة رئيسية ب',mat:'brick',fn:'main',x:20,z:18,w:24,d:14,f:3}),
 norm({name:'الكتلة التخصصية',mat:'stone',fn:'spec',x:24,z:-18,w:20,d:22,f:2}),
 norm({name:'قاعة الاستقبال العامة',mat:'white',fn:'pub',x:-24,z:-18,w:18,d:18,f:2}),
 norm({name:'الإدارة والخدمات',mat:'concrete',fn:'adm',x:0,z:26,w:16,d:12,f:2}),
 norm({name:'جسر رابط',mat:'joint',fn:'circ',x:0,z:16,w:20,d:6,f:1,y0:4})
]})}
function tplTower(){return normState({v:9,site:{w:100,d:100,sb:6,north:0,city:'baghdad',lat:33.31,lon:44.36,tz:3,wind:315},fh:4,blocks:[
 norm({name:'ساحة أمامية',mat:'paving',x:0,z:24,w:60,d:18,f:1}),
 norm({name:'مسطح أخضر',mat:'green',x:-26,z:-16,w:22,d:28,f:1}),
 norm({name:'منصة الاستقبال والعام',mat:'stone',fn:'pub',x:0,z:2,w:56,d:28,f:2}),
 norm({name:'منصة الخدمات',mat:'concrete',fn:'adm',x:0,z:-18,w:42,d:12,f:2}),
 norm({name:'البرج الرئيسي',mat:'white',fn:'main',x:8,z:0,w:24,d:20,f:8,y0:8}),
 norm({name:'جناح مخصص',mat:'brick',fn:'spec',x:-18,z:4,w:16,d:16,f:4,y0:8}),
 norm({name:'قلب الحركة الرأسية',mat:'joint',fn:'circ',x:-6,z:0,w:8,d:10,f:11})
]})}
function migrate(o){const s=tplCourtyard();s.blocks=(o.blocks||[]).map(b=>norm(b));return normState(s)}
function blank(){return normState({site:clone(state.site),meta:clone(state.meta),fh:state.fh,blocks:[],sun:clone(state.sun),img:state.img?clone(state.img):null})}
let state=null,designs=LS.get('mc3d_designs')||{};
state=LS.get('mc3d_cur');
if(!state||!state.blocks){const old=LS.get('mc3d');if(old&&old.blocks){state=migrate(old);designs['تصميمي السابق']=clone(state);LS.set('mc3d_designs',designs)}else state=tplCourtyard()}
if((state.v||3)<4)state.blocks=state.blocks.filter(b=>b.mat!=='glass');
normState(state);
let firstMsg='';
LS.set('mc3d_mig',9);
let curName=LS.get('mc3d_name')||'تصميم افتراضي';
let imgData=null;try{imgData=localStorage.getItem('mc3d_img')}catch(e){}
let sel=-1,selSet=new Set(),tool='select',colorMode='fn',showGrid=true,showNames=false,showDims=true,snapStep=1,edgeOn=true,multiMode=false;
let sec={on:false,axis:'x',pos:0,flip:false,angle:0,slice:false,thick:12,cap:true,showFrame:true},playing=false,whiteBg=false;
let undoS=[],redoS=[],lastPush=0;
const snapStr=()=>JSON.stringify({s:state,n:curName});
function restore(str){const o=JSON.parse(str);if(o&&o.s){state=normState(o.s);curName=o.n||curName}else state=normState(o)}
function snap(force){const n=Date.now();if(!force&&n-lastPush<700)return;lastPush=n;undoS.push(snapStr());if(undoS.length>100)undoS.shift();redoS=[]}
function doUndo(){if(!undoS.length)return flash(L('لا يوجد ما يمكن التراجع عنه','Nothing to undo'));redoS.push(snapStr());restore(undoS.pop());clearSel();siteChanged();refresh();fillDesigns()}
function doRedo(){if(!redoS.length)return;undoS.push(snapStr());restore(redoS.pop());clearSel();siteChanged();refresh();fillDesigns()}
function uniq(base){if(!designs[base])return base;let i=2;while(designs[base+' '+i])i++;return base+' '+i}
const $=id=>document.getElementById(id);
function flash(t){const m=$('msg');m.textContent=t;m.style.display='block';clearTimeout(flash.t);flash.t=setTimeout(()=>m.style.display='none',Math.min(6000,1800+String(t).length*35))}
function arm(btn,fn){if(btn.dataset.armed){delete btn.dataset.armed;btn.classList.remove('armed');btn.innerHTML=btn.dataset.lbl;fn();return}
 btn.dataset.lbl=btn.innerHTML;btn.dataset.armed=1;btn.classList.add('armed');btn.textContent=L('انقر مرة أخرى للتأكيد','Click again to confirm');
 setTimeout(()=>{if(btn.dataset.armed){delete btn.dataset.armed;btn.classList.remove('armed');btn.innerHTML=btn.dataset.lbl}},3000)}
function clearSel(){sel=-1;selSet=new Set()}
function setSel(i){sel=i;selSet=new Set(i>=0?[i]:[])}

// ---------- three ----------
const el=$('v');
const R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(1,1);R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.localClippingEnabled=true;el.appendChild(R.domElement);
const S=new THREE.Scene();S.background=new THREE.Color('#eef1f4');
const camP=new THREE.PerspectiveCamera(35,1,0.5,4000);const camO=new THREE.OrthographicCamera(-1,1,1,-1,0.5,4000);camO.up.set(0,0,-1);
let C=camP,isPlan=false;
function makeControls(cam){const c=new THREE.OrbitControls(cam,R.domElement);c.enableDamping=true;c.maxPolarAngle=Math.PI/2-0.02;c.screenSpacePanning=true;return c}
let O=makeControls(C);
const hemi=new THREE.HemisphereLight('#ffffff','#cbd5e1',0.78);S.add(hemi);
const sun=new THREE.DirectionalLight('#fff6e8',0.85);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);S.add(sun);S.add(sun.target);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000),new THREE.MeshLambertMaterial({color:'#e2e6ea'}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;S.add(ground);
const siteG=new THREE.Group();S.add(siteG);let grid=null;
const imgG=new THREE.Group();S.add(imgG);
const secPlane=new THREE.Plane(new THREE.Vector3(-1,0,0),0);const secPlane2=new THREE.Plane(new THREE.Vector3(1,0,0),12);let clipArr=[];
const secVis=new THREE.Group();secVis.visible=false;S.add(secVis);
const secVisM=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:'#dc2626',transparent:true,opacity:.09,side:THREE.DoubleSide,depthWrite:false}));
const secVisB=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1,1)),new THREE.LineBasicMaterial({color:'#dc2626',transparent:true,opacity:.85}));
const secVisM2=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:'#2563eb',transparent:true,opacity:.06,side:THREE.DoubleSide,depthWrite:false}));
const secVisB2=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1,1)),new THREE.LineBasicMaterial({color:'#2563eb',transparent:true,opacity:.7}));
secVis.add(secVisM,secVisB,secVisM2,secVisB2);
const secCapsG=new THREE.Group();S.add(secCapsG);

// ---------- sun (dynamic site coordinates) ----------
function sunPos(dateStr,hour){
 const lat=(state&&state.site&&typeof state.site.lat==='number')?state.site.lat:33.31;
 const lon=(state&&state.site&&typeof state.site.lon==='number')?state.site.lon:44.36;
 const tz=(state&&state.site&&typeof state.site.tz==='number')?state.site.tz:3;
 const d=new Date(dateStr+'T00:00:00');const N=Math.round((d-new Date(d.getFullYear(),0,0))/864e5);
 const g=2*Math.PI/365*(N-1+(hour-12)/24);
 const eqt=229.18*(0.000075+0.001868*Math.cos(g)-0.032077*Math.sin(g)-0.014615*Math.cos(2*g)-0.040849*Math.sin(2*g));
 const dec=0.006918-0.399912*Math.cos(g)+0.070257*Math.sin(g)-0.006758*Math.cos(2*g)+0.000907*Math.sin(2*g)-0.002697*Math.cos(3*g)+0.00148*Math.sin(3*g);
 const ha=((hour*60+eqt+4*lon-60*tz)/4-180)*Math.PI/180,la=lat*Math.PI/180;
 const alt=Math.asin(Math.sin(la)*Math.sin(dec)+Math.cos(la)*Math.cos(dec)*Math.cos(ha));
 const azS=Math.atan2(Math.sin(ha),Math.cos(ha)*Math.sin(la)-Math.tan(dec)*Math.cos(la));
 return {alt,az:(azS+Math.PI+2*Math.PI)%(2*Math.PI)}}
function fmtH(h){const H=Math.floor(h),M=Math.round((h-H)*60);return `${H}:${String(M).padStart(2,'0')}`}
function setSun(){const m=Math.max(state.site.w,state.site.d)*1.2;const sc=sun.shadow.camera;sc.left=-m;sc.right=m;sc.top=m;sc.bottom=-m;sc.near=1;sc.far=m*8;sc.updateProjectionMatrix();
 if(state.sun.on){const p=sunPos(state.sun.date,state.sun.hour);const th=p.az+state.site.north*Math.PI/180;
  const dir=new THREE.Vector3(Math.sin(th)*Math.cos(p.alt),Math.sin(p.alt),-Math.cos(th)*Math.cos(p.alt));
  sun.position.copy(dir.multiplyScalar(m*3));const day=p.alt>0;sun.intensity=day?0.95:0;hemi.intensity=day?0.6:0.35;
  sun.color.set(p.alt<0.25?'#ffc890':'#fff6e6');
  $('sunInfo').innerHTML=day?`${L('ارتفاع الشمس','Sun Altitude')} <b>${(p.alt*180/Math.PI).toFixed(0)}°</b><br>${L('الاتجاه','Azimuth')} <b>${(p.az*180/Math.PI).toFixed(0)}°</b> ${L('من الشمال','from North')}`:`<b>${L('ليل — الشمس تحت الأفق','Night — Sun below horizon')}</b>`}
 else{sun.position.set(m*.6,m*1.4,m*.8);sun.intensity=0.85;hemi.intensity=0.78;sun.color.set('#fff6e8');$('sunInfo').innerHTML=`<span class="hint">${L('فعّل "شمس حقيقية" لمحاكاة الظلال وفق الموقع المختار','Enable "Real Sun" to simulate shadows for the selected site')}</span>`}
 $('sunHL').textContent=fmtH(state.sun.hour);$('sunH').value=state.sun.hour;$('sunDate').value=state.sun.date;$('bSunOn').classList.toggle('on',state.sun.on)}

// ---------- site ----------
const northG=new THREE.Group();S.add(northG);
const plinth=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:'#cfd5dd'}));plinth.receiveShadow=true;S.add(plinth);
const shadowCatch=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000),new THREE.ShadowMaterial({opacity:.22}));shadowCatch.rotation.x=-Math.PI/2;shadowCatch.position.y=-0.012;shadowCatch.receiveShadow=true;shadowCatch.visible=false;S.add(shadowCatch);
function siteChanged(){siteG.clear();const st=state.site,w=st.w,d=st.d,m=Math.max(w,d);plinth.scale.set(w+m*.12,1.2,d+m*.12);plinth.position.set(0,-0.62,0);
 const p=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshLambertMaterial({color:'#f8fafc',transparent:true,opacity:imgData&&state.img&&state.img.show?0.25:1}));p.rotation.x=-Math.PI/2;p.position.y=0.02;p.receiveShadow=true;siteG.add(p);
 const dl=(W,D,c,y)=>{const l=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(W,D)),new THREE.LineDashedMaterial({color:c,dashSize:2,gapSize:1.5}));l.rotation.x=-Math.PI/2;l.position.y=y;l.computeLineDistances();siteG.add(l)};
 dl(w,d,'#64748b',0.07);if(st.sb>0&&st.sb*2<Math.min(w,d))dl(w-2*st.sb,d-2*st.sb,'#dc2626',0.08);
 grid=new THREE.GridHelper(m,Math.round(m/2),'#cbd5e1','#e2e8f0');grid.position.y=0.05;grid.visible=showGrid;siteG.add(grid);
 northG.clear();const na=new THREE.Mesh(new THREE.ConeGeometry(m*.02,m*.06,3),new THREE.MeshLambertMaterial({color:'#0f172a'}));na.rotation.x=-Math.PI/2;northG.add(na);
 northG.position.set(-w/2-m*.07,0.5,-d/2+m*.05);northG.rotation.y=-st.north*Math.PI/180;
 $('sW').value=w;$('sD').value=d;$('sFH').value=state.fh;$('sSB').value=st.sb;$('sN').value=st.north;
 if($('citySel'))$('citySel').value=CITIES[st.city]?st.city:'custom';
 if($('siteLat'))$('siteLat').value=st.lat;$('siteLon')&&($('siteLon').value=st.lon);$('siteTz')&&($('siteTz').value=st.tz);$('siteWind')&&($('siteWind').value=st.wind);
 const mt=state.meta||{};
 if($('metaTitle'))$('metaTitle').value=mt.title||'';if($('metaDesigner'))$('metaDesigner').value=mt.designer||'';if($('metaOrg'))$('metaOrg').value=mt.org||'';if($('metaLoc'))$('metaLoc').value=mt.location||'';
 $('secPos').min=-m*.6;$('secPos').max=m*.6;buildImg();setSun();if(typeof buildWind==='function')buildWind();if(typeof rebuildShadowHeatmap==='function'&&shadowHmOn)rebuildShadowHeatmap()}
function buildImg(){imgG.clear();const im=state.img;const has=!!(imgData&&im);
 ['iOp','iW','iR','iX','iZ'].forEach(id=>$(id).disabled=!has);
 if(!has)return;$('iOp').value=im.op;$('iW').value=+im.w.toFixed(1);$('iR').value=im.rot;$('iX').value=+im.x.toFixed(1);$('iZ').value=+im.z.toFixed(1);$('bImgShow').classList.toggle('on',im.show);
 if(!im.show)return;
 const tex=new THREE.TextureLoader().load(imgData);tex.anisotropy=4;
 const pl=new THREE.Mesh(new THREE.PlaneGeometry(im.w,im.w*im.ar),new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:im.op,depthWrite:false}));
 pl.rotation.x=-Math.PI/2;pl.position.set(im.x,0.03,im.z);const g=new THREE.Group();g.add(pl);g.rotation.y=-im.rot*Math.PI/180;
 pl.position.set(0,0.03,0);g.position.set(im.x,0,im.z);imgG.add(g)}

// ---------- geometry ----------
function extr(pts,h){const sh=new THREE.Shape();pts.forEach((p,k)=>k?sh.lineTo(p[0],-p[1]):sh.moveTo(p[0],-p[1]));const g=new THREE.ExtrudeGeometry(sh,{depth:h,bevelEnabled:false});g.rotateX(-Math.PI/2);g.translate(0,-h/2,0);return g}
const rotOf=b=>(b.shape==='box'?0:b.ry);
function loc(b){return (rotOf(b)%180===0)?[b.w,b.d]:[b.d,b.w]}
function polyPts(b){if(!b.pts||b.pts.length<3)return null;let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;b.pts.forEach(([x,z])=>{x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z)});const pw=(x1-x0)||1,pd=(z1-z0)||1,[w,d]=loc(b);return b.pts.map(([x,z])=>[(x-(x0+x1)/2)*w/pw,(z-(z0+z1)/2)*d/pd])}
function pip(pts,x,z){let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [xi,zi]=pts[i],[xj,zj]=pts[j];if(((zi>z)!==(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi)+xi))c=!c}return c}
function polyArea(pts){let a=0;for(let i=0,j=pts.length-1;i<pts.length;j=i++)a+=(pts[j][0]+pts[i][0])*(pts[j][1]-pts[i][1]);return Math.abs(a/2)}
function geom(b,h){const [w,d]=loc(b),W=w/2,D=d/2;let g;
 switch(b.shape){
 case 'cyl':g=new THREE.CylinderGeometry(W,W,h,40);g.scale(1,1,d/w);break;
 case 'tri':g=extr([[-W,-D],[W,-D],[-W,D]],h);break;
 case 'L':{const t=Math.min(w,d)*.45;g=extr([[-W,-D],[W,-D],[W,-D+t],[-W+t,-D+t],[-W+t,D],[-W,D]],h);break}
 case 'U':{const t=Math.min(w,d)*.3;g=extr([[-W,-D],[W,-D],[W,D],[W-t,D],[W-t,-D+t],[-W+t,-D+t],[-W+t,D],[-W,D]],h);break}
 case 'vault':{const sh=new THREE.Shape();sh.moveTo(-W,0);sh.absellipse(0,0,W,h,Math.PI,0,true);sh.lineTo(-W,0);g=new THREE.ExtrudeGeometry(sh,{depth:d,bevelEnabled:false,curveSegments:24});g.translate(0,-h/2,-D);break}
 case 'pyr':g=new THREE.ConeGeometry(Math.SQRT1_2,1,4,1);g.rotateY(Math.PI/4);g.scale(w,h,d);break;
 case 'ring':{const sh=new THREE.Shape();sh.absellipse(0,0,W,D,0,Math.PI*2);const ho=new THREE.Path();ho.absellipse(0,0,W*.6,D*.6,0,Math.PI*2,true);sh.holes.push(ho);g=new THREE.ExtrudeGeometry(sh,{depth:h,bevelEnabled:false,curveSegments:40});g.rotateX(-Math.PI/2);g.translate(0,-h/2,0);break}
 case 'poly':{const P=polyPts(b);g=P?extr(P,h):new THREE.BoxGeometry(w,h,d);break}
 case 'court':{const t=courtT(b);const sh=new THREE.Shape();sh.moveTo(-W,-D);sh.lineTo(W,-D);sh.lineTo(W,D);sh.lineTo(-W,D);sh.lineTo(-W,-D);const ho=new THREE.Path();ho.moveTo(-W+t,-D+t);ho.lineTo(-W+t,D-t);ho.lineTo(W-t,D-t);ho.lineTo(W-t,-D+t);ho.lineTo(-W+t,-D+t);sh.holes.push(ho);g=new THREE.ExtrudeGeometry(sh,{depth:h,bevelEnabled:false});g.rotateX(-Math.PI/2);g.translate(0,-h/2,0);break}
 case 'gate':case 'gable':case 'shed':{const H=h/2;let P;if(b.shape==='gate'){const [gw,gh]=gateG(b);P=[[-W,-H],[-gw/2,-H],[-gw/2,-H+gh],[gw/2,-H+gh],[gw/2,-H],[W,-H],[W,H],[-W,H]]}
   else{const hw=h-roofH(b);P=b.shape==='gable'?[[-W,-H],[W,-H],[W,-H+hw],[0,H],[-W,-H+hw]]:[[-W,-H],[W,-H],[W,-H+hw],[-W,H]]}
   const sh=new THREE.Shape();P.forEach((p,k)=>k?sh.lineTo(p[0],p[1]):sh.moveTo(p[0],p[1]));g=new THREE.ExtrudeGeometry(sh,{depth:d,bevelEnabled:false});g.translate(0,0,-D);break}
 default:g=new THREE.BoxGeometry(w,h,d)}
 return g}
const RECTISH=['box','court','gate','gable','shed'];
const courtT=b=>{const [w,d]=loc(b);return Math.max(1,Math.min(b.t||8,Math.min(w,d)/2-1))};
const gateG=b=>{const [w]=loc(b);return [Math.max(1,Math.min(b.gw||6,w-2)),Math.max(1,Math.min((b.gf||1)*state.fh,b.f*state.fh-1))]};
const roofH=b=>(b.shape==='gable'||b.shape==='shed')?Math.max(.5,b.rh===undefined?3:b.rh):0;
function bh(b){if(b.shape==='tree')return b.w*1.3;if(b.shape==='person')return 1.75;if(b.shape==='car')return 1.55;
 if(isFlat(b))return b.mat==='asphalt'?0.1:0.3;if(b.shape==='riwaq')return Math.max(3,b.f*state.fh-0.5);return b.f*state.fh+roofH(b)}
const WHITE={green:'#dfe8d6',water:'#d3e4ee',asphalt:'#c4c4c4',paving:'#ecebe6',glass:'#d6e8f3',context:'#d9d9d9'};
const colOf=b=>{if(colorMode==='white')return WHITE[b.mat]||'#f7f6f2';if(colorMode==='fn'&&!isFlat(b)&&!isProp(b)&&b.mat!=='context')return FNS[b.fn||''].c;return MATS[b.mat].c};
function M(c,glass,map){const o={color:map?'#ffffff':c,clippingPlanes:clipArr,clipShadows:true};if(map)o.map=map;if(glass)return new THREE.MeshPhysicalMaterial(Object.assign(o,{transparent:true,opacity:.45,roughness:.05,metalness:.1,depthWrite:false}));if(clipArr.length)o.side=THREE.DoubleSide;return new THREE.MeshLambertMaterial(o)}
const LM=(c,op)=>new THREE.LineBasicMaterial({color:c,clippingPlanes:clipArr,transparent:op!==undefined,opacity:op===undefined?1:op});
const matOf=b=>{if(colorMode==='xray'&&!isFlat(b)){const m=M(colOf(b),true);m.opacity=.3;return m}return M(colOf(b),b.mat==='glass',(RQ.tex&&colorMode==='mat')?texOf(b.mat):null)};
const bg=new THREE.Group();S.add(bg);let meshes=[];
function propGroup(b,grp,h){const add=(g,c,y)=>{const m=new THREE.Mesh(g,M(colorMode==='white'?'#e9e9e5':c));m.position.y=y;m.castShadow=true;grp.add(m);return m};
 if(b.shape==='tree'){add(new THREE.CylinderGeometry(.15,.22,h*.4,8),'#7a5a3a',-h/2+h*.2);const cr=add(new THREE.SphereGeometry(b.w/2,14,10),'#6f9e5b',h/2-b.w/2);cr.scale.y=.9}
 else if(b.shape==='person'){add(new THREE.CylinderGeometry(.2,.24,1.45,10),'#4a4a4a',-h/2+.725);add(new THREE.SphereGeometry(.14,10,8),'#4a4a4a',-h/2+1.6)}
 else{const [w,d]=loc(b);const body=add(new THREE.BoxGeometry(w,.85,d),MATS[b.mat].c,-h/2+.6);const cab=add(new THREE.BoxGeometry(w*.55,.6,d*.92),'#2c3e50',-h/2+1.3);cab.position.x=-w*.05}}
function makeBlock(b,i){const h=bh(b);const grp=new THREE.Group();const isSel=selSet.has(i);let pick;
 if(isProp(b)){propGroup(b,grp,h);const [w,d]=loc(b);pick=new THREE.Mesh(new THREE.BoxGeometry(Math.max(w,.6),h,Math.max(d,.6)),new THREE.MeshBasicMaterial({visible:false}));grp.add(pick);
  if(isSel)grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(pick.geometry),LM('#ffb000')))}
 else if(b.shape==='riwaq'){const cm=matOf(b);const [w,d]=[b.w,b.d];const W=w/2,D=d/2;
  const edge=(x1,z1,x2,z2)=>{const L=Math.hypot(x2-x1,z2-z1),n=Math.max(1,Math.round(L/3));for(let k=0;k<=n;k++){const p=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,h,8),cm);p.position.set(x1+(x2-x1)*k/n,0,z1+(z2-z1)*k/n);p.castShadow=true;grp.add(p)}};
  edge(-W,-D,W,-D);edge(-W,D,W,D);edge(-W,-D,-W,D);edge(W,-D,W,D);
  [[w,.6,0,-D],[w,.6,0,D],[.6,d,-W,0],[.6,d,W,0]].forEach(([a,c,x,z])=>{const bm=new THREE.Mesh(new THREE.BoxGeometry(a,.45,c),cm);bm.position.set(x,h/2,z);bm.castShadow=true;grp.add(bm)});
  pick=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({visible:false}));grp.add(pick);
  if(isSel)grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(pick.geometry),LM('#ffb000')))}
 else{const gg=geom(b,h);const mt=matOf(b);if(mt.map)worldUV(gg,b);const m=new THREE.Mesh(gg,mt);m.castShadow=b.mat!=='glass'&&!isFlat(b);m.receiveShadow=true;grp.add(m);pick=m;
  const ec=isSel?'#ffb000':colorMode==='white'?'#55534e':(b.mat==='glass'||b.mat==='joint'?'#16285c':(isFlat(b)?'#7d7d70':'#5a2a18'));
  grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry,25),LM(ec)));
  if(b.shape==='box'&&!isFlat(b)){const pts=[],x=b.w/2+.02,z=b.d/2+.02;
   for(let k=1;k<b.f;k++){const y=-h/2+k*state.fh;pts.push(-x,y,z,x,y,z, x,y,z,x,y,-z, x,y,-z,-x,y,-z, -x,y,-z,-x,y,z)}
   if(b.mat==='glass'){const sx=Math.max(1,Math.round(b.w/2.5)),sz=Math.max(1,Math.round(b.d/2.5));
    for(let k=1;k<sx;k++){const xx=-b.w/2+k*b.w/sx;pts.push(xx,-h/2,z,xx,h/2,z,xx,-h/2,-z,xx,h/2,-z)}
    for(let k=1;k<sz;k++){const zz=-b.d/2+k*b.d/sz;pts.push(x,-h/2,zz,x,h/2,zz,-x,-h/2,zz,-x,h/2,zz)}}
   if(pts.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));grp.add(new THREE.LineSegments(g,LM(b.mat==='glass'?'#1f4e79':'#e7a07c',b.mat==='glass'?.8:.6)))}}
  if(b.fac&&RECTISH.includes(b.shape)&&!isFlat(b)&&colorMode!=='xray')facade(b,h,grp)}
 grp.rotation.y=-((b.shape==='riwaq'?0:rotOf(b))+(b.rot||0))*Math.PI/180;
 pick.userData.i=i;grp.position.set(b.x,b.y0+h/2,b.z);return [grp,pick]}
let groups=[],handles=[];const hG=new THREE.Group();S.add(hG);
function build(){ensureIds(state);bg.clear();meshes=[];groups=[];state.blocks.forEach((b,i)=>{if(b.hidden){meshes.push(null);groups.push(null);return}const [g,m]=makeBlock(b,i);bg.add(g);meshes.push(m);groups.push(g)});buildHandles()}
const pickables=()=>meshes.filter(Boolean);
function buildHandles(){hG.clear();handles=[];if(selSet.size!==1||tool!=='select')return;const b=state.blocks[sel];if(!b||b.hidden||b.lock||isProp(b))return;
 const m=Math.max(state.site.w,state.site.d),s=Math.max(.8,m*.013),h=bh(b),y=b.y0+(isFlat(b)?0.5:Math.min(h/2,3));
 const mk=(k,x,yy,z,col,geo)=>{const me=new THREE.Mesh(geo||new THREE.BoxGeometry(s,s,s),new THREE.MeshBasicMaterial({color:col,depthTest:false}));me.renderOrder=1000;me.position.set(x,yy,z);me.userData.h=k;hG.add(me);handles.push(me)};
 if(!(b.rot%360))mk('R',b.x+b.w/2,y,b.z,'#ff8f00'),mk('L',b.x-b.w/2,y,b.z,'#ff8f00'),mk('B',b.x,y,b.z+b.d/2,'#ff8f00'),mk('T',b.x,y,b.z-b.d/2,'#ff8f00');
 if(counts(b)||b.shape==='riwaq')mk('H',b.x,b.y0+h+s*1.2,b.z,'#1565c0',new THREE.ConeGeometry(s*.7,s*1.6,12))}

// ---------- areas ----------
function inside(b,px,pz){const u=px-b.x,v=pz-b.z,a=(rotOf(b)+(b.rot||0))*Math.PI/180;const lx=u*Math.cos(a)+v*Math.sin(a),lz=-u*Math.sin(a)+v*Math.cos(a);const [w,d]=loc(b),W=w/2,D=d/2;
 if(Math.abs(lx)>W||Math.abs(lz)>D)return false;
 switch(b.shape){case 'cyl':return (lx/W)**2+(lz/D)**2<=1;case 'ring':{const r=(lx/W)**2+(lz/D)**2;return r<=1&&r>=.36}
 case 'poly':{const P=polyPts(b);return P?pip(P,lx,lz):true}
 case 'tri':return (lx+W)/(2*W)+(lz+D)/(2*D)<=1;case 'L':{const t=Math.min(w,d)*.45;return !(lx>-W+t&&lz>-D+t)}
 case 'U':{const t=Math.min(w,d)*.3;return !(lx>-W+t&&lx<W-t&&lz>-D+t)}
 case 'court':{const t=courtT(b);return !(Math.abs(lx)<W-t&&Math.abs(lz)<D-t)}default:return true}}
function areaOf(b){if(!counts(b))return 0;const [w,d]=loc(b);let f=1;const t1=Math.min(w,d)*.45,t2=Math.min(w,d)*.3;
 if(b.shape==='poly'){const P=polyPts(b);if(P)return polyArea(P)}
 switch(b.shape){case 'cyl':f=Math.PI/4;break;case 'ring':f=Math.PI/4*.64;break;case 'tri':f=.5;break;case 'L':f=(w*d-(w-t1)*(d-t1))/(w*d);break;case 'U':f=(w*d-(w-2*t2)*(d-t2))/(w*d);break;case 'court':{const t=courtT(b);f=(w*d-(w-2*t)*(d-2*t))/(w*d);break}}
 return w*d*f}
function stats(){const st=state.site,bl=state.blocks.filter(counts);let fp=0;const W=st.w,D=st.d;
 const grounded=bl.filter(b=>b.y0<1);
 for(let x=-W/2+.5;x<W/2;x+=1)for(let z=-D/2+.5;z<D/2;z+=1){for(const b of grounded){if(inside(b,x,z)){fp+=1;break}}}
 const by={};Object.keys(FNS).forEach(k=>by[k]=0);let gfa=0;bl.forEach(b=>{const a=areaOf(b)*b.f;gfa+=a;by[b.fn||'']+=a});
 let out=0;if(st.sb>0){const lx=W/2-st.sb,lz=D/2-st.sb;bl.forEach(b=>{const [w,d]=[b.w,b.d];if(Math.abs(b.x)+w/2>lx+.01||Math.abs(b.z)+d/2>lz+.01)out++})}
 const u2=L('م²','m²'),um=L('م','m');
 $('status').innerHTML=`<span>${L('البصمة ≈','Footprint ≈')} <b>${Math.round(fp).toLocaleString('en')}</b> ${u2}</span><span>${L('التغطية','Coverage')} <b>${(fp/(W*D)*100).toFixed(0)}%</b></span><span>${L('المساحة الطابقية ≈','GFA ≈')} <b>${Math.round(gfa).toLocaleString('en')}</b> ${u2}</span><span>${L('الكتل','Blocks')} <b>${state.blocks.length}</b></span>`+(out?`<span class="warnTxt">⚠ ${out} ${L('كتلة تتجاوز الارتداد','exceed setback')}</span>`:'')+(selSet.size>1?`<span>${L('محدد:','Selected:')} <b>${selSet.size}</b></span>`:'')+`<span class="hint">${L('القطعة','Site')} ${W}×${D} ${um} · ${L('الأرقام تقريبية','Approx.')}</span>`;
 let h='';Object.entries(FNS).forEach(([k,f])=>{if(!f.t&&!by[k])return;const tg=f.t*1.25,p=tg?Math.min(100,by[k]/tg*100):0;
  h+=`<div class="fnb"><div class="fnb-top"><span><span class="sw" style="background:${f.c}"></span>${fnName(k)}</span><span style="font-family:var(--font-mono)">${Math.round(by[k])}${tg?' / '+Math.round(tg):''} ${u2}</span></div>`+(tg?`<div class="bar"><i style="width:${p}%;background:${f.c}"></i></div>`:'')+'</div>'});
 $('fnBox').innerHTML=h;
 if(window.MC3D_OCC_CHART){
  const eff=(state.prog&&state.prog.eff)||0.8;
  const netCapacity=bl.filter(b=>!b.hidden).reduce((s,b)=>s+areaOf(b)*b.f*eff,0);
  const validSlots=new Set();
  bl.forEach(b=>{if(!b.hidden)for(let f=0;f<b.f;f++)validSlots.add(b.id+'|'+f)});
  const allocatedArea=(state.prog&&Array.isArray(state.prog.sp))?state.prog.sp.filter(x=>x.bid&&validSlots.has(x.bid+'|'+x.fl)).reduce((s,x)=>s+x.a,0):0;
  MC3D_OCC_CHART.render({siteWidth:W,siteDepth:D,footprint:fp,netCapacity,allocatedArea,byZone:by});
 }}

// ---------- inspector panels ----------
const opts=(o,v,grp)=>Object.entries(o).map(([k,x])=>`<option value="${k}" ${k===v?'selected':''}>${grp?dn(grp,k,x.n||x):(x.n||x)}</option>`).join('');
$('dShape').innerHTML=opts(SHAPES,'box','shapes');$('dMat').innerHTML=opts(MATS,'brick','mats');$('dFn').innerHTML=opts(FNS,'','fns');
if($('citySel'))$('citySel').innerHTML=opts(CITIES,'baghdad','cities');
function galSync(){}

const DEFP={t:8,gw:6,gf:1,rh:3};
function shapeExtra(b){let h='';if(b.shape==='court')h+=numRow('pT',L('عمق الجناح','Wing Depth'),courtT(b),1);if(b.shape==='gate'){const [gw]=gateG(b);h+=numRow('pGW',L('عرض البوابة','Portal Width'),gw,1)+numRow('pGF',L('طوابق البوابة','Portal Floors'),b.gf||1,1)}
 if(b.shape==='gable'||b.shape==='shed')h+=numRow('pRH',L('ارتفاع السقف','Roof Height'),roofH(b),.5);let out=h?`<div class="grp"><div class="gc">${L('إعدادات الشكل','Shape Settings')}</div><div class="gb"><div class="col">${h}</div></div></div>`:'';
 if(RECTISH.includes(b.shape)&&!isFlat(b)&&b.mat!=='context')out+=`<div class="grp"><div class="gc">${L('عناصر الواجهة','Facade Elements')}</div><div class="gb"><div class="fld"><span class="fld-lbl">${L('الواجهة','Facade')}</span><select id="pFac">${Object.entries(FACS).map(([k,n])=>`<option value="${k}" ${(b.fac||'')===k?'selected':''}>${dn('facs',k,n)}</option>`).join('')}</select></div><div class="hint">${L('تظهر في الإظهار واللوحات','Visible in 3D & sheets')}</div></div></div>`;
 if(counts(b)&&state.prog){const sp=state.prog.sp.filter(x=>x.bid===b.id),a=sp.reduce((s,x)=>s+x.a,0),cap=areaOf(b)*b.f*state.prog.eff;out+=`<div class="grp"><div class="gc">${L('البرنامج الوظيفي','Program Allocation')}</div><div class="gb"><button class="big" id="pProg"><i><svg class="ic"><use href="#i-clip"/></svg></i>${sp.length} ${L('فضاء','spaces')} (${Math.round(a)}/${Math.round(cap)} ${L('م²','m²')})</button></div></div>`}
 return out}
function numRow(id,l,v,st){return `<div class="fld"><span class="fld-lbl">${l}</span><div class="stepper"><button class="sm" data-n="${id}" data-s="-${st}">−</button><input type="number" id="${id}" value="${+(+v).toFixed(2)}" step="${st}"><button class="sm" data-n="${id}" data-s="${st}">+</button></div></div>`}
let lastSelPanel=-2,curTab='home',userTab='home';
function showTab(t){curTab=t;if(typeof openSheet==='function'&&t!=='sheet'&&t!=='shmod'&&sheetOpen)openSheet(false);document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('on',b.dataset.t===t));document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on',p.id==='p_'+t));setTimeout(fit,0)}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{if(b.dataset.t!=='mod')userTab=b.dataset.t;document.body.classList.remove('insp-closed');showTab(b.dataset.t)});
if($('inspToggle'))$('inspToggle').onclick=()=>{document.body.classList.toggle('insp-closed');setTimeout(()=>{fit();layoutSheet()},220)};
if(innerWidth<=760)document.body.classList.add('insp-closed');
function panel(){const box=$('selBox'),tm=$('tabMod');const ids=[...selSet].filter(i=>state.blocks[i]);
 if(!ids.length){tm.style.display='none';if(curTab==='mod')showTab(userTab);box.innerHTML='';lastSelPanel=-1;return}
 tm.style.display='inline-block';const key=ids.join(',');if(curTab!=='mod'&&lastSelPanel!==key)showTab('mod');lastSelPanel=key;
 if(ids.length>1){tm.textContent=L('تعديل ('+ids.length+' كتل)','Edit ('+ids.length+' blocks)');
  box.innerHTML=`<div class="grp"><div class="gc">${L('تغيير للكل','Batch Edit')}</div><div class="gb"><div class="fld"><span class="fld-lbl">${L('الوظيفة','Function')}</span><select id="mFn"><option value="__">—</option>${opts(FNS,'__','fns')}</select></div><div class="fld"><span class="fld-lbl">${L('المادة','Material')}</span><select id="mMat"><option value="__">—</option>${opts(MATS,'__','mats')}</select></div></div></div>
  <div class="grp"><div class="gc">${L('الارتفاع','Elevation')}</div><div class="gb"><div class="fld"><span class="fld-lbl">${L('الطوابق للكل','Floors (All)')}</span><div class="stepper"><button class="sm" id="mFm">−1</button><button class="sm" id="mFp">+1</button></div></div><div class="hint">${L('حرّكها معاً بالسحب أو بالأسهم','Drag together or nudge with arrow keys')}</div></div></div>
  <div class="grp"><div class="gc">${L('أوامر سريعة','Quick Actions')}</div><div class="gb"><div class="gb-row"><button class="big" id="pDup"><i><svg class="ic"><use href="#i-copy"/></svg></i>${L('نسخ','Duplicate')}</button><button class="big warn" id="pDel"><i><svg class="ic"><use href="#i-trash"/></svg></i>${L('حذف','Delete')}</button></div><button class="big" id="pDesel"><i><svg class="ic"><use href="#i-x"/></svg></i>${L('إنهاء التحديد','Clear Selection')}</button></div></div>`;
  $('mFn').onchange=e=>{if(e.target.value==='__')return;snap(true);ids.forEach(i=>state.blocks[i].fn=e.target.value);refresh()};
  $('mMat').onchange=e=>{if(e.target.value==='__')return;snap(true);ids.forEach(i=>state.blocks[i].mat=e.target.value);refresh()};
  $('mFp').onclick=()=>{snap();ids.forEach(i=>state.blocks[i].f++);refresh()};$('mFm').onclick=()=>{snap();ids.forEach(i=>{if(state.blocks[i].f>1)state.blocks[i].f--});refresh()};
  $('pDup').onclick=dup;$('pDel').onclick=del;$('pDesel').onclick=()=>{clearSel();refresh()};return}
 tm.textContent=L('تعديل الكتلة','Edit Mass');const b=state.blocks[ids[0]];
 box.innerHTML=`<div class="grp"><div class="gc"><span>${L('التعريف','Identity')}</span><span class="ins-area-badge">≈ ${Math.round(areaOf(b)*b.f)} ${L('م²','m²')}</span></div><div class="gb">
  <div class="fld"><span class="fld-lbl">${L('الاسم','Name')}</span><input type="text" id="pName" value="${b.name.replace(/"/g,'&quot;')}"></div>
  <div class="fld"><span class="fld-lbl">${L('الوظيفة','Zone')}</span><select id="pFn">${opts(FNS,b.fn||'','fns')}</select></div>
  <div class="fld-grid">
   <div class="fld-stack">${L('المادة','Material')} <select id="pMat">${opts(MATS,b.mat,'mats')}</select></div>
   <div class="fld-stack">${L('الشكل','Shape')} <select id="pShape">${opts(SHAPES,b.shape,'shapes')}</select></div>
  </div></div></div>
 <div class="grp"><div class="gc">${L('الارتفاع والمستوى','Height & Level')}</div><div class="gb">${numRow('pF',L('الطوابق','Floors'),b.f,1)}${numRow('pY0',L('مرفوع (م)','Elevate (m)'),b.y0,1)}</div></div>
 <div class="grp"><div class="gc"><span>${L('الأبعاد (م)','Dimensions (m)')}</span><span class="hint">${L('اسحب المربعات للمد','Drag handles to resize')}</span></div><div class="gb">${numRow('pW',L('العرض','Width'),b.w,1)}${numRow('pD',L('العمق','Depth'),b.d,1)}</div></div>
 <div class="grp"><div class="gc">${L('التدوير','Rotation')}</div><div class="gb"><div class="fld"><span class="fld-lbl">${L('زاوية (°)','Angle (°)')}</span><div class="stepper"><button class="sm" id="pRm">−15°</button><input type="number" id="pRotA" value="${+(b.rot||0).toFixed(1)}" step="1"><button class="sm" id="pRp">+15°</button></div></div></div></div>${shapeExtra(b)}
 <div class="grp"><div class="gc">${L('أوامر','Actions')}</div><div class="gb"><div class="gb-row"><button class="big" id="pLock"><i>${b.lock?IC('lock'):IC('unlock')}</i>${b.lock?L('مقفلة','Locked'):L('قفل','Lock')}</button><button class="big" id="pDup"><i><svg class="ic"><use href="#i-copy"/></svg></i>${L('نسخ','Copy')}</button><button class="big warn" id="pDel"><i><svg class="ic"><use href="#i-trash"/></svg></i>${L('حذف','Delete')}</button><button class="big" id="pDesel"><i><svg class="ic"><use href="#i-x"/></svg></i>${L('إنهاء','Done')}</button></div></div></div>`;
 $('pName').onchange=e=>{snap(true);b.name=e.target.value;refresh()};
 $('pShape').onchange=e=>{snap(true);b.shape=e.target.value;if(PROPS[b.shape]){[b.w,b.d]=PROPS[b.shape];b.f=1}refresh()};
 $('pMat').onchange=e=>{snap(true);b.mat=e.target.value;refresh()};
 $('pFn').onchange=e=>{snap(true);b.fn=e.target.value;refresh()};
 const map={pF:'f',pY0:'y0',pW:'w',pD:'d',pX:'x',pZ:'z',pT:'t',pGW:'gw',pGF:'gf',pRH:'rh'},min={f:1,y0:0,w:.3,d:.3,x:-9999,z:-9999,t:1,gw:1,gf:1,rh:.5};
 Object.entries(map).forEach(([id,k])=>{if(!$(id))return;$(id).onchange=e=>{const v=parseFloat(e.target.value);if(isNaN(v))return;snap(true);b[k]=Math.max(min[k],v);refresh()}});
 box.querySelectorAll('[data-n]').forEach(bt=>bt.onclick=()=>{const k=map[bt.dataset.n];snap();if(b[k]===undefined)b[k]=DEFP[k]||0;b[k]=Math.max(min[k],+(b[k]+parseFloat(bt.dataset.s)).toFixed(2));refresh()});
 if($('pFac'))$('pFac').onchange=e=>{snap(true);b.fac=e.target.value;refresh()};if($('pProg'))$('pProg').onclick=openProg;
 $('pLock').onclick=toggleLock;$('pRm').onclick=()=>rotFree(-15);$('pRp').onclick=()=>rotFree(15);$('pRotA').onchange=e=>{const v=parseFloat(e.target.value);if(isNaN(v))return;snap(true);b.rot=((v%360)+360)%360;refresh()};$('pDup').onclick=dup;$('pDel').onclick=del;$('pDesel').onclick=()=>{clearSel();refresh()}}
function elemList(){const box=$('elBox');if(!box)return;box.innerHTML='';state.blocks.forEach((b,i)=>{const d=document.createElement('div');d.className='chip'+(selSet.has(i)?' on':'')+(b.hidden?' off':'');
 d.innerHTML=`<span class="sw" style="background:${colOf(b)}"></span><span class="nm"></span><button title="${L('إظهار/إخفاء','Show/Hide')}">${b.hidden?IC('eyeoff'):IC('eye')}</button><button title="${L('قفل','Lock')}">${b.lock?IC('lock'):IC('unlock')}</button>`;d.querySelector('.nm').textContent=b.name;
 d.querySelector('.nm').onclick=ev=>{if(b.hidden){b.hidden=false}if(ev.shiftKey){selSet.add(i);sel=i}else setSel(i);refresh()};
 const [bh_,bl]=d.querySelectorAll('button');bh_.onclick=()=>{snap(true);b.hidden=!b.hidden;if(b.hidden)selSet.delete(i);refresh()};bl.onclick=()=>{b.lock=!b.lock;refresh()};box.appendChild(d)})}
function growSide(b,k,s){if(k==='R'||k==='L'){if(b.w+s<1)return;b.w+=s;b.x+=k==='R'?s/2:-s/2}else{if(b.d+s<1)return;b.d+=s;b.z+=k==='B'?s/2:-s/2}}
function rotFree(dv){if(!selSet.size)return;snap();selSet.forEach(i=>{const b=state.blocks[i];if(b.lock)return;b.rot=(((b.rot||0)+dv)%360+360)%360});refresh()}
function rot90(){if(sel<0)return;snap(true);const b=state.blocks[sel];b.ry=(b.ry+90)%360;[b.w,b.d]=[b.d,b.w];refresh()}
function split(){if(sel<0)return;const b=state.blocks[sel];if(b.f<2)return flash(L('الكتلة من طابق واحد','Mass has only 1 floor'));snap(true);const parts=[];
 for(let k=0;k<b.f;k++)parts.push(Object.assign(clone(b),{f:1,y0:b.y0+k*state.fh,name:b.name+L(' — ط',' — F')+(k+1)}));
 state.blocks.splice(sel,1,...parts);selSet=new Set(parts.map((_,k)=>sel+k));refresh();flash(L('قُسِّمت إلى '+parts.length+' طوابق — حدّد كل طابق لتغيير وظيفته','Split into '+parts.length+' floors — select each to assign a zone'))}
function dup(){if(!selSet.size)return;snap(true);const ids=[...selSet],start=state.blocks.length;
 ids.forEach(i=>{const b=clone(state.blocks[i]);b.x+=snapStep*4;b.z+=snapStep*4;if(ids.length===1)b.name+=L(' (نسخة)',' (Copy)');state.blocks.push(b)});
 selSet=new Set(ids.map((_,k)=>start+k));sel=start;refresh()}
function del(){if(!selSet.size)return;const ids=[...selSet].filter(i=>!state.blocks[i].lock);if(!ids.length)return flash(L('الكتلة مقفلة','Mass is locked'));snap(true);ids.sort((a,b)=>b-a).forEach(i=>state.blocks.splice(i,1));clearSel();refresh()}
function refresh(){build();panel();stats();save();renderNames(true);elemList();if(typeof galSync==='function')galSync();if(typeof scheduleShadowHeatmap==='function')scheduleShadowHeatmap();if(typeof renderSectionAnalysis==='function')renderSectionAnalysis()}
let saveT=null;
function syncDesigns(){const disk=LS.get('mc3d_designs');if(disk&&typeof disk==='object'){Object.keys(designs).forEach(k=>{if(!(k in disk)&&k!==curName)delete designs[k]});Object.keys(disk).forEach(k=>{if(k!==curName)designs[k]=disk[k]})}}
function save(){LS.set('mc3d_cur',state);LS.set('mc3d_name',curName);if(curName){designs[curName]=clone(state);clearTimeout(saveT);saveT=setTimeout(()=>{syncDesigns();designs[curName]=clone(state);const ok=LS.set('mc3d_designs',designs);fillDesigns();$('dsel').value=curName;$('curname').textContent='· '+curName+(ok?L('  ✓ محفوظ','  ✓ Saved'):L('  ⚠ الذاكرة ممتلئة','  ⚠ Storage full'))},300)}
 $('curname').textContent='· '+curName}
function fillDesigns(){const ks=Object.keys(designs);$('dsel').innerHTML=ks.length?ks.map(k=>`<option>${k.replace(/</g,'&lt;')}</option>`).join(''):`<option value="">${L('— لا توجد تصاميم محفوظة —','— No saved designs —')}</option>`}

// ---------- file ----------
$('bNew').onclick=e=>arm(e.currentTarget,()=>{snap(true);state=blank();designs[curName]=clone(state);curName=uniq(L('تصميم جديد','New Design'));clearSel();siteChanged();refresh();view('top');setTool('draw');flash(L('لوحة فارغة — اسحب على الأرض لرسم أول كتلة','Blank canvas — drag on ground to draw your first mass'))});
$('bSketch').onclick=e=>arm(e.currentTarget,()=>{snap(true);const keep={site:clone(state.site),meta:clone(state.meta),sun:clone(state.sun),img:state.img};state=tplCourtyard();state.site=Object.assign(state.site,{north:keep.site.north,city:keep.site.city,lat:keep.site.lat,lon:keep.site.lon,tz:keep.site.tz,wind:keep.site.wind});state.meta=keep.meta;state.sun=keep.sun;state.img=keep.img;designs[curName]=clone(state);curName=uniq(L('فناء وسطي','Courtyard'));clearSel();siteChanged();refresh();view('iso');flash(L('تم تحميل قالب الفناء الوسطي ✓','Loaded Courtyard template ✓'))});
$('bSketch2').onclick=e=>arm(e.currentTarget,()=>{snap(true);const keep={site:clone(state.site),meta:clone(state.meta),sun:clone(state.sun),img:state.img};state=tplCluster();state.site=Object.assign(state.site,{north:keep.site.north,city:keep.site.city,lat:keep.site.lat,lon:keep.site.lon,tz:keep.site.tz,wind:keep.site.wind});state.meta=keep.meta;state.sun=keep.sun;state.img=keep.img;designs[curName]=clone(state);curName=uniq(L('مجمع كتل','Mass Cluster'));clearSel();siteChanged();refresh();view('iso');flash(L('تم تحميل قالب مجمع الكتل ✓','Loaded Mass Cluster template ✓'))});
$('bSketch3').onclick=e=>arm(e.currentTarget,()=>{snap(true);const keep={site:clone(state.site),meta:clone(state.meta),sun:clone(state.sun),img:state.img};state=tplTower();state.site=Object.assign(state.site,{north:keep.site.north,city:keep.site.city,lat:keep.site.lat,lon:keep.site.lon,tz:keep.site.tz,wind:keep.site.wind});state.meta=keep.meta;state.sun=keep.sun;state.img=keep.img;designs[curName]=clone(state);curName=uniq(L('برج ومنصة','Tower & Podium'));clearSel();siteChanged();refresh();view('iso');flash(L('تم تحميل قالب البرج والمنصة ✓','Loaded Tower & Podium template ✓'))});
$('bSave').onclick=()=>{const n=($('dname').value||curName||'').trim();if(!n)return flash(L('أدخل اسماً للتصميم','Enter a design name'));designs[curName]=clone(state);designs[n]=clone(state);LS.set('mc3d_designs',designs);curName=n;fillDesigns();$('dsel').value=n;save();flash(L('تم الحفظ: ','Saved: ')+n)};
$('qSave').onclick=()=>{$('dname').value=curName;$('bSave').click()};
$('bOpen').onclick=()=>{const n=$('dsel').value;if(!n||!designs[n])return;if(n===curName)return flash(L('هذا التصميم مفتوح أصلاً','This design is already open'));designs[curName]=clone(state);LS.set('mc3d_designs',designs);snap(true);state=normState(clone(designs[n]));curName=n;clearSel();siteChanged();refresh();fillDesigns();$('dsel').value=n;flash(L('تم الفتح: '+n+' — التصميم السابق محفوظ','Opened: '+n+' — previous design saved'))};
$('bDelD').onclick=e=>{const n=$('dsel').value;if(!n||!designs[n])return;arm(e.currentTarget,()=>{clearTimeout(saveT);syncDesigns();delete designs[n];
  if(n===curName){const rest=Object.keys(designs);snap(true);if(rest.length){curName=rest[0];state=normState(clone(designs[curName]))}else{state=blank();curName=L('تصميم جديد','New Design');designs[curName]=clone(state)}clearSel();siteChanged()}
  LS.set('mc3d_designs',designs);LS.set('mc3d_cur',state);LS.set('mc3d_name',curName);fillDesigns();$('dsel').value=curName;refresh();flash(L('حُذف نهائياً: ','Permanently deleted: ')+n+(designs[curName]?L(' — المفتوح حالياً: ',' — current: ')+curName:''))})};
addEventListener('storage',e=>{if(e.key==='mc3d_designs'){syncDesigns();fillDesigns();$('dsel').value=curName}
 if(e.key==='mc3d_sheets'&&typeof sheets!=='undefined'){const d=LS.get('mc3d_sheets');if(d){Object.keys(sheets).forEach(k=>{if(!(k in d)&&k!==curSheet)delete sheets[k]});Object.keys(d).forEach(k=>{if(k!==curSheet)sheets[k]=d[k]});fillSheets()}}});
const MODALS={io:['mIO','نسخ / لصق التصميم'],shot:['mShot','صورة النموذج'],help:['mHelp','دليل الاستخدام'],crop:['mCrop','قص اللقطة'],quick:['mQuick','لوحة سريعة — اختر المحتوى'],report:['mReport','تقرير المساحات'],export:['mExport','تصدير — اختر الصيغة'],input:['mInput',''],auth:['mAuth','الحساب'],notes:['mNotes','الملاحظات على الكتل'],prog:['mProg','توزيع البرنامج الوظيفي على الكتل والطوابق'],rvinfo:['mRvInfo','مشاركة للمراجعة']};
function modal(kind){$('modal').style.display='flex';Object.entries(MODALS).forEach(([k,[id]])=>{const e=$(id);if(e)e.style.display=k===kind?'block':'none'});$('modal').querySelector('.box').classList.toggle('wide',kind==='prog');$('mTitle').textContent=dn('modals',kind,(MODALS[kind]||[0,''])[1])}
$('bIO').onclick=()=>{$('ioText').value=JSON.stringify(state);modal('io')};
$('mClose').onclick=()=>{$('modal').style.display='none';crop=null};
$('ioCopy').onclick=()=>{const t=$('ioText');t.select();navigator.clipboard.writeText(t.value).then(()=>flash(L('تم النسخ ✓','Copied ✓'))).catch(()=>flash(L('حدد النص وانسخه يدوياً','Select and copy text manually')))};
$('ioImport').onclick=()=>{try{const s=JSON.parse($('ioText').value);if(!s.blocks)throw 0;snap(true);state=(s.v>=3)?normState(s):migrate(s);clearSel();designs[curName]=clone(state);curName=uniq(L('مستورد','Imported'));siteChanged();refresh();$('modal').style.display='none';flash(L('تم استيراد التصميم ✓','Design imported ✓'))}catch(e){flash(L('النص ليس تصميماً صالحاً','Invalid design JSON'))}};
function shot(){const pr=R.getPixelRatio(),bgc=S.background.clone();if(whiteBg){S.background.set('#ffffff');ground.visible=false}
 lab.style.display='none';R.setPixelRatio(Math.max(2.5,pr));fit();draw(C);let url='';try{url=R.domElement.toDataURL('image/png')}catch(e){}
 R.setPixelRatio(pr);S.background.copy(bgc);ground.visible=true;fit();
 if(!url)return flash(L('تعذّر إنشاء الصورة','Failed to capture image'));$('shot').src=url;modal('shot')}
$('bShot').onclick=shot;$('bShot2').onclick=shot;$('qShot').onclick=shot;
$('bWhite').onclick=()=>{whiteBg=!whiteBg;$('bWhite').classList.toggle('on',whiteBg)};

// ---------- project metadata & site settings ----------
[['metaTitle','title'],['metaDesigner','designer'],['metaOrg','org'],['metaLoc','location']].forEach(([id,k])=>{
 if($(id))$(id).onchange=e=>{snap(true);state.meta=state.meta||{};state.meta[k]=e.target.value.trim();save();flash(L('حُدِّثت بيانات المشروع ✓','Project info updated ✓'))};
});
if($('citySel'))$('citySel').onchange=e=>{
 const c=CITIES[e.target.value];if(!c)return;snap(true);
 state.site.city=e.target.value;
 if(e.target.value!=='custom'){state.site.lat=c.lat;state.site.lon=c.lon;state.site.tz=c.tz;state.site.wind=c.wind}
 siteChanged();save();flash(L('تم ضبط الموقع الجغرافي: ','Geographic location set: ')+dn('cities',e.target.value,c.n));
};
[['siteLat','lat'],['siteLon','lon'],['siteTz','tz'],['siteWind','wind']].forEach(([id,k])=>{
 if($(id))$(id).onchange=e=>{const v=parseFloat(e.target.value);if(isNaN(v))return;snap(true);state.site[k]=v;state.site.city='custom';siteChanged();save()};
});
['sW','sD','sFH','sSB','sN'].forEach(id=>$(id).onchange=()=>{const w=parseFloat($('sW').value),d=parseFloat($('sD').value),fh=parseFloat($('sFH').value),sb=parseFloat($('sSB').value)||0,n=parseFloat($('sN').value)||0;
 if(!(w>0&&d>0&&fh>0))return;snap(true);Object.assign(state.site,{w,d,sb,north:n});state.fh=fh;siteChanged();refresh()});
$('dSnap').onchange=e=>snapStep=parseFloat(e.target.value);
$('bEdge').onclick=()=>{edgeOn=!edgeOn;tg('bEdge',edgeOn)};
$('bMulti').onclick=()=>{multiMode=!multiMode;tg('bMulti',multiMode);flash(multiMode?L('التحديد المتعدد مفعّل: كل نقرة تضيف كتلة','Multi-select ON: click to add blocks'):L('التحديد المتعدد متوقف','Multi-select OFF'))};
$('bAll').onclick=()=>{selSet=new Set(state.blocks.map((_,i)=>i));sel=state.blocks.length-1;refresh()};
// image
$('bImg').onclick=()=>$('imgFile').click();
$('imgFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{const im=new Image();im.onload=()=>{
  const mx=2048,k=Math.min(1,mx/Math.max(im.width,im.height));const cv=document.createElement('canvas');cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);
  cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);imgData=cv.toDataURL('image/jpeg',.85);
  let ok=true;try{localStorage.setItem('mc3d_img',imgData)}catch(er){ok=false}
  snap(true);state.img={w:state.site.w*2,ar:cv.height/cv.width,x:0,z:0,rot:0,op:.85,show:true};siteChanged();save();view('top');
  flash(ok?L('رُفعت الصورة — أجرِ الآن معايرة بنقطتين لضبط المقياس','Image uploaded — run 2-point calibration to set scale'):L('رُفعت الصورة، لكنها كبيرة ولم تُحفظ في المتصفح (ستُحذف عند إغلاق الصفحة)','Image loaded, too large for local cache (session only)'))};im.src=rd.result};rd.readAsDataURL(f);e.target.value=''};
$('bImgShow').onclick=()=>{if(!state.img)return;state.img.show=!state.img.show;siteChanged();save()};
$('iOp').oninput=e=>{if(!state.img)return;state.img.op=parseFloat(e.target.value);buildImg();save()};
[['iW','w'],['iR','rot'],['iX','x'],['iZ','z']].forEach(([id,k])=>$(id).onchange=e=>{if(!state.img)return;const v=parseFloat(e.target.value);if(isNaN(v)||(k==='w'&&v<=0))return;snap(true);state.img[k]=v;buildImg();save()});
$('bImgDel').onclick=e=>{if(!state.img)return;arm(e.currentTarget,()=>{snap(true);state.img=null;imgData=null;try{localStorage.removeItem('mc3d_img')}catch(er){}siteChanged();save()})};
$('bCal').onclick=()=>{if(!state.img||!imgData)return flash(L('ارفع صورة الموقع أولاً','Upload a site image first'));setTool('cal');view('top');flash(L('انقر نقطتين على الصورة تعرف المسافة الحقيقية بينهما (مثل عرض شارع أو ضلع القطعة)','Click 2 points on the image with a known real-world distance'))};
$('calOk').onclick=()=>{const real=parseFloat($('calD').value);if(!(real>0)||!mp.a||!mp.b)return;const dm=mp.a.distanceTo(mp.b);if(dm<.01)return;const k=real/dm,im=state.img;snap(true);
 im.x=mp.a.x+(im.x-mp.a.x)*k;im.z=mp.a.z+(im.z-mp.a.z)*k;im.w*=k;$('calBox').style.display='none';clearMeas();setTool('select');siteChanged();save();flash(L('تمت المعايرة ✓ — حرّك الصورة الآن (إزاحة/تدوير) لتنطبق على القطعة','Calibrated ✓ — adjust image X/Z offset & rotation to align with site'))};

// ---------- sun & section ----------
$('bSunOn').onclick=()=>{state.sun.on=!state.sun.on;setSun();save()};
$('sunDate').onchange=e=>{state.sun.date=e.target.value;setSun();save()};
$('sunH').oninput=e=>{state.sun.hour=parseFloat(e.target.value);setSun()};$('sunH').onchange=save;
document.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{state.sun.date=state.sun.date.slice(0,4)+'-'+b.dataset.d;state.sun.on=true;setSun();save()});
$('bSunPlay').onclick=()=>{playing=!playing;$('bSunPlay').classList.toggle('on',playing);if(playing){state.sun.on=true;if(state.sun.hour>=19)state.sun.hour=5.5}};
function disposeGroupChildren(g){
 while(g.children.length){
  const c=g.children[0];g.remove(c);
  if(c.geometry)c.geometry.dispose();
  if(c.material)c.material.dispose();
 }
}
function alignCamToSection(){
 const m=Math.max(state.site.w,state.site.d);
 if(sec.axis==='y'){view('top');return}
 const p=window.MC3D_SECTION?MC3D_SECTION.buildSectionPlaneParams({axis:sec.axis,pos:sec.pos,flip:sec.flip,angleDeg:sec.angle}):null;
 const n=p?p.normal:{x:sec.axis==='x'?(sec.flip?1:-1):0,y:0,z:sec.axis==='z'?(sec.flip?1:-1):0};
 const hc=Math.min(maxH()/2,m*.3);
 camO.up.set(0,1,0);usePlan(false);usePlan('elev');
 O.target.set(0,hc,0);
 camO.position.set(n.x*m*3,hc,n.z*m*3);
 camO.zoom=1;camO.updateProjectionMatrix();O.update();
}
function renderSectionAnalysis(){
 if(!window.MC3D_SECTION)return;
 const analysis=MC3D_SECTION.analyzeSectionCut({
  blocks:state.blocks,fh:state.fh,axis:sec.axis,pos:sec.pos,flip:sec.flip,
  angleDeg:sec.angle||0,sliceOn:!!sec.slice,thickness:sec.thick||12
 });
 function addYCap(item,yCap){
  if(!item.rings||!item.rings.length)return;
  const sh=new THREE.Shape();
  item.rings[0].forEach(([x,z],k)=>k?sh.lineTo(x,-z):sh.moveTo(x,-z));
  for(let h=1;h<item.rings.length;h++){
   const ho=new THREE.Path();
   item.rings[h].forEach(([x,z],k)=>k?ho.lineTo(x,-z):ho.moveTo(x,-z));
   sh.holes.push(ho);
  }
  const geo=new THREE.ShapeGeometry(sh);geo.rotateX(-Math.PI/2);
  const fill=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:'#1e293b',side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
  fill.position.y=yCap;secCapsG.add(fill);
  const edge=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:'#0f172a'}));
  edge.position.y=yCap+0.01;secCapsG.add(edge);
 }
 function addVCap(seg,pt,nrm,tan,eps){
  const wSpan=seg.u1-seg.u0,hSpan=seg.y1-seg.y0;
  if(wSpan<0.05||hSpan<0.05)return;
  const uMid=(seg.u0+seg.u1)/2,yMid=(seg.y0+seg.y1)/2;
  const yaw=Math.atan2(tan.x,tan.z)-Math.PI/2;
  const geo=new THREE.PlaneGeometry(wSpan,hSpan);
  const fill=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:'#1e293b',side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
  fill.position.set(pt.x+tan.x*uMid+nrm.x*eps,yMid,pt.z+tan.z*uMid+nrm.z*eps);
  fill.rotation.y=yaw;
  secCapsG.add(fill);
  const edge=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:'#0f172a'}));
  edge.position.copy(fill.position).addScaledVector(new THREE.Vector3(nrm.x,0,nrm.z),0.015);
  edge.rotation.y=yaw;
  secCapsG.add(edge);
 }
 // 3D Solid Poche Cut Caps
 disposeGroupChildren(secCapsG);
 if(sec.on&&sec.cap!==false){
  const {normal,point,tangent,second}=analysis.params;
  const eps=0.03;
  if(sec.axis==='y'){
   const yCap=sec.pos+(sec.flip?eps:-eps);
   analysis.cutItems.forEach(item=>addYCap(item,yCap));
   if(sec.slice&&second&&analysis.cutItems2){
    const yCap2=second.point.y+(second.normal.y>0?eps:-eps);
    analysis.cutItems2.forEach(item=>addYCap(item,yCap2));
   }
  }else{
   analysis.capSegments.forEach(seg=>addVCap(seg,point,normal,tangent,eps));
   if(sec.slice&&second&&analysis.capSegments2){
    analysis.capSegments2.forEach(seg=>addVCap(seg,second.point,second.normal,tangent,eps));
   }
  }
 }
 // Inspector KPIs & Live 2D SVG Diagram
 if($('secCutCnt'))$('secCutCnt').textContent=String(analysis.cutCount);
 if($('secCutArea'))$('secCutArea').textContent=Math.round(analysis.totalCutArea).toLocaleString('en');
 if($('secCutH'))$('secCutH').textContent=analysis.maxCutHeight?analysis.maxCutHeight.toFixed(1):'0';
 if($('secAreaUnit'))$('secAreaUnit').textContent=L('م²','m²');
 if($('secHeightUnit'))$('secHeightUnit').textContent=L('م','m');
 const svg=$('secDiagram');
 if(svg){
  const W=268,H=142,pad=16;
  let out=[];
  if(sec.axis==='y'){
   const sw=state.site.w||100,sd=state.site.d||100;
   const sc=Math.min((W-pad*2)/sw,(H-pad*2)/sd);
   const cx=W/2,cy=H/2;
   out.push(`<rect x="${(cx-sw*sc/2).toFixed(1)}" y="${(cy-sd*sc/2).toFixed(1)}" width="${(sw*sc).toFixed(1)}" height="${(sd*sc).toFixed(1)}" fill="#f8fafc" stroke="#cbd5e1" stroke-dasharray="3 2"/>`);
   analysis.cutItems.forEach(item=>{
    const b=state.blocks[item.index];const col=b?colOf(b):'#334155';
    const selCls=selSet.has(item.index)?' is-sel':'';
    const dPath=(item.rings||[]).map(ring=>'M'+ring.map(([x,z])=>`${(cx+x*sc).toFixed(1)},${(cy+z*sc).toFixed(1)}`).join('L')+'Z').join(' ');
    if(dPath)out.push(`<path class="sec-cut-shape${selCls}" data-bi="${item.index}" d="${dPath}" fill="${col}" fill-opacity="0.82" fill-rule="evenodd" stroke="#0f172a" stroke-width="1.2"><title>${item.name}</title></path>`);
   });
   out.push(`<text x="8" y="13" text-anchor="start" font-size="10" fill="#64748b" font-family="IBM Plex Mono,monospace">EL +${sec.pos.toFixed(1)}m</text>`);
  }else{
   const m=Math.max(state.site.w,state.site.d)*1.05;
   const uMin=-m/2,uMax=m/2;
   const maxH_=Math.max(16,analysis.maxCutHeight+4);
   const xOf=u=>pad+((u-uMin)/(uMax-uMin))*(W-pad*2);
   const yOf=y=>H-18-((y/maxH_)*(H-30));
   // Floor gridlines
   for(let lv=state.fh;lv<maxH_;lv+=state.fh){
    const yy=yOf(lv);
    out.push(`<line x1="${pad}" y1="${yy.toFixed(1)}" x2="${W-pad}" y2="${yy.toFixed(1)}" stroke="#e2e8f0" stroke-dasharray="2 2"/>`);
   }
   // Ground line
   const gy=yOf(0);
   out.push(`<line x1="6" y1="${gy.toFixed(1)}" x2="${W-6}" y2="${gy.toFixed(1)}" stroke="#475569" stroke-width="1.4"/>`);
   analysis.capSegments.forEach(seg=>{
    const b=state.blocks[seg.index];const col=b?colOf(b):'#334155';
    const selCls=selSet.has(seg.index)?' is-sel':'';
    const x0=xOf(seg.u0),x1=xOf(seg.u1),yTop=yOf(seg.y1),yBot=yOf(seg.y0);
    const rw=Math.max(1.5,x1-x0),rh=Math.max(1.5,yBot-yTop);
    out.push(`<rect class="sec-cut-shape${selCls}" data-bi="${seg.index}" x="${x0.toFixed(1)}" y="${yTop.toFixed(1)}" width="${rw.toFixed(1)}" height="${rh.toFixed(1)}" fill="${col}" fill-opacity="0.82" stroke="#0f172a" stroke-width="1.2"><title>${seg.name} (${seg.y1.toFixed(1)}m)</title></rect>`);
   });
   if(!analysis.capSegments.length){
    out.push(`<text x="${W/2}" y="${H/2}" text-anchor="middle" font-size="11" fill="#94a3b8">${L('لا توجد كتل عند هذا الموضع','No masses intersected at this position')}</text>`);
   }
   out.push(`<text x="8" y="13" text-anchor="start" font-size="10" fill="#64748b" font-family="IBM Plex Mono,monospace">${sec.axis.toUpperCase()} ${sec.pos.toFixed(1)}m${sec.angle?' · '+sec.angle+'°':''}</text>`);
  }
  svg.innerHTML=out.join('');
  svg.querySelectorAll('.sec-cut-shape').forEach(el=>{
   el.onclick=()=>{const i=parseInt(el.dataset.bi);if(!isNaN(i)&&state.blocks[i]){setSel(i);lastSelPanel=String(i);refresh()}};
  });
 }
 const list=$('secCutList');
 if(list){
  list.innerHTML=analysis.cutItems.slice(0,8).map(it=>{
   const b=state.blocks[it.index];const col=b?colOf(b):'#334155';
   const cls=selSet.has(it.index)?'sec-chip on':'sec-chip';
   return `<button type="button" class="${cls}" data-bi="${it.index}"><span class="sw" style="background:${col}"></span><span>${it.name}</span></button>`;
  }).join('');
  list.querySelectorAll('.sec-chip').forEach(bt=>{
   bt.onclick=()=>{const i=parseInt(bt.dataset.bi);if(!isNaN(i)&&state.blocks[i]){setSel(i);lastSelPanel=String(i);refresh()}};
  });
 }
}
function applySec(){
 const params=window.MC3D_SECTION?MC3D_SECTION.buildSectionPlaneParams({
  axis:sec.axis,pos:sec.pos,flip:sec.flip,angleDeg:sec.angle||0,sliceOn:!!sec.slice,thickness:sec.thick||12
 }):null;
 if(params){
  secPlane.normal.set(params.normal.x,params.normal.y,params.normal.z);
  secPlane.constant=params.constant;
  if(params.second){
   secPlane2.normal.set(params.second.normal.x,params.second.normal.y,params.second.normal.z);
   secPlane2.constant=params.second.constant;
  }
 }else{
  const n=sec.axis==='x'?new THREE.Vector3(1,0,0):sec.axis==='y'?new THREE.Vector3(0,1,0):new THREE.Vector3(0,0,1);
  if(!sec.flip)n.negate();secPlane.normal.copy(n);secPlane.constant=sec.flip?-sec.pos:sec.pos;
 }
 clipArr.length=0;
 if(sec.on){clipArr.push(secPlane);if(sec.slice&&params&&params.second)clipArr.push(secPlane2)}
 const m=Math.max(state.site.w,state.site.d);
 const frameH=Math.max(40,maxH()+12);
 const p0=params?params.point:{x:sec.axis==='x'?sec.pos:0,y:sec.axis==='y'?sec.pos:0,z:sec.axis==='z'?sec.pos:0};
 const tan=params?params.tangent:{x:sec.axis==='z'?1:0,y:0,z:sec.axis==='x'?-1:0};
 if(sec.axis==='y'){
  secVisM.scale.set(m*1.05,m*1.05,1);secVisM.position.set(0,sec.pos,0);secVisM.rotation.set(-Math.PI/2,0,0);
  secVisB.scale.set(m*1.05,m*1.05,1);secVisB.position.set(0,sec.pos,0);secVisB.rotation.set(-Math.PI/2,0,0);
  if(sec.slice&&params&&params.second){
   secVisM2.visible=secVisB2.visible=true;
   secVisM2.scale.set(m*1.05,m*1.05,1);secVisM2.position.set(0,params.second.point.y,0);secVisM2.rotation.set(-Math.PI/2,0,0);
   secVisB2.scale.set(m*1.05,m*1.05,1);secVisB2.position.set(0,params.second.point.y,0);secVisB2.rotation.set(-Math.PI/2,0,0);
  }else{secVisM2.visible=secVisB2.visible=false}
 }else{
  const yaw=Math.atan2(tan.x,tan.z)-Math.PI/2;
  secVisM.scale.set(m*1.1,frameH,1);secVisM.position.set(p0.x,frameH/2,p0.z);secVisM.rotation.set(0,yaw,0);
  secVisB.scale.set(m*1.1,frameH,1);secVisB.position.set(p0.x,frameH/2,p0.z);secVisB.rotation.set(0,yaw,0);
  if(sec.slice&&params&&params.second){
   secVisM2.visible=secVisB2.visible=true;
   const p2=params.second.point;
   secVisM2.scale.set(m*1.1,frameH,1);secVisM2.position.set(p2.x,frameH/2,p2.z);secVisM2.rotation.set(0,yaw,0);
   secVisB2.scale.set(m*1.1,frameH,1);secVisB2.position.set(p2.x,frameH/2,p2.z);secVisB2.rotation.set(0,yaw,0);
  }else{secVisM2.visible=secVisB2.visible=false}
 }
 secVis.visible=sec.on&&sec.showFrame!==false;
 if($('secLvlWrap'))$('secLvlWrap').style.display=sec.axis==='y'?'flex':'none';
 if($('secAngWrap'))$('secAngWrap').style.display=sec.axis==='y'?'none':'flex';
 const pMin=sec.axis==='y'?0:-Math.round(m*.6),pMax=sec.axis==='y'?Math.max(40,Math.ceil(maxH()+8)):Math.round(m*.6);
 $('secPos').min=pMin;$('secPos').max=pMax;$('secPos').value=sec.pos;
 if($('secPosNum')){$('secPosNum').min=pMin;$('secPosNum').max=pMax;$('secPosNum').value=sec.pos.toFixed(1)}
 if($('secAng'))$('secAng').value=sec.angle||0;
 if($('secAngL'))$('secAngL').textContent=(sec.angle||0)+'°';
 if($('secSlice'))$('secSlice').classList.toggle('on',!!sec.slice);
 if($('secThick')){$('secThick').disabled=!sec.slice;$('secThick').value=sec.thick||12}
 if($('secThickWrap'))$('secThickWrap').style.opacity=sec.slice?'1':'0.55';
 if($('secThickL'))$('secThickL').textContent=(sec.thick||12)+' '+L('م','m');
 $('secY').classList.toggle('on',sec.axis==='y');
 $('secPL').textContent=sec.pos.toFixed(1)+' '+L('م','m');$('secX').classList.toggle('on',sec.axis==='x');$('secZ').classList.toggle('on',sec.axis==='z');
 $('bSec').classList.toggle('on',sec.on);$('secFlip').classList.toggle('on',sec.flip);
 if($('secCap'))$('secCap').classList.toggle('on',sec.cap!==false);
 if($('secFrame'))$('secFrame').classList.toggle('on',sec.showFrame!==false);
 renderSectionAnalysis();
}
function setSecOn(on){sec.on=on;clipArr.length=0;if(on){clipArr.push(secPlane);if(sec.slice)clipArr.push(secPlane2)}applySec();build()}
$('bSec').onclick=()=>{setSecOn(!sec.on)};
$('secX').onclick=()=>{sec.axis='x';applySec()};
$('secZ').onclick=()=>{sec.axis='z';applySec()};
$('secFlip').onclick=()=>{sec.flip=!sec.flip;applySec()};
if($('secViewCut'))$('secViewCut').onclick=()=>{if(!sec.on)setSecOn(true);alignCamToSection()};
if($('secCap'))$('secCap').onclick=()=>{sec.cap=sec.cap===false;applySec()};
if($('secFrame'))$('secFrame').onclick=()=>{sec.showFrame=sec.showFrame===false;applySec()};
$('secY').onclick=()=>{sec.axis='y';sec.flip=false;sec.pos=1.2;fillLvls();if(!sec.on)setSecOn(true);else applySec()};
function fillLvls(){const mx=Math.max(1,...state.blocks.filter(counts).map(b=>Math.round((b.y0+b.f*state.fh)/state.fh)));$('secLvl').innerHTML=Array.from({length:mx},(_,k)=>`<option value="${k}">${k===0?L('الطابق الأرضي','Ground Floor'):L('الطابق '+k,'Floor '+k)}</option>`).join('')}
$('secLvl').onchange=e=>{sec.pos=parseInt(e.target.value)*state.fh+1.2;applySec()};
$('secPos').oninput=e=>{sec.pos=parseFloat(e.target.value);applySec()};
if($('secPosNum'))$('secPosNum').onchange=e=>{const v=parseFloat(e.target.value);if(!isNaN(v)){sec.pos=v;applySec()}};
if($('secStepM'))$('secStepM').onclick=()=>{sec.pos=+(sec.pos-1).toFixed(1);applySec()};
if($('secStepP'))$('secStepP').onclick=()=>{sec.pos=+(sec.pos+1).toFixed(1);applySec()};
if($('secZero'))$('secZero').onclick=()=>{sec.pos=sec.axis==='y'?1.2:0;applySec()};
if($('secAng'))$('secAng').oninput=e=>{sec.angle=parseInt(e.target.value)||0;applySec()};
if($('secAngZero'))$('secAngZero').onclick=()=>{sec.angle=0;applySec()};
if($('secSlice'))$('secSlice').onclick=()=>{sec.slice=!sec.slice;setSecOn(sec.on)};
if($('secThick'))$('secThick').oninput=e=>{sec.thick=parseInt(e.target.value)||12;applySec()};
if($('secShot'))$('secShot').onclick=()=>{if(!sec.on)setSecOn(true);captureView()};
if($('secReset'))$('secReset').onclick=()=>{Object.assign(sec,{axis:'x',pos:0,flip:false,angle:0,slice:false,thick:12,cap:true,showFrame:true});setSecOn(sec.on)};

// ---------- view ----------
let orthoMode=false;
function usePlan(mode){mode=mode||false;if(mode===orthoMode&&!!mode===isPlan)return;orthoMode=mode;isPlan=!!mode;const t=O.target.clone();O.dispose();C=isPlan?camO:camP;O=makeControls(C);
 if(isPlan){O.enableRotate=false;O.mouseButtons={LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};O.touches={ONE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_PAN}}
 O.target.copy(t);fit();tg('bPlan',mode==='top')}
const camIdx={iso:0,eye:0,front:0,side:0};
const VNAME={iso:['أيزو — الجنوب الشرقي','أيزو — الجنوب الغربي','أيزو — الشمال الغربي','أيزو — الشمال الشرقي'],front:['الواجهة الأمامية (الجنوبية)','الواجهة الخلفية (الشمالية)'],side:['الواجهة الجانبية (الشرقية)','الواجهة الجانبية (الغربية)']};
function maxH(){let h=4;state.blocks.forEach(b=>{if(counts(b))h=Math.max(h,b.y0+b.f*state.fh)});return h}
function view(v,k){const m=Math.max(state.site.w,state.site.d);if(v==='isoB'){v='iso';k=2}if(k===undefined)k=camIdx[v]||0;
 if(v==='top'){camO.up.set(0,0,-1);usePlan(false);usePlan('top');O.target.set(0,0,0);camO.position.set(0,m*3,0);camO.zoom=1;camO.updateProjectionMatrix();O.update();return}
 if(v==='front'||v==='side'){const hc=Math.min(maxH()/2,m*.3),dir=v==='front'?(k%2?[0,-1]:[0,1]):(k%2?[-1,0]:[1,0]);camO.up.set(0,1,0);usePlan(false);usePlan('elev');O.target.set(0,hc,0);camO.position.set(dir[0]*m*3,hc,dir[1]*m*3);camO.zoom=1;camO.updateProjectionMatrix();O.update();return}
 usePlan(false);O.target.set(0,0,0);
 if(v==='iso'){const a=Math.PI/4+k*Math.PI/2,r=m*1.34;C.position.set(Math.cos(a)*r,m*.85,Math.sin(a)*r)}
 if(v==='eye'){const a=Math.PI/8+k*Math.PI/4,r=m*.72;C.position.set(Math.cos(a)*r,1.7,Math.sin(a)*r);O.target.set(0,Math.min(8,maxH()*.5),0)}O.update()}
function cycleView(v){const N={iso:4,eye:8,front:2,side:2}[v];if(N){camIdx[v]=(camIdx[v]+1)%N;view(v,camIdx[v]);const nm=VNAME[v]?dn('vname',v,VNAME[v])[camIdx[v]]:L('منظور عين — موقع '+(camIdx[v]+1)+' من 8','Eye-Level — Angle '+(camIdx[v]+1)+' of 8');flash(nm+' · '+L('انقر مرة أخرى للزاوية التالية','Click again for next angle'))}else view(v)}
document.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>cycleView(b.dataset.v));
$('bPlan').onclick=()=>{if(orthoMode==='top')view('iso');else view('top')};
$('qHelp').onclick=()=>{modal('help')};
function tg(id,on){$(id).classList.toggle('on',!!on)}
$('bGrid').onclick=()=>{showGrid=!showGrid;tg('bGrid',showGrid);if(grid)grid.visible=showGrid};
$('bNames').onclick=()=>{showNames=!showNames;tg('bNames',showNames);renderNames(true)};
$('bDims').onclick=()=>{showDims=!showDims;tg('bDims',showDims)};
function setColor(m){colorMode=m;[['cMat','mat'],['cFn','fn'],['cWhite','white'],['cXray','xray']].forEach(([id,v])=>tg(id,m===v));build();renderNames(true)}
$('cMat').onclick=()=>setColor('mat');$('cFn').onclick=()=>setColor('fn');$('cWhite').onclick=()=>setColor('white');$('cXray').onclick=()=>setColor('xray');
function setTool(t){if(typeof cancelPoly==='function'&&polyD&&t!=='draw')cancelPoly();tool=t;buildHandles();tg('tCut',t==='cut');if(t==='cut'){mLine.visible=false;flash(L('اسحب خطاً عبر الكتلة لقصها إلى جزأين — الأسهل من وضع المسقط','Drag a line across a mass to split it in two (best in 2D Plan)'))}if(typeof galSync==='function')setTimeout(galSync,0);tg('tSel',t==='select');tg('tDraw',t==='draw');tg('tMeas',t==='meas');R.domElement.style.cursor=t==='select'?'default':'crosshair';
 if(t!=='meas'&&t!=='cal')clearMeas();if(t==='draw')flash($('dShape').value==='poly'?L('مضلع حر: انقر نقاط الشكل واحدة تلو الأخرى، وأغلقه بالنقر على أول نقطة','Polygon: click points on the ground, then click the start point to close'):PROPS[$('dShape').value]?L('انقر على الأرض لوضع العنصر','Click on the ground to place item'):L('اسحب على الأرض لرسم كتلة','Drag on the ground to draw a mass'));if(t==='meas')flash(L('انقر نقطتين لقياس المسافة','Click 2 points to measure distance'))}
$('tSel').onclick=()=>setTool('select');$('tCut').onclick=()=>setTool(tool==='cut'?'select':'cut');$('tDraw').onclick=()=>setTool('draw');$('tMeas').onclick=()=>setTool('meas');
$('tUndo').onclick=doUndo;$('tRedo').onclick=doRedo;$('qUndo').onclick=doUndo;$('qRedo').onclick=doRedo;

// ---------- interaction ----------
const ray=new THREE.Raycaster(),mv=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
let drawing=null,dragging=null,down=null;
const prev=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:'#ffb000',transparent:true,opacity:.35,depthWrite:false}));prev.visible=false;S.add(prev);
function ndc(e){const r=R.domElement.getBoundingClientRect();mv.x=((e.clientX-r.left)/r.width)*2-1;mv.y=-((e.clientY-r.top)/r.height)*2+1;ray.setFromCamera(mv,C)}
function gpt(e){ndc(e);const p=new THREE.Vector3();return ray.ray.intersectPlane(plane,p)?p:null}
const sn=v=>Math.round(v/snapStep)*snapStep;
const TH=()=>Math.max(.6,snapStep*.8);
function edgeLists(excl){const xs=[],zs=[];state.blocks.forEach((b,i)=>{if(excl&&excl.has(i)||isProp(b))return;xs.push(b.x-b.w/2,b.x+b.w/2,b.x);zs.push(b.z-b.d/2,b.z+b.d/2,b.z)});
 const st=state.site;xs.push(-st.w/2,st.w/2,0);zs.push(-st.d/2,st.d/2,0);if(st.sb>0){xs.push(-st.w/2+st.sb,st.w/2-st.sb);zs.push(-st.d/2+st.sb,st.d/2-st.sb)}return {xs,zs}}
function near(v,arr){let best=null,bd=TH();for(const e of arr){const d=Math.abs(e-v);if(d<bd){bd=d;best=e}}return best}
function snapPt(p){let x=sn(p.x),z=sn(p.z);if(edgeOn){const {xs,zs}=edgeLists(null);const ex=near(p.x,xs),ez=near(p.z,zs);if(ex!==null)x=ex;if(ez!==null)z=ez}return new THREE.Vector3(x,0,z)}
function defH(){const sh=$('dShape').value;if(PROPS[sh])return 2;return FLAT.includes($('dMat').value)?0.3:Math.max(1,parseInt($('dF').value)||1)*state.fh}
function updPrev(){const d=drawing,w=Math.max(.2,Math.abs(d.x1-d.x0)),dd=Math.max(.2,Math.abs(d.z1-d.z0)),h=defH();prev.scale.set(w,h,dd);prev.position.set((d.x0+d.x1)/2,h/2,(d.z0+d.z1)/2);prev.visible=true}
// measure
let mp={a:null,b:null,hover:null};const mLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:'#e53935',depthTest:false}));mLine.renderOrder=999;mLine.visible=false;S.add(mLine);
const mDots=[0,1].map(()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.45,10,8),new THREE.MeshBasicMaterial({color:'#e53935',depthTest:false}));m.renderOrder=999;m.visible=false;S.add(m);return m});
function clearMeas(){mp={a:null,b:null,hover:null};mLine.visible=false;mDots.forEach(d=>d.visible=false);$('mlab').style.display='none';$('calBox').style.display='none'}
function updMeas(){const a=mp.a,b=mp.b||mp.hover;mDots[0].visible=!!a;if(a)mDots[0].position.set(a.x,.3,a.z);mDots[1].visible=!!mp.b;if(mp.b)mDots[1].position.set(mp.b.x,.3,mp.b.z);
 if(a&&b){mLine.geometry.setFromPoints([new THREE.Vector3(a.x,.3,a.z),new THREE.Vector3(b.x,.3,b.z)]);mLine.visible=true}else mLine.visible=false}
function pickPt(s){if(!mp.a||mp.b){mp={a:s,b:null,hover:null}}else{mp.b=s;if(tool==='cal'){$('calBox').style.display='flex';$('calD').focus();flash(L('أدخل المسافة الحقيقية بين النقطتين وانقر تطبيق','Enter the real distance between the two points and click Apply'))}}updMeas()}
let resizing=null,pending=null,ctxDown=null;
el.addEventListener('pointerdown',e=>{hideCtx();if(e.button===2){ctxDown={x:e.clientX,y:e.clientY};return}if(e.button!==0)return;down={x:e.clientX,y:e.clientY};const p=gpt(e);
 if(tool==='draw'&&$('dShape').value==='poly'){if(!p)return;polyClick(snapPt(p));return}
 if(tool==='draw'){if(!p)return;O.enabled=false;const s=snapPt(p);drawing={x0:s.x,z0:s.z,x1:s.x,z1:s.z};updPrev();return}
 if(tool==='meas'||tool==='cal'){if(!p)return;O.enabled=false;pickPt(tool==='cal'?p.clone():snapPt(p));return}
 if(tool==='cut'){if(!p)return;O.enabled=false;const s=snapPt(p);cutting={a:s,b:s.clone()};updCut();return}
 ndc(e);const hh=ray.intersectObjects(handles)[0];
 if(hh){const b=state.blocks[sel];snap(true);resizing={k:hh.object.userData.h,b,x1:b.x-b.w/2,x2:b.x+b.w/2,z1:b.z-b.d/2,z2:b.z+b.d/2};O.enabled=false;return}
 const h=ray.intersectObjects(pickables())[0];
 if(h){const i=h.object.userData.i,b=state.blocks[i];
  if(selSet.has(i)&&!e.shiftKey&&!multiMode&&p){if(b.lock){flash(L('الكتلة مقفلة — يمكن تعديلها من تبويب تعديل الكتلة','Mass is locked — edit it in the Edit Mass panel'));return}
   dragging={i,p0:p.clone(),orig:[...selSet].filter(k=>!state.blocks[k].lock).map(k=>({k,x:state.blocks[k].x,z:state.blocks[k].z})),moved:false};O.enabled=false;return}
  pending={i,shift:e.shiftKey||multiMode}}},true);
addEventListener('pointermove',e=>{
 if(polyD&&e.target===R.domElement){const p=gpt(e);if(p){polyD.hover=snapPt(p);updPoly()}}
 if(drawing){const p=gpt(e);if(p){const s=snapPt(p);drawing.x1=s.x;drawing.z1=s.z;updPrev()}return}
 if(cutting){const p=gpt(e);if(p){const s=snapPt(p),a=cutting.a;if(Math.abs(s.x-a.x)>=Math.abs(s.z-a.z))s.z=a.z;else s.x=a.x;cutting.b=s;updCut()}return}
 if((tool==='meas'||tool==='cal')&&mp.a&&!mp.b&&e.target===R.domElement){const p=gpt(e);if(p){mp.hover=tool==='cal'?p:snapPt(p);updMeas()}return}
 if(resizing){const r=resizing,b=r.b;
  if(r.k==='H'){ndc(e);const n=new THREE.Vector3(C.position.x-b.x,0,C.position.z-b.z).normalize();const vp=new THREE.Plane().setFromNormalAndCoplanarPoint(n,new THREE.Vector3(b.x,0,b.z));const q=new THREE.Vector3();
   if(ray.ray.intersectPlane(vp,q)){const nf=Math.max(1,Math.round((q.y-b.y0)/state.fh));if(nf!==b.f){b.f=nf;rebuildOne(sel)}}return}
  const p=gpt(e);if(!p)return;let s=sn(p[r.k==='R'||r.k==='L'?'x':'z']);
  if(edgeOn){const {xs,zs}=edgeLists(new Set([sel]));const ev=near(p[r.k==='R'||r.k==='L'?'x':'z'],r.k==='R'||r.k==='L'?xs:zs);if(ev!==null)s=ev}
  let {x1,x2,z1,z2}=r;if(r.k==='R')x2=Math.max(x1+1,s);if(r.k==='L')x1=Math.min(x2-1,s);if(r.k==='B')z2=Math.max(z1+1,s);if(r.k==='T')z1=Math.min(z2-1,s);
  b.w=+(x2-x1).toFixed(3);b.x=+((x1+x2)/2).toFixed(3);b.d=+(z2-z1).toFixed(3);b.z=+((z1+z2)/2).toFixed(3);rebuildOne(sel);return}
 if(dragging){if(!dragging.moved){if(Math.hypot(e.clientX-down.x,e.clientY-down.y)<4)return;snap(true);dragging.moved=true;hG.clear()}
  if(!dragging.orig.length)return;const p=gpt(e);if(!p)return;const pr=state.blocks[dragging.i],o=dragging.orig.find(q=>q.k===dragging.i)||dragging.orig[0];
  let dx=p.x-dragging.p0.x,dz=p.z-dragging.p0.z;dx=sn(o.x-pr.w/2+dx)+pr.w/2-o.x;dz=sn(o.z-pr.d/2+dz)+pr.d/2-o.z;
  if(edgeOn){const {xs,zs}=edgeLists(selSet);let a=1e9,b=-1e9,c=1e9,d=-1e9;dragging.orig.forEach(q=>{const bb=state.blocks[q.k];a=Math.min(a,q.x-bb.w/2);b=Math.max(b,q.x+bb.w/2);c=Math.min(c,q.z-bb.d/2);d=Math.max(d,q.z+bb.d/2)});
   const adj=(lo,hi,arr)=>{let best=0,bd=TH();for(const ev of arr)for(const v of [lo,hi,(lo+hi)/2]){const df=ev-v;if(Math.abs(df)<bd){bd=Math.abs(df);best=df}}return best};
   dx+=adj(a+dx,b+dx,xs);dz+=adj(c+dz,d+dz,zs)}
  dragging.orig.forEach(q=>{const b=state.blocks[q.k];b.x=+(q.x+dx).toFixed(3);b.z=+(q.z+dz).toFixed(3);const g=groups[q.k];if(g){g.position.x=b.x;g.position.z=b.z}})}});
let cutting=null,polyD=null;
addEventListener('pointermove',e=>{if(typeof updateShadowProbe==='function')updateShadowProbe(e)});
const polyLine=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:'#ff8f00',depthTest:false}));polyLine.renderOrder=1001;polyLine.visible=false;S.add(polyLine);
function updPoly(){if(!polyD){polyLine.visible=false;return}const y=.4,pts=polyD.pts.map(p=>new THREE.Vector3(p.x,y,p.z));if(polyD.hover)pts.push(new THREE.Vector3(polyD.hover.x,y,polyD.hover.z));if(polyD.pts.length>=2)pts.push(new THREE.Vector3(polyD.pts[0].x,y,polyD.pts[0].z));
 polyLine.geometry.dispose();polyLine.geometry=new THREE.BufferGeometry().setFromPoints(pts);polyLine.visible=pts.length>1;mDots[0].visible=true;mDots[0].position.set(polyD.pts[0].x,y,polyD.pts[0].z)}
function polyClick(s){const now=Date.now();if(!polyD){polyD={pts:[s],t:now};flash(L('مضلع حر: انقر نقاط الشكل — انقر على أول نقطة أو انقر نقراً مزدوجاً أو Enter للإغلاق · Backspace يحذف آخر نقطة · Esc إلغاء','Polygon: click points — click start, double-click, or Enter to close · Backspace removes last · Esc cancels'));updPoly();return}
 const f=polyD.pts[0],last=polyD.pts[polyD.pts.length-1];
 if(polyD.pts.length>=3&&(Math.hypot(s.x-f.x,s.z-f.z)<TH()*1.5||(now-polyD.t<350&&Math.hypot(s.x-last.x,s.z-last.z)<TH()))){finishPoly();return}
 if(Math.hypot(s.x-last.x,s.z-last.z)<.2){polyD.t=now;return}polyD.pts.push(s);polyD.t=now;updPoly()}
function finishPoly(){const P=polyD&&polyD.pts;polyD=null;polyLine.visible=false;mDots[0].visible=false;if(!P||P.length<3)return flash(L('المضلع يحتاج 3 نقاط على الأقل','Polygon needs at least 3 points'));
 let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;P.forEach(p=>{x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);z0=Math.min(z0,p.z);z1=Math.max(z1,p.z)});const cx=(x0+x1)/2,cz=(z0+z1)/2;
 if(x1-x0<.5||z1-z0<.5)return flash(L('المضلع صغير جداً','Polygon is too small'));snap(true);const n=state.blocks.length+1;
 state.blocks.push(norm({name:L('مضلع ','Polygon ')+n,shape:'poly',pts:P.map(p=>[+(p.x-cx).toFixed(3),+(p.z-cz).toFixed(3)]),mat:$('dMat').value,fn:$('dFn').value,f:Math.max(1,parseInt($('dF').value)||1),x:cx,z:cz,w:+(x1-x0).toFixed(3),d:+(z1-z0).toFixed(3)}));setSel(state.blocks.length-1);refresh();flash(L('رُسم المضلع ✓','Polygon created ✓'))}
function cancelPoly(){polyD=null;polyLine.visible=false;mDots[0].visible=false}
function updCut(){const {a,b}=cutting;mLine.geometry.setFromPoints([new THREE.Vector3(a.x,maxH()+1,a.z),new THREE.Vector3(b.x,maxH()+1,b.z)]);mLine.visible=true;mDots[0].visible=true;mDots[0].position.set(a.x,maxH()+1,a.z);mDots[1].visible=true;mDots[1].position.set(b.x,maxH()+1,b.z)}
function doCut(a,b){const len=Math.hypot(b.x-a.x,b.z-a.z);if(len<1)return flash(L('اسحب خطاً أطول عبر الكتلة','Drag a longer cut line across the mass'));const hor=Math.abs(b.x-a.x)>=Math.abs(b.z-a.z);
 const lo=hor?Math.min(a.x,b.x):Math.min(a.z,b.z),hi=hor?Math.max(a.x,b.x):Math.max(a.z,b.z),c=hor?a.z:a.x;let skipped=0;const hits=[];
 state.blocks.forEach((bl,i)=>{if(bl.hidden||isProp(bl))return;const x1=bl.x-bl.w/2,x2=bl.x+bl.w/2,z1=bl.z-bl.d/2,z2=bl.z+bl.d/2;
  const crosses=hor?(c>z1+.3&&c<z2-.3&&lo<x2&&hi>x1):(c>x1+.3&&c<x2-.3&&lo<z2&&hi>z1);if(!crosses)return;
  if(selSet.size>1&&!selSet.has(i))return;if(bl.lock||(bl.rot%360)||!['box','riwaq'].includes(bl.shape)){skipped++;return}hits.push(i)});
 if(!hits.length)return flash(skipped?L('يعمل القص على الكتل المستطيلة غير المقفلة فقط','Cut works only on unlocked rectangular boxes'):L('الخط لا يقطع أي كتلة — اسحبه عبر الكتلة','Line does not cross any mass'));
 snap(true);const newIdx=[];[...hits].sort((p,q)=>q-p).forEach(i=>{const bl=state.blocks[i],A=clone(bl),B=clone(bl);
  if(hor){const z1=bl.z-bl.d/2,z2=bl.z+bl.d/2;A.d=+(c-z1).toFixed(3);A.z=+((z1+c)/2).toFixed(3);B.d=+(z2-c).toFixed(3);B.z=+((c+z2)/2).toFixed(3)}
  else{const x1=bl.x-bl.w/2,x2=bl.x+bl.w/2;A.w=+(c-x1).toFixed(3);A.x=+((x1+c)/2).toFixed(3);B.w=+(x2-c).toFixed(3);B.x=+((c+x2)/2).toFixed(3)}
  const base=bl.name.replace(/ \(\d\)$/,'');A.name=base+' (1)';B.name=base+' (2)';state.blocks.splice(i,1,A,B)});
 clearSel();refresh();
 flash(L(`قُصّت ${hits.length} كتلة إلى جزأين`+(skipped?` (${skipped} تم تخطيها: غير مستطيلة أو مقفلة)`:'')+' — تابع القص، أو انقر تحديد لتحريك أي جزء أو حذفه',`Split ${hits.length} block(s)`+(skipped?` (${skipped} skipped: non-box or locked)`:'')+' — continue cutting or switch to Select'))}
function rebuildOne(i){const b=state.blocks[i],old=groups[i];if(!old)return;bg.remove(old);const [g,m]=makeBlock(b,i);bg.add(g);groups[i]=g;meshes[i]=m;buildHandles()}
function up(e){
 if(cutting){const c=cutting;cutting=null;O.enabled=true;mLine.visible=false;mDots.forEach(d=>d.visible=false);doCut(c.a,c.b);down=null;return}
 if(tool==='meas'||tool==='cal'){O.enabled=true;down=null;return}
 if(resizing){resizing=null;O.enabled=true;refresh();down=null;return}
 if(drawing){const d=drawing;drawing=null;prev.visible=false;O.enabled=true;const w=Math.abs(d.x1-d.x0),dd=Math.abs(d.z1-d.z0),sh=$('dShape').value,n=state.blocks.length+1;
  if(PROPS[sh]){snap(true);const [pw,pd]=PROPS[sh];state.blocks.push(norm({name:dn('shapes',sh,SHAPES[sh])+' '+n,shape:sh,mat:sh==='car'?'white':'brick',f:1,x:d.x1,z:d.z1,w:pw,d:pd}));setSel(state.blocks.length-1);refresh()}
  else if(w>=1&&dd>=1){snap(true);state.blocks.push(norm({name:dn('shapes',sh,SHAPES[sh])+' '+n,shape:sh,mat:$('dMat').value,fn:$('dFn').value,f:Math.max(1,parseInt($('dF').value)||1),x:(d.x0+d.x1)/2,z:(d.z0+d.z1)/2,w,d:dd}));setSel(state.blocks.length-1);refresh()}
  else flash(L('اسحب مسافة أكبر للرسم (1 م على الأقل)','Drag at least 1 m to draw a mass'));down=null;return}
 if(dragging){const g=dragging;dragging=null;O.enabled=true;if(g.moved)refresh();down=null;return}
 const click=down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5;
 if(pending){const pd=pending;pending=null;if(click){if(pd.shift){if(selSet.has(pd.i))selSet.delete(pd.i);else selSet.add(pd.i);sel=selSet.size?(selSet.has(pd.i)?pd.i:[...selSet].pop()):-1}else setSel(pd.i);refresh()}down=null;return}
 if(click&&e.target===R.domElement&&selSet.size&&!multiMode){clearSel();refresh()}
 down=null}
// context menu
const ctx=document.createElement('div');ctx.id='ctx';document.body.appendChild(ctx);
function hideCtx(){ctx.style.display='none'}
el.addEventListener('contextmenu',e=>{e.preventDefault();if(ctxDown&&Math.hypot(e.clientX-ctxDown.x,e.clientY-ctxDown.y)>5)return;ndc(e);const h=ray.intersectObjects(pickables())[0];if(!h)return;const i=h.object.userData.i;if(!selSet.has(i))setSel(i);refresh();
 const b=state.blocks[i],items=[[L('نسخ (Ctrl+D)','Duplicate (Ctrl+D)'),dup],[L('نسخ للحافظة (Ctrl+C)','Copy (Ctrl+C)'),copySel],[L('⟳ تدوير 90°','⟳ Rotate 90°'),rot90],[L('↻ تدوير 15°','↻ Rotate 15°'),()=>rotFree(15)],[L('إضافة طابق','Add Floor'),()=>floors(1)],[L('حذف طابق','Remove Floor'),()=>floors(-1)],[L('⇋ عكس أفقي','⇋ Mirror X'),()=>mirror('x')],[L('⇵ عكس عمودي','⇵ Mirror Z'),()=>mirror('z')],...(selSet.size===1&&b.f>1?[[L('تقسيم لطوابق','Split to Floors'),split]]:[]),[b.lock?L('فتح القفل','Unlock'):L('قفل','Lock'),toggleLock],[L('إخفاء','Hide'),toggleHide],[L('حذف','Delete'),del]];
 ctx.innerHTML='';items.forEach(([t,f])=>{const d=document.createElement('div');d.textContent=t;d.onclick=()=>{hideCtx();f()};ctx.appendChild(d)});
 ctx.style.display='block';ctx.style.left=Math.min(e.clientX,innerWidth-190)+'px';ctx.style.top=Math.min(e.clientY,innerHeight-340)+'px'});
addEventListener('pointerdown',e=>{if(!ctx.contains(e.target))hideCtx()});
let clip=[];
function copySel(){if(!selSet.size)return;clip=[...selSet].map(i=>clone(state.blocks[i]));flash(L('تم النسخ '+clip.length+' عنصر — Ctrl+V للصق','Copied '+clip.length+' item(s) — Ctrl+V to paste'))}
function pasteClip(){if(!clip.length)return flash(L('الحافظة فارغة','Clipboard is empty'));snap(true);const st=state.blocks.length;clip.forEach(b=>{const c=clone(b);c.x+=snapStep*4;c.z+=snapStep*4;state.blocks.push(c)});selSet=new Set(clip.map((_,k)=>st+k));sel=state.blocks.length-1;refresh()}
function floors(dv){if(!selSet.size)return;snap();selSet.forEach(i=>{const b=state.blocks[i];b.f=Math.max(1,b.f+dv)});refresh()}
function mirror(ax){if(!selSet.size)return;snap(true);const ids=[...selSet];let lo=1e9,hi=-1e9;ids.forEach(i=>{const b=state.blocks[i],c=ax==='x'?b.x:b.z,s=(ax==='x'?b.w:b.d)/2;lo=Math.min(lo,c-s);hi=Math.max(hi,c+s)});const m=lo+hi;
 ids.forEach(i=>{const b=state.blocks[i];if(ax==='x')b.x=+(m-b.x).toFixed(3);else b.z=+(m-b.z).toFixed(3);if(['tri','L'].includes(b.shape))b.ry=(b.ry+(ax==='x'?90:270))%360});refresh()}
function toggleLock(){if(!selSet.size)return;const v=!state.blocks[sel].lock;selSet.forEach(i=>state.blocks[i].lock=v);refresh();flash(v?L('قُفلت — لن تتحرك خطأً','Locked'):L('أُلغي القفل','Unlocked'))}
function toggleHide(){if(!selSet.size)return;snap(true);selSet.forEach(i=>state.blocks[i].hidden=true);clearSel();refresh();flash(L('أُخفيت — يمكن إظهارها من قائمة العناصر','Hidden — restore from the Outliner list'))}
addEventListener('pointerup',up);addEventListener('pointercancel',up);
addEventListener('keydown',e=>{const t=e.target.tagName;if(t==='INPUT'||t==='SELECT'||t==='TEXTAREA')return;
 const k=e.key,ctrl=e.ctrlKey||e.metaKey;
 if(polyD){if(k==='Enter'){e.preventDefault();finishPoly();return}if(k==='Escape'){cancelPoly();return}if(k==='Backspace'){e.preventDefault();polyD.pts.pop();if(!polyD.pts.length)cancelPoly();else updPoly();return}}
 if(ctrl&&(k==='z'||k==='Z')){if(sheetOpen)return;e.preventDefault();e.shiftKey?doRedo():doUndo();return}
 if(ctrl&&(k==='y'||k==='Y')){if(sheetOpen)return;e.preventDefault();doRedo();return}
 if(ctrl&&(k==='a'||k==='A')){e.preventDefault();$('bAll').click();return}
 if(ctrl&&(k==='c'||k==='C')){copySel();return}if(ctrl&&(k==='v'||k==='V')){e.preventDefault();pasteClip();return}
 if(ctrl&&(k==='d'||k==='D')){e.preventDefault();dup();return}
 if(k==='v'||k==='V'){setTool('select');return}if(k==='b'||k==='B'){setTool('draw');return}if(k==='m'||k==='M'){setTool('meas');return}
 if(k==='Escape'){clearSel();setTool('select');refresh();return}
 if(!selSet.size)return;
 if(k==='Delete'||k==='Backspace'){e.preventDefault();del();return}
 if(k==='d'||k==='D'){dup();return}if(k==='R'&&e.shiftKey){rotFree(15);return}if((k==='r'||k==='R')&&selSet.size===1){rot90();return}if(k==='l'||k==='L'){toggleLock();return}if(k==='h'||k==='H'){toggleHide();return}
 if(k==='PageUp'){snap();selSet.forEach(i=>state.blocks[i].f++);refresh();return}if(k==='PageDown'){snap();selSet.forEach(i=>{if(state.blocks[i].f>1)state.blocks[i].f--});refresh();return}
 const st=snapStep*(e.shiftKey?5:1),mvk={ArrowLeft:[-st,0],ArrowRight:[st,0],ArrowUp:[0,-st],ArrowDown:[0,st]}[k];
 if(mvk){e.preventDefault();snap();selSet.forEach(i=>{if(state.blocks[i].lock)return;state.blocks[i].x+=mvk[0];state.blocks[i].z+=mvk[1]});refresh()}});

// ---------- labels ----------
const lab=$('lab'),namesBox=$('names');let nameDivs=[];
function renderNames(rebuild){if(rebuild){namesBox.innerHTML='';nameDivs=[];if(showNames)state.blocks.forEach(b=>{const d=document.createElement('div');d.className='nl';d.textContent=b.name+(counts(b)?' · '+b.f+L('ط','F'):'');if(isProp(b))d.style.display='none';namesBox.appendChild(d);nameDivs.push(d)})}}
function toScreen(v){v.project(C);if(v.z>1)return null;const r=el.getBoundingClientRect();return [r.left+(v.x+1)/2*r.width,r.top+(1-v.y)/2*r.height]}
function labels(){let txt=null,pos=null;const um=L('م','m');
 if(drawing){const d=drawing;txt=`${Math.abs(d.x1-d.x0).toFixed(1)} × ${Math.abs(d.z1-d.z0).toFixed(1)} ${um}`;pos=new THREE.Vector3((d.x0+d.x1)/2,defH()+1,(d.z0+d.z1)/2)}
 else if(selSet.size===1&&showDims&&state.blocks[sel]){const b=state.blocks[sel];txt=(b.lock?'':'')+`${b.w.toFixed(1)} × ${b.d.toFixed(1)} ${um}`+(counts(b)?` · ${L('ارتفاع','H')} ${(bh(b)).toFixed(1)} ${um}`:'')+(b.y0?` · ${L('مرفوع','Elev')} ${b.y0} ${um}`:'');pos=new THREE.Vector3(b.x,b.y0+bh(b)+1.5,b.z)}
 const s=pos&&toScreen(pos);if(!txt||!s){lab.style.display='none'}else{lab.style.display='block';lab.textContent=txt;lab.style.left=s[0]+'px';lab.style.top=s[1]+'px'}
 const ml=$('mlab'),a=mp.a,b=mp.b||mp.hover;if(a&&b&&(tool==='meas'||tool==='cal')){const q=toScreen(new THREE.Vector3((a.x+b.x)/2,.5,(a.z+b.z)/2));if(q){ml.style.display='block';ml.textContent=a.distanceTo(b).toFixed(2)+' '+um+(tool==='cal'?L(' (بمقياس الصورة)',' (image scale)'):'');ml.style.left=q[0]+'px';ml.style.top=q[1]+'px'}}else ml.style.display='none';
 if(showNames)state.blocks.forEach((b,i)=>{const d=nameDivs[i];if(!d||isProp(b))return;const q=toScreen(new THREE.Vector3(b.x,b.y0+bh(b)+.5,b.z));if(!q){d.style.display='none';return}d.style.display='block';d.style.left=q[0]+'px';d.style.top=q[1]+'px'})}
function fit(){const w=el.clientWidth||1,h=el.clientHeight||1;camP.aspect=w/h;camP.updateProjectionMatrix();const hh=Math.max(state.site.w,state.site.d)*.62;camO.left=-hh*w/h;camO.right=hh*w/h;camO.top=hh;camO.bottom=-hh;camO.updateProjectionMatrix();R.setSize(w,h)}
addEventListener('resize',fit);
if(typeof ResizeObserver==='function')new ResizeObserver(()=>{fit();if(typeof layoutSheet==='function'&&sheetOpen)layoutSheet()}).observe(el);
// ================= SHEETS v3 (layout system) =================
const IDB={db:null,
 open(){return new Promise(r=>{try{const q=indexedDB.open('mc3d',1);q.onupgradeneeded=()=>q.result.createObjectStore('imgs');q.onsuccess=()=>{IDB.db=q.result;r(true)};q.onerror=()=>r(false)}catch(e){r(false)}})},
 put(k,v){return new Promise(r=>{if(!IDB.db)return r(false);try{const t=IDB.db.transaction('imgs','readwrite');t.objectStore('imgs').put(v,k);t.oncomplete=()=>r(true);t.onerror=()=>r(false)}catch(e){r(false)}})},
 get(k){return new Promise(r=>{if(!IDB.db)return r(null);try{const q=IDB.db.transaction('imgs','readonly').objectStore('imgs').get(k);q.onsuccess=()=>r(q.result||null);q.onerror=()=>r(null)}catch(e){r(null)}})},
 del(k){return new Promise(r=>{if(!IDB.db)return r(false);try{const t=IDB.db.transaction('imgs','readwrite');t.objectStore('imgs').delete(k);t.oncomplete=()=>r(true)}catch(e){r(false)}})}};
const imgSrc={};const ground_=ground;
const SIZES={A4:[297,210],A3:[420,297],A2:[594,420],A1:[841,594]};
const FONTS=['IBM Plex Sans Arabic','Tajawal','Cairo','Amiri','Noto Naskh Arabic','Reem Kufi'];
function defSheet(){const m=(typeof state!=='undefined'&&state&&state.meta)?state.meta:{};
 const title=(m.title||L('مشروع معماري','Architectural Project'))+L(' — النموذج الكتلي',' — Massing Model');
 const subParts=[];if(m.designer)subParts.push(L('المصمم: ','Designer: ')+m.designer);if(m.org)subParts.push(m.org);if(m.location)subParts.push(m.location);
 const sub=subParts.length?subParts.join(' · '):L('لوحة عرض معمارية — ماكيت','Architectural Presentation Sheet — Maket');
 return {size:'A3',orient:'land',frame:true,states:{},items:[
  {id:'t1',type:'text',x:20,y:12,w:380,h:16,text:title,size:9,bold:true,color:'#222222',align:'center',font:'IBM Plex Sans Arabic'},
  {id:'tb1',type:'text',x:20,y:274,w:380,h:12,text:sub,size:3.6,bold:false,color:'#444444',align:'center',font:'IBM Plex Sans Arabic'}]}}
let sheets=LS.get('mc3d_sheets')||{},curSheet=LS.get('mc3d_sheetname')||'';
{const old=LS.get('mc3d_sheet');if(!Object.keys(sheets).length)sheets[L('اللوحة 1','Sheet 1')]=(old&&old.items)?old:defSheet()}
if(!sheets[curSheet])curSheet=Object.keys(sheets)[0];
Object.values(sheets).forEach(s=>{if(s){s.states=s.states||{};s.size=s.size||'A3'}});
let sheet=sheets[curSheet]||defSheet();sheets[curSheet]=sheet;
let sheetOpen=false,sItem=null,sSel=new Set(),sDrag=null,sK=1,sZoom=1,shGround=true,sHist=[],showGuides=true;
const PW=()=>{const s=SIZES[sheet.size]||SIZES.A3;return sheet.orient==='land'?s[0]:s[1]},PH=()=>{const s=SIZES[sheet.size]||SIZES.A3;return sheet.orient==='land'?s[1]:s[0]};
const uid=()=>'i'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const byId=id=>sheet.items.find(i=>i.id===id);
const selItems=()=>sheet.items.filter(i=>sSel.has(i.id));
function gcStates(){const used=new Set(sheet.items.filter(i=>i.sk).map(i=>i.sk));Object.keys(sheet.states).forEach(k=>{if(!used.has(k))delete sheet.states[k]})}
function saveSheet(){gcStates();sheets[curSheet]=sheet;const ok=LS.set('mc3d_sheets',sheets);LS.set('mc3d_sheetname',curSheet);if(!ok)flash(L('⚠ ذاكرة المتصفح ممتلئة — احذف لوحات قديمة أو احفظ نسخة احتياطية','⚠ Browser storage full — delete old sheets or save a backup'))}
function sPush(){sHist.push(JSON.stringify(sheet));if(sHist.length>80)sHist.shift()}
function sUndo(){if(!sHist.length)return flash(L('لا يوجد ما يمكن التراجع عنه في اللوحة','Nothing to undo on sheet'));sheet=JSON.parse(sHist.pop());sheets[curSheet]=sheet;setSSel([]);saveSheet();loadImgs();layoutSheet()}
function setSSel(ids){sSel=new Set(ids);sItem=ids.length?ids[ids.length-1]:null}
function fillSheets(){$('shList').innerHTML=Object.keys(sheets).map(k=>`<option ${k===curSheet?'selected':''}>${k.replace(/</g,'&lt;')}</option>`).join('')}
function switchSheet(n){if(!sheets[n])return;saveSheet();curSheet=n;sheet=sheets[n];setSSel([]);sHist=[];loadImgs();saveSheet();fillSheets();layoutSheet();sheetPanel()}
function newSheet(name,data){let n=name,i=2;while(sheets[n])n=name+' '+(i++);saveSheet();sheets[n]=data||defSheet();curSheet=n;sheet=sheets[n];setSSel([]);sHist=[];saveSheet();fillSheets();return n}
const sw=$('sheetWrap'),pg=$('sheetPage');
function layoutSheet(){if(!sheetOpen)return;const aw=Math.max(120,sw.clientWidth-56),ah=Math.max(120,sw.clientHeight-56);sK=Math.min(aw/PW(),ah/PH())*sZoom;pg.style.width=PW()*sK+'px';pg.style.height=PH()*sK+'px';$('shZL').textContent=Math.round(sZoom*100)+'%';renderSheet()}
// ---- draw lists for special items (mm local coords) ----
function niceLen(m){const c=[1,2,5,10,20,25,50,100,200,250,500,1000];return c.find(v=>v>=m)||1000}
function dlScale(it){const N=it.n||500,L_=it.len||niceLen(it.w*N/1000*0.75),bar=L_*1000/N,seg=4,cmds=[],y=2,h=1.6;
 for(let k=0;k<seg;k++)cmds.push({t:'rect',x:k*bar/seg,y,w:bar/seg,h,fill:k%2?'#ffffff':'#111111',stroke:'#111111',sw:.2});
 [0,L_/2,L_].forEach((v,k)=>cmds.push({t:'text',x:k*bar/2,y:y+h+.8,s:2.4,txt:(k===2?v+' '+L('م','m'):String(v)),anchor:'middle'}));
 cmds.push({t:'text',x:bar/2,y:-.6,s:2.4,txt:L('مقياس الرسم 1:','Scale 1:')+N,anchor:'middle',bold:true});return {cmds,w:bar,h:y+h+3.6}}
function dlNorth(it){const w=it.w,h=it.h,cx=w/2,cy=h/2+1.5,r=Math.min(w,h)/2-2,a=(it.rot||0)*Math.PI/180,R2=(x,y)=>[cx+x*Math.cos(a)-y*Math.sin(a),cy+x*Math.sin(a)+y*Math.cos(a)];
 return {cmds:[{t:'circle',x:cx,y:cy,r,stroke:'#111111',sw:.3},{t:'poly',pts:[R2(0,-r*.9),R2(r*.35,r*.6),R2(0,r*.25)],fill:'#111111'},{t:'poly',pts:[R2(0,-r*.9),R2(-r*.35,r*.6),R2(0,r*.25)],fill:'#ffffff',stroke:'#111111',sw:.25},
  {t:'text',x:R2(0,-r-2.6)[0],y:R2(0,-r-2.6)[1]-1.4,s:3.2,txt:'N',anchor:'middle',bold:true}]}}
function dlToSVG(dl,w,h){const dir=L('rtl','ltr');let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%" style="overflow:visible">`;
 dl.cmds.forEach(c=>{if(c.t==='rect')s+=`<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" fill="${c.fill}" stroke="${c.stroke||'none'}" stroke-width="${c.sw||0}"/>`;
  else if(c.t==='circle')s+=`<circle cx="${c.x}" cy="${c.y}" r="${c.r}" fill="none" stroke="${c.stroke}" stroke-width="${c.sw}"/>`;
  else if(c.t==='poly')s+=`<polygon points="${c.pts.map(p=>p.join(',')).join(' ')}" fill="${c.fill}" stroke="${c.stroke||'none'}" stroke-width="${c.sw||0}"/>`;
  else s+=`<text x="${c.x}" y="${c.y+c.s*.85}" font-size="${c.s}" font-family="Tajawal" text-anchor="${c.anchor}" font-weight="${c.bold?700:400}" fill="#111" direction="${dir}">${c.txt}</text>`});return s+'</svg>'}
function dlToCanvas(c,dl,ox,oy,ppm){dl.cmds.forEach(k=>{
 if(k.t==='rect'){c.fillStyle=k.fill;c.fillRect((ox+k.x)*ppm,(oy+k.y)*ppm,k.w*ppm,k.h*ppm);if(k.stroke){c.strokeStyle=k.stroke;c.lineWidth=Math.max(1,k.sw*ppm);c.strokeRect((ox+k.x)*ppm,(oy+k.y)*ppm,k.w*ppm,k.h*ppm)}}
 else if(k.t==='circle'){c.beginPath();c.arc((ox+k.x)*ppm,(oy+k.y)*ppm,k.r*ppm,0,Math.PI*2);c.strokeStyle=k.stroke;c.lineWidth=Math.max(1,k.sw*ppm);c.stroke()}
 else if(k.t==='poly'){c.beginPath();k.pts.forEach((p,i)=>i?c.lineTo((ox+p[0])*ppm,(oy+p[1])*ppm):c.moveTo((ox+p[0])*ppm,(oy+p[1])*ppm));c.closePath();c.fillStyle=k.fill;c.fill();if(k.stroke){c.strokeStyle=k.stroke;c.lineWidth=Math.max(1,k.sw*ppm);c.stroke()}}
 else{c.font=`${k.bold?700:400} ${k.s*ppm}px Tajawal, sans-serif`;c.fillStyle='#111';c.textAlign=k.anchor==='middle'?'center':k.anchor==='end'?'left':'right';c.direction=L('rtl','ltr');c.textBaseline='top';c.fillText(k.txt,(ox+k.x)*ppm,(oy+k.y)*ppm)}})}
function planMeters(it){if(!it.cam||!it.cam.o||!it.cam.fr||!it.crop)return null;const fr=it.cam.fr;return (fr[1]-fr[0])/(it.cam.zoom||1)*(it.crop.x1-it.crop.x0)}
// ---- render editor ----
function renderSheet(){pg.innerHTML='';
 if(sheet.frame){const f=document.createElement('div');f.className='sframe';Object.assign(f.style,{left:8*sK+'px',top:8*sK+'px',width:(PW()-16)*sK+'px',height:(PH()-16)*sK+'px'});pg.appendChild(f)}
 sheet.items.forEach(it=>{const d=document.createElement('div');d.className='sitem'+(sSel.has(it.id)?' sel':'')+(it.lock?' lk':'');d.dataset.id=it.id;
  Object.assign(d.style,{left:it.x*sK+'px',top:it.y*sK+'px',width:it.w*sK+'px',height:it.h*sK+'px'});
  if(it.type==='img'){const im=document.createElement('img');im.src=imgSrc[it.src]||'';im.draggable=false;d.appendChild(im);if(it.bd){d.style.outline='none';d.style.boxShadow=`inset 0 0 0 ${Math.max(1,it.bd*sK)}px ${it.bc||'#222'}`}
   if(it.cam){const b=document.createElement('span');b.className='hqb';const pm=planMeters(it);b.textContent=pm?('HQ · 1:'+Math.round(pm*1000/it.w)):'HQ';d.appendChild(b)}}
  else if(it.type==='rect'){d.style.background=it.color;d.style.border='1px solid rgba(0,0,0,.35)'}
  else if(it.type==='box'){d.style.border=`${Math.max(1,(it.sw||.5)*sK)}px solid ${it.color}`;d.style.background=it.fill||'transparent';d.style.boxSizing='border-box'}
  else if(it.type==='line'){d.style.background=it.color}
  else if(it.type==='scale'){const dl=dlScale(it);it.w=+dl.w.toFixed(2);it.h=+dl.h.toFixed(2);d.style.width=it.w*sK+'px';d.style.height=it.h*sK+'px';d.innerHTML=dlToSVG(dl,it.w,it.h)}
  else if(it.type==='north'){d.innerHTML=dlToSVG(dlNorth(it),it.w,it.h)}
  else{const tx=document.createElement('div');tx.className='stext';tx.textContent=it.text;Object.assign(tx.style,{fontSize:it.size*sK+'px',fontWeight:it.bold?'700':'400',color:it.color,textAlign:it.align,fontFamily:`'${it.font||'Tajawal'}',sans-serif`});d.appendChild(tx);
}
  if(sSel.size===1&&sItem===it.id&&!it.lock&&!['scale'].includes(it.type)){const h=document.createElement('div');h.className='srh';d.appendChild(h)}
  pg.appendChild(d)});sheetPanel()}
// ---- panel ----
let lastTap={},editing=null;
function startEdit(it){if(!it||it.type!=='text')return;if(it.lock)return flash(L('النص مقفل — ألغِ القفل أولاً','Text is locked — unlock it first'));if(!sheetOpen)openSheet(true);
 setSSel([it.id]);renderSheet();const d=pg.querySelector(`[data-id="${it.id}"]`);if(!d)return;const tx=d.querySelector('.stext');sPush();editing=it.id;d.classList.add('editing');
 tx.contentEditable='true';tx.focus();const r=document.createRange();r.selectNodeContents(tx);const s=getSelection();s.removeAllRanges();s.addRange(r);
 tx.onkeydown=ev=>{if(ev.key==='Escape'){ev.preventDefault();tx.blur()}if(ev.key==='Enter'&&(ev.ctrlKey||ev.metaKey)){ev.preventDefault();tx.blur()}};
 tx.onblur=()=>{tx.contentEditable='false';editing=null;const v=tx.innerText.replace(/\n$/,'');if(v!==it.text){it.text=v;saveSheet()}else sHist.pop();renderSheet()};
 flash(L('اكتب النص — انقر خارجه أو Esc للإنهاء','Type text — click outside or press Esc to finish'))}
let lastShSel='';
function sheetPanel(){const its=selItems(),it=its.length===1?its[0]:null,show=(id,v)=>{const e=$(id);if(e)e.style.display=v?'':'none'};
 const tm=$('tabShMod'),key=its.map(i=>i.id).join(',');tm.style.display=(sheetOpen&&its.length)?'inline-block':'none';
 if(sheetOpen&&its.length&&key!==lastShSel&&curTab!=='shmod')showTab('shmod');if((!its.length||!sheetOpen)&&curTab==='shmod')showTab('sheet');lastShSel=key;
 show('shSel',its.length>0);show('shArr',true);
 const t=it&&it.type==='text',img=it&&it.type==='img',box=it&&(it.type==='box'||it.type==='line'),col=it&&['text','rect','box','line'].includes(it.type);
 ['shBold','shAlign','shFont','shEditT','shTxt'].forEach(id=>show(id,t));if(t&&document.activeElement!==$('shTxt'))$('shTxt').value=it.text;show('shColor',col);show('shSw',box||img);['shCrop','shTrim'].forEach(id=>show(id,img));show('shScaleBox',img&&!!planMeters(it));show('shRot',it&&it.type==='north');show('shLen',it&&it.type==='scale');
 if(it){if(col)$('shColor').value=it.color;if(t)$('shFont').value=it.font||'Tajawal';if(box)$('shSw').value=it.sw||.5;if(img)$('shSw').value=it.bd||0;if(it.type==='north')$('shRot').value=it.rot||0;
  if(img&&planMeters(it))$('shScaleN').value=String(Math.round(planMeters(it)*1000/it.w));if(it.type==='scale'){$('shLenN').value=it.n||500;$('shLenL').value=it.len||''}}
 $('shLockB').textContent=its.length&&its.every(i=>i.lock)?L('فتح القفل','Unlock'):L('قفل','Lock');$('shSelInfo').textContent=its.length>1?its.length+' '+L('عناصر','items'):'';
 $('shLand').classList.toggle('on',sheet.orient==='land');$('shPort').classList.toggle('on',sheet.orient==='port');$('shFrame').classList.toggle('on',sheet.frame);$('shSize').value=sheet.size;
 $('shCount').textContent=sheet.items.filter(i=>i.type==='img').length+' '+L('صور','images')}
function openSheet(on){sheetOpen=on;document.body.classList.toggle('sheet-mode',on);$('shZoomBar').style.display=on?'flex':'none';if(!on){$('tabShMod').style.display='none'}else if(selSet.size){clearSel();refresh()}sw.style.display=on?'block':'none';$('shOpen').innerHTML=on?`<i><svg class="ic"><use href="#i-cube"/></svg></i>${L('رجوع للنموذج','Back to 3D')}`:`<i><svg class="ic"><use href="#i-sheet"/></svg></i>${L('فتح اللوحة','Open Sheet')}`;$('shOpen').classList.toggle('on',on);if(on)layoutSheet()}
// ---- interaction: select, move (snap+guides), resize ----
function guideTargets(excl){const xs=[0,PW()/2,PW()],ys=[0,PH()/2,PH()];if(sheet.frame){xs.push(8,PW()-8);ys.push(8,PH()-8)}
 sheet.items.forEach(i=>{if(excl.has(i.id))return;xs.push(i.x,i.x+i.w/2,i.x+i.w);ys.push(i.y,i.y+i.h/2,i.y+i.h)});return {xs,ys}}
function clearGuides(){pg.querySelectorAll('.sguide').forEach(g=>g.remove())}
function drawGuide(axis,v){const g=document.createElement('div');g.className='sguide';if(axis==='x')Object.assign(g.style,{left:v*sK+'px',top:0,width:'1px',height:'100%'});else Object.assign(g.style,{top:v*sK+'px',left:0,height:'1px',width:'100%'});pg.appendChild(g)}
function snapAxis(vals,targets,th){let best=null;for(const t of targets)for(const v of vals){const d=t-v;if(Math.abs(d)<=th&&(!best||Math.abs(d)<Math.abs(best.d)))best={d,t}}return best}
pg.addEventListener('pointerdown',e=>{const d=e.target.closest('.sitem');if(!d){if(!e.shiftKey)setSSel([]);renderSheet();return}
 if(e.target.isContentEditable)return;const it=byId(d.dataset.id);if(!it)return;
 const now=Date.now();if(it.type==='text'&&lastTap.id===it.id&&now-lastTap.t<450&&!e.shiftKey){lastTap={};e.preventDefault();startEdit(it);return}lastTap={id:it.id,t:now};
 let ids=it.g&&!e.altKey?sheet.items.filter(i=>i.g===it.g).map(i=>i.id):[it.id];
 if(e.shiftKey){const all=ids.every(i=>sSel.has(i));ids.forEach(i=>all?sSel.delete(i):sSel.add(i));sItem=all?([...sSel].pop()||null):it.id}else if(!sSel.has(it.id))setSSel(ids);else sItem=it.id;
 renderSheet();const resize=e.target.classList.contains('srh');const mv=selItems().filter(i=>!i.lock);if(!mv.length){if(it.lock)flash(L('العنصر مقفل','Item is locked'));return}
 sDrag={mode:resize?'rs':'mv',it,x0:e.clientX,y0:e.clientY,orig:mv.map(i=>({i,x:i.x,y:i.y,w:i.w,h:i.h,size:i.size})),pushed:false};e.preventDefault()});
addEventListener('pointermove',e=>{if(!sDrag)return;const dx=(e.clientX-sDrag.x0)/sK,dy=(e.clientY-sDrag.y0)/sK;if(!sDrag.pushed){if(Math.hypot(dx,dy)*sK<3)return;sPush();sDrag.pushed=true}
 clearGuides();const th=6/sK,g=v=>Math.round(v*10)/10;
 if(sDrag.mode==='mv'){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;sDrag.orig.forEach(o=>{x0=Math.min(x0,o.x);y0=Math.min(y0,o.y);x1=Math.max(x1,o.x+o.w);y1=Math.max(y1,o.y+o.h)});
  let ddx=dx,ddy=dy;if(showGuides&&!e.altKey){const T=guideTargets(new Set(sDrag.orig.map(o=>o.i.id)));const sx=snapAxis([x0+dx,(x0+x1)/2+dx,x1+dx],T.xs,th),sy=snapAxis([y0+dy,(y0+y1)/2+dy,y1+dy],T.ys,th);if(sx){ddx+=sx.d;drawGuide('x',sx.t)}if(sy){ddy+=sy.d;drawGuide('y',sy.t)}}
  sDrag.orig.forEach(o=>{o.i.x=g(o.x+ddx);o.i.y=g(o.y+ddy);const el_=pg.querySelector(`[data-id="${o.i.id}"]`);if(el_){el_.style.left=o.i.x*sK+'px';el_.style.top=o.i.y*sK+'px'}})}
 else{const o=sDrag.orig.find(q=>q.i===sDrag.it)||sDrag.orig[0],it=o.i;let w=Math.max(3,o.w+dx),h=Math.max(1,o.h+dy);
  if(showGuides&&!e.altKey){const T=guideTargets(new Set([it.id]));const sx=snapAxis([it.x+w],T.xs,th);if(sx){w+=sx.d;drawGuide('x',sx.t)}if(it.type!=='img'&&it.type!=='north'){const sy=snapAxis([it.y+h],T.ys,th);if(sy){h+=sy.d;drawGuide('y',sy.t)}}}
  if(it.type==='img'||it.type==='north'){const ar=o.h/o.w;it.w=g(w);it.h=g(w*ar)}else if(it.type==='line'){if(o.w>=o.h){it.w=g(w)}else{it.h=g(h)}}else{it.w=g(w);it.h=g(h)}
  const el_=pg.querySelector(`[data-id="${it.id}"]`);if(el_)Object.assign(el_.style,{width:it.w*sK+'px',height:it.h*sK+'px'})}});
addEventListener('pointerup',()=>{if(sDrag){clearGuides();if(sDrag.pushed){saveSheet();renderSheet()}sDrag=null}});
sw.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();setZoom(sZoom*(e.deltaY<0?1.12:1/1.12))},{passive:false});
function setZoom(z){sZoom=Math.max(.4,Math.min(6,z));layoutSheet()}
addEventListener('keydown',e=>{if(!sheetOpen)return;const t=e.target;if(t.isContentEditable||['INPUT','SELECT','TEXTAREA'].includes(t.tagName))return;
 const ctrl=e.ctrlKey||e.metaKey,k=e.key,stop=()=>{e.preventDefault();e.stopImmediatePropagation()};
 if(ctrl&&(k==='z'||k==='Z')){stop();sUndo();return}
 if(ctrl&&(k==='a'||k==='A')){stop();setSSel(sheet.items.map(i=>i.id));renderSheet();return}
 if(k==='Escape'){stop();setSSel([]);renderSheet();return}
 if(!sSel.size){e.stopImmediatePropagation();return}
 if(k==='Delete'||k==='Backspace'){stop();shDelete();return}
 if(ctrl&&(k==='d'||k==='D')){stop();shDup();return}
 if((k==='Enter'||k==='F2')&&curIt()&&curIt().type==='text'){stop();startEdit(curIt());return}
 if(ctrl&&(k==='g'||k==='G')){stop();e.shiftKey?ungroup():group();return}
 const mv={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[k];if(mv){stop();sPush();const s=e.shiftKey?5:.5;selItems().forEach(i=>{if(i.lock)return;i.x+=mv[0]*s;i.y+=mv[1]*s});saveSheet();renderSheet();return}
 e.stopImmediatePropagation()},true);
addEventListener('resize',layoutSheet);

// ---- capture (with camera info for HQ re-render) ----
function trimBox(cv){const c=cv.getContext('2d'),W=cv.width,H=cv.height;let d;try{d=c.getImageData(0,0,W,H).data}catch(e){return null}let x0=W,y0=H,x1=-1,y1=-1;
 for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2){const i=(y*W+x)*4;if(d[i]<244||d[i+1]<244||d[i+2]<244){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}}
 if(x1<0)return null;const p=Math.round(Math.max(x1-x0,y1-y0)*.03);return {x0:Math.max(0,x0-p)/W,y0:Math.max(0,y0-p)/H,x1:Math.min(W,x1+p+2)/W,y1:Math.min(H,y1+p+2)/H}}
function camInfo(){const o=isPlan;return {o,p:C.position.toArray(),t:O.target.toArray(),q:C.quaternion.toArray(),zoom:C.zoom,fov:camP.fov,fr:o?[camO.left,camO.right,camO.top,camO.bottom]:null}}
function prepRender(ground){shadowCatch.visible=true;const st={bg:S.background.clone(),gv:grid?grid.visible:false,sv:siteG.visible,iv:imgG.visible,hv:hG.visible,pv:prev.visible,sec:secVis.visible,hmv:typeof shadowHmG!=='undefined'?shadowHmG.visible:false};
 S.background.set('#ffffff');ground_.visible=false;if(grid)grid.visible=false;hG.visible=false;prev.visible=false;secVis.visible=false;mLine.visible=false;mDots.forEach(d=>d.visible=false);if(typeof hmProbeRing!=='undefined')hmProbeRing.visible=false;if(!ground){siteG.visible=false;imgG.visible=false;if(typeof shadowHmG!=='undefined')shadowHmG.visible=false}return st}
function endRender(st){shadowCatch.visible=false;S.background.copy(st.bg);ground_.visible=true;if(grid)grid.visible=st.gv;siteG.visible=st.sv;imgG.visible=st.iv;hG.visible=st.hv;secVis.visible=st.sec&&sec.on;if(typeof shadowHmG!=='undefined')shadowHmG.visible=st.hmv;fit()}
function cropCanvas(src,r){const W=src.width,H=src.height,sx=Math.round(r.x0*W),sy=Math.round(r.y0*H),w=Math.max(2,Math.round((r.x1-r.x0)*W)),h=Math.max(2,Math.round((r.y1-r.y0)*H));const o=document.createElement('canvas');o.width=w;o.height=h;const c=o.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,w,h);c.drawImage(src,sx,sy,w,h,0,0,w,h);return o}
function readCanvas(){const s=R.domElement,o=document.createElement('canvas');o.width=s.width;o.height=s.height;const c=o.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,o.width,o.height);c.drawImage(s,0,0);return o}
async function grab(ground,names){if(ground===undefined)ground=shGround;if(names===undefined)names=shNames;const pr=R.getPixelRatio(),st=prepRender(ground);
 R.setPixelRatio(2);fit();draw(C);let full;try{full=readCanvas();if(names)drawNames(full,C)}catch(e){full=null}
 const aspect=el.clientWidth/el.clientHeight,cam=camInfo();R.setPixelRatio(pr);endRender(st);if(!full)return null;
 const crop=trimBox(full)||{x0:0,y0:0,x1:1,y1:1},t=cropCanvas(full,crop),k=Math.min(1,1800/Math.max(t.width,t.height)),o=document.createElement('canvas');o.width=Math.round(t.width*k);o.height=Math.round(t.height*k);o.getContext('2d').drawImage(t,0,0,o.width,o.height);
 return {data:o.toDataURL('image/jpeg',.9),ar:o.height/o.width,cam,aspect,crop,ground,names,cm:colorMode,sec:sec.on?clone(sec):null}}
let shNames=false;
function drawNames(cv,cam){const c=cv.getContext('2d'),W=cv.width,H=cv.height,fs=Math.max(12,Math.round(W/95));c.font=`700 ${fs}px Tajawal, sans-serif`;c.textAlign='center';c.textBaseline='middle';c.direction=L('rtl','ltr');
 state.blocks.forEach(b=>{if(b.hidden||!counts(b))return;const p=new THREE.Vector3(b.x,b.y0+bh(b)+.6,b.z).project(cam);if(p.z>1||p.x<-1||p.x>1||p.y<-1||p.y>1)return;const x=(p.x+1)/2*W,y=(1-p.y)/2*H,t=b.name,tw=c.measureText(t).width+fs*.8,th=fs*1.5;
  c.fillStyle='rgba(255,255,255,.88)';c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=1;c.beginPath();if(c.roundRect)c.roundRect(x-tw/2,y-th/2,tw,th,fs*.3);else c.rect(x-tw/2,y-th/2,tw,th);c.fill();c.stroke();c.fillStyle='#222';c.fillText(t,x,y)})}
function stateKey(s){const j=JSON.stringify(s);let h=0;for(let i=0;i<j.length;i++)h=(h*31+j.charCodeAt(i))|0;return 's'+(h>>>0).toString(36)}
function addImgItem(g,box,label){const id=uid();imgSrc[id]=g.data;IDB.put(id,g.data).then(ok=>{if(!ok)flash(L('أُضيفت الصورة، لكنها لم تُحفظ في المتصفح','Image added, but could not cache in browser'))});
 const W=PW(),w=Math.min(W*.42,180),h=w*g.ar,n=sheet.items.filter(i=>i.type==='img').length;
 const it={id:uid(),type:'img',src:id,x:20+(n%2)*(w+10),y:34+Math.floor(n/2)%2*(h+8),w,h,label:label||''};
 if(g.cam){const s=g.state||clone(state);const k=stateKey(s);sheet.states[k]=s;Object.assign(it,{sk:k,cam:g.cam,aspect:g.aspect,crop:g.crop,ground:g.ground,names:!!g.names,cm:g.cm,sec:g.sec})}
 if(box){let bw=box.w,bh=bw*g.ar;if(bh>box.h){bh=box.h;bw=bh/g.ar}it.w=+bw.toFixed(1);it.h=+bh.toFixed(1);it.x=+(box.x+(box.w-bw)/2).toFixed(1);it.y=+(box.y+(box.h-bh)/2).toFixed(1)}
 sheet.items.push(it);saveSheet();renderSheet();return it}
async function captureView(){const g=await grab();if(!g)return flash(L('تعذّر التقاط الصورة','Failed to capture view'));sPush();const it=addImgItem(g);setSSel([it.id]);if(sheetOpen)renderSheet();flash(L('أُضيفت اللقطة إلى اللوحة ('+sheet.items.filter(i=>i.type==='img').length+') — افتح اللوحة لترتيبها','Added view to sheet ('+sheet.items.filter(i=>i.type==='img').length+') — open Sheet to arrange'))}
// ---- HQ re-render for export ----
function maxRB(){try{const gl=R.getContext();return Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),gl.getParameter(gl.MAX_VIEWPORT_DIMS)[0],8192)}catch(e){return 4096}}
function setCam(ci,aspect){if(ci.o){camO.position.fromArray(ci.p);camO.quaternion.fromArray(ci.q);camO.zoom=ci.zoom;const [l,r,t,b]=ci.fr;camO.left=l;camO.right=r;camO.top=t;camO.bottom=b;camO.updateProjectionMatrix();return camO}
 camP.position.fromArray(ci.p);camP.quaternion.fromArray(ci.q);camP.fov=ci.fov;camP.aspect=aspect;camP.updateProjectionMatrix();return camP}
async function renderHQ(it,needW){const cr=it.crop,MX=Math.min(maxRB(),RQ.ao?4096:1e9);let fw=Math.round(needW/(cr.x1-cr.x0)),fh=Math.round(fw/it.aspect);const s=Math.min(1,MX/fw,MX/fh);fw=Math.round(fw*s);fh=Math.round(fh*s);
 const cam=setCam(it.cam,it.aspect);R.setPixelRatio(1);R.setSize(fw,fh,false);draw(cam);let out=null;try{const full=readCanvas();if(it.names)drawNames(full,cam);out=cropCanvas(full,cr)}catch(e){}return out}
async function hqPass(items,ppm,onEach){const keep={state,curName,sel,selSet,cm:colorMode,secS:clone(sec),pr:R.getPixelRatio(),camPos:camP.position.clone(),camQ:camP.quaternion.clone(),oPos:camO.position.clone(),oQ:camO.quaternion.clone(),oz:camO.zoom};
 const groups={};items.forEach(it=>{(groups[it.sk]=groups[it.sk]||[]).push(it)});
 try{for(const [k,arr] of Object.entries(groups)){const st=sheet.states[k];if(!st)continue;state=normState(clone(st));clearSel();
   for(const it of arr){colorMode=it.cm||'mat';const want=it.sec||{on:false};Object.assign(sec,want.on?want:{on:false});setSecOn(!!want.on);siteChanged();build();const ps=prepRender(it.ground!==false);
    const cv=await renderHQ(it,Math.round(it.w*ppm));endRender(ps);if(cv)await onEach(it,cv);await new Promise(r=>setTimeout(r,0))}}}
 finally{state=keep.state;curName=keep.curName;sel=keep.sel;selSet=keep.selSet;colorMode=keep.cm;Object.assign(sec,keep.secS);setSecOn(keep.secS.on);R.setPixelRatio(keep.pr);camP.position.copy(keep.camPos);camP.quaternion.copy(keep.camQ);camO.position.copy(keep.oPos);camO.quaternion.copy(keep.oQ);camO.zoom=keep.oz;fit();siteChanged();refresh()}}
// ---- compose & export ----
function wrapLines(c,text,maxW){const out=[];String(text).split('\n').forEach(par=>{const words=par.split(' ');let line='';words.forEach(w=>{const t=line?line+' '+w:w;if(c.measureText(t).width>maxW&&line){out.push(line);line=w}else line=t});out.push(line)});return out}
async function loadFonts(){const fs=new Set(['Tajawal']);Object.values(sheets).forEach(s=>s.items.forEach(i=>{if(i.font)fs.add(i.font)}));for(const f of fs){try{await document.fonts.load(`700 20px '${f}'`);await document.fonts.load(`400 20px '${f}'`)}catch(e){}}}
async function composeSheet(dpi,hq){const ppm=dpi/25.4,W=Math.round(PW()*ppm),H=Math.round(PH()*ppm);await loadFonts();
 const hqMap={};if(hq){const its=sheet.items.filter(i=>i.type==='img'&&i.cam&&sheet.states[i.sk]);let n=0;if(its.length)await hqPass(its,ppm,async(it,cv)=>{hqMap[it.id]=cv;n++;flash(L(`جارٍ الرسم بدقة عالية… ${n}/${its.length}`,`Rendering high-res… ${n}/${its.length}`))})}
 const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,W,H);c.imageSmoothingQuality='high';
 if(sheet.frame){c.strokeStyle='#222';c.lineWidth=Math.max(2,.5*ppm);c.strokeRect(8*ppm,8*ppm,(PW()-16)*ppm,(PH()-16)*ppm)}
 for(const it of sheet.items){const X=it.x*ppm,Y=it.y*ppm,Wd=it.w*ppm,Hd=it.h*ppm;
  if(it.type==='img'){c.globalCompositeOperation='multiply';if(hqMap[it.id])c.drawImage(hqMap[it.id],X,Y,Wd,Hd);else{const src=imgSrc[it.src];if(src)await new Promise(r=>{const im=new Image();im.onload=()=>{c.drawImage(im,X,Y,Wd,Hd);r()};im.onerror=r;im.src=src})}c.globalCompositeOperation='source-over';
   if(it.bd){c.strokeStyle=it.bc||'#222';c.lineWidth=it.bd*ppm;c.strokeRect(X+it.bd*ppm/2,Y+it.bd*ppm/2,Wd-it.bd*ppm,Hd-it.bd*ppm)}}
  else if(it.type==='rect'){c.fillStyle=it.color;c.fillRect(X,Y,Wd,Hd);c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=Math.max(1,.2*ppm);c.strokeRect(X,Y,Wd,Hd)}
  else if(it.type==='box'){const s=(it.sw||.5)*ppm;if(it.fill){c.fillStyle=it.fill;c.fillRect(X,Y,Wd,Hd)}c.strokeStyle=it.color;c.lineWidth=s;c.strokeRect(X+s/2,Y+s/2,Wd-s,Hd-s)}
  else if(it.type==='line'){c.fillStyle=it.color;c.fillRect(X,Y,Wd,Hd)}
  else if(it.type==='scale')dlToCanvas(c,dlScale(it),it.x,it.y,ppm);
  else if(it.type==='north')dlToCanvas(c,dlNorth(it),it.x,it.y,ppm);
  else{const fs=it.size*ppm;c.font=`${it.bold?700:400} ${fs}px '${it.font||'Tajawal'}', Tajawal, sans-serif`;c.fillStyle=it.color;c.direction=L('rtl','ltr');c.textBaseline='top';
   const lines=wrapLines(c,it.text,Wd);const ax=it.align==='center'?X+Wd/2:it.align==='left'?X:X+Wd;c.textAlign=it.align==='center'?'center':it.align==='left'?'left':'right';lines.forEach((l,k)=>c.fillText(l,ax,Y+k*fs*1.35))}}
 return cv}
function pdfPages(pages){const enc=new TextEncoder(),parts=[],offs=[];let len=0;const push=x=>{const b=typeof x==='string'?enc.encode(x):x;parts.push(b);len+=b.length};
 const n=pages.length,kids=pages.map((_,i)=>`${3+i*3} 0 R`).join(' ');push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');const obj=(k,s)=>{offs[k]=len;push(`${k} 0 obj\n${s}\nendobj\n`)};
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,`<< /Type /Pages /Kids [${kids}] /Count ${n} >>`);
 pages.forEach((p,i)=>{const pn=3+i*3,im=pn+1,ct=pn+2,pw=(p.wmm/25.4*72).toFixed(2),ph=(p.hmm/25.4*72).toFixed(2),content=`q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
  obj(pn,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 ${im} 0 R >> >> /Contents ${ct} 0 R >>`);
  offs[im]=len;push(`${im} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>\nstream\n`);push(p.bytes);push('\nendstream\nendobj\n');
  obj(ct,`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)});
 const tot=3+n*3,xref=len;let x=`xref\n0 ${tot}\n0000000000 65535 f \n`;for(let i=1;i<tot;i++)x+=String(offs[i]).padStart(10,'0')+' 00000 n \n';push(x+`trailer\n<< /Size ${tot} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
 const out=new Uint8Array(len);let q=0;parts.forEach(b=>{out.set(b,q);q+=b.length});return out}
const pdfFromJpeg=(bytes,w,h,wmm,hmm)=>pdfPages([{bytes,w,h,wmm,hmm}]);
const toBlob=(cv,type,q)=>new Promise(r=>cv.toBlob(b=>r(b),type,q));
let DL=null;(async()=>{try{if(window.claude&&claude.use)DL=await claude.use('downloads')}catch(e){DL=null}['shDown','shAll'].forEach(id=>$(id).style.display=DL?'':'none');$('shDownHint').textContent=DL?'':L('(التنزيل المباشر غير متاح في هذا العرض — استخدم "معاينة")','(Direct download unavailable — use Preview)')})();
function busy(on){['shExport','shDown','shAll'].forEach(id=>$(id).disabled=on)}
async function exportSheet(direct){const dpi=parseInt($('shDpi').value)||300,fmt=$('shFmt').value,hq=$('shHQ').classList.contains('on');busy(true);flash(L('جارٍ التصدير…','Exporting…'));
 try{const cv=await composeSheet(dpi,hq);const base=(curSheet||L('لوحة','Sheet')).replace(/[\\/:*?"<>|]/g,'-')+` ${sheet.size} ${dpi}dpi`;
  if(direct&&DL){let blob,name;
   if(fmt==='pdf'){const jb=await toBlob(cv,'image/jpeg',.95);blob=new Blob([pdfFromJpeg(new Uint8Array(await jb.arrayBuffer()),cv.width,cv.height,PW(),PH())]);name=base+'.pdf'}
   else if(fmt==='png'){blob=await toBlob(cv,'image/png');name=base+'.png'}else{blob=await toBlob(cv,'image/jpeg',.95);name=base+'.jpg'}
   try{await DL.save({filename:name,data:blob});flash(L('حُفظ الملف ✓ ','Saved ✓ ')+name)}catch(er){const code=er&&er.code;flash(code==='declined'?L('أُلغي التنزيل','Download cancelled'):code==='rate_limited'?L('انتظر قليلاً وأعد المحاولة','Please wait and try again'):L('تعذّر التنزيل — جرّب "معاينة"','Download failed — try Preview'))}}
  else{$('shot').src=cv.toDataURL('image/jpeg',.95);modal('shot');$('mTitle').textContent=`${sheet.size} — ${cv.width}×${cv.height} ${L('بكسل','px')} (${dpi} DPI)`}}
 catch(e){flash(L('حدث خطأ أثناء التصدير — جرّب دقة أقل','Export error — try lower DPI'))}finally{busy(false)}}
async function exportAll(){if(!DL)return;const dpi=parseInt($('shDpi').value)||300,hq=$('shHQ').classList.contains('on');busy(true);const keep=curSheet,pages=[];
 try{const names=Object.keys(sheets);for(let i=0;i<names.length;i++){flash(L(`جارٍ تجهيز اللوحة ${i+1}/${names.length}…`,`Preparing sheet ${i+1}/${names.length}…`));curSheet=names[i];sheet=sheets[curSheet];await loadImgs();const cv=await composeSheet(dpi,hq);const jb=await toBlob(cv,'image/jpeg',.93);pages.push({bytes:new Uint8Array(await jb.arrayBuffer()),w:cv.width,h:cv.height,wmm:PW(),hmm:PH()})}}
 finally{curSheet=keep;sheet=sheets[keep];await loadImgs();layoutSheet();busy(false)}
 try{await DL.save({filename:L(`كل اللوحات (${pages.length}) ${dpi}dpi.pdf`,`All Sheets (${pages.length}) ${dpi}dpi.pdf`),data:new Blob([pdfPages(pages)])});flash(L('حُفظ ملف PDF يضم كل اللوحات ✓','Saved multi-page PDF ✓'))}catch(e){flash(L('أُلغي التنزيل','Download cancelled'))}}
$('shExport').onclick=()=>exportSheet(false);$('shDown').onclick=()=>exportSheet(true);$('shAll').onclick=exportAll;$('shHQ').onclick=()=>$('shHQ').classList.toggle('on');
// ---- add items ----
function addText(text,x,y,w,size,opt){const it=Object.assign({id:uid(),type:'text',x,y,w,h:size*1.6,text,size,bold:false,color:'#222222',align:'center',font:'Tajawal'},opt||{});sheet.items.push(it);return it}
function addItem(o){const it=Object.assign({id:uid()},o);sheet.items.push(it);return it}
function afterAdd(it){setSSel([it.id]);saveSheet();if(!sheetOpen)openSheet(true);else renderSheet()}
function fixTitles(){const W=PW(),H=PH();const t1=byId('t1');if(t1){t1.w=W-40;t1.x=20;t1.y=12}const tb=byId('tb1');if(tb){tb.w=W-40;tb.x=20;tb.y=H-23}}
function autoArrange(){const imgs=sheet.items.filter(i=>i.type==='img'&&!i.lock);if(!imgs.length)return;sPush();const W=PW(),H=PH(),top=32,bot=sheet.frame?30:20,mx=16,gap=6;
 const n=imgs.length,cols=n<=1?1:n<=4?2:3,rows=Math.ceil(n/cols),cw=(W-2*mx-(cols-1)*gap)/cols,ch=(H-top-bot-(rows-1)*gap)/rows;
 imgs.forEach((it,k)=>{const ar=it.h/it.w;let w=cw,h=w*ar;if(h>ch){h=ch;w=h/ar}const c=k%cols,r=Math.floor(k/cols);it.w=+w.toFixed(1);it.h=+h.toFixed(1);it.x=+(W-mx-(c+1)*cw-c*gap+(cw-w)/2).toFixed(1);it.y=+(top+r*(ch+gap)+(ch-h)/2).toFixed(1)});
 fixTitles();saveSheet();renderSheet()}
function addLegend(x,y){const g=uid(),en=L('0','1')==='1';Object.entries(FNS).forEach(([k,f],i)=>{if(!f.t)return;sheet.items.push({id:uid(),g,type:'rect',x:en?x:x+62,y:y+i*7,w:5,h:5,color:f.c});addText(fnName(k),en?x+8:x,y+i*7-.3,60,3.6,{align:en?'left':'right',h:6,g})})}
function addTitleBlock(){const W=PW(),H=PH(),bw=Math.min(170,W*.42),bh=40,x=W-12-bw,y=H-12-bh,g=uid(),rh=bh/4,ln=(x1,y1,w,h)=>addItem({type:'line',g,x:x1,y:y1,w,h,color:'#222222'});
 addItem({type:'box',g,x,y,w:bw,h:bh,color:'#222222',sw:.5,fill:'#ffffff'});for(let r=1;r<4;r++)ln(x,y+r*rh,bw,.3);ln(x+bw/2,y+rh*2,.3,rh);ln(x+bw*2/3,y+rh*3,.3,rh);ln(x+bw/3,y+rh*3,.3,rh);
 const m=state.meta||{},today=new Date(),ds=`${today.getFullYear()}/${today.getMonth()+1}/${today.getDate()}`,T=(t,xx,yy,ww,o)=>addText(t,xx+1.5,yy+rh*.22,ww-3,3.3,Object.assign({align:L('right','left'),g,h:rh*.7},o||{}));
 T(L('المشروع: ','Project: ')+(m.title||curName||L('مشروع معماري','Architectural Project'))+(m.location?' — '+m.location:''),x,y,bw,{bold:true,size:3.8});
 T(m.org||L('دراسة كتلية معمارية — ماكيت','Architectural Massing Study — Maket'),x,y+rh,bw,{size:3});
 T(L('المصمم: ','Designer: ')+(m.designer||'—'),x+bw/2,y+rh*2,bw/2);T(L('التصميم: ','Design: ')+curName,x,y+rh*2,bw/2,{size:2.8});
 T(L('رقم اللوحة: 01','Sheet No: 01'),x+bw*2/3,y+rh*3,bw/3);T(L('المقياس: كما مبين','Scale: As Shown'),x+bw/3,y+rh*3,bw/3);T(L('التاريخ: ','Date: ')+ds,x,y+rh*3,bw/3);
 const tb=byId('tb1');if(tb)sheet.items=sheet.items.filter(i=>i!==tb)}
function shDelete(){const its=selItems().filter(i=>!i.lock);if(!its.length)return flash(L('العنصر مقفل','Item is locked'));sPush();const ids=new Set(its.map(i=>i.id));sheet.items=sheet.items.filter(i=>!ids.has(i.id));setSSel([]);saveSheet();renderSheet()}
function shDup(){const its=selItems();if(!its.length)return;sPush();const gm={},out=[];its.forEach(i=>{const c=clone(i);c.id=uid();c.x+=6;c.y+=6;c.lock=false;if(c.g){gm[c.g]=gm[c.g]||uid();c.g=gm[c.g]}sheet.items.push(c);out.push(c.id)});setSSel(out);saveSheet();renderSheet()}
function group(){const its=selItems();if(its.length<2)return flash(L('حدد عنصرين أو أكثر (Shift + نقر)','Select 2+ items (Shift + Click)'));sPush();const g=uid();its.forEach(i=>i.g=g);saveSheet();renderSheet();flash(L('جُمِّعت ✓ — تتحرك معاً','Grouped ✓'))}
function ungroup(){const its=selItems();if(!its.length)return;sPush();its.forEach(i=>delete i.g);saveSheet();renderSheet();flash(L('فُكّ تجميع العناصر','Ungrouped'))}
function align(mode){const its=selItems().filter(i=>!i.lock);if(!its.length)return;sPush();let x0,y0,x1,y1;
 if(its.length===1||(its.every(i=>i.g&&i.g===its[0].g))){x0=sheet.frame?8:0;y0=sheet.frame?8:0;x1=PW()-x0;y1=PH()-y0;if(its.every(i=>i.g&&i.g===its[0].g)&&its.length>1){const bx=bbox(its),dx={r:x1-bx.x1,l:x0-bx.x0,c:(x0+x1)/2-(bx.x0+bx.x1)/2}[mode]||0,dy={t:y0-bx.y0,b:y1-bx.y1,m:(y0+y1)/2-(bx.y0+bx.y1)/2}[mode]||0;its.forEach(i=>{i.x+=dx;i.y+=dy});saveSheet();renderSheet();return}}
 else{const b=bbox(its);x0=b.x0;y0=b.y0;x1=b.x1;y1=b.y1}
 its.forEach(i=>{if(mode==='r')i.x=x1-i.w;if(mode==='l')i.x=x0;if(mode==='c')i.x=(x0+x1)/2-i.w/2;if(mode==='t')i.y=y0;if(mode==='b')i.y=y1-i.h;if(mode==='m')i.y=(y0+y1)/2-i.h/2});saveSheet();renderSheet()}
function bbox(its){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;its.forEach(i=>{x0=Math.min(x0,i.x);y0=Math.min(y0,i.y);x1=Math.max(x1,i.x+i.w);y1=Math.max(y1,i.y+i.h)});return {x0,y0,x1,y1}}
function distribute(ax){const its=selItems().filter(i=>!i.lock);if(its.length<3)return flash(L('حدد 3 عناصر أو أكثر','Select 3 or more items'));sPush();const k=ax==='h'?'x':'y',s=ax==='h'?'w':'h';its.sort((a,b)=>a[k]-b[k]);
 const first=its[0][k],last=its[its.length-1][k]+its[its.length-1][s],tot=its.reduce((a,i)=>a+i[s],0),gap=(last-first-tot)/(its.length-1);let p=first;its.forEach(i=>{i[k]=+p.toFixed(1);p+=i[s]+gap});saveSheet();renderSheet()}
function sameSize(){const its=selItems().filter(i=>i.type==='img'&&!i.lock);if(its.length<2)return flash(L('حدد صورتين أو أكثر','Select 2 or more images'));sPush();const ref=selItems().find(i=>i.id===sItem)||its[0];its.forEach(i=>{if(i===ref)return;const ar=i.h/i.w;i.w=ref.w;i.h=+(ref.w*ar).toFixed(1)});saveSheet();renderSheet()}
function setSize(sz){if(!SIZES[sz]||sz===sheet.size)return;sPush();const f=(SIZES[sz][0])/(SIZES[sheet.size||'A3'][0]);sheet.items.forEach(i=>{i.x*=f;i.y*=f;i.w*=f;i.h*=f;if(i.size)i.size*=f;if(i.sw)i.sw*=f;if(i.bd)i.bd*=f});sheet.size=sz;saveSheet();layoutSheet();flash(L('أصبحت اللوحة '+sz+' وكُبّرت العناصر بالنسبة نفسها','Sheet set to '+sz+' and items scaled proportionally'))}
// ---- bindings ----
const curIt=()=>selItems().length===1?selItems()[0]:null;
function upd(fn){const its=selItems();if(!its.length)return;sPush();its.forEach(fn);saveSheet();renderSheet()}
$('shOpen').onclick=()=>openSheet(!sheetOpen);$('shShot').onclick=()=>captureView();$('shUp').onclick=()=>$('shFile').click();
$('shFile').onchange=e=>{[...e.target.files].forEach(f=>{const rd=new FileReader();rd.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,2600/Math.max(im.width,im.height));const cv=document.createElement('canvas');cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);const c=cv.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,cv.width,cv.height);c.drawImage(im,0,0,cv.width,cv.height);sPush();const it=addImgItem({data:cv.toDataURL('image/jpeg',.92),ar:cv.height/cv.width});afterAdd(it)};im.src=rd.result};rd.readAsDataURL(f)});e.target.value=''};
$('shText').onclick=()=>{sPush();afterAdd(addText(L('اكتب هنا (نقر مزدوج للتعديل)','Type here (double-click to edit)'),PW()/2-60,PH()/2-6,120,5))};
$('shBox').onclick=()=>{sPush();afterAdd(addItem({type:'box',x:PW()/2-40,y:PH()/2-25,w:80,h:50,color:'#222222',sw:.5}))};
$('shLine').onclick=()=>{sPush();afterAdd(addItem({type:'line',x:PW()/2-60,y:PH()/2,w:120,h:.4,color:'#222222'}))};
$('shLineV').onclick=()=>{sPush();afterAdd(addItem({type:'line',x:PW()/2,y:PH()/2-40,w:.4,h:80,color:'#222222'}))};
$('shTB').onclick=()=>{sPush();addTitleBlock();saveSheet();if(!sheetOpen)openSheet(true);else renderSheet();flash(L('أُضيف جدول العنوان — انقر نقراً مزدوجاً على أي خانة لتعديلها','Title block added — double-click any cell to edit'))};
$('shTitle').onclick=()=>{sPush();if(!byId('t1'))sheet.items.push(defSheet().items[0]);fixTitles();saveSheet();if(!sheetOpen)openSheet(true);else renderSheet()};
$('shLegend').onclick=()=>{sPush();addLegend(PW()-16-70,PH()-60);saveSheet();if(!sheetOpen)openSheet(true);else renderSheet()};
$('shNorth').onclick=()=>{sPush();afterAdd(addItem({type:'north',x:20,y:PH()-45,w:18,h:22,rot:state.site.north||0}))};
$('shScale').onclick=()=>{const p=curIt();let n=500;if(p&&planMeters(p))n=Math.round(planMeters(p)*1000/p.w);n=[100,200,250,500,1000,2000].reduce((a,b)=>Math.abs(b-n)<Math.abs(a-n)?b:a);sPush();afterAdd(addItem({type:'scale',n,x:p?p.x:24,y:p?p.y+p.h+6:PH()-40,w:40,h:8}))};
$('shSize').onchange=e=>setSize(e.target.value);
$('shLand').onclick=()=>{if(sheet.orient==='land')return;sPush();sheet.orient='land';autoArrange();layoutSheet()};$('shPort').onclick=()=>{if(sheet.orient==='port')return;sPush();sheet.orient='port';autoArrange();layoutSheet()};
$('shFrame').onclick=()=>{sPush();sheet.frame=!sheet.frame;saveSheet();renderSheet()};$('shAuto').onclick=autoArrange;$('shUndo').onclick=sUndo;
$('shZin').onclick=()=>setZoom(sZoom*1.25);$('shZout').onclick=()=>setZoom(sZoom/1.25);$('shZfit').onclick=()=>setZoom(1);$('shGuides').onclick=()=>{showGuides=!showGuides;$('shGuides').classList.toggle('on',showGuides)};
$('shDel').onclick=shDelete;$('shDone').onclick=()=>{setSSel([]);renderSheet();showTab('sheet')};$('shDupB').onclick=shDup;$('shGrp').onclick=group;$('shUngrp').onclick=ungroup;
document.querySelectorAll('[data-al]').forEach(b=>b.onclick=()=>align(b.dataset.al));$('shDistH').onclick=()=>distribute('h');$('shDistV').onclick=()=>distribute('v');$('shSame').onclick=sameSize;
$('shFront').onclick=()=>upd(()=>{});$('shFront').onclick=()=>{const its=selItems();if(!its.length)return;sPush();const ids=new Set(its.map(i=>i.id));sheet.items=sheet.items.filter(i=>!ids.has(i.id)).concat(its);saveSheet();renderSheet()};
$('shBack').onclick=()=>{const its=selItems();if(!its.length)return;sPush();const ids=new Set(its.map(i=>i.id));sheet.items=its.concat(sheet.items.filter(i=>!ids.has(i.id)));saveSheet();renderSheet()};
$('shLockB').onclick=()=>{const its=selItems();if(!its.length)return;const v=!its.every(i=>i.lock);upd(i=>i.lock=v);flash(v?L('قُفلت','Locked'):L('أُلغي القفل','Unlocked'))};
$('shPlus').onclick=()=>shScale(1.1);$('shMinus').onclick=()=>shScale(1/1.1);
function shScale(f){upd(it=>{if(it.lock)return;if(it.type==='text')it.size=+(it.size*f).toFixed(2);else if(it.type==='scale'){}else{it.w=+(it.w*f).toFixed(1);it.h=+(it.h*f).toFixed(1)}})}
$('shBold').onclick=()=>upd(it=>{if(it.type==='text')it.bold=!it.bold});
$('shEditT').onclick=()=>startEdit(curIt());
$('shTxt').onfocus=()=>{const it=curIt();if(it&&it.type==='text'&&!it.lock)sPush()};
$('shTxt').oninput=e=>{const it=curIt();if(!it||it.type!=='text'||it.lock)return;it.text=e.target.value;const tx=pg.querySelector(`[data-id="${it.id}"] .stext`);if(tx)tx.textContent=it.text};
$('shTxt').onchange=()=>{saveSheet()};
$('shAlign').onclick=()=>upd(it=>{if(it.type==='text')it.align={right:'center',center:'left',left:'right'}[it.align]||'right'});
$('shFont').onchange=e=>upd(it=>{if(it.type==='text')it.font=e.target.value});
$('shColor').onchange=e=>upd(it=>{if(['text','rect','box','line'].includes(it.type))it.color=e.target.value});
$('shSw').onchange=e=>{const v=Math.max(0,parseFloat(e.target.value)||0);upd(it=>{if(it.type==='img')it.bd=v;else if(it.type==='box')it.sw=v;else if(it.type==='line'){if(it.w>=it.h)it.h=Math.max(.1,v);else it.w=Math.max(.1,v)}})};
$('shRot').onchange=e=>upd(it=>{if(it.type==='north')it.rot=parseFloat(e.target.value)||0});
$('shScaleN').onchange=e=>{const it=curIt(),N=parseFloat(e.target.value);if(!it||!(N>0))return;const m=planMeters(it);if(!m)return;sPush();const ar=it.h/it.w;it.w=+(m*1000/N).toFixed(2);it.h=+(it.w*ar).toFixed(2);saveSheet();renderSheet();flash(L(`أصبح مقياس المسقط 1:${N} — عرضه ${it.w.toFixed(0)} مم`,`Plan scale set to 1:${N} — width ${it.w.toFixed(0)} mm`))};
$('shLenN').onchange=e=>upd(it=>{if(it.type==='scale')it.n=parseFloat(e.target.value)||500});$('shLenL').onchange=e=>upd(it=>{if(it.type==='scale')it.len=parseFloat(e.target.value)||0});
$('shClear').onclick=e=>arm(e.currentTarget,()=>{sPush();sheet=defSheet();sheets[curSheet]=sheet;setSSel([]);saveSheet();renderSheet();flash(L('مُسحت اللوحة — Ctrl+Z لاستعادتها','Sheet cleared — Ctrl+Z to undo'))});
async function loadImgs(){if(!IDB.db)return;for(const it of sheet.items){if(it.type==='img'&&!imgSrc[it.src]){const v=await IDB.get(it.src);if(v)imgSrc[it.src]=v}}if(sheetOpen)renderSheet()}
IDB.open().then(ok=>{if(ok)loadImgs()});fillSheets();
$('shList').onchange=e=>switchSheet(e.target.value);
$('shNew').onclick=()=>{newSheet(L('لوحة','Sheet'));layoutSheet();sheetPanel();if(!sheetOpen)openSheet(true)};
$('shDupS').onclick=()=>{const c=clone(sheet);newSheet(curSheet+L(' نسخة',' Copy'),c);layoutSheet();flash(L('نُسخت اللوحة ✓','Sheet duplicated ✓'))};
$('shRen').onclick=()=>{const n=($('shName').value||'').trim();if(!n||n===curSheet)return;if(sheets[n])return flash(L('توجد لوحة بالاسم نفسه','A sheet with that name already exists'));const o={};Object.keys(sheets).forEach(k=>o[k===curSheet?n:k]=sheets[k]);sheets=o;curSheet=n;saveSheet();fillSheets();$('shName').value='';flash(L('تم تغيير الاسم ✓','Renamed ✓'))};
$('shDelS').onclick=e=>arm(e.currentTarget,()=>{delete sheets[curSheet];if(!Object.keys(sheets).length)sheets[L('اللوحة 1','Sheet 1')]=defSheet();curSheet=Object.keys(sheets)[0];sheet=sheets[curSheet];setSSel([]);sHist=[];saveSheet();fillSheets();loadImgs();layoutSheet();sheetPanel()});
$('shGround').onclick=()=>{shGround=!shGround;$('shGround').classList.toggle('on',shGround)};
$('shNamesB').onclick=()=>{shNames=!shNames;$('shNamesB').classList.toggle('on',shNames)};

// ---- crop (composes with HQ crop) ----
let crop=null;const cBox=$('cropBox'),cImg=$('cropImg'),cRect=$('cropRect');
function openCrop(){const it=byId(sItem);if(!it||it.type!=='img')return flash(L('حدّد لقطة أولاً','Select an image first'));crop={it,r:{x0:0,y0:0,x1:1,y1:1}};cImg.onload=()=>drawCrop();cImg.src=imgSrc[it.src];modal('crop')}
function drawCrop(){if(!crop)return;const W=cImg.clientWidth,H=cImg.clientHeight,r=crop.r;Object.assign(cRect.style,{left:r.x0*W+'px',top:r.y0*H+'px',width:(r.x1-r.x0)*W+'px',height:(r.y1-r.y0)*H+'px'})}
let cDrag=null;
cBox.addEventListener('pointerdown',e=>{if(!crop)return;const h=e.target.dataset.c||(e.target===cRect?'mv':null);if(!h)return;e.preventDefault();cDrag={h,x0:e.clientX,y0:e.clientY,o:Object.assign({},crop.r)}});
addEventListener('pointermove',e=>{if(!cDrag)return;const W=cImg.clientWidth,H=cImg.clientHeight,dx=(e.clientX-cDrag.x0)/W,dy=(e.clientY-cDrag.y0)/H,o=cDrag.o,r=crop.r,cl=v=>Math.max(0,Math.min(1,v)),m=.03;
 if(cDrag.h==='mv'){const w=o.x1-o.x0,h=o.y1-o.y0;r.x0=Math.max(0,Math.min(1-w,o.x0+dx));r.y0=Math.max(0,Math.min(1-h,o.y0+dy));r.x1=r.x0+w;r.y1=r.y0+h}
 else{if(cDrag.h.includes('w'))r.x0=Math.min(cl(o.x0+dx),r.x1-m);if(cDrag.h.includes('e'))r.x1=Math.max(cl(o.x1+dx),r.x0+m);if(cDrag.h.includes('n'))r.y0=Math.min(cl(o.y0+dy),r.y1-m);if(cDrag.h.includes('s'))r.y1=Math.max(cl(o.y1+dy),r.y0+m)}drawCrop()});
addEventListener('pointerup',()=>{cDrag=null});
function applyCrop(){if(!crop)return;const {it,r}=crop,im=cImg,W=im.naturalWidth,H=im.naturalHeight;const cv=cropCanvas((()=>{const c=document.createElement('canvas');c.width=W;c.height=H;c.getContext('2d').drawImage(im,0,0);return c})(),r);
 sPush();setImg(it,cv.toDataURL('image/jpeg',.92),r);$('modal').style.display='none';crop=null;flash(L('قُصّت اللقطة ✓','Cropped ✓'))}
function setImg(it,data,r){const id=uid();imgSrc[id]=data;IDB.put(id,data);it.x=+(it.x+r.x0*it.w).toFixed(1);it.y=+(it.y+r.y0*it.h).toFixed(1);it.w=+(it.w*(r.x1-r.x0)).toFixed(1);it.h=+(it.h*(r.y1-r.y0)).toFixed(1);it.src=id;
 if(it.crop){const c=it.crop,cw=c.x1-c.x0,ch=c.y1-c.y0;it.crop={x0:c.x0+r.x0*cw,y0:c.y0+r.y0*ch,x1:c.x0+r.x1*cw,y1:c.y0+r.y1*ch}}saveSheet();renderSheet()}
function autoTrimItem(){const it=byId(sItem);if(!it||it.type!=='img')return flash(L('حدّد لقطة أولاً','Select an image first'));const im=new Image();im.onload=()=>{const cv=document.createElement('canvas');cv.width=im.width;cv.height=im.height;cv.getContext('2d').drawImage(im,0,0);
  const r=trimBox(cv);if(!r)return;sPush();setImg(it,cropCanvas(cv,r).toDataURL('image/jpeg',.92),r);flash(L('أُزيلت الحواف البيضاء ✓','White margins trimmed ✓'))};im.src=imgSrc[it.src]}
$('shCrop').onclick=openCrop;$('shTrim').onclick=autoTrimItem;$('cropOk').onclick=applyCrop;$('cropAll').onclick=()=>{if(crop){crop.r={x0:0,y0:0,x1:1,y1:1};drawCrop()}};
// ---- quick sheet with chooser ----
const QV={iso:'أيزومتري',isoB:'أيزومتري (الجهة المقابلة)',top:'المسقط الأفقي',front:'الواجهة الأمامية',side:'الواجهة الجانبية',eye:'منظور بمستوى الإنسان'};
function openQuick(){const opts_=`<option value="__cur">${L('التصميم المفتوح','Current design')} (${curName.replace(/</g,'&lt;')})</option>`+Object.keys(designs).filter(k=>k!==curName).map(k=>`<option>${k.replace(/</g,'&lt;')}</option>`).join('');$('qDesign').innerHTML=opts_;
 $('qViews').innerHTML=Object.entries(QV).map(([k,n])=>`<label class="qchk"><input type="checkbox" value="${k}" ${['iso','top','front'].includes(k)?'checked':''}> ${dn('qv',k,n)}</label>`).join('');$('qTitle').value='';modal('quick')}
async function runQuick(){const pick=$('qDesign').value||'__cur',name=pick==='__cur'?curName:pick;if(pick!=='__cur'&&!designs[pick])return;
 const views=[...document.querySelectorAll('#qViews input:checked')].map(i=>i.value);if(!views.length)return flash(L('اختر زاوية واحدة على الأقل','Choose at least one view'));
 const opt={fn:$('qFn').checked,ground:$('qGround').checked,sun:$('qSun').checked,legend:$('qLegend').checked,orient:$('qOrient').value,layout:$('qLayout').value,title:$('qTitle').value.trim()||(name+L(' — النموذج الكتلي',' — Massing Model'))};
 $('modal').style.display='none';flash(L('جارٍ تجهيز اللوحة…','Generating sheet…'));
 const keep={state,curName,sel,selSet,cm:colorMode,plan:isPlan};
 if(pick!=='__cur')state=normState(clone(designs[pick]));const capState=clone(state);if(opt.sun)capState.sun.on=true;state=normState(clone(capState));
 colorMode=opt.fn?'fn':'mat';clearSel();const secWas=sec.on;if(sec.on)setSecOn(false);siteChanged();build();
 const shots={};for(const v of views){view(v,0);O.update();await new Promise(r=>requestAnimationFrame(()=>r()));const g=await grab(opt.ground,$('qNames').checked);if(g){g.state=clone(capState);shots[v]=g}}
 state=keep.state;curName=keep.curName;sel=keep.sel;selSet=keep.selSet;colorMode=keep.cm;siteChanged();if(secWas)setSecOn(true);view(keep.plan?'top':'iso');refresh();
 const n=newSheet(L('لوحة — ','Sheet — ')+name);sheet.orient=opt.orient;sheet.size=$('qSize').value||'A3';sheet.frame=true;sheet.items=defSheet().items;if(sheet.size!=='A3'){const f=SIZES[sheet.size][0]/420;sheet.items.forEach(i=>{i.size*=f})}sheet.items[0].text=opt.title;fixTitles();
 const W=PW(),H=PH(),top=30,bot=(sheet.frame?30:20)+(opt.legend&&opt.fn?0:0),mx=14,gap=8,cap=9,keys=views.filter(v=>shots[v]);
 const boxes=layoutBoxes(keys.length,opt.layout,W,H,top,bot,mx,gap,cap,opt.legend&&opt.fn);
 keys.forEach((v,i)=>{const b=boxes[i];const it=addImgItem(shots[v],b);addText(dn('qv',v,QV[v]),b.x,it.y+it.h+1.5,b.w,4.2,{bold:true,color:'#9C3F24'})});
 if(opt.legend&&opt.fn)addLegend(mx+2,H-bot-46);if($('qTB').checked){addTitleBlock()}if($('qNorth').checked){const tp=sheet.items.find(i=>i.type==='img'&&i.cam&&i.cam.o);if(tp)sheet.items.push({id:uid(),type:'north',x:tp.x+2,y:tp.y+2,w:14,h:17,rot:state.site.north||0})}if($('qScale').checked){const tp=sheet.items.find(i=>i.type==='img'&&i.cam&&i.cam.o);if(tp){const m=planMeters(tp),N=[100,200,250,500,1000,2000].reduce((a,b)=>Math.abs(b-m*1000/tp.w)<Math.abs(a-m*1000/tp.w)?b:a);const ar=tp.h/tp.w,cx=tp.x+tp.w/2;tp.w=+(m*1000/N).toFixed(1);tp.h=+(tp.w*ar).toFixed(1);tp.x=+(cx-tp.w/2).toFixed(1);sheet.items.push({id:uid(),type:'scale',n:N,x:tp.x,y:tp.y+tp.h+9,w:40,h:8})}}
 saveSheet();fillSheets();if(!sheetOpen)openSheet(true);else layoutSheet();flash(L('اللوحة جاهزة: '+n+' — تُعاد معالجة اللقطات بدقة عالية عند التصدير','Sheet ready: '+n+' — views re-render at HQ on export'))}
function layoutBoxes(n,mode,W,H,top,bot,mx,gap,cap,leg){const AW=W-2*mx,AH=H-top-bot;const out=[];
 if(n===1)return [{x:mx,y:top,w:AW,h:AH-cap}];
 if(mode==='big'){const bigW=AW*(W>H?.56:1),bigH=W>H?AH-cap:AH*.55-cap;
  if(W>H){out.push({x:W-mx-bigW,y:top,w:bigW,h:bigH});const rest=n-1,sw_=AW-bigW-gap,rows=Math.min(rest,3),cols=Math.ceil(rest/rows),cw=(sw_-(cols-1)*gap)/cols,availH=AH-(leg?48:0),ch=(availH-(rows-1)*gap)/rows-cap;
   for(let i=0;i<rest;i++){const c=Math.floor(i/rows),r=i%rows;out.push({x:mx+sw_-(c+1)*cw-c*gap,y:top+r*(ch+cap+gap),w:cw,h:ch})}}
  else{out.push({x:mx,y:top,w:AW,h:bigH});const rest=n-1,cols=Math.min(rest,2),rows=Math.ceil(rest/cols),cw=(AW-(cols-1)*gap)/cols,y0=top+bigH+cap+gap,ch=(H-bot-y0-(leg?48:0)-(rows-1)*gap)/rows-cap;
   for(let i=0;i<rest;i++){const c=i%cols,r=Math.floor(i/cols);out.push({x:W-mx-(c+1)*cw-c*gap,y:y0+r*(ch+cap+gap),w:cw,h:ch})}}return out}
 const cols=n<=2?2:n<=4?2:3,rows=Math.ceil(n/cols),cw=(AW-(cols-1)*gap)/cols,ch=(AH-(leg?48:0)-(rows-1)*gap)/rows-cap;
 for(let i=0;i<n;i++){const c=i%cols,r=Math.floor(i/cols);out.push({x:W-mx-(c+1)*cw-c*gap,y:top+r*(ch+cap+gap),w:cw,h:ch})}return out}
$('shQuick').onclick=openQuick;$('qGo').onclick=runQuick;
document.querySelector('[data-t=sheet]').addEventListener('click',()=>{if(!sheetOpen)openSheet(true)});

// ================= MORE: report, compare, backup, video, wind =================
function computeStats(st){const bl=st.blocks.filter(counts),W=st.site.w,D=st.site.d,fh=st.fh;let fp=0;const gr=bl.filter(b=>b.y0<1);
 for(let x=-W/2+.5;x<W/2;x+=1)for(let z=-D/2+.5;z<D/2;z+=1){for(const b of gr){if(inside(b,x,z)){fp+=1;break}}}
 const by={};Object.keys(FNS).forEach(k=>by[k]=0);let gfa=0,hmax=0;bl.forEach(b=>{const a=areaOf(b)*b.f;gfa+=a;by[b.fn||'']+=a;hmax=Math.max(hmax,b.y0+b.f*fh)});
 return {fp,gfa,by,hmax,cov:fp/(W*D),far:gfa/(W*D),n:bl.length,W,D}}
const csvEsc=v=>{const s=String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
let reportCSV='';
function openReport(){const s=computeStats(state),r=x=>Math.round(x).toLocaleString('en'),u2=L('م²','m²'),um=L('م','m');let h=`<div class="rep"><div class="repk">
 <div><b>${r(s.fp)}</b><span>${L('البصمة','Footprint')} ${u2}</span></div><div><b>${(s.cov*100).toFixed(0)}%</b><span>${L('التغطية','Coverage')}</span></div><div><b>${r(s.gfa)}</b><span>${L('المساحة الطابقية','GFA')} ${u2}</span></div><div><b>${s.far.toFixed(2)}</b><span>${L('معامل الاستغلال FAR','FAR')}</span></div><div><b>${s.hmax.toFixed(1)}</b><span>${L('أعلى ارتفاع','Max Height')} ${um}</span></div></div>
 <h4>${L('حسب الوظيفة مقابل البرنامج','By Zone vs. Program')}</h4><table><tr><th>${L('الوظيفة','Zone')}</th><th>${L('بالتصميم','Designed')} ${u2}</th><th>${L('المطلوب (مع الحركة)','Target (+25% Circ.)')} ${u2}</th><th>${L('الفرق','Diff')}</th><th>${L('النسبة','Ratio')}</th></tr>`;
 const rows=[[L('الوظيفة','Zone'),L('بالتصميم م2','Designed m2'),L('المطلوب م2','Target m2'),L('الفرق','Diff'),L('النسبة','Ratio')]];
 Object.entries(FNS).forEach(([k,f])=>{if(!f.t&&!s.by[k])return;const fnm=fnName(k),tg=f.t*1.25,d=s.by[k]-tg,p=tg?s.by[k]/tg*100:0;h+=`<tr><td><span class="sw" style="background:${f.c}"></span>${fnm}</td><td>${r(s.by[k])}</td><td>${tg?r(tg):'—'}</td><td class="${d<0?'neg':'pos'}">${tg?(d>0?'+':'')+r(d):'—'}</td><td>${tg?p.toFixed(0)+'%':'—'}</td></tr>`;rows.push([fnm,Math.round(s.by[k]),Math.round(tg),Math.round(d),tg?p.toFixed(0)+'%':''])});
 h+=`</table><h4>${L('الكتل','Blocks')}</h4><table><tr><th>${L('الكتلة','Block')}</th><th>${L('الوظيفة','Zone')}</th><th>${L('الشكل','Shape')}</th><th>${L('المادة','Material')}</th><th>${L('القياس','Size')} ${um}</th><th>${L('الطوابق','Floors')}</th><th>${L('البصمة','Footprint')} ${u2}</th><th>${L('المساحة','Area')} ${u2}</th></tr>`;
 rows.push([]);rows.push([L('الكتلة','Block'),L('الوظيفة','Zone'),L('الشكل','Shape'),L('المادة','Material'),L('العرض','Width'),L('العمق','Depth'),L('الطوابق','Floors'),L('البصمة م2','Footprint m2'),L('المساحة م2','Area m2')]);
 state.blocks.forEach(b=>{const a=areaOf(b),fnm=fnName(b.fn||''),snm=dn('shapes',b.shape,SHAPES[b.shape]),mnm=dn('mats',b.mat,MATS[b.mat].n);h+=`<tr><td>${b.name.replace(/</g,'&lt;')}</td><td>${fnm}</td><td>${snm}</td><td>${mnm}</td><td>${b.w.toFixed(1)}×${b.d.toFixed(1)}</td><td>${counts(b)?b.f:'—'}</td><td>${r(a)}</td><td>${r(a*b.f)}</td></tr>`;rows.push([b.name,fnm,snm,mnm,b.w.toFixed(1),b.d.toFixed(1),counts(b)?b.f:'',Math.round(a),Math.round(a*b.f)])});
 h+=`</table><div class="hint">${L('الأرقام تقريبية: تُحسب البصمة بشبكة 1 م، والمطلوب = البرنامج الصافي + 25% حركة.','Figures are approximate: footprint uses a 1 m grid, target = net program + 25% circulation.')}</div></div>`;
 reportCSV='\uFEFF'+rows.map(r=>r.map(csvEsc).join(',')).join('\n');$('repBody').innerHTML=h;modal('report');$('repCSV').style.display=DL?'':'none'}
function openCompare(){const all=Object.assign({},designs);all[curName]=state;const r=x=>Math.round(x).toLocaleString('en'),u2=L('م²','m²'),um=L('م','m');
 let h=`<div class="rep"><table><tr><th>${L('التصميم','Design')}</th><th>${L('البصمة','Footprint')} ${u2}</th><th>${L('التغطية','Coverage')}</th><th>${L('المساحة الطابقية','GFA')} ${u2}</th><th>FAR</th><th>${L('أعلى ارتفاع','Max H')} ${um}</th><th>${L('الكتل','Blocks')}</th>`+Object.entries(FNS).filter(([k,f])=>f.t).map(([k,f])=>`<th><span class="sw" style="background:${f.c}"></span>${fnName(k).split(' ')[0]}</th>`).join('')+'</tr>';
 const rows=[[L('التصميم','Design'),L('البصمة','Footprint'),L('التغطية','Coverage'),L('المساحة الطابقية','GFA'),'FAR',L('أعلى ارتفاع','Max H'),L('الكتل','Blocks'),...Object.entries(FNS).filter(([k,f])=>f.t).map(([k])=>fnName(k))]];
 Object.entries(all).forEach(([n,st])=>{try{const s=computeStats(normState(clone(st)));h+=`<tr${n===curName?' class="cur"':''}><td>${n.replace(/</g,'&lt;')}</td><td>${r(s.fp)}</td><td>${(s.cov*100).toFixed(0)}%</td><td>${r(s.gfa)}</td><td>${s.far.toFixed(2)}</td><td>${s.hmax.toFixed(1)}</td><td>${s.n}</td>`+Object.entries(FNS).filter(([k,f])=>f.t).map(([k])=>`<td>${r(s.by[k])}</td>`).join('')+'</tr>';
  rows.push([n,Math.round(s.fp),(s.cov*100).toFixed(0)+'%',Math.round(s.gfa),s.far.toFixed(2),s.hmax.toFixed(1),s.n,...Object.entries(FNS).filter(([k,f])=>f.t).map(([k])=>Math.round(s.by[k]))])}catch(e){}});
 h+=`</table><div class="hint">${L('تظهر المساحات حسب الوظيفة فقط عند تحديد وظيفة كل كتلة.','Zone breakdowns require assigning a zone/function to each mass.')}</div></div>`;reportCSV='\uFEFF'+rows.map(r=>r.map(csvEsc).join(',')).join('\n');$('repBody').innerHTML=h;modal('report');$('mTitle').textContent=L('مقارنة التصاميم','Compare Designs');$('repCSV').style.display=DL?'':'none'}
$('bReport').onclick=openReport;$('bCompare').onclick=openCompare;
$('repCSV').onclick=async()=>{if(!DL)return;try{await DL.save({filename:L('تقرير المساحات.csv','Area Report.csv'),data:reportCSV});flash(L('حُفظ الجدول ✓ (يفتح بالإكسل)','CSV saved ✓ (opens in Excel)'))}catch(e){flash(L('أُلغي التنزيل','Download cancelled'))}};
// ---- backup ----
async function backup(){if(!DL)return flash(L('التنزيل غير متاح في هذا العرض','Download unavailable in this view'));flash(L('جارٍ تجهيز النسخة…','Preparing backup…'));const imgs={};for(const s of Object.values(sheets))for(const it of s.items)if(it.type==='img'&&!imgs[it.src]){const v=imgSrc[it.src]||await IDB.get(it.src);if(v)imgs[it.src]=v}
 const data={app:'mc3d',v:1,date:new Date().toISOString(),designs:Object.assign({},designs,{[curName]:state}),curName,sheets,curSheet,images:imgs,siteImg:imgData||null};
 const d=new Date(),name=L(`نسخة احتياطية - ماكيت ${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.json`,`Maket Backup ${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.json`);
 try{await DL.save({filename:name,data:new Blob([JSON.stringify(data)])});LS.set('mc3d_lastbk',Date.now());document.querySelector('.tab[data-t=file]').classList.remove('dotted');flash(L('حُفظت النسخة الاحتياطية ✓','Backup saved ✓'))}catch(e){flash(L('أُلغي التنزيل','Download cancelled'))}}
$('bBackup').onclick=backup;$('bRestore').onclick=()=>$('restoreFile').click();
$('restoreFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=async()=>{try{const d=JSON.parse(rd.result);if(d.app!=='mc3d'||!d.designs)throw 0;
  designs[curName]=clone(state);let nd=0;Object.entries(d.designs).forEach(([k,v])=>{const n=designs[k]&&JSON.stringify(designs[k])!==JSON.stringify(v)?k+L(' (مسترجع)',' (Restored)'):k;designs[n]=v;nd++});LS.set('mc3d_designs',designs);
  for(const [k,v] of Object.entries(d.images||{})){imgSrc[k]=v;await IDB.put(k,v)}
  let ns=0;Object.entries(d.sheets||{}).forEach(([k,v])=>{const n=sheets[k]?k+L(' (مسترجع)',' (Restored)'):k;sheets[n]=v;ns++});saveSheet();fillSheets();
  if(d.siteImg&&!imgData){imgData=d.siteImg;try{localStorage.setItem('mc3d_img',imgData)}catch(er){}}
  fillDesigns();flash(L(`استُعيدت ${nd} تصاميم و ${ns} لوحات ✓ — افتحها من التصاميم المحفوظة`,`Restored ${nd} design(s) & ${ns} sheet(s) ✓ — open from Saved Designs`))}catch(er){flash(L('الملف ليس نسخة احتياطية صالحة','Invalid backup file'))}};rd.readAsText(f);e.target.value=''};
// ---- video ----
let spin=null;
function spinStep(t){const s=spin;const k=Math.min(1,(t-s.t0)/s.dur);if(s.mode==='orbit'){const a=s.a0+k*Math.PI*2;C.position.set(s.tg.x+Math.cos(a)*s.r,s.y,s.tg.z+Math.sin(a)*s.r);C.lookAt(s.tg)}else{state.sun.hour=5.5+k*13.5;setSun()}}
async function recordVideo(){if(!DL)return flash(L('التنزيل غير متاح في هذا العرض','Download unavailable in this view'));const cv=R.domElement;if(!cv.captureStream||!window.MediaRecorder)return flash(L('المتصفح لا يدعم تسجيل الفيديو — جرّب Chrome','Browser does not support video capture — try Chrome'));
 const mode=$('vidMode').value,dur=parseInt($('vidDur').value)*1000;if(isPlan&&mode==='orbit')view('iso');clearSel();refresh();hG.visible=false;
 const keepSun=clone(state.sun);if(mode==='sun'){state.sun.on=true;setSun()}
 const tg=O.target.clone(),off=C.position.clone().sub(tg);const stream=cv.captureStream(30);const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));
 let rec;try{rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:10e6})}catch(e){return flash(L('تعذّر بدء التسجيل','Failed to start recording'))}const chunks=[];rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
 const done=new Promise(r=>rec.onstop=r);$('bVideo').classList.add('on');flash(L(`جارٍ التسجيل… ${dur/1000} ثانية — يُرجى عدم تحريك الشاشة`,`Recording… ${dur/1000}s — please keep window steady`));
 spin={mode,t0:performance.now(),dur,tg,r:Math.hypot(off.x,off.z),y:C.position.y,a0:Math.atan2(off.z,off.x)};rec.start(200);
 await new Promise(r=>setTimeout(r,dur+150));spin=null;rec.stop();await done;$('bVideo').classList.remove('on');hG.visible=true;state.sun=keepSun;setSun();O.update();
 const blob=new Blob(chunks,{type:'video/webm'});try{await DL.save({filename:`${curName} - ${mode==='orbit'?L('دوران','Orbit'):L('حركة الظلال','Sun Study')}.webm`,data:blob});flash(L('حُفظ الفيديو ✓','Video saved ✓'))}catch(e){flash(L('أُلغي التنزيل','Download cancelled'))}}
$('bVideo').onclick=recordVideo;
// ---- wind ----
const windG=new THREE.Group();S.add(windG);let showWind=false;
function windDirName(deg){const d=((deg%360)+360)%360;const names=L('0','1')==='1'?['North','North-East','East','South-East','South','South-West','West','North-West']:['شمالية','شمالية شرقية','شرقية','جنوبية شرقية','جنوبية','جنوبية غربية','غربية','شمالية غربية'];return names[Math.round(d/45)%8]}
function buildWind(){windG.clear();if(!showWind)return;const m=Math.max(state.site.w,state.site.d),wd=(state.site.wind!==undefined?state.site.wind:315),from=wd*Math.PI/180+state.site.north*Math.PI/180;
 const mat=new THREE.MeshBasicMaterial({color:'#1e40af',transparent:true,opacity:.85});for(let i=-1;i<=1;i++){const g=new THREE.Group();const L_=m*.28;
  const sh=new THREE.Mesh(new THREE.CylinderGeometry(m*.006,m*.006,L_,8),mat);sh.rotation.x=Math.PI/2;sh.position.z=-L_/2;g.add(sh);const hd=new THREE.Mesh(new THREE.ConeGeometry(m*.02,m*.05,12),mat);hd.rotation.x=Math.PI/2;g.add(hd);
  const dir=new THREE.Vector3(-Math.sin(from),0,Math.cos(from));const start=new THREE.Vector3(Math.sin(from),0,-Math.cos(from)).multiplyScalar(m*.8);const side=new THREE.Vector3(dir.z,0,-dir.x).multiplyScalar(i*m*.12);
  g.position.copy(start.add(side));g.position.y=m*.08;g.lookAt(g.position.clone().add(dir));windG.add(g)}}
$('bWind').onclick=()=>{showWind=!showWind;tg('bWind',showWind);buildWind();if(showWind){const wd=(state.site.wind!==undefined?state.site.wind:315);flash(L(`الرياح السائدة: ${windDirName(wd)} (${wd}°) — تبيّن الأسهم مسارها على الموقع`,`Prevailing Wind: ${windDirName(wd)} (${wd}°) — arrows indicate airflow direction`))}};

// ---- annual shadow heatmap ----
const shadowHmG=new THREE.Group();S.add(shadowHmG);
const hmProbeRing=new THREE.Group();
const hmProbeInner=new THREE.Mesh(new THREE.RingGeometry(0.85,1.3,28),new THREE.MeshBasicMaterial({color:'#0f172a',side:THREE.DoubleSide,depthTest:false}));
hmProbeInner.rotation.x=-Math.PI/2;
const hmProbeOuter=new THREE.Mesh(new THREE.RingGeometry(1.3,1.7,28),new THREE.MeshBasicMaterial({color:'#ffffff',side:THREE.DoubleSide,depthTest:false}));
hmProbeOuter.rotation.x=-Math.PI/2;
hmProbeRing.add(hmProbeOuter,hmProbeInner);
hmProbeRing.position.y=0.35;hmProbeRing.renderOrder=6;hmProbeRing.visible=false;S.add(hmProbeRing);
let shadowHmOn=false,hmRamp='thermal',hmOpacity=0.78,hmQuality='std',lastShadowHm=null,hmMesh=null,hmTex=null,hmTimer=null;
function disposeShadowHmMesh(){
 if(hmMesh){shadowHmG.remove(hmMesh);if(hmMesh.geometry)hmMesh.geometry.dispose();if(hmMesh.material)hmMesh.material.dispose();hmMesh=null}
 if(hmTex){hmTex.dispose();hmTex=null}
}
function paintShadowHmTexture(res){
 if(!res||!window.MC3D_SHADOW_HEATMAP)return;
 disposeShadowHmMesh();
 const src=document.createElement('canvas');src.width=res.cols;src.height=res.rows;
 const sctx=src.getContext('2d');const img=sctx.createImageData(res.cols,res.rows);const d=img.data;
 const peak=Math.max(0.25,res.stats.maxRatio||1);
 for(let i=0;i<res.shadowRatio.length;i++){
  const o=i*4;
  if(res.footprintMask[i]){
   d[o]=15;d[o+1]=23;d[o+2]=42;d[o+3]=28;
   continue;
  }
  const rgba=MC3D_SHADOW_HEATMAP.sampleColorRamp(res.shadowRatio[i],hmRamp);
  d[o]=rgba[0];d[o+1]=rgba[1];d[o+2]=rgba[2];d[o+3]=rgba[3];
 }
 sctx.putImageData(img,0,0);
 const out=document.createElement('canvas');out.width=256;out.height=256;
 const octx=out.getContext('2d');octx.imageSmoothingEnabled=true;if('imageSmoothingQuality'in octx)octx.imageSmoothingQuality='high';
 octx.drawImage(src,0,0,out.width,out.height);
 hmTex=new THREE.CanvasTexture(out);
 hmTex.generateMipmaps=false;hmTex.minFilter=THREE.LinearFilter;hmTex.magFilter=THREE.LinearFilter;
 try{hmTex.anisotropy=Math.min(8,R.capabilities.getMaxAnisotropy())}catch(e){}
 const mat=new THREE.MeshBasicMaterial({map:hmTex,transparent:true,opacity:hmOpacity,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 hmMesh=new THREE.Mesh(new THREE.PlaneGeometry(res.siteW,res.siteD),mat);
 hmMesh.rotation.x=-Math.PI/2;hmMesh.position.y=0.32;hmMesh.renderOrder=5;
 shadowHmG.add(hmMesh);shadowHmG.visible=true;
}
function renderShadowHmSummary(){
 if(!$('shadowMapBox'))return;
 $('bShadowMap').classList.toggle('on',shadowHmOn);
 $('hmRampThermal').classList.toggle('on',hmRamp==='thermal');
 $('hmRampCool').classList.toggle('on',hmRamp==='cool');
 $('shadowMapBox').style.display=shadowHmOn?'flex':'none';
 $('shadowMapHint').style.display=shadowHmOn?'none':'block';
 if(!shadowHmOn||!lastShadowHm||!window.MC3D_SHADOW_HEATMAP)return;
 const s=lastShadowHm.stats,uHrs=L('س/سنة','hrs/yr'),uArea=L('م²','m²');
 $('hmBar').style.background=MC3D_SHADOW_HEATMAP.rampCssGradient(hmRamp);
 $('hmPeakNote').textContent=`${L('الذروة','Peak')}: ${Math.round(s.maxHours).toLocaleString('en')} ${uHrs}`;
 $('hmAvgVal').textContent=`${Math.round(s.avgRatio*100)}%`;
 $('hmAvgHrs').textContent=`${Math.round(s.avgHours).toLocaleString('en')} ${uHrs}`;
 $('hmMaxVal').textContent=`${Math.round(s.maxRatio*100)}%`;
 $('hmMaxHrs').textContent=`${Math.round(s.maxHours).toLocaleString('en')} ${uHrs}`;
 $('hmHeavyVal').textContent=`${Math.round(s.heavyShare*100)}%`;
 $('hmHeavyArea').textContent=`${Math.round(s.heavyArea).toLocaleString('en')} ${uArea}`;
 const st=state.site||{},cn=CITIES[st.city]?dn('cities',st.city,CITIES[st.city].n):L('موقع مخصص','Custom Site');
 $('hmMeta').textContent=L(`${cn} (${Number(st.lat).toFixed(2)}°) · ${lastShadowHm.sampleCount} موضع شمسي سنوياً (${Math.round(lastShadowHm.totalDaylightHours).toLocaleString('en')} ساعة نهار)`,`${cn} (${Number(st.lat).toFixed(2)}°) · ${lastShadowHm.sampleCount} solar samples/yr (${Math.round(lastShadowHm.totalDaylightHours).toLocaleString('en')} daylight hrs)`);
}
function rebuildShadowHeatmap(){
 if(!shadowHmOn){disposeShadowHmMesh();shadowHmG.visible=false;hmProbeRing.visible=false;lastShadowHm=null;renderShadowHmSummary();return}
 if(!window.MC3D_SHADOW_HEATMAP)return;
 lastShadowHm=MC3D_SHADOW_HEATMAP.computeAnnualShadowHeatmap({site:state.site,fh:state.fh,blocks:state.blocks,quality:hmQuality});
 paintShadowHmTexture(lastShadowHm);
 renderShadowHmSummary();
}
function scheduleShadowHeatmap(){
 if(!shadowHmOn)return;
 clearTimeout(hmTimer);
 hmTimer=setTimeout(rebuildShadowHeatmap,40);
}
function updateShadowProbe(e){
 if(!shadowHmOn||!lastShadowHm||!window.MC3D_SHADOW_HEATMAP||e.target!==R.domElement||drawing||dragging||resizing||cutting){hmProbeRing.visible=false;return}
 const p=gpt(e);if(!p){hmProbeRing.visible=false;if($('hmProbe'))$('hmProbe').textContent='—';return}
 const pr=MC3D_SHADOW_HEATMAP.probeHeatmapAt(lastShadowHm,p.x,p.z);
 if(!pr){hmProbeRing.visible=false;if($('hmProbe'))$('hmProbe').textContent='—';return}
 hmProbeRing.position.set(p.x,0.35,p.z);hmProbeRing.visible=true;
 if($('hmProbe'))$('hmProbe').textContent=pr.inBuilding?L('داخل كتلة مبنى','Inside mass footprint'):`${Math.round(pr.ratio*100)}% (${Math.round(pr.hours).toLocaleString('en')} ${L('س/سنة','hrs/yr')})`;
}
if($('bShadowMap'))$('bShadowMap').onclick=()=>{
 shadowHmOn=!shadowHmOn;
 rebuildShadowHeatmap();
 if(shadowHmOn&&lastShadowHm){
  if($('shadowMapBox'))$('shadowMapBox').scrollIntoView({block:'nearest',behavior:'smooth'});
  flash(L(`حُسبت خريطة الظلال السنوية — متوسط التظليل ${Math.round(lastShadowHm.stats.avgRatio*100)}% وأعلى منطقة ${Math.round(lastShadowHm.stats.maxRatio*100)}%`,`Annual shadow heatmap ready — avg ${Math.round(lastShadowHm.stats.avgRatio*100)}%, peak ${Math.round(lastShadowHm.stats.maxRatio*100)}%`));
 }
};
if($('hmRampThermal'))$('hmRampThermal').onclick=()=>{hmRamp='thermal';if(shadowHmOn&&lastShadowHm)paintShadowHmTexture(lastShadowHm);renderShadowHmSummary()};
if($('hmRampCool'))$('hmRampCool').onclick=()=>{hmRamp='cool';if(shadowHmOn&&lastShadowHm)paintShadowHmTexture(lastShadowHm);renderShadowHmSummary()};
if($('hmOp'))$('hmOp').oninput=e=>{
 hmOpacity=parseFloat(e.target.value)||0.78;
 if($('hmOpL'))$('hmOpL').textContent=Math.round(hmOpacity*100)+'%';
 if(hmMesh&&hmMesh.material)hmMesh.material.opacity=hmOpacity;
};
if($('hmQual'))$('hmQual').onchange=e=>{hmQuality=e.target.value==='high'?'high':'std';if(shadowHmOn)rebuildShadowHeatmap()};

// ================= EXPORT 3D (OBJ + DAE in ZIP) =================
const scriptP={};function loadScript(src){if(!scriptP[src])scriptP[src]=new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=()=>res();s.onerror=()=>{delete scriptP[src];rej()};document.head.appendChild(s)});return scriptP[src]}

// ================= BACKUP REMINDER =================
(function(){const last=LS.get('mc3d_lastbk')||0,days=(Date.now()-last)/864e5;if(Object.keys(designs).length>=1&&days>3){document.querySelector('.tab[data-t=file]').classList.add('dotted');setTimeout(()=>flash(last?L(`مضى ${Math.floor(days)} يوماً دون حفظ نسخة احتياطية — ملف ← حفظ نسخة كاملة`,`${Math.floor(days)} days since last backup — File → Full Backup`):L('تنبيه: يُنصح بحفظ نسخة احتياطية — ملف ← حفظ نسخة كاملة','Tip: Save a backup copy — File → Full Backup')),2500)}})();

// ================= EXPORT DIALOG & CAD WRITERS =================
function popMenu(btn,items){const r=btn.getBoundingClientRect();ctx.innerHTML='';items.forEach(([t,f])=>{const d=document.createElement('div');d.textContent=t;d.onclick=()=>{hideCtx();f()};ctx.appendChild(d)});ctx.style.display='block';
 ctx.style.left=Math.max(6,Math.min(r.left,innerWidth-200))+'px';ctx.style.top=(r.bottom+4)+'px'}
let inpCb=null;function showInput(title,val,cb){$('inpVal').value=val||'';inpCb=cb;modal('input');$('mTitle').textContent=title;setTimeout(()=>$('inpVal').focus(),50)}
$('inpOk').onclick=()=>{const v=$('inpVal').value.trim();$('modal').style.display='none';if(inpCb&&v)inpCb(v);inpCb=null};$('inpVal').onkeydown=e=>{if(e.key==='Enter')$('inpOk').click()};
$('shMoreS').onclick=e=>{e.stopPropagation();popMenu(e.currentTarget,[[L('✎ تسمية اللوحة','✎ Rename Sheet'),()=>showInput(L('اسم اللوحة','Sheet Name'),curSheet,v=>{$('shName').value=v;$('shRen').click()})],[L('نسخ اللوحة','Duplicate Sheet'),()=>$('shDupS').click()],[L('مسح محتوى اللوحة','Clear Sheet'),()=>{const b=$('shClear');b.click();b.click()}],[L('حذف اللوحة','Delete Sheet'),()=>{const b=$('shDelS');b.click();b.click()}]])};
$('shAddM').onclick=e=>{e.stopPropagation();popMenu(e.currentTarget,[[L('صورة من جهازك','Upload Image'),()=>$('shUp').click()],[L('T نص','T Text'),()=>$('shText').click()],[L('عنوان اللوحة','Sheet Title'),()=>$('shTitle').click()],[L('▤ جدول عنوان','▤ Title Block'),()=>$('shTB').click()],[L('▭ إطار','▭ Frame Box'),()=>$('shBox').click()],[L('— خط أفقي','— Horizontal Line'),()=>$('shLine').click()],[L('| خط عمودي','| Vertical Line'),()=>$('shLineV').click()],[L('سهم الشمال','North Arrow'),()=>$('shNorth').click()],[L('مقياس رسم','Scale Bar'),()=>$('shScale').click()],[L('مفتاح ألوان الوظائف','Zone Color Legend'),()=>$('shLegend').click()]])};
$('shSnapOpt').onclick=e=>{e.stopPropagation();popMenu(e.currentTarget,[[(shGround?'☑':'☐')+' '+L('أرضية الموقع باللقطة','Include Site Ground'),()=>$('shGround').click()],[(shNames?'☑':'☐')+' '+L('أسماء الكتل باللقطة','Include Mass Labels'),()=>$('shNamesB').click()]])};
function openExport(){$('expSheetName').textContent='('+curSheet+' · '+sheet.size+')';['shDown','shAll'].forEach(id=>$(id).style.display=DL?'':'none');$('exp3D').disabled=!DL;$('exp3D').title=DL?'':L('التنزيل غير متاح في هذا العرض','Download unavailable in this view');modal('export')}
$('shExpDlg').onclick=openExport;$('b3D').onclick=openExport;$('qExp').onclick=openExport;
// ---- geometry helpers ----
function blockTris(i){const g=groups[i],out=[];if(!g)return out;g.updateMatrixWorld(true);const v=new THREE.Vector3();
 g.traverse(o=>{if(!o.isMesh||!o.material||o.material.visible===false||o.userData.fac)return;const pos=o.geometry&&o.geometry.attributes.position;if(!pos)return;const P=k=>{v.fromBufferAttribute(pos,k).applyMatrix4(o.matrixWorld);return [v.x,v.y,v.z]};const idx=o.geometry.index,col=o.material.color.getHex();
  if(idx){for(let k=0;k+2<idx.count;k+=3)out.push({t:[P(idx.getX(k)),P(idx.getX(k+1)),P(idx.getX(k+2))],c:col})}else{for(let k=0;k+2<pos.count;k+=3)out.push({t:[P(k),P(k+1),P(k+2)],c:col})}});return out}
function footprint(b){const [w,d]=b.shape==='riwaq'?[b.w,b.d]:loc(b),W=w/2,D=d/2;let rings=[];const ell=(rx,rz)=>Array.from({length:40},(_,k)=>[Math.cos(k/40*Math.PI*2)*rx,Math.sin(k/40*Math.PI*2)*rz]);
 switch(b.shape){case 'cyl':rings=[ell(W,D)];break;case 'ring':rings=[ell(W,D),ell(W*.6,D*.6)];break;case 'tri':rings=[[[-W,-D],[W,-D],[-W,D]]];break;
  case 'L':{const t=Math.min(w,d)*.45;rings=[[[-W,-D],[W,-D],[W,-D+t],[-W+t,-D+t],[-W+t,D],[-W,D]]];break}
  case 'U':{const t=Math.min(w,d)*.3;rings=[[[-W,-D],[W,-D],[W,D],[W-t,D],[W-t,-D+t],[-W+t,-D+t],[-W+t,D],[-W,D]]];break}
  case 'poly':{const P=polyPts(b);rings=[P||[[-W,-D],[W,-D],[W,D],[-W,D]]];break}
  case 'court':{const t=courtT(b);rings=[[[-W,-D],[W,-D],[W,D],[-W,D]],[[-W+t,-D+t],[W-t,-D+t],[W-t,D-t],[-W+t,D-t]]];break}
  case 'person':case 'tree':rings=[ell(W,D)];break;default:rings=[[[-W,-D],[W,-D],[W,D],[-W,D]]]}
 const th=-((b.shape==='riwaq'?0:rotOf(b))+(b.rot||0))*Math.PI/180,c=Math.cos(th),s=Math.sin(th);return rings.map(r=>r.map(([x,z])=>[b.x+x*c+z*s,b.z-x*s+z*c]))}
const ACI={brick:30,glass:4,concrete:8,stone:41,white:7,green:3,joint:5,asphalt:250,water:140,paving:9,context:253};
const asc=s=>String(s).replace(/[^\x20-\x7E]/g,'').trim();
function dxfHeader(layers){let o='0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n9\n$INSUNITS\n70\n6\n0\nENDSEC\n0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n'+layers.length+'\n';
 layers.forEach(([n,c])=>{o+=`0\nLAYER\n2\n${n}\n70\n0\n62\n${c}\n6\nCONTINUOUS\n`});return o+'0\nENDTAB\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n'}
const f3=v=>(+v).toFixed(4);
function dxf3D(){const layers=[['GROUND',8]],ents=[];state.blocks.forEach((b,i)=>{if(b.hidden)return;const ln='B'+String(i+1).padStart(2,'0')+'_'+(asc(MATS[b.mat]&&b.mat)||'M').toUpperCase();layers.push([ln,ACI[b.mat]||7]);
  blockTris(i).forEach(({t})=>{const p=t.map(([x,y,z])=>[x,-z,y]);ents.push(`0\n3DFACE\n8\n${ln}\n10\n${f3(p[0][0])}\n20\n${f3(p[0][1])}\n30\n${f3(p[0][2])}\n11\n${f3(p[1][0])}\n21\n${f3(p[1][1])}\n31\n${f3(p[1][2])}\n12\n${f3(p[2][0])}\n22\n${f3(p[2][1])}\n32\n${f3(p[2][2])}\n13\n${f3(p[2][0])}\n23\n${f3(p[2][1])}\n33\n${f3(p[2][2])}\n`)})});
 return dxfHeader(layers)+ents.join('')+'0\nENDSEC\n0\nEOF\n'}
function dxf2D(){const st=state.site,layers=[['SITE',7],['SETBACK',1],['TEXT',7],['OPEN_SPACE',3],['CONTEXT',8],['PROPS',94]];Object.entries(FNS).forEach(([k,f])=>layers.push(['FN_'+(k||'NONE').toUpperCase(),{main:5,pub:4,spec:30,adm:8,circ:6}[k]||7]));
 let e='';const pl=(pts,layer,closed=true)=>{e+=`0\nPOLYLINE\n8\n${layer}\n66\n1\n70\n${closed?1:0}\n`;pts.forEach(([x,z])=>{e+=`0\nVERTEX\n8\n${layer}\n10\n${f3(x)}\n20\n${f3(-z)}\n30\n0\n`});e+=`0\nSEQEND\n8\n${layer}\n`};
 const tx=(x,z,h,t)=>{e+=`0\nTEXT\n8\nTEXT\n10\n${f3(x)}\n20\n${f3(-z)}\n30\n0\n40\n${h}\n1\n${t}\n72\n1\n11\n${f3(x)}\n21\n${f3(-z)}\n31\n0\n`};
 const W=st.w/2,D=st.d/2;pl([[-W,-D],[W,-D],[W,D],[-W,D]],'SITE');if(st.sb>0)pl([[-W+st.sb,-D+st.sb],[W-st.sb,-D+st.sb],[W-st.sb,D-st.sb],[-W+st.sb,D-st.sb]],'SETBACK');
 state.blocks.forEach((b,i)=>{if(b.hidden)return;const layer=isProp(b)?'PROPS':isFlat(b)?'OPEN_SPACE':b.mat==='context'?'CONTEXT':'FN_'+((b.fn||'none').toUpperCase());footprint(b).forEach(r=>pl(r,layer));
  if(!isProp(b))tx(b.x,b.z,1.2,'B'+String(i+1).padStart(2,'0')+(counts(b)?` ${b.f}F +${(b.y0+bh(b)).toFixed(1)}`:''))});
 return dxfHeader(layers)+e+'0\nENDSEC\n0\nEOF\n'}
function ifcEnc(t){let o='';for(const ch of String(t)){const c=ch.codePointAt(0);if(c<128)o+=ch==="'"?"''":ch==='\\'?'\\\\':ch;else o+='\\X2\\'+c.toString(16).toUpperCase().padStart(4,'0')+'\\X0\\'}return o}
function ifcGid(){const A='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';let s=A[Math.floor(Math.random()*4)];for(let i=0;i<21;i++)s+=A[Math.floor(Math.random()*64)];return s}
function ifcModel(){const ifcLines=[];let n=0;const e=s=>{n++;ifcLines.push(`#${n}=${s};`);return '#'+n};
 const m=state.meta||{},st=state.site||{};
 const designer=m.designer||'Designer',orgName=m.org||'Maket Studio',projTitle=m.title||curName||'Massing Project',locName=m.location||(CITIES[st.city]&&CITIES[st.city].n)||'Site';
 const toDMS=v=>{const s=v<0?-1:1,av=Math.abs(v),d=Math.floor(av),mf=(av-d)*60,mn=Math.floor(mf),sf=(mf-mn)*60,sc=Math.floor(sf),u=Math.round((sf-sc)*1e6);return `(${s*d},${s*mn},${s*sc},${s*u})`};
 const per=e(`IFCPERSON($,$,'${ifcEnc(designer)}',$,$,$,$,$)`),org=e(`IFCORGANIZATION($,'${ifcEnc(orgName)}',$,$,$)`),pao=e(`IFCPERSONANDORGANIZATION(${per},${org},$)`),app=e(`IFCAPPLICATION(${org},'1.0','Maket Massing','MASS')`),oh=e(`IFCOWNERHISTORY(${pao},${app},$,.ADDED.,$,$,$,${Math.floor(Date.now()/1000)})`);
 const u=[e("IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)"),e("IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)"),e("IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.)"),e("IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.)")],ua=e(`IFCUNITASSIGNMENT((${u.join(',')}))`);
 const o=e("IFCCARTESIANPOINT((0.,0.,0.))"),Z=e("IFCDIRECTION((0.,0.,1.))"),X=e("IFCDIRECTION((1.,0.,0.))"),ax=e(`IFCAXIS2PLACEMENT3D(${o},${Z},${X})`),ctx_=e(`IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,${ax},$)`);
 const pj=e(`IFCPROJECT('${ifcGid()}',${oh},'${ifcEnc(curName)}',$,$,$,$,(${ctx_}),${ua})`),sp=e(`IFCLOCALPLACEMENT($,${ax})`),site=e(`IFCSITE('${ifcGid()}',${oh},'${ifcEnc(locName)}',$,$,${sp},$,$,.ELEMENT.,${toDMS(st.lat||33.31)},${toDMS(st.lon||44.36)},0.,$,$)`);
 const bp=e(`IFCLOCALPLACEMENT(${sp},${ax})`),bld=e(`IFCBUILDING('${ifcGid()}',${oh},'${ifcEnc(projTitle)}',$,$,${bp},$,$,.ELEMENT.,$,$,$)`),stp=e(`IFCLOCALPLACEMENT(${bp},${ax})`),sto=e(`IFCBUILDINGSTOREY('${ifcGid()}',${oh},'Level 0',$,$,${stp},$,$,.ELEMENT.,0.)`);
 e(`IFCRELAGGREGATES('${ifcGid()}',${oh},$,$,${pj},(${site}))`);e(`IFCRELAGGREGATES('${ifcGid()}',${oh},$,$,${site},(${bld}))`);e(`IFCRELAGGREGATES('${ifcGid()}',${oh},$,$,${bld},(${sto}))`);
 const styles={},mats={},els=[];const sty=(hex,tr)=>{const k=hex+'_'+tr;if(styles[k])return styles[k];const r=((hex>>16)&255)/255,g=((hex>>8)&255)/255,b=(hex&255)/255;const c=e(`IFCCOLOURRGB($,${r.toFixed(3)},${g.toFixed(3)},${b.toFixed(3)})`),rd=e(`IFCSURFACESTYLERENDERING(${c},${tr.toFixed(2)},$,$,$,$,$,$,.FLAT.)`),ss=e(`IFCSURFACESTYLE($,.BOTH.,(${rd}))`);return styles[k]=e(`IFCPRESENTATIONSTYLEASSIGNMENT((${ss}))`)};
 state.blocks.forEach((b,i)=>{if(b.hidden||isProp(b))return;const tris=blockTris(i);if(!tris.length)return;const pm={},pt=(p)=>{const k=p.map(v=>v.toFixed(4)).join(',');if(!pm[k])pm[k]=e(`IFCCARTESIANPOINT((${(+p[0]).toFixed(4)},${(-p[2]).toFixed(4)},${(+p[1]).toFixed(4)}))`);return pm[k]};
  const faces=[];tris.forEach(({t})=>{const a=pt(t[0]),bb=pt(t[1]),c=pt(t[2]);if(a===bb||bb===c||a===c)return;const lp=e(`IFCPOLYLOOP((${a},${bb},${c}))`),fb=e(`IFCFACEOUTERBOUND(${lp},.T.)`);faces.push(e(`IFCFACE((${fb}))`))});
  const sh=e(`IFCCLOSEDSHELL((${faces.join(',')}))`),br=e(`IFCFACETEDBREP(${sh})`);const glass=b.mat==='glass';e(`IFCSTYLEDITEM(${br},(${sty(tris[0].c,glass?.6:0)}),$)`);
  const sr=e(`IFCSHAPEREPRESENTATION(${ctx_},'Body','Brep',(${br}))`),pds=e(`IFCPRODUCTDEFINITIONSHAPE($,$,(${sr}))`),lpl=e(`IFCLOCALPLACEMENT(${stp},${ax})`);
  const desc=`${fnName(b.fn||'')} · ${dn('mats',b.mat,MATS[b.mat].n)} · ${counts(b)?b.f+L(' طوابق','F'):''}`;const el=e(`IFCBUILDINGELEMENTPROXY('${ifcGid()}',${oh},'${ifcEnc(b.name)}','${ifcEnc(desc)}','${asc(MATS[b.mat]?b.mat:'block')}',${lpl},${pds},$,$)`);els.push(el);
  const mk=MATS[b.mat].n;if(!mats[mk])mats[mk]={m:e(`IFCMATERIAL('${ifcEnc(mk)}')`),els:[]};mats[mk].els.push(el)});
 if(els.length)e(`IFCRELCONTAINEDINSPATIALSTRUCTURE('${ifcGid()}',${oh},$,$,(${els.join(',')}),${sto})`);Object.values(mats).forEach(m=>e(`IFCRELASSOCIATESMATERIAL('${ifcGid()}',${oh},$,$,(${m.els.join(',')}),${m.m})`));
 return `ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('ViewDefinition [CoordinationView_V2.0]'),'2;1');\nFILE_NAME('model.ifc','${new Date().toISOString().slice(0,19)}',('${ifcEnc(designer)}'),('${ifcEnc(orgName)}'),'MASS','MASS','');\nFILE_SCHEMA(('IFC2X3'));\nENDSEC;\nDATA;\n${ifcLines.join('\n')}\nENDSEC;\nEND-ISO-10303-21;\n`}
async function exportModel(){if(!DL)return flash(L('التنزيل غير متاح في هذا العرض','Download unavailable in this view'));const fm=[...document.querySelectorAll('.xf:checked')].map(i=>i.value);if(!fm.length)return flash(L('اختر صيغة واحدة على الأقل','Select at least one format'));
 $('exp3D').disabled=true;flash(L('جارٍ تجهيز الملفات…','Preparing files…'));const keepSel=selSet,keepClip=clipArr.slice();
 try{await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');selSet=new Set();clipArr.length=0;build();bg.updateMatrixWorld(true);plinth.updateMatrixWorld(true);
  const zip=new window.JSZip(),base=asc(curName)||'model',readme=[L('النموذج الكتلي — ','Massing Model — ')+curName,L('الوحدات: متر','Units: Meters'),''];
  if(fm.includes('ifc')){zip.file('Revit - model.ifc',ifcModel());readme.push(L('Revit - model.ifc ← ريفت: File ← Open ← IFC (أو Insert ← Link IFC). كل كتلة عنصر منفصل باسمها ومادتها','Revit - model.ifc -> File -> Open -> IFC. Each mass is an element with name and material'))}
  if(fm.includes('dwg3d')){zip.file('AutoCAD 3D - model.dxf',dxf3D());readme.push(L('AutoCAD 3D - model.dxf ← أوتوكاد: يُفتح مباشرة، وكل كتلة على طبقة (B01, B02…) بلون مادتها','AutoCAD 3D - model.dxf -> Opens directly in AutoCAD with each block on its own layer (B01, B02...)'))}
  if(fm.includes('dwg2d')){zip.file('AutoCAD plan - siteplan.dxf',dxf2D());readme.push(L('AutoCAD plan - siteplan.dxf ← مسقط 2D: حدود القطعة والارتداد وحدود الكتل على طبقات حسب الوظيفة، ورقم كل كتلة وطوابقها ومنسوبها','AutoCAD plan - siteplan.dxf -> 2D site plan with boundary, setbacks, and function layers'))}
  if(fm.includes('dae')){try{await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/ColladaExporter.js');const sc=new THREE.Scene(),cl=bg.clone(true),rm=[];cl.traverse(o=>{if((o.isMesh&&o.material&&o.material.visible===false)||o.isLine||o.isLineSegments)rm.push(o)});rm.forEach(o=>o.parent&&o.parent.remove(o));sc.add(cl);sc.add(plinth.clone());
   const r=new THREE.ColladaExporter().parse(sc,null,{upAxis:'Y_UP',unitName:'meter',unitMeter:1});if(r&&r.data){zip.file('SketchUp - model.dae',r.data);readme.push(L('SketchUp - model.dae ← سكتش أب: File ← Import ← COLLADA (.dae). يعمل أيضاً مع Lumion وTwinmotion','SketchUp - model.dae -> File -> Import -> COLLADA (.dae). Also works in Lumion & Twinmotion'))}}catch(er){readme.push(L('(تعذّر إنشاء DAE — تأكد من الإنترنت)','(Failed to create DAE — check internet connection)'))}}
  if(fm.includes('obj')){let obj='mtllib model.mtl\n',mtl='',mats={},vo=1;state.blocks.forEach((b,i)=>{if(b.hidden)return;const tris=blockTris(i);if(!tris.length)return;obj+=`o B${String(i+1).padStart(2,'0')}\n`;let cur=null;
    tris.forEach(({t,c})=>{const mn='m_'+c.toString(16).padStart(6,'0');if(!mats[mn]){mats[mn]=1;mtl+=`newmtl ${mn}\nKd ${(((c>>16)&255)/255).toFixed(4)} ${(((c>>8)&255)/255).toFixed(4)} ${((c&255)/255).toFixed(4)}\n\n`}if(mn!==cur){obj+=`usemtl ${mn}\n`;cur=mn}t.forEach(p=>obj+=`v ${f3(p[0])} ${f3(p[1])} ${f3(p[2])}\n`);obj+=`f ${vo} ${vo+1} ${vo+2}\n`;vo+=3})});
   zip.file('OBJ - model.obj',obj);zip.file('model.mtl',mtl);readme.push(L('OBJ - model.obj + model.mtl ← بلندر، رينو، لومين، 3ds Max','OBJ - model.obj + model.mtl -> Blender, Rhino, Lumion, 3ds Max'))}
  if(fm.includes('csv')){let csv='\uFEFF'+L('الرقم,الاسم,الوظيفة,المادة,الشكل,العرض م,العمق م,الطوابق,الارتفاع م,المساحة م2\n','ID,Name,Zone,Material,Shape,Width m,Depth m,Floors,Height m,Area m2\n');state.blocks.forEach((b,i)=>{csv+=['B'+String(i+1).padStart(2,'0'),b.name,fnName(b.fn||''),dn('mats',b.mat,MATS[b.mat].n),dn('shapes',b.shape,SHAPES[b.shape]||b.shape),b.w.toFixed(1),b.d.toFixed(1),counts(b)?b.f:'',(b.y0+bh(b)).toFixed(1),Math.round(areaOf(b)*b.f)].map(csvEsc).join(',')+'\n'});zip.file(L('جدول الكتل.csv','Mass Schedule.csv'),csv);readme.push(L('جدول الكتل.csv ← يفتح بالإكسل: B01 = الكتلة رقم 1 بكل الملفات','Mass Schedule.csv -> Opens in Excel: B01 = Block #1 across all exported files'))}
  zip.file(L('اقرأني.txt','README.txt'),readme.join('\n'));clipArr.push(...keepClip);selSet=keepSel;build();
  const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'});await DL.save({filename:`${curName} - ${L('تصدير','Export')} ${fm.length===1?fm[0].toUpperCase():'3D'}.zip`,data:blob});flash(L('حُفظ الملف ✓','File saved ✓'));$('modal').style.display='none'}
 catch(er){clipArr.length=0;clipArr.push(...keepClip);selSet=keepSel;build();flash(er&&er.code==='declined'?L('أُلغي التنزيل','Download cancelled'):L('تعذّر التصدير — تحقق من الاتصال بالإنترنت وأعد المحاولة','Export failed — check internet connection and retry'))}finally{$('exp3D').disabled=false}}
$('exp3D').onclick=exportModel;

// ================= CLOUD SYNC (private per user) + REVIEW =================
const CL={db:null,uid:null,col:null,busy:false,pending:false,unsub:null,lastMeta:null,ok:false,owner:false};
const hstr=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36)+'.'+s.length.toString(36)};
const keyOf=(p,name)=>p+hstr(name).replace(/\./g,'_');
let clLast={t:'الحفظ السحابي',en:'Cloud Sync',cls:'off'};
function clStatus(t,cls,en){clLast={t,en:en||t,cls:cls||''};const e=$('cloudSt');if(!e)return;const txt=L(t,clLast.en);const sp=e.querySelector('span');if(sp)sp.textContent=txt;else e.textContent=txt;e.className=cls||''}
function syncedMap(){return LS.get('mc3d_synced')||{d:{},s:{}}}
function localDesigns(){const all=Object.assign({},designs);if(curName)all[curName]=state;return all}
const hOf=o=>hstr(JSON.stringify(o));
const CHUNK=180000;
async function clWrite(fn){CL.q=(CL.q||Promise.resolve()).then(fn).catch(e=>{throw e});return CL.q}
async function pushImg(id){const done=LS.get('mc3d_imgup')||{};if(done[id])return;const v=imgSrc[id]||await IDB.get(id);if(!v)return;const n=Math.ceil(v.length/CHUNK);
 for(let k=0;k<n;k++)await CL.col.doc('img_'+id+'_'+k).set({d:v.slice(k*CHUNK,(k+1)*CHUNK),k,n});done[id]=1;LS.set('mc3d_imgup',done)}
async function pullImg(id){if(imgSrc[id])return true;const first=await CL.col.doc('img_'+id+'_0').get();if(!first.exists)return false;const f=first.data();let s=f.d;
 for(let k=1;k<f.n;k++){const p=await CL.col.doc('img_'+id+'_'+k).get();if(!p.exists)return false;s+=p.data().d}imgSrc[id]=s;await IDB.put(id,s);const done=LS.get('mc3d_imgup')||{};done[id]=1;LS.set('mc3d_imgup',done);return true}
async function reconcile(remote){if(!CL.col)return;if(CL.busy){CL.pending=true;return}CL.busy=true;clStatus('جارٍ المزامنة…','sync','Syncing…');
 try{remote=remote||{d:{},s:{},del:{d:{},s:{}}};remote.d=remote.d||{};remote.s=remote.s||{};remote.del=remote.del||{d:{},s:{}};remote.del.d=remote.del.d||{};remote.del.s=remote.del.s||{};
  const sy=syncedMap(),now=Date.now();let changedCur=false,changedD=false,changedS=false,msgs=[];
  // ---- designs
  const Lc=localDesigns(),lh={};Object.keys(Lc).forEach(n=>lh[n]=hOf(Lc[n]));
  const names=new Set([...Object.keys(Lc),...Object.keys(remote.d)]);
  for(const n of names){const r=remote.d[n],l=lh[n],s=sy.d[n];
   if(l===undefined){if(!r)continue;if(s!==undefined&&s===r.h){await CL.col.doc(keyOf('d_',n)).delete();delete remote.d[n];remote.del.d[n]=now;delete sy.d[n];continue}
    const doc=await CL.col.doc(keyOf('d_',n)).get();if(doc.exists){designs[n]=doc.data().st;sy.d[n]=r.h;changedD=true;msgs.push(''+n)}continue}
   if(!r){if(remote.del.d[n]&&s===l){delete designs[n];if(n===curName){const rest=Object.keys(designs);curName=rest[0]||L('تصميم جديد','New Design');state=normState(clone(designs[curName]||blank()));changedCur=true}delete sy.d[n];changedD=true;continue}
    await CL.col.doc(keyOf('d_',n)).set({name:n,st:Lc[n],h:l,u:now});remote.d[n]={h:l,u:now};delete remote.del.d[n];sy.d[n]=l;continue}
   if(l===r.h){sy.d[n]=l;continue}
   if(s===r.h){await CL.col.doc(keyOf('d_',n)).set({name:n,st:Lc[n],h:l,u:now});remote.d[n]={h:l,u:now};sy.d[n]=l;continue}
   const doc=await CL.col.doc(keyOf('d_',n)).get();if(!doc.exists)continue;const rst=doc.data().st;
   const pr=(LS.get('mc3d_pristine')||{d:{}}).d||{};
   if(s===l||s===undefined){if(s===undefined&&pr[n]!==l){const cn=uniq(n+L(' (هذا الجهاز)',' (This Device)'));designs[cn]=clone(Lc[n]);msgs.push(L('نسخة هذا الجهاز: ','Local copy: ')+cn)}designs[n]=rst;if(n===curName){state=normState(clone(rst));changedCur=true}sy.d[n]=r.h;changedD=true;msgs.push(''+n)}
   else{const cn=uniq(n+L(' (من جهاز آخر)',' (Other Device)'));designs[cn]=rst;changedD=true;msgs.push('⚠ '+cn);await CL.col.doc(keyOf('d_',n)).set({name:n,st:Lc[n],h:l,u:now});remote.d[n]={h:l,u:now};sy.d[n]=l}}
  // ---- sheets
  saveSheetLocalOnly();const SL=sheets,shh={};Object.keys(SL).forEach(n=>shh[n]=hOf(SL[n]));const snames=new Set([...Object.keys(SL),...Object.keys(remote.s)]);
  for(const n of snames){const r=remote.s[n],l=shh[n],s=sy.s[n];
   if(l===undefined){if(!r)continue;if(s!==undefined&&s===r.h){await CL.col.doc(keyOf('s_',n)).delete();delete remote.s[n];remote.del.s[n]=now;delete sy.s[n];continue}
    const doc=await CL.col.doc(keyOf('s_',n)).get();if(doc.exists){sheets[n]=doc.data().sh;sy.s[n]=r.h;changedS=true;msgs.push(L('لوحة: ','Sheet: ')+n)}continue}
   if(!r){if(remote.del.s[n]&&s===l){if(n!==curSheet){delete sheets[n];changedS=true}delete sy.s[n];continue}
    for(const it of SL[n].items)if(it.type==='img')await pushImg(it.src);await CL.col.doc(keyOf('s_',n)).set({name:n,sh:SL[n],h:l,u:now});remote.s[n]={h:l,u:now};delete remote.del.s[n];sy.s[n]=l;continue}
   if(l===r.h){sy.s[n]=l;continue}
   if(s===r.h){for(const it of SL[n].items)if(it.type==='img')await pushImg(it.src);await CL.col.doc(keyOf('s_',n)).set({name:n,sh:SL[n],h:l,u:now});remote.s[n]={h:l,u:now};sy.s[n]=l;continue}
   const doc=await CL.col.doc(keyOf('s_',n)).get();if(!doc.exists)continue;const prs=(LS.get('mc3d_pristine')||{s:{}}).s||{};if(s===l||s===undefined){if(s===undefined&&prs[n]!==l)sheets[n+L(' (هذا الجهاز)',' (This Device)')]=SL[n];sheets[n]=doc.data().sh;if(n===curSheet)sheet=sheets[n];sy.s[n]=r.h;changedS=true}else{const cn=n+L(' (من جهاز آخر)',' (Other Device)');sheets[cn]=doc.data().sh;changedS=true}}
  // pull missing images
  for(const s of Object.values(sheets))for(const it of (s.items||[]))if(it.type==='img'&&!imgSrc[it.src]){const v=await IDB.get(it.src);if(v)imgSrc[it.src]=v;else await pullImg(it.src)}
  // prune tombstones older than 60 days
  ['d','s'].forEach(k=>Object.keys(remote.del[k]).forEach(n=>{if(now-remote.del[k][n]>5184e6)delete remote.del[k][n]}));
  const meta={d:remote.d,s:remote.s,del:remote.del,u:now};const mj=JSON.stringify({d:meta.d,s:meta.s,del:meta.del});
  if(mj!==CL.lastMetaJ){await CL.col.doc('meta').set(meta);CL.lastMetaJ=mj}
  LS.set('mc3d_synced',sy);
  if(changedD){LS.set('mc3d_designs',designs);fillDesigns();$('dsel').value=curName}
  if(changedCur){clearSel();siteChanged();refresh()}
  if(changedS){LS.set('mc3d_sheets',sheets);fillSheets();if(sheetOpen)layoutSheet()}
  if(msgs.length)flash(''+msgs.slice(0,3).join(' · '));
  clStatus('متزامن','ok','Synced');CL.ok=true}
 catch(e){clStatus('خطأ بالمزامنة','err','Sync error');if(e&&e.code==='quota_exceeded')flash(L('مساحة الحفظ السحابي ممتلئة — احذف لوحات أو صوراً قديمة','Cloud storage quota full — delete old sheets or images'))}
 finally{CL.busy=false;if(CL.pending){CL.pending=false;setTimeout(()=>reconcile(CL.lastMeta),300)}}}
function saveSheetLocalOnly(){if(typeof sheet!=='undefined'&&sheet&&curSheet)sheets[curSheet]=sheet}
let clT=null;function cloudSoon(){if(!CL.col)return;clearTimeout(clT);clT=setTimeout(()=>reconcile(CL.lastMeta),4000)}
async function cloudInit(){try{if(!window.claude||!claude.use)return sbInit();const db=await claude.use('db'),user=await claude.use('user');
  CL.owner=user?await user.isOwner():false;if(!db||!user)return clStatus('غير متاح','off','Unavailable');const uid=await user.id();if(!uid)return clStatus('سجّل دخول للحفظ السحابي','off','Sign in to sync');
  CL.db=db;CL.uid=uid;CL.col=db.collection('data/users/'+uid);if(WAS_FRESH&&!LS.get('mc3d_pristine')){const d={},s={};Object.entries(localDesigns()).forEach(([k,v])=>d[k]=hOf(v));saveSheetLocalOnly();Object.entries(sheets).forEach(([k,v])=>s[k]=hOf(v));LS.set('mc3d_pristine',{d,s})}clStatus('جارٍ الاتصال…','sync','Connecting…');
  const t=setTimeout(()=>{if(!CL.ok)clStatus('لم يتم الاتصال بالسحابة بعد','err','Cloud timeout')},10000);
  CL.unsub=CL.col.doc('meta').onSnapshot(snap=>{if(snap.metadata&&snap.metadata.fromCache&&CL.ok)return;clearTimeout(t);const m=snap.exists?snap.data():null;CL.lastMeta=m?clone(m):null;if(m)CL.lastMetaJ=JSON.stringify({d:m.d||{},s:m.s||{},del:m.del||{d:{},s:{}}});reconcile(m?clone(m):null)},
   err=>{clearTimeout(t);clStatus('انقطع الاتصال','err','Disconnected')});
  initReview(db)}catch(e){clStatus('غير متاح','off','Unavailable')}}
$('cloudSt').onclick=()=>{if(CL.col)reconcile(CL.lastMeta?clone(CL.lastMeta):null);else flash(L('انقر لتسجيل الدخول إلى الحفظ السحابي ومزامنة تصاميمك','Sign in to enable cloud sync for your designs'))};
// hook saves
{const _save=save;save=function(){_save.apply(this,arguments);cloudSoon()}}
{const _ss=saveSheet;saveSheet=function(){_ss.apply(this,arguments);cloudSoon()}}
addEventListener('focus',()=>{if(CL.col)cloudSoon()});
// ---- review (publish for reviewers) ----
async function initReview(db){CL.rdb=db;try{const q=await db.collection('review').get();const list=q.docs.map(d=>d.data()).filter(Boolean);
  if(!CL.owner&&list.length){const sel=$('revSel');sel.innerHTML='<option value="">'+L('تصاميم للمراجعة…','Designs for review…')+'</option>'+list.map((r,i)=>`<option value="${i}">${String(r.name).replace(/</g,'&lt;')}</option>`).join('');sel.style.display='';
   sel.onchange=()=>{const r=list[+sel.value];if(!r)return;snap(true);designs[curName]=clone(state);curName=uniq(L('مراجعة — ','Review — ')+r.name);state=normState(clone(r.st));clearSel();siteChanged();refresh();view('iso',0);flash(L('فُتح "'+r.name+'" للمراجعة — أضف ملاحظاتك مباشرة على الكتل','Opened "'+r.name+'" for review — add notes directly on blocks'))}}}catch(e){}}

setTimeout(cloudInit,1500);



// ================= RENDER QUALITY (textures · AO · sky) =================
let capturing=false;
const TEXC={};
function rndGen(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function texOf(mat){const OK=['brick','stone','concrete','green','paving','asphalt','water','context'];if(!OK.includes(mat))return null;if(TEXC[mat])return TEXC[mat];
 const N=256,cv=document.createElement('canvas');cv.width=cv.height=N;const c=cv.getContext('2d'),rnd=rndGen(mat.length*7919+13);
 c.fillStyle=MATS[mat].c;c.fillRect(0,0,N,N);
 const sh=(x,y,w,h,a)=>{c.fillStyle=a>0?`rgba(255,255,255,${a})`:`rgba(0,0,0,${-a})`;c.fillRect(x,y,w,h)};
 const noise=(a,n,sz)=>{for(let k=0;k<n;k++){const s=(sz||1.5)*(.5+rnd());sh(rnd()*N,rnd()*N,s,s,(rnd()-.5)*a)}};
 let size=2;
 if(mat==='brick'){size=1.5;const rows=12,rh=N/rows,bw=N/4;for(let r=0;r<rows;r++){const off=r%2?bw/2:0;for(let k=-1;k<5;k++)sh(k*bw+off+1,r*rh+1,bw-2,rh-2,(rnd()-.5)*.18)}
  noise(.12,2200);c.fillStyle='rgba(232,220,204,.9)';for(let r=0;r<rows;r++){c.fillRect(0,r*rh,N,2);const off=r%2?bw/2:0;for(let k=-1;k<5;k++)c.fillRect(k*bw+off,r*rh,2,rh)}}
 else if(mat==='stone'){size=3;const rows=5,rh=N/rows;for(let r=0;r<rows;r++){let x=-rnd()*40;while(x<N){const w=40+rnd()*60;sh(x+1,r*rh+1,w-2,rh-2,(rnd()-.5)*.14);c.fillStyle='rgba(120,100,70,.35)';c.fillRect(x,r*rh,1.5,rh);x+=w}c.fillStyle='rgba(120,100,70,.35)';c.fillRect(0,r*rh,N,1.5)}noise(.1,2600)}
 else if(mat==='concrete'){size=2.4;noise(.09,4000,2);c.fillStyle='rgba(0,0,0,.10)';c.fillRect(0,0,N,1.2);c.fillRect(0,N/2,N,1.2);c.fillRect(0,0,1.2,N);
  c.fillStyle='rgba(0,0,0,.18)';[[.25,.25],[.75,.25],[.25,.75],[.75,.75]].forEach(([x,y])=>{c.beginPath();c.arc(x*N,y*N,2.2,0,7);c.fill()})}
 else if(mat==='green'){size=4;noise(.25,9000,2.5)}
 else if(mat==='paving'){size=2.4;for(let i=0;i<4;i++)for(let j=0;j<4;j++)sh(i*N/4+1,j*N/4+1,N/4-2,N/4-2,(rnd()-.5)*.08);c.fillStyle='rgba(0,0,0,.16)';for(let i=0;i<4;i++){c.fillRect(i*N/4,0,1.5,N);c.fillRect(0,i*N/4,N,1.5)}noise(.06,1500)}
 else if(mat==='asphalt'){size=4;noise(.22,9000,1.6)}
 else if(mat==='water'){size=6;c.strokeStyle='rgba(255,255,255,.28)';c.lineWidth=1.5;for(let k=0;k<26;k++){const y=rnd()*N,x=rnd()*N;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+15,y-4,x+30,y);c.stroke()}}
 else if(mat==='context'){size=4;noise(.06,1500);c.fillStyle='rgba(0,0,0,.08)';c.fillRect(0,0,N,2)}
 const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;try{t.anisotropy=Math.min(8,R.capabilities.getMaxAnisotropy())}catch(e){}t.userData={size};TEXC[mat]=t;return t}
let latticeT=null;function lattice(){if(latticeT)return latticeT;const N=128,cv=document.createElement('canvas');cv.width=cv.height=N;const c=cv.getContext('2d');c.fillStyle='#8a5a32';c.fillRect(0,0,N,N);
 c.fillStyle='#3b2414';const n=8,s=N/n;for(let i=0;i<n;i++)for(let j=0;j<n;j++){c.beginPath();c.arc(i*s+s/2,j*s+s/2,s*.28,0,7);c.fill()}
 c.strokeStyle='#6d4425';c.lineWidth=3;c.strokeRect(1.5,1.5,N-3,N-3);latticeT=new THREE.CanvasTexture(cv);return latticeT}
function worldUV(g,b){const map=texOf(b.mat);if(!map)return;const s=map.userData.size||2,pos=g.attributes.position;if(!g.attributes.normal)g.computeVertexNormals();const n=g.attributes.normal,yo=b.y0+bh(b)/2;
 const uv=new Float32Array(pos.count*2);for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i)+yo,z=pos.getZ(i),nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));let u,v;
  if(ny>.7){u=x;v=z}else if(nx>nz){u=z;v=y}else{u=x;v=y}uv[i*2]=u/s;uv[i*2+1]=v/s}g.setAttribute('uv',new THREE.BufferAttribute(uv,2))}
// ---- facade elements ----
const FACS={'':'بدون',win:'شبابيك (إيقاع)',fins:'كاسرات عمودية',hfins:'كاسرات أفقية',mash:'مشربية'};
function boxesGeo(list){const P=[],Nn=[],U=[];list.forEach(([cx,cy,cz,sx,sy,sz,ang])=>{const g=new THREE.BoxGeometry(sx,sy,sz).toNonIndexed();g.rotateY(ang);g.translate(cx,cy,cz);
  P.push(...g.attributes.position.array);Nn.push(...g.attributes.normal.array);U.push(...g.attributes.uv.array);g.dispose()});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));return g}
function facade(b,h,grp){const [w,d]=loc(b),W=w/2,D=d/2,fh=state.fh,H=h/2,hw=h-roofH(b);const faces=[[-W,D,1,0,0,1,w],[W,-D,-1,0,0,-1,w],[W,D,0,-1,1,0,d],[-W,-D,0,1,-1,0,d]];
 if(b.shape==='court'){const t=courtT(b),Wi=W-t,Di=D-t;faces.push([Wi,Di,-1,0,0,-1,2*Wi],[-Wi,-Di,1,0,0,1,2*Wi],[-Wi,Di,0,-1,1,0,2*Di],[Wi,-Di,0,1,-1,0,2*Di])}
 const gate=b.shape==='gate'?gateG(b):null,wh=colorMode==='white';
 const dark=[],lite=[],wood=[];
 faces.forEach(([ox,oz,dx,dz,nx,nz,len])=>{const ang=Math.atan2(-dz,dx),at=(s,off,y,sx,sy,sz,arr)=>{const x=ox+dx*s+nx*off,z=oz+dz*s+nz*off;
   if(gate&&nx===0&&Math.abs(x)<gate[0]/2+sx/2+.3&&y-sy/2<-H+gate[1])return;arr.push([x,y,z,sx,sy,sz,ang])};
  for(let k=0;k<b.f;k++){const y0=-H+k*fh;if(y0+fh>-H+hw+.01)break;
   if(b.fac==='win'){const n=Math.max(1,Math.floor(len/3.2));for(let i=0;i<n;i++)at((i+.5)*len/n,.05,y0+1.9,1.5,1.8,.12,dark)}
   else if(b.fac==='fins'){const n=Math.max(1,Math.floor(len/2.4));for(let i=0;i<n;i++)at((i+.5)*len/n,.04,y0+1.7,1.9,2.4,.08,dark)}
   else if(b.fac==='hfins'){at(len/2,.04,y0+1.7,len-.6,2.6,.08,dark);[1.2,1.75,2.3,2.85].forEach(yy=>at(len/2,.32,y0+yy,len-.2,.08,.55,lite))}
   else if(b.fac==='mash'){const n=Math.max(1,Math.floor(len/4));for(let i=0;i<n;i++)at((i+.5)*len/n,.2,y0+1.9,2.4,2.6,.4,wood)}}
  if(b.fac==='fins'){const n=Math.max(1,Math.floor(len/1));for(let i=0;i<=n;i++)at(i*len/n,.35,-H+hw/2,.12,hw,.7,lite)}});
 const add=(arr,col,map)=>{if(!arr.length)return;const m=new THREE.Mesh(boxesGeo(arr),M(wh?(map?'#d8d4cc':col==='#2e3d4f'?'#a9a9a4':'#f7f6f2'):col,false,wh?null:map));m.castShadow=true;m.receiveShadow=true;m.userData.fac=1;grp.add(m)};
 add(dark,'#2e3d4f');add(lite,'#f1eee6');add(wood,'#8a5a32',lattice())}
// ---- sky & fog ----
const skyTex=(()=>{const c=document.createElement('canvas');c.width=4;c.height=256;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#8fb4dc');gr.addColorStop(.6,'#d4e2ee');gr.addColorStop(1,'#efeee8');g.fillStyle=gr;g.fillRect(0,0,4,256);return new THREE.CanvasTexture(c)})();
const FOG=new THREE.Fog('#eceee9',200,900);
// ---- SSAO ----
const AOS={p:null,o:null,loading:false,fail:false};
async function aoInit(){if(AOS.p||AOS.loading||AOS.fail)return;AOS.loading=true;flash(L('جارٍ تحميل الظلال الناعمة…','Loading soft AO shadows…'));
 try{const B='https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/';for(const f of ['shaders/CopyShader.js','shaders/SSAOShader.js','math/SimplexNoise.js'])await loadScript(B+f);try{await loadScript(B+'postprocessing/Pass.js')}catch(e){}
  for(const f of ['postprocessing/EffectComposer.js','postprocessing/ShaderPass.js','postprocessing/RenderPass.js','postprocessing/SSAOPass.js'])await loadScript(B+f);
  const mk=cam=>{const comp=new THREE.EffectComposer(R);const p=new THREE.SSAOPass(S,cam,2,2);p.kernelRadius=2.2;p.minDistance=0.00002;p.maxDistance=0.0022;comp.addPass(p);return {comp,p,w:0,h:0,pr:0}};
  AOS.p=mk(camP);AOS.o=mk(camO);flash(L('✓ الظلال الناعمة (AO) مفعّلة','✓ Soft AO shadows enabled'))}
 catch(e){AOS.fail=true;RQ.ao=false;LS.set('mc3d_rq',RQ);rqSync();flash(L('تعذّر تشغيل الظلال الناعمة — تحقق من الاتصال بالإنترنت','Unable to load Soft AO — check your connection'))}finally{AOS.loading=false}}
const _v2=new THREE.Vector2();
function draw(cam){const sky=RQ.sky&&!capturing&&!whiteBg&&cam===camP;const bgc=S.background;
 if(sky){const m=Math.max(state.site.w,state.site.d);FOG.near=m*3;FOG.far=m*14;S.fog=FOG;S.background=skyTex}else S.fog=null;
 try{const A=RQ.ao&&!sec.on&&AOS.p&&!AOS.fail?(cam.isOrthographicCamera?AOS.o:AOS.p):null;
  if(A){R.getSize(_v2);const pr=R.getPixelRatio();if(A.w!==_v2.x||A.h!==_v2.y||A.pr!==pr){A.comp.setPixelRatio(pr);A.comp.setSize(_v2.x,_v2.y);A.w=_v2.x;A.h=_v2.y;A.pr=pr}
   const u=A.p.ssaoMaterial.uniforms;u.cameraProjectionMatrix.value.copy(cam.projectionMatrix);u.cameraInverseProjectionMatrix.value.copy(cam.projectionMatrixInverse);A.comp.render()}
  else R.render(S,cam)}
 catch(e){if(RQ.ao){AOS.fail=true;RQ.ao=false;rqSync();flash(L('الظلال الناعمة غير مدعومة على هذا الجهاز — أُعيد العرض العادي','Soft AO is not supported on this device'))}R.render(S,cam)}
 finally{S.background=bgc;S.fog=null}}
{const _pr=prepRender;prepRender=function(){capturing=true;return _pr.apply(this,arguments)};const _er=endRender;endRender=function(){capturing=false;return _er.apply(this,arguments)}}
function rqSync(){tg('rqTex',RQ.tex);tg('rqAO',RQ.ao);tg('rqSky',RQ.sky);tg('rqAll',RQ.tex&&RQ.ao&&RQ.sky)}
function setRQ(k,v){RQ[k]=v;LS.set('mc3d_rq',RQ);if(k==='ao'&&v)aoInit();rqSync();build()}
$('rqTex').onclick=()=>setRQ('tex',!RQ.tex);$('rqAO').onclick=()=>setRQ('ao',!RQ.ao);$('rqSky').onclick=()=>setRQ('sky',!RQ.sky);
$('rqAll').onclick=()=>{const on=!(RQ.tex&&RQ.ao&&RQ.sky);RQ.tex=RQ.ao=RQ.sky=on;LS.set('mc3d_rq',RQ);if(on)aoInit();rqSync();build();flash(on?L('إظهار محسّن: ملمس + ظلال ناعمة + سماء — تُلتقط صور اللوحة بالجودة نفسها','Enhanced render ON: Textures + Soft AO + Sky'):L('أُعيد العرض العادي','Standard render restored'))};
rqSync();if(RQ.ao)setTimeout(aoInit,2500);

// ================= NOTES (anchored to blocks) =================
const notesOf=()=>(state.notes=state.notes||[]);
const blkById=id=>state.blocks.findIndex(b=>b.id===id);
function notePos(n){const i=blkById(n.bid);if(i>=0){const b=state.blocks[i];return new THREE.Vector3(b.x+(n.dx||0),b.y0+(n.dy===undefined?bh(b):n.dy),b.z+(n.dz||0))}return n.p?new THREE.Vector3(...n.p):null}
function myName(){return REV?(LS.get('mc3d_rvname')||L('المراجع','Reviewer')):L('أنا','Me')}
function addNote(i,text,pt){const b=state.blocks[i];if(!b)return;snap(true);const p=pt||new THREE.Vector3(b.x,b.y0+bh(b),b.z);
 notesOf().push({id:uid(),bid:b.id,bn:b.name,dx:+(p.x-b.x).toFixed(2),dy:+(p.y-b.y0).toFixed(2),dz:+(p.z-b.z).toFixed(2),p:[p.x,p.y,p.z].map(v=>+v.toFixed(2)),t:text,by:myName(),u:Date.now(),done:false});
 save();pinsBuild();notesBadge();flash(L('أُضيفت الملاحظة على "'+b.name+'"','Note added on "'+b.name+'"'))}
function askNote(i,pt){const b=state.blocks[i];if(!b)return flash(L('حدّد كتلة أولاً، ثم انقر ملاحظة','Select a block first, then click Add Note'));const go=()=>showInput(L('ملاحظة على: ','Note on: ')+b.name,'',v=>addNote(i,v,pt));
 if(REV&&!LS.get('mc3d_rvname'))showInput(L('الاسم (ليعرف صاحب التصميم كاتب الملاحظة)','Your name (so the designer knows who commented)'),'',v=>{LS.set('mc3d_rvname',v);setTimeout(go,50)});else go()}
const pinsBox=document.createElement('div');pinsBox.id='pins';document.body.appendChild(pinsBox);let pinDivs=[],showPins=true;
function pinsBuild(){pinsBox.innerHTML='';pinDivs=[];if(!showPins)return;notesOf().forEach((n,k)=>{const d=document.createElement('div');d.className='pin'+(n.done?' done':'')+(n.by&&n.by!=='أنا'&&n.by!=='Me'?' sup':'');d.textContent=k+1;d.title=(n.by?n.by+': ':'')+n.t;
 d.onclick=()=>openNotes(n.id);pinsBox.appendChild(d);pinDivs.push([d,n])})}
function pinsUpd(){if(!pinDivs.length)return;const vis=!sheetOpen&&$('modal').style.display!=='flex';pinDivs.forEach(([d,n])=>{const p=vis&&notePos(n),q=p&&toScreen(p);if(!q){d.style.display='none';return}d.style.display='flex';d.style.left=q[0]+'px';d.style.top=q[1]+'px'})}
function notesBadge(){const n=notesOf().filter(x=>!x.done).length;['bNotes','rvNotes'].forEach(id=>{const e=$(id);if(e)e.querySelector('.cnt').textContent=n?'('+n+')':''})}
function notesText(){const Lst=notesOf();if(!Lst.length)return L('لا توجد ملاحظات','No notes');return L('ملاحظات على تصميم "'+curName+'"\n','Review notes for "'+curName+'"\n')+Lst.map((n,k)=>`${k+1}. [${n.bn||'—'}] ${n.t}${n.by&&n.by!=='أنا'&&n.by!=='Me'?' — '+n.by:''}${n.done?' ✓':''}`).join('\n')}
function saveBlob(name,data,type){if(DL)return DL.save({filename:name,data:typeof data==='string'?new Blob([data],{type:type||'text/plain'}):data});
 const u=URL.createObjectURL(typeof data==='string'?new Blob([data],{type:type||'text/plain'}):data),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);return Promise.resolve()}
let notesHL=null;
function openNotes(hl){notesHL=hl||null;renderNotes();modal('notes')}
function renderNotes(){const Lst=notesOf(),box=$('notesList');
 box.innerHTML=Lst.length?'':`<div class="hint" style="padding:10px">${L('لا توجد ملاحظات بعد. حدّد كتلة وانقر ملاحظة، أو انقر بالزر الأيمن على الكتلة.','No notes yet. Select a block and click Add Note, or right-click a block.')}</div>`;
 Lst.forEach((n,k)=>{const r=document.createElement('div');r.className='nrow'+(n.done?' done':'')+(n.id===notesHL?' hl':'');const ex=blkById(n.bid)>=0;
  r.innerHTML=`<span class="nnum${n.by&&n.by!=='أنا'&&n.by!=='Me'?' sup':''}">${k+1}</span><div class="ntx"><div class="nb"></div><div class="nt"></div></div><button class="sm" title="${L('الانتقال إلى الكتلة','Focus block')}"><svg class="ic"><use href="#i-target"/></svg></button><button class="sm" title="${L('تم','Done')}">${n.done?'↺':'✓'}</button><button class="sm" title="${L('حذف','Delete')}"><svg class="ic"><use href="#i-trash"/></svg></button>`;
  r.querySelector('.nb').textContent=(n.bn||'—')+(ex?'':L(' (الكتلة انحذفت)',' (block deleted)'))+' · '+(n.by||'')+' · '+new Date(n.u).toLocaleDateString(L('ar-IQ','en-US'));r.querySelector('.nt').textContent=n.t;
  const [bGo,bDone,bDel]=r.querySelectorAll('button');
  bGo.onclick=()=>{const i=blkById(n.bid);$('modal').style.display='none';if(i>=0){setSel(i);refresh();const p=notePos(n);if(p&&!isPlan){O.target.copy(p);}}};
  bDone.onclick=()=>{snap(true);n.done=!n.done;save();pinsBuild();notesBadge();renderNotes()};
  bDel.onclick=()=>{snap(true);Lst.splice(k,1);save();pinsBuild();notesBadge();renderNotes()};box.appendChild(r)});
 $('ntSend').style.display=REV&&!REV.remote?'':'none';$('ntImp').style.display=REV?'none':'';$('ntPull').style.display=REV&&!REV.remote?'none':''}
$('ntPull').onclick=async()=>{const b=$('ntPull');b.disabled=true;try{if(REV){if(REV.remote)await pullRemoteNotesForReviewer()}else await pullNotes(true)}finally{b.disabled=false;renderNotes()}};
$('ntCopy').onclick=()=>navigator.clipboard.writeText(notesText()).then(()=>flash(L('نُسخت الملاحظات — يمكن لصقها في أي تطبيق مراسلة ✓','Notes copied to clipboard ✓'))).catch(()=>{$('ioText').value=notesText();modal('io')});
$('ntSend').onclick=()=>{const data=JSON.stringify({kind:'mc3d-notes',design:REV?REV.name:curName,key:REV?REV.key:'',by:myName(),u:Date.now(),notes:notesOf()});
 saveBlob(L('ملاحظات المراجعة - ','Review notes - ')+(REV?REV.name:curName)+'.json',data,'application/json').then(()=>flash(L('حُفظ ملف الملاحظات — أرسله إلى صاحب التصميم ✓','Notes file saved — send it back to the designer ✓'))).catch(()=>flash(L('تعذّر الحفظ — استخدم "نسخ كنص"','Unable to save — use Copy as Text')))};
$('ntImp').onclick=()=>$('ntFile').click();
$('ntFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{const o=JSON.parse(await f.text());if(o.kind!=='mc3d-notes'||!Array.isArray(o.notes))throw 0;
  if(o.design&&o.design!==curName&&designs[o.design]){snap(true);designs[curName]=clone(state);curName=o.design;state=normState(clone(designs[o.design]));clearSel();siteChanged()}
  snap(true);const Lst=notesOf(),have=new Set(Lst.map(n=>n.id));let k=0;o.notes.forEach(n=>{if(have.has(n.id))return;Lst.push(n);k++});save();refresh();pinsBuild();notesBadge();renderNotes();
  flash(k?L(`أُضيفت ${k} ملاحظة من ${o.by||'المراجع'} على "${curName}"`,`Added ${k} note(s) from ${o.by||'Reviewer'} on "${curName}"`):L('جميع هذه الملاحظات موجودة مسبقاً','All these notes already exist'))}catch(er){flash(L('هذا ليس ملف ملاحظات صالحاً','Invalid notes file'))}};
$('bNote').onclick=()=>askNote(sel);$('bNotes').onclick=()=>openNotes();$('bPins').onclick=()=>{showPins=!showPins;tg('bPins',showPins);pinsBuild()};
// context menu: add note item
el.addEventListener('contextmenu',e=>{setTimeout(()=>{if(ctx.style.display!=='block')return;ndc(e);const h=ray.intersectObjects(pickables())[0];if(!h)return;const i=h.object.userData.i,pt=h.point.clone();
 const d=document.createElement('div');d.textContent=L('ملاحظة هنا','Add note here');d.onclick=()=>{hideCtx();askNote(i,pt)};ctx.insertBefore(d,ctx.firstChild)},0)});

// ================= REVIEW PACKAGE (opens in any browser) =================
async function reviewHTML(){if(!PAGE_SRC)return null;const doc=new DOMParser().parseFromString(PAGE_SRC,'text/html');
 let main=null;for(const s of [...doc.querySelectorAll('script[src]')]){if(/(^|\/)(vendor\/d3\.min|areas-logic|i18n|occupancy-chart|app)\.js/.test(s.getAttribute('src'))){try{const t=await (await fetch(s.getAttribute('src'))).text();const n=doc.createElement('script');n.textContent=t;s.replaceWith(n)}catch(e){}}}doc.querySelectorAll('script').forEach(s=>{const src=s.getAttribute('src')||'';if(src){if(!/three(\.min)?\.js|OrbitControls/.test(src))s.remove()}else if(s.textContent.includes('mc3d_cur')&&!main)main=s;else s.remove()});
 doc.querySelectorAll('meta[http-equiv]').forEach(m=>m.remove());if(!main)return null;
 const st0=clone(state);st0.notes=[];const pkg={name:curName,st:st0,key:hstr(curName+Date.now()).replace(/\./g,''),u:Date.now()};
 const tag=doc.createElement('script');tag.textContent='window.MC3D_REVIEW='+JSON.stringify(pkg).replace(/</g,'\\u003c')+';';main.parentNode.insertBefore(tag,main);
 return '<!DOCTYPE html>\n'+doc.documentElement.outerHTML}
async function reviewFile(){const h=await reviewHTML();if(!h)return flash(L('تعذّر تجهيز ملف المراجعة','Unable to build review file'));
 try{await saveBlob(L('مراجعة - ','Review - ')+curName+'.html',new Blob([h],{type:'text/html'}));$('modal').style.display='none';
  setTimeout(()=>{$('rvInfoT').innerHTML=L(
   '✓ تم حفظ <b>ملف المراجعة</b> لتصميم "'+curName.replace(/</g,'&lt;')+'".<br>1. أرسل الملف إلى المراجع عبر البريد الإلكتروني أو تطبيقات المراسلة أو USB.<br>2. يفتح المراجع الملف بأي متصفح حديث.<br>3. ينقر على أي كتلة ← ملاحظة، وعند الانتهاء ← <b>حفظ ملف الملاحظات</b> لإرساله إليك.<br>4. من تبويب ملف ← الملاحظات ← <b>استيراد ملاحظات</b> فتظهر مثبتة على الكتل.',
   '✓ Saved interactive <b>Review File</b> for "'+curName.replace(/</g,'&lt;')+'".<br>1. Send this HTML file to any reviewer (email / messaging / USB).<br>2. They open it in any modern desktop browser.<br>3. They click blocks to add notes, then click <b>Save Notes File</b> and send the JSON back.<br>4. Open File → Notes → <b>Import Notes</b> to display pins directly on your blocks.'
  );modal('rvinfo')},300)}
 catch(e){flash(e&&e.code==='declined'?L('أُلغي التنزيل','Download cancelled'):L('تعذّر حفظ الملف','Unable to save file'))}}
$('bReview').style.display='';
$('bReview').onclick=e=>{e.stopPropagation();const it=[[L('ملف مراجعة تفاعلي (يفتح بأي متصفح)','Interactive review file (any browser)'),reviewFile],[L('نسخ الملاحظات كنص','Copy notes as text'),()=>$('ntCopy').click()]];
 if(CL.rdb&&CL.owner)it.push([L('نشر على رابط المشاركة','Publish to review link'),publishOnline],[L('سحب كل المنشور أونلاين','Unpublish all'),unpublishAll]);popMenu(e.currentTarget,it)};
async function publishOnline(){try{await CL.rdb.collection('review').doc(keyOf('r_',curName)).set({name:curName,st:state,u:Date.now()});
  $('rvInfoT').innerHTML=L('✓ نُشر "'+curName.replace(/</g,'&lt;')+'" للمراجعة.','✓ Published "'+curName.replace(/</g,'&lt;')+'" for review.');modal('rvinfo')}
 catch(e){flash(L('تعذّر النشر — تحقق من الاتصال','Unable to publish — check connection'))}}
async function unpublishAll(){try{const q=await CL.rdb.collection('review').get();for(const d of q.docs)await CL.rdb.collection('review').doc(d.id).delete();flash(L('سُحب كل المنشور ('+q.docs.length+')','Unpublished '+q.docs.length+' item(s)'))}catch(e){flash(L('تعذّر السحب','Unable to unpublish'))}}
// review mode UI
if(REV){document.body.classList.add('revmode');const bar=document.createElement('div');bar.id='rvBar';
 bar.innerHTML=`<b>${L('وضع المراجعة','Review Mode')}</b><span>${L('تصميم:','Design:')} <b></b> · ${L('انقر على كتلة ثم','Click a block then')}</span><button id="rvNote">${L('ملاحظة','Add Note')}</button><button id="rvNotes">${L('الملاحظات','Notes')} <span class="cnt"></span></button><button id="rvSend" class="pri">${L('إرسال الملاحظات','Send Notes')}</button><span class="rvv"><button data-rv="iso">${L('أيزو','Iso')}</button><button data-rv="top">${L('مسقط','Plan')}</button><button data-rv="front">${L('واجهة','Front')}</button><button data-rv="eye">${L('منظور','Eye')}</button><button id="rvFn">${L('الوظائف','Zones')}</button></span>`;
 bar.querySelector('span b').textContent=REV.name;bar.querySelectorAll('[data-rv]').forEach(x=>x.onclick=()=>view(x.dataset.rv));state.blocks.forEach(b=>b.lock=true);$('titlebar').after(bar);$('rvNote').onclick=()=>askNote(sel);$('rvNotes').onclick=()=>openNotes();$('rvSend').onclick=()=>{openNotes()};
 $('cloudSt').style.display='none';$('rvFn').onclick=()=>{setColor(colorMode==='fn'?'mat':'fn');tg('rvFn',colorMode==='fn')};if(colorMode!=='fn')setColor('fn');tg('rvFn',true);setTimeout(()=>{fit();flash(L('هذا تصميم "'+REV.name+'" للمراجعة — انقر على أي كتلة لإضافة ملاحظة','Viewing "'+REV.name+'" for review — click any block to add a note'))},800)}
setTimeout(()=>{pinsBuild();notesBadge()},500);
{const _r=refresh;refresh=function(){_r.apply(this,arguments);if(typeof pinsBuild==='function'){pinsBuild();notesBadge()}}}

// ================= FUNCTIONAL PROGRAM ALLOCATION =================
const PROG_PRESETS={
 general:{
  main:[['قاعة رئيسية متعددة الاستخدامات','Main Multipurpose Hall',350,1],['قاعة نشاط رئيسية','Primary Activity Hall',120,4],['مساحات عمل رئيسية','Primary Studio / Workrooms',80,4]],
  pub:[['بهو الاستقبال الرئيسي','Main Lobby & Reception',260,1],['صالة عرض ومعرض','Exhibition & Gallery Hall',220,1],['مكتبة ومصادر عامة','Public Lounge & Library',180,1],['كافتيريا واستراحة','Cafe & Dining',160,1]],
  spec:[['مختبر / ورشة تخصصية','Specialized Lab / Workshop',140,3],['استوديو تقني مجهز','Equipped Technical Studio',100,2],['قاعة تدريب تخصصية','Training Room',90,3]],
  adm:[['مكاتب الإدارة','Administration Offices',180,1],['قاعة اجتماعات','Meeting Room',65,2],['خدمات ومرافق صحية','Restrooms & Utilities',140,1],['ميكانيك وكهرباء ومخازن','MEP & Storage',220,1]],
  circ:[['بهو ومفاصل حركة','Circulation Cores & Bridges',250,1]]
 },
 edu:{
  main:[['مدرج محاضرات رئيسي','Main Lecture Auditorium',320,1],['قاعة دراسية','Classroom',70,6],['استوديو تصميم / عمل جماعي','Design / Group Studio',140,3]],
  pub:[['المكتبة وقاعة المطالعة','Library & Reading Hall',400,1],['بهو واستقبال الطلاب','Student Atrium & Lobby',240,1],['كافتيريا','Cafeteria',200,1]],
  spec:[['مختبر علمي / حاسوب','Science / Computer Lab',110,4],['ورشة نماذج','Fabrication Workshop',140,1]],
  adm:[['العمادة والإدارة','Dean & Administration',200,1],['مكاتب التدريسيين','Faculty Offices',160,1],['خدمات ومخازن وميكانيك','Services, Storage & MEP',220,1]],
  circ:[['ممرات ربط وعناصر رأسية','Corridors & Vertical Cores',260,1]]
 },
 res:{
  main:[['وحدة سكنية (3 غرف)','3-Bedroom Apartment',160,6],['وحدة سكنية (غرفتان)','2-Bedroom Apartment',120,8],['وحدة استوديو','Studio Unit',65,6]],
  pub:[['بهو ومدخل سكني','Residential Lobby',140,1],['صالة ترفيه واجتماعات سكانية','Residents Lounge',160,1],['محلات وخدمات تجارية','Ground Retail',220,1]],
  spec:[['نادي رياضي ومرافق صحية','Fitness & Wellness Club',180,1],['حديقة أو سطح مشترك','Communal Roof / Garden',200,1]],
  adm:[['إدارة المجمع والأمن','Building Management & Security',90,1],['مواقف وخدمات تقنية','MEP & Technical Rooms',240,1]],
  circ:[['نواة المصاعد والسلالم','Elevator & Stair Cores',220,1]]
 },
 office:{
  main:[['مكاتب مفتوحة (Open Plan)','Open-Plan Office Floor',420,4],['مكاتب تنفيذية','Executive Suites',140,2]],
  pub:[['بهو الاستقبال الرئيسي','Main Atrium Lobby',280,1],['مركز مؤتمرات','Conference Center',260,1],['مقهى ومطعم','Cafe & Dining',160,1]],
  spec:[['غرف اجتماعات ذكية','Boardrooms & Meeting Pods',75,5],['مركز بيانات وتقنية','IT & Data Hub',120,1]],
  adm:[['إدارة المبنى والأرشيف','Facility Management & Archive',160,1],['خدمات ومرافق ميكانيكية','MEP & Utilities',240,1]],
  circ:[['نواة الخدمة والحركة الرأسية','Service & Elevator Core',260,1]]
 },
 med:{
  main:[['عيادات خارجية','Outpatient Clinics',120,6],['قاعة تعليم وتدريب سريري','Clinical Training Hall',200,2],['أجنحة إقامة / رعاية','Inpatient / Care Ward',220,2]],
  pub:[['بهو الاستقبال والفرز','Main Reception & Triage',280,1],['استراحة المراجعين وكافتيريا','Waiting Lounge & Cafe',200,1]],
  spec:[['مختبرات وتحاليل','Diagnostic Labs',140,2],['أشعة وتصوير طبي','Imaging & Radiology',160,1],['طوارئ أو عمليات','Emergency / OR Suite',240,1]],
  adm:[['إدارة وسجلات طبية','Medical Records & Admin',180,1],['تعقيم وصيدلية وميكانيك','CSSD, Pharmacy & MEP',280,1]],
  circ:[['مصاعد وممرات فصل الحركة','Separated Circulation Cores',260,1]]
 },
 empty:{main:[],pub:[],spec:[],adm:[],circ:[]}
};
function progSeed(preset){
 const p=(preset&&PROG_PRESETS[preset])?preset:'general';
 const src=PROG_PRESETS[p],sp=[];
 Object.entries(src).forEach(([fn,Lst])=>Lst.forEach(([nar,nen,a,q])=>{
  for(let k=1;k<=q;k++)sp.push({id:uid(),n:q>1?nar+' '+k:nar,nen:q>1?nen+' '+k:nen,a,fn,bid:'',fl:0});
 }));
 return {eff:.8,preset:p,sp};
}
const prog=()=>(state.prog=state.prog||progSeed());
function slots(){const out=[];state.blocks.forEach((b,i)=>{if(!counts(b)||b.hidden)return;for(let f=0;f<b.f;f++)out.push({key:b.id+'|'+f,bid:b.id,fl:f,i,b,cap:areaOf(b)*prog().eff})});return out}
const slotName=s=>`B${String(s.i+1).padStart(2,'0')} ${s.b.name} — ${L('ط','F')}${s.fl+1}`;
function progUse(){const P=prog(),use={};P.sp.forEach(x=>{if(!x.bid)return;const k=x.bid+'|'+x.fl;(use[k]=use[k]||{a:0,L:[]}).a+=x.a;use[k].L.push(x)});return use}
function progAuto(){const P=prog(),S0=slots(),use=progUse(),rem={};S0.forEach(s=>rem[s.key]=s.cap-(use[s.key]?use[s.key].a:0));let miss={},placed=0;
 Object.keys(FNS).forEach(fn=>{const Lst=P.sp.filter(x=>(LEGACY_FN[x.fn]||x.fn)===fn&&!(x.bid&&S0.some(s=>s.bid===x.bid&&s.fl===x.fl))).sort((a,b)=>b.a-a.a);const C=S0.filter(s=>(s.b.fn||'')===fn);
  Lst.forEach(x=>{x.fn=LEGACY_FN[x.fn]||x.fn;const best=C.find(s=>rem[s.key]>=x.a);if(best){x.bid=best.bid;x.fl=best.fl;rem[best.key]-=x.a;placed++}else{x.bid='';miss[fn]=(miss[fn]||0)+1}})});
 return {placed,miss}}
let progFilter='all';
function spName(x){return (L(0,1)&&x.nen)?x.nen:x.n}
function renderProg(){const P=prog(),S0=slots(),use=progUse(),valid=new Set(S0.map(s=>s.key));
 P.sp.forEach(x=>{if(x.fn&&LEGACY_FN[x.fn])x.fn=LEGACY_FN[x.fn];if(x.fn&&!FNS[x.fn])x.fn='adm';if(x.bid&&!valid.has(x.bid+'|'+x.fl))x.bid=''});
 if($('pgPreset'))$('pgPreset').value=P.preset||'general';
 const tot=P.sp.reduce((a,x)=>a+x.a,0),done=P.sp.filter(x=>x.bid).reduce((a,x)=>a+x.a,0),cap=S0.reduce((a,s)=>a+s.cap,0);
 $('pgSum').innerHTML=L(
  `البرنامج <b>${Math.round(tot)}</b> م² · موزع <b>${Math.round(done)}</b> م² (${tot?Math.round(done/tot*100):0}%) · سعة الكتل الصافية <b>${Math.round(cap)}</b> م²`+(cap<tot?' <span class="warnTxt">⚠ الكتل أصغر من البرنامج</span>':''),
  `Program <b>${Math.round(tot)}</b> m² · Allocated <b>${Math.round(done)}</b> m² (${tot?Math.round(done/tot*100):0}%) · Net Capacity <b>${Math.round(cap)}</b> m²`+(cap<tot?' <span class="warnTxt">⚠ Mass capacity below program</span>':'')
 );
 $('pgEff').value=String(P.eff);
 const opt=x=>'<option value="">'+L('— غير موزع —','— Unassigned —')+'</option>'+S0.map(s=>`<option value="${s.key}" ${x.bid+'|'+x.fl===s.key&&x.bid?'selected':''}>${slotName(s).replace(/</g,'&lt;')}${(s.b.fn||'')!==x.fn?' ⚠':''}</option>`).join('');
 let h='';Object.entries(FNS).forEach(([fn,f])=>{const Lst=P.sp.filter(x=>x.fn===fn&&(progFilter==='all'||!x.bid));if(!Lst.length)return;const a=Lst.reduce((s,x)=>s+x.a,0);
  h+=`<div class="pgH"><span class="sw" style="background:${f.c}"></span>${fnName(fn)} <span class="hint">${Lst.length} ${L('فضاء','spaces')} · ${Math.round(a)} ${L('م²','m²')}</span></div>`;
  Lst.forEach(x=>{h+=`<div class="pgR" data-id="${x.id}"><input class="pgN" value="${spName(x).replace(/"/g,'&quot;')}"><input class="pgA" type="number" min="1" step="5" value="${x.a}"><select class="pgS">${opt(x)}</select><button class="sm pgD" title="${L('حذف','Delete')}">✕</button></div>`})});
 $('pgList').innerHTML=h||`<div class="hint" style="padding:8px">${P.sp.length?L('كل الفضاءات موزعة ✓','All spaces allocated ✓'):L('البرنامج فارغ — أضف فضاءً أو اختر قالباً من الأعلى','Program is empty — add a space or choose a preset above')}</div>`;
 let c='';S0.forEach(s=>{const u=use[s.key]||{a:0,L:[]},p=s.cap?u.a/s.cap:0,col=p>1.001?'#c62828':p>.85?'#ef6c00':'#2e7d32';
  c+=`<div class="pgC"><div class="pgCt"><span class="sw" style="background:${FNS[s.b.fn||''].c}"></span>${slotName(s).replace(/</g,'&lt;')}<span class="hint" style="margin-inline-start:auto">${Math.round(u.a)} / ${Math.round(s.cap)} ${L('م²','m²')}</span></div><div class="bar"><i style="width:${Math.min(100,p*100)}%;background:${col}"></i></div>`+(u.L.length?`<div class="pgCl">${u.L.map(x=>spName(x).replace(/</g,'&lt;')).join(' · ')}</div>`:'')+(p>1.001?`<div class="warnTxt" style="font-size:11px">⚠ ${L('زيادة','Overflow')} ${Math.round(u.a-s.cap)} ${L('م² — كبّر الكتلة أو انقل فضاء','m² — enlarge block or reassign')}</div>`:'')+'</div>'});
 $('pgCap').innerHTML=c||`<div class="hint">${L('لا توجد كتل بعد','No blocks yet')}</div>`;
 $('pgList').querySelectorAll('.pgR').forEach(r=>{const x=P.sp.find(y=>y.id===r.dataset.id);if(!x)return;
  r.querySelector('.pgN').onchange=e=>{snap(true);const v=e.target.value;if(L(0,1))x.nen=v||x.nen;else x.n=v||x.n;save()};r.querySelector('.pgA').onchange=e=>{const v=parseFloat(e.target.value);if(!(v>0))return;snap(true);x.a=v;save();renderProg();stats()};
  r.querySelector('.pgS').onchange=e=>{snap(true);const v=e.target.value;if(!v){x.bid=''}else{const [b,f]=v.split('|');x.bid=b;x.fl=+f}save();renderProg();panel()};
  r.querySelector('.pgD').onclick=()=>{snap(true);P.sp.splice(P.sp.indexOf(x),1);save();renderProg()}});
 if(typeof stats==='function')stats()}
function openProg(){renderProg();modal('prog')}
if($('pgPreset'))$('pgPreset').onchange=e=>{const val=e.target.value;if(!PROG_PRESETS[val])return;const P=prog();
 if(!P.sp.length||!P.sp.some(x=>x.bid)){snap(true);state.prog=progSeed(val);save();renderProg();panel();flash(L('تم تحميل قالب البرنامج ✓','Program preset loaded ✓'))}
 else{P.preset=val;save();flash(L('اخترت القالب — انقر "تحميل القالب" مرتين لتطبيقه','Preset selected — double-click "Load Preset" to replace current spaces'))}};
$('pgEff').onchange=e=>{snap(true);prog().eff=parseFloat(e.target.value);save();renderProg()};
$('pgAuto').onclick=()=>{snap(true);const r=progAuto();save();renderProg();panel();const m=Object.entries(r.miss).map(([fn,n])=>fnName(fn).split(' ')[0]+': '+n);flash(L(`وُزِّع ${r.placed} فضاء`,`Allocated ${r.placed} space(s)`)+(m.length?L(' · لم يُعثر على مكان لـ ',' · Unplaced: ')+m.join('، '):' ✓'))};
$('pgClear').onclick=e=>arm(e.currentTarget,()=>{snap(true);prog().sp.forEach(x=>x.bid='');save();renderProg();panel()});
$('pgReset').onclick=e=>arm(e.currentTarget,()=>{snap(true);state.prog=progSeed($('pgPreset')?$('pgPreset').value:'general');save();renderProg();panel();flash(L('تم تحميل القالب ✓','Program preset loaded ✓'))});
$('pgFilt').onclick=()=>{progFilter=progFilter==='all'?'free':'all';$('pgFilt').textContent=progFilter==='all'?L('غير الموزع فقط','Unallocated Only'):L('عرض الكل','Show All');renderProg()};
$('pgAdd').onclick=()=>showInput(L('فضاء جديد: الاسم، المساحة، العدد، الوظيفة (مثال: قاعة، 80، 2، main)','New space: Name, Area, Count, Zone (e.g. Hall, 80, 2, main)'),'',v=>{const [n,a,q,fn]=v.split(/[،,]/).map(s=>s.trim());const A=parseFloat(a)||50,Q=Math.max(1,parseInt(q)||1);
 const F=Object.keys(FNS).find(k=>k&&(k===fn||(fn&&(FNS[k].n.includes(fn)||fnName(k).toLowerCase().includes(fn.toLowerCase())))))||'adm';snap(true);for(let k=1;k<=Q;k++)prog().sp.push({id:uid(),n:Q>1?n+' '+k:n,nen:Q>1?n+' '+k:n,a:A,fn:F,bid:'',fl:0});save();setTimeout(openProg,60)});
$('pgCSV').onclick=()=>{const S0=slots(),m={};S0.forEach(s=>m[s.key]=slotName(s));let csv='\uFEFF'+L('الفضاء,الوظيفة,المساحة م2,الكتلة والطابق','Space,Zone,Area m2,Block & Floor')+'\n';prog().sp.forEach(x=>csv+=[spName(x),fnName(x.fn),x.a,x.bid?m[x.bid+'|'+x.fl]||'':L('غير موزع','Unassigned')].map(csvEsc).join(',')+'\n');
 saveBlob(curName+L(' - توزيع البرنامج.csv',' - Program Schedule.csv'),new Blob([csv],{type:'text/csv'})).then(()=>flash(L('تم الحفظ ✓','Saved ✓'))).catch(()=>flash(L('تعذّر الحفظ','Unable to save')))};
$('pgSheet').onclick=()=>{const S0=slots(),use=progUse();const lines=[L('توزيع البرنامج الوظيفي — ','Functional Program Allocation — ')+curName];S0.forEach(s=>{const u=use[s.key];if(!u)return;lines.push(`${slotName(s)} (${Math.round(u.a)}/${Math.round(s.cap)} ${L('م²','m²')}): ${u.L.map(x=>spName(x)).join(' · ')}`)});
 if(lines.length<2)return flash(L('لا توجد فضاءات موزعة بعد','No allocated spaces yet'));sPush();const W=PW(),it=addText(lines.join('\n'),W*.55,40,W*.4,3.2,{align:L('right','left')});it.h=lines.length*3.2*1.7;saveSheet();$('modal').style.display='none';flash(L('أُضيف جدول التوزيع إلى اللوحة "'+curSheet+'" — افتح اللوحات لترتيبه','Added schedule to sheet "'+curSheet+'"'))};
$('bProg').onclick=openProg;

// ================= UNIFIED UNDO (sheet + model) =================
let sRedoS=[];{const _p=sPush;sPush=function(){sRedoS=[];return _p.apply(this,arguments)}}
function sRedo(){if(!sRedoS.length)return;sHist.push(JSON.stringify(sheet));sheet=JSON.parse(sRedoS.pop());sheets[curSheet]=sheet;setSSel([]);saveSheet();loadImgs();layoutSheet()}
{const _u=sUndo;sUndo=function(){if(sHist.length)sRedoS.push(JSON.stringify(sheet));return _u.apply(this,arguments)}}
const anyUndo=()=>sheetOpen?sUndo():doUndo(),anyRedo=()=>sheetOpen?sRedo():doRedo();
$('qUndo').onclick=anyUndo;$('qRedo').onclick=anyRedo;
addEventListener('keydown',e=>{if(!sheetOpen)return;const t=e.target;if(t.isContentEditable||['INPUT','SELECT','TEXTAREA'].includes(t.tagName))return;const ctrl=e.ctrlKey||e.metaKey,k=e.key;
 if(ctrl&&((k==='y'||k==='Y')||((k==='z'||k==='Z')&&e.shiftKey))){e.preventDefault();e.stopImmediatePropagation();sRedo()}},true);


// ================= PUBLIC SITE: Supabase (cloud + live review links) =================
const SB={url:'https://kwoftzpxtytcgahsgjro.supabase.co',key:'sb_publishable_YHx-GmgyEdNhCqhf98Ds2w_oCZAMMDp',pub:'https://roden57.github.io/maket/'};
const IN_CLAUDE=!!(window.claude&&claude.use);
async function sbFetch(path,opt){const r=await fetch(SB.url+path,Object.assign({},opt,{headers:Object.assign({apikey:SB.key,'Content-Type':'application/json'},(opt&&opt.headers)||{})}));
 if(!r.ok){let t='';try{t=await r.text()}catch(e){}const er=new Error(t||('HTTP '+r.status));er.code=/denied/.test(t)?'denied':'http_'+r.status;throw er}const t=await r.text();return t?JSON.parse(t):null}
const sbRpc=(fn,args)=>sbFetch('/rest/v1/rpc/'+fn,{method:'POST',body:JSON.stringify(args)});
// ---- accounts: each person has username + password ----
let SBU=LS.get('mc3d_sbu')||null,SBK=LS.get('mc3d_sbk')||null;
const sbA=o=>Object.assign({u:SBU,k:SBK},o||{});
function sbCollection(p){return {
 doc:id=>({async get(){const d=await sbRpc('kv_get',sbA({p,i:id}));return {exists:d!==null&&d!==undefined,id,data:()=>d}},
  async set(v){await sbRpc('kv_set',sbA({p,i:id,d:v}))},async delete(){await sbRpc('kv_del',sbA({p,i:id}))},
  onSnapshot(cb,err){let last=null,stop=false;const tick=async()=>{if(stop)return;try{const d=await sbRpc('kv_get',sbA({p,i:id}));const j=JSON.stringify(d);if(j!==last){last=j;cb({exists:d!==null,data:()=>d,metadata:{fromCache:false}})}}catch(e){if(err)err(e)}if(!stop)setTimeout(tick,document.hidden?60000:15000)};tick();return()=>{stop=true}}}),
 async get(){const rows=await sbRpc('kv_list',sbA({p}))||[];return {docs:rows.map(r=>({id:r.id,data:()=>r.data}))}}}}
const LOCAL_KEYS=['mc3d_designs','mc3d_cur','mc3d_name','mc3d_sheets','mc3d_sheetname','mc3d_sheet','mc3d_synced','mc3d_pristine','mc3d_imgup','mc3d_revids','mc3d_ntseen','mc3d_lastbk','mc3d_owner'];
function clearLocalData(){clearTimeout(saveT);LOCAL_KEYS.forEach(k=>{try{localStorage.removeItem(k)}catch(e){}})}
function userUI(){const on=!!(SBU&&SBK&&!REV);$('userSt').style.display=on?'':'none';$('userNm').textContent=on?''+SBU:''}
function sbForget(){SBU=SBK=null;LS.set('mc3d_sbu',null);LS.set('mc3d_sbk',null);userUI()}
let authAfter=null;
function sbLogin(after){authAfter=typeof after==='function'?after:null;$('auU').value=SBU||'';$('auK').value='';$('auMsg').textContent='';modal('auth');setTimeout(()=>$(SBU?'auK':'auU').focus(),50)}
async function authGo(isNew){const u=$('auU').value.trim().toLowerCase(),k=$('auK').value,msg=t=>{$('auMsg').textContent=t};
 if(u.length<2||u.length>30||/[\s\/]/.test(u))return msg(L('يجب أن يتكون اسم المستخدم من 2 إلى 30 حرفاً دون مسافات','Username must be 2–30 characters with no spaces'));
 if(k.length<4)return msg(L('يجب ألا تقل كلمة المرور عن 4 أحرف','Password must be at least 4 characters'));
 msg('');let r;try{r=await sbRpc(isNew?'user_signup':'user_login',{u,k})}catch(e){return msg(L('تعذّر الاتصال بالسحابة — تحقق من الاتصال بالإنترنت','Cloud connection failed — check your internet'))}
 if(r==='taken')return msg(L('اسم المستخدم مستخدم — اختر اسماً آخر، أو انقر "دخول" إذا كان هذا حسابك','Username taken — choose another or click Sign In'));
 if(r==='badname')return msg(L('اسم المستخدم غير صالح','Invalid username'));
 if(r==='short')return msg(L('يجب ألا تقل كلمة المرور عن 4 أحرف','Password must be at least 4 characters'));
 if(r!=='ok'&&r!=='new')return msg(L('اسم المستخدم أو كلمة المرور غير صحيحة','Incorrect username or password'));
 const owner=LS.get('mc3d_owner');SBU=u;SBK=k;LS.set('mc3d_sbu',u);LS.set('mc3d_sbk',k);
 if(owner&&owner!==u){clearLocalData();LS.set('mc3d_owner',u);flash(L('جارٍ فتح حساب '+u+'…','Opening account '+u+'…'));setTimeout(()=>location.reload(),400);return}
 LS.set('mc3d_owner',u);$('modal').style.display='none';userUI();flash(r==='new'?L('✓ أُنشئ حسابك "'+u+'" — يُحفظ عملك الآن في السحابة','✓ Account "'+u+'" created — cloud sync enabled'):L('✓ مرحباً '+u,'✓ Welcome back, '+u));
 const after=authAfter;authAfter=null;if(!CL.col&&after!==sbInit)sbInit();if(after)after();pullNotes()}
$('auIn').onclick=()=>authGo(false);$('auNew').onclick=()=>authGo(true);$('auK').onkeydown=e=>{if(e.key==='Enter')authGo(false)};$('auU').onkeydown=e=>{if(e.key==='Enter')$('auK').focus()};
$('bLogout').onclick=e=>arm(e.currentTarget,async()=>{if(CL.col&&CL.sb){clearTimeout(clT);flash(L('جارٍ حفظ عملك في السحابة قبل الخروج…','Saving your work to cloud before logout…'));CL.ok=false;await reconcile(CL.lastMeta?clone(CL.lastMeta):null);
  for(let t=0;t<40&&CL.busy;t++)await new Promise(r=>setTimeout(r,500));if(!CL.ok)return flash(L('تعذّر الحفظ في السحابة — لم يتم تسجيل الخروج حفاظاً على عملك','Could not sync — logout cancelled to protect your work'))}
 if(CL.unsub)CL.unsub();sbForget();clearLocalData();location.reload()});
userUI();
async function sbInit(){if(REV)return clStatus('','off','');if(CL.col)return;if(!SBK||!SBU)return clStatus('انقر لتسجيل الدخول','off','Sign in');
 try{const r=await sbRpc('user_login',sbA());if(r!=='ok'){sbForget();return clStatus('انقر لتسجيل الدخول','off','Sign in')}}catch(e){return clStatus('تعذّر الاتصال بالسحابة','err','Offline')}
 if(!LS.get('mc3d_owner'))LS.set('mc3d_owner',SBU);userUI();
 CL.db={collection:sbCollection};CL.uid=SBU;CL.owner=true;CL.col=sbCollection('data');CL.sb=true;
 if(WAS_FRESH&&!LS.get('mc3d_pristine')){const d={},s={};Object.entries(localDesigns()).forEach(([k,v])=>d[k]=hOf(v));saveSheetLocalOnly();Object.entries(sheets).forEach(([k,v])=>s[k]=hOf(v));LS.set('mc3d_pristine',{d,s})}
 clStatus('جارٍ الاتصال…','sync','Connecting…');CL.unsub=CL.col.doc('meta').onSnapshot(snap=>{const m=snap.exists?snap.data():null;CL.lastMeta=m?clone(m):null;if(m)CL.lastMetaJ=JSON.stringify({d:m.d||{},s:m.s||{},del:m.del||{d:{},s:{}}});reconcile(m?clone(m):null)},()=>clStatus('انقطع الاتصال','err','Disconnected'));
 setTimeout(()=>pullNotes(),1500)}
if(!IN_CLAUDE){$('cloudSt').onclick=()=>{if(CL.col)return reconcile(CL.lastMeta?clone(CL.lastMeta):null);sbLogin(sbInit)}}
// downloads outside Claude
if(!IN_CLAUDE){DL={save:({filename,data})=>{const b=data instanceof Blob?data:new Blob([data]);const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),8000);return Promise.resolve()}};
 setTimeout(()=>{['shDown','shAll'].forEach(id=>$(id).style.display='');$('shDownHint').textContent=''},0)}
// ---- live review link ----
function revIds(){return LS.get('mc3d_revids')||{}}
function revIdFor(name){const m=revIds();if(!m[name]){m[name]='r'+Math.random().toString(36).slice(2,10);LS.set('mc3d_revids',m)}return m[name]}
async function publishLink(){if(!SBK||!SBU)return sbLogin(publishLink);const id=revIdFor(curName);
 try{await sbRpc('review_put',sbA({i:id,n:curName,s:Object.assign(clone(state),{notes:[]})}));const link=SB.pub+'?r='+id;
  $('rvInfoT').innerHTML=L(
   `✓ نُشر "<b></b>" — شارك هذا الرابط للمراجعة (يُفتح على أي هاتف أو حاسوب، دون حساب):<div class="fld" style="margin:8px 0"><input id="rvLink" readonly style="width:min(420px,78vw);direction:ltr" value="${link}"></div>
    <button class="sm pri2" id="rvCopy">نسخ الرابط</button> <a class="sm" id="rvWa" target="_blank" rel="noopener" style="display:inline-block;padding:4px 10px;background:#25d366;color:#fff;border-radius:6px;text-decoration:none">مشاركة عبر واتساب</a>
    <div class="hint" style="margin-top:8px">تصل الملاحظات هنا تلقائياً كعلامات على الكتل. عند تعديل التصميم، أعد نشره بالطريقة نفسها ويبقى الرابط كما هو.</div>`,
   `✓ Published "<b></b>" — share this live review link (works on any device, no login needed):<div class="fld" style="margin:8px 0"><input id="rvLink" readonly style="width:min(420px,78vw);direction:ltr" value="${link}"></div>
    <button class="sm pri2" id="rvCopy">Copy Link</button> <a class="sm" id="rvWa" target="_blank" rel="noopener" style="display:inline-block;padding:4px 10px;background:#25d366;color:#fff;border-radius:6px;text-decoration:none">Share on WhatsApp</a>
    <div class="hint" style="margin-top:8px">Reviewer comments sync automatically onto your blocks. Re-publish anytime to update the same link.</div>`
  );
  $('rvInfoT').querySelector('b').textContent=curName;$('rvWa').href='https://wa.me/?text='+encodeURIComponent(L('مرحباً، هذا رابط تصميم "'+curName+'" للمراجعة — يمكنك الاطلاع عليه وكتابة الملاحظات على الكتل مباشرة:\n','Hi, here is the 3D massing design "'+curName+'" for review — click any block to leave notes:\n')+link);
  $('rvCopy').onclick=()=>navigator.clipboard.writeText(link).then(()=>flash(L('نُسخ الرابط ✓','Link copied ✓'))).catch(()=>{$('rvLink').select()});modal('rvinfo')}
 catch(e){if(e.code==='denied'){sbForget();return sbLogin(publishLink)}flash(L('تعذّر النشر — تحقق من الاتصال بالإنترنت','Publish failed — check your connection'))}}
async function unpublishLink(){if(!SBK||!SBU)return sbLogin(unpublishLink);const m=revIds(),id=m[curName];if(!id)return flash(L('هذا التصميم غير منشور','This design is not published'));try{await sbRpc('review_del',sbA({i:id}));delete m[curName];LS.set('mc3d_revids',m);flash(L('سُحب الرابط — لن يُفتح بعد الآن','Link unpublished'))}catch(e){flash(L('تعذّر سحبه','Unable to unpublish'))}}
// pull new reviewer notes into matching designs
let ntBusy=false,ntLast=0;
async function pullNotes(manual){if(REV||ntBusy)return;if(!manual&&Date.now()-ntLast<3000)return;ntBusy=true;ntLast=Date.now();
 try{if(SBU&&SBK){try{const Lst=await sbRpc('review_list',sbA()),m=revIds(),have=new Set(Object.values(m));let ch=false;
   (Lst||[]).forEach(r=>{if(!have.has(r.id)&&!(r.name in m)){m[r.name]=r.id;ch=true}});if(ch)LS.set('mc3d_revids',m)}catch(e){}}
 const m=revIds(),ids=Object.values(m);if(!ids.length){if(manual)flash(L('لا توجد تصاميم منشورة برابط بعد','No published review links yet'));return}
 let rows;try{rows=await sbFetch('/rest/v1/notes?select=*&review_id=in.('+ids.map(encodeURIComponent).join(',')+')&order=created_at.asc')}catch(e){if(manual)flash(L('تعذّر الاتصال بالسحابة — تحقق من الاتصال بالإنترنت','Cloud error — check internet connection'));return}
 const seen=new Set(LS.get('mc3d_ntseen')||[]),byId={};Object.entries(m).forEach(([n,i])=>byId[i]=n);let got=0,curChanged=false,otherChanged=false;const who=new Set(),per={};
 (rows||[]).forEach(r=>{if(seen.has(r.id))return;const n=byId[r.review_id];if(!n)return;const tgt=n===curName?state:designs[n];if(!tgt)return;
  seen.add(r.id);const Lst=(tgt.notes=tgt.notes||[]);if(Lst.some(x=>x.id===r.id))return;
  const note=Object.assign({},r.data,{id:r.id});Lst.push(note);if(n===curName)curChanged=true;else otherChanged=true;got++;per[n]=(per[n]||0)+1;if(note.by)who.add(note.by)});
 LS.set('mc3d_ntseen',[...seen]);if(!got){if(manual)flash(L('لا توجد ملاحظات جديدة ✓','No new notes ✓'));return}
 if(curName)designs[curName]=clone(state);LS.set('mc3d_designs',designs);if(curChanged)save();if(otherChanged&&typeof cloudSoon==='function')cloudSoon();
 pinsBuild();notesBadge();if($('modal').style.display==='flex'&&$('notesList').offsetParent)renderNotes();
 const where=Object.entries(per).map(([n,k])=>n===curName?L(`${k} على هذا التصميم`,`${k} on current`):L(`${k} على "${n}"`,`${k} on "${n}"`)).join(' · ');
 flash(L(`وصلت ${got} ملاحظة جديدة${who.size?' من '+[...who].join('، '):''} (${where})`,`Received ${got} new note(s)${who.size?' from '+[...who].join(', '):''} (${where})`))}
 finally{ntBusy=false}}
if(!REV){setTimeout(()=>pullNotes(),2500);setInterval(()=>{if(!document.hidden)pullNotes()},30000);
 addEventListener('focus',()=>pullNotes());document.addEventListener('visibilitychange',()=>{if(!document.hidden)pullNotes()})}
// reviewer (review link opened): notes go straight to the database
async function sendNoteRemote(n){if(!REV||!REV.remote)return;try{await sbFetch('/rest/v1/notes',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({id:n.id,review_id:REV.key,data:n})});n.sent=1;flash(L('✓ أُرسلت الملاحظة إلى صاحب التصميم','✓ Note sent to the designer'))}catch(e){flash(L('لم تُرسل الملاحظة — تحقق من الاتصال وأعد المحاولة','Failed to send note — check connection'))}}
async function pullRemoteNotesForReviewer(){if(!REV||!REV.remote)return;try{const rows=await sbFetch('/rest/v1/notes?select=*&review_id=eq.'+encodeURIComponent(REV.key)+'&order=created_at.asc');const Lst=notesOf(),have=new Set(Lst.map(n=>n.id));
 (rows||[]).forEach(r=>{if(!have.has(r.id))Lst.push(Object.assign({},r.data,{id:r.id,sent:1}))});pinsBuild();notesBadge()}catch(e){}}
{const _a=addNote;addNote=function(i,text,pt){_a.apply(this,arguments);const Lst=notesOf(),n=Lst[Lst.length-1];if(n&&REV&&REV.remote)sendNoteRemote(n)}}
if(REV&&REV.remote){setTimeout(()=>{pullRemoteNotesForReviewer();const b=$('rvSend');if(b){b.textContent=L('✓ تصل ملاحظاتك تلقائياً','✓ Notes sync automatically');b.onclick=()=>openNotes()}
  const sp=document.querySelector('#rvBar span');if(sp){sp.innerHTML=`${L('تصميم:','Design:')} <b></b> · ${L('انقر على أي كتلة ثم ملاحظة','Click any block then Add Note')}`;sp.querySelector('b').textContent=REV.name}
  ['ntSend'].forEach(id=>$(id).style.display='none')},600)}
// review menu
$('bReview').onclick=e=>{e.stopPropagation();popMenu(e.currentTarget,[[L('رابط مباشر للمراجعة (دون حساب) — الأسهل','Live review link (no sign-in needed)'),publishLink],[L('ملف مراجعة تفاعلي (يفتح بأي متصفح)','Interactive review file (any browser)'),reviewFile],[L('نسخ الملاحظات كنص','Copy notes as text'),()=>$('ntCopy').click()],[L('سحب رابط هذا التصميم','Unpublish review link'),unpublishLink]])};

// ================= TOUR =================
function getTour(){return [
 [L('مرحباً بك في ماكيت','Welcome to Maket'),L('استوديو نمذجة كتلية معمارية ثلاثي الأبعاد لكل المصممين. جولة سريعة من 6 خطوات للتعرف على الواجهة.','A universal 3D architectural massing studio. Take a quick 6-step tour of the workspace.'),'#top'],
 [L('أدوات الرسم السريعة','Quick Canvas Tools'),L('استخدم الشريط العائم يسار الشاشة للتحديد والرسم والقص والقياس، وتفعيل المسقط الأفقي 2D أو التحديد المتعدد.','Use the floating left rail to Select, Draw, Cut, Measure, toggle 2D Plan, or Multi-Select.'),'#toolRail'],
 [L('لوحة النمذجة والعناصر','Modeling Inspector'),L('من هنا تضبط الشكل والمادة والتصنيف والطوابق قبل الرسم، وتتحكم بقائمة جميع الكتل في المشروع.','Choose default shape, material, zone, and floors before drawing, and manage your project outliner.'),'[data-t=home]'],
 [L('تعديل الكتلة والخصائص','Contextual Block Editing'),L('انقر على أي كتلة لتظهر لوحة «تعديل الكتلة» باليمين، واسحب المربعات البرتقالية للأبعاد والمخروط الأزرق للطوابق.','Click any mass to open the Edit Mass panel, drag orange handles to resize, and the blue cone for floors.'),'#tabs'],
 [L('الشمس والرياح والعرض','Sun, Wind & Display'),L('خصّص المدينة أو الإحداثيات لمحاكاة الشمس والرياح الحقيقية، واختر زوايا الكاميرا أو الإظهار المحسّن.','Pick any city or custom coordinates for real sun & wind studies, plus camera views and enhanced rendering.'),'[data-t=view]'],
 [L('اللوحات والتصدير الاحترافي','Sheets & CAD/BIM Export'),L('أنشئ لوحات عرض معمارية A4–A1 مع جدول عنوان ومقياس رسم، وصدّر إلى PDF وRevit (IFC) وAutoCAD (DXF) وSketchUp.','Build A4–A1 boards with title blocks and scale bars, and export to PDF, Revit (IFC), AutoCAD (DXF), and SketchUp.'),'#qExp']
]}
let tourI=0;function showTour(i){const TR=getTour();tourI=i;const [t,txt,sel]=TR[i];$('tourT').textContent=t;$('tourX').textContent=txt;$('tourN').textContent=(i+1)+' / '+TR.length;$('tourPrev').style.visibility=i?'visible':'hidden';$('tourNext').textContent=i===TR.length-1?L('ابدأ ✓','Start ✓'):L('التالي →','Next →');
 document.querySelectorAll('.tourhl').forEach(e=>e.classList.remove('tourhl'));if(sel){const e=document.querySelector(sel);if(e)e.classList.add('tourhl')}$('tour').style.display='flex'}
function endTour(){$('tour').style.display='none';document.querySelectorAll('.tourhl').forEach(e=>e.classList.remove('tourhl'));LS.set('mc3d_tour',1)}
$('tourNext').onclick=()=>{const TR=getTour();if(tourI<TR.length-1)showTour(tourI+1);else endTour()};$('tourPrev').onclick=()=>showTour(Math.max(0,tourI-1));$('tourSkip').onclick=endTour;
$('bTour').onclick=()=>{$('modal').style.display='none';showTour(0)};
if(!LS.get('mc3d_tour'))setTimeout(()=>showTour(0),1200);

// ================= BILINGUAL SWITCHING HOOK =================
function syncLangUI(){
 if(window.MC3D_I18N)MC3D_I18N.applyDOM();
 if($('dShape'))$('dShape').innerHTML=opts(SHAPES,$('dShape').value||'box','shapes');
 if($('dMat'))$('dMat').innerHTML=opts(MATS,$('dMat').value||'brick','mats');
 if($('dFn'))$('dFn').innerHTML=opts(FNS,$('dFn').value||'','fns');
 if($('citySel'))$('citySel').innerHTML=opts(CITIES,(state.site&&state.site.city)||'baghdad','cities');
 fillDesigns();
 if($('dsel')&&curName)$('dsel').value=curName;
 clStatus(clLast.t,clLast.cls,clLast.en);
 siteChanged();
 applySec();
 fillLvls();
 if(typeof openSheet==='function'&&$('shOpen'))$('shOpen').innerHTML=sheetOpen?`<i><svg class="ic"><use href="#i-cube"/></svg></i>${L('رجوع للنموذج','Back to 3D')}`:`<i><svg class="ic"><use href="#i-sheet"/></svg></i>${L('فتح اللوحة','Open Sheet')}`;
 refresh();
 if(typeof renderShadowHmSummary==='function')renderShadowHmSummary();
 if(window.MC3D_OCC_CHART&&MC3D_OCC_CHART.renderPaletteControls)MC3D_OCC_CHART.renderPaletteControls();
 if(sheetOpen)renderSheet();else sheetPanel();
 if($('tour').style.display==='flex')showTour(tourI);
 if($('modal').style.display==='flex'){
  if($('mProg').style.display!=='none')renderProg();
  if($('mNotes').style.display!=='none')renderNotes();
 }
}
window.onLangChange=syncLangUI;
if($('langBtn'))$('langBtn').onclick=()=>{if(window.MC3D_I18N)MC3D_I18N.toggle()};
if(window.MC3D_I18N)MC3D_I18N.applyDOM();

fillDesigns();fit();siteChanged();applySec();refresh();view('iso');if(firstMsg)setTimeout(()=>flash(firstMsg),600);
syncLangUI();
let lastT=0;(function loop(t){requestAnimationFrame(loop);
 if(playing&&t-lastT>60){lastT=t;state.sun.hour+=0.1;if(state.sun.hour>19.5){state.sun.hour=5.5}setSun()}
 if(spin)spinStep(t);else O.update();draw(C);labels();if(typeof pinsUpd==='function')pinsUpd()})(0);

