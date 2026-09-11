import json,os,sys,shutil,datetime
TL=sys.argv[1]
MEDIA=sys.argv[2] if len(sys.argv)>2 and sys.argv[2] not in ("-","bk") else None
DO_BK = "bk" in sys.argv[2:]
US=1000000.0
def tc(u):
    try: u=float(u)
    except: return "?"
    s=u/US; m=int(s//60); return "%d:%05.2f"%(m,s-m*60)
def g(d,*ks,**kw):
    for k in ks:
        if isinstance(d,dict) and k in d and d[k] is not None: return d[k]
    return kw.get("dflt")

if DO_BK:
    PROJ=os.path.dirname(os.path.dirname(TL.rstrip("/")))
    ts=datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    dst=os.path.expanduser("~/Desktop/BACKUP_boda_adrian_%s"%ts)
    print("=== RESPALDO ===")
    print("  origen : %s"%PROJ)
    tot=0; nf=0
    for root,dirs,files in os.walk(PROJ):
        for f in files:
            fp=os.path.join(root,f)
            try: tot+=os.path.getsize(fp); nf+=1
            except OSError: pass
    print("  proyecto: %d archivos, %.1f MB"%(nf,tot/1048576.0))
    LIGHT = tot > 600*1048576
    KEEP=(".json",".extra",".bak",".txt",".plist")
    copied=0; skipped=0
    for root,dirs,files in os.walk(PROJ):
        rel=os.path.relpath(root,PROJ)
        out=dst if rel=="." else os.path.join(dst,rel)
        for f in files:
            src=os.path.join(root,f)
            if LIGHT and not f.lower().endswith(KEEP):
                skipped+=1; continue
            try:
                os.makedirs(out,exist_ok=True)
                shutil.copy2(src,os.path.join(out,f)); copied+=1
            except Exception:
                skipped+=1
    try:
        shutil.copy2(os.path.join(TL,"draft_info.json"),
                     os.path.expanduser("~/Desktop/draft_info_ORIGINAL_%s.json"%ts))
    except Exception as e:
        print("  aviso: no se pudo copiar el draft_info suelto: %s"%e)
    print("  copia  : %s"%dst)
    print("  modo   : %s"%("SOLO ESTRUCTURA (json) - proyecto muy grande" if LIGHT else "COMPLETO"))
    print("  copiados: %d   omitidos: %d"%(copied,skipped))
    print("  copia suelta de la timeline: ~/Desktop/draft_info_ORIGINAL_%s.json"%ts)
    print("")

p=os.path.join(TL,"draft_info.json")
D=json.load(open(p,encoding="utf-8"))
tr=g(D,"tracks","track",dflt=[]) or []
mats=g(D,"materials",dflt={}) or {}
cc=g(D,"canvas_config",dflt={}) or {}

def idx(key):
    out={}
    for m in (mats.get(key) or []):
        if isinstance(m,dict) and m.get("id"): out[m["id"]]=m
    return out
VID=idx("videos"); AUD=idx("audios"); TRN=idx("transitions")
SPD=idx("speeds"); TXT=idx("texts"); ADJ=idx("video_effects"); FLT=idx("filters")
ADJUST=idx("adjusts") or idx("adjust")

print("=== PROYECTO ===")
print("  archivo   : draft_info.json  (%d bytes)"%os.path.getsize(p))
print("  duracion  : %s"%tc(g(D,"duration",dflt=0)))
print("  fps       : %s"%g(D,"fps"))
print("  lienzo    : %sx%s  %s"%(cc.get("width"),cc.get("height"),cc.get("ratio")))
print("  materials : %s"%", ".join("%s=%d"%(k,len(v)) for k,v in sorted(mats.items()) if isinstance(v,list) and v))
print("")
print("=== TRACKS ===")
for i,t in enumerate(tr):
    print("  %d. tipo=%-8s segmentos=%3d  flag=%s"%(i,t.get("type","?"),len(t.get("segments") or []),t.get("flag","")))
print("")

vtracks=[t for t in tr if t.get("type")=="video"]
main = max(vtracks,key=lambda t:len(t.get("segments") or [])) if vtracks else None
segs=sorted((main.get("segments") or []),key=lambda s:g(s,"target_timerange",dflt={}).get("start",0)) if main else []

def srcname(s):
    m=VID.get(s.get("material_id")) or {}
    nm=g(m,"material_name","name",dflt=None)
    if not nm:
        pth=g(m,"path","remote_url",dflt="") or ""
        nm=os.path.basename(pth)
    return (nm or "?"), (g(m,"type",dflt="?")), g(m,"duration",dflt=0)

print("=== CLIPS DE VIDEO (%d) ==="%len(segs))
print("  #   inicio    dur      in-pt    vel   trans  archivo")
use={}
rows=[]
for i,s in enumerate(segs,1):
    tt=g(s,"target_timerange",dflt={}) or {}
    st=g(s,"source_timerange",dflt={}) or {}
    nm,ty,sdur=srcname(s)
    use[nm]=use.get(nm,0)+1
    sp=g(s,"speed",dflt=None)
    if sp is None:
        for r in (s.get("extra_material_refs") or []):
            if r in SPD: sp=g(SPD[r],"speed",dflt=1.0)
    trn=""
    for r in (s.get("extra_material_refs") or []):
        if r in TRN: trn=(g(TRN[r],"name",dflt="T") or "T")[:6]
    d=tt.get("duration",0)
    rows.append((i,tt.get("start",0),d,st.get("start",0),sp,nm,ty,sdur))
    print("  %-3d %-9s %-8s %-8s %-5s %-6s %s"%(i,tc(tt.get("start",0)),tc(d),tc(st.get("start",0)),
          ("%.2f"%sp if isinstance(sp,(int,float)) else "-"),(trn or "-"),nm[:48]))
print("")

others=[t for t in vtracks if t is not main]
if others:
    print("=== OTRAS PISTAS DE VIDEO / OVERLAYS ===")
    for t in others:
        for s in (t.get("segments") or []):
            tt=g(s,"target_timerange",dflt={}) or {}
            nm,ty,_=srcname(s)
            print("  %-9s %-8s %-10s %s"%(tc(tt.get("start",0)),tc(tt.get("duration",0)),ty,nm[:48]))
    print("")

atr=[t for t in tr if t.get("type")=="audio"]
if atr:
    print("=== AUDIO ===")
    for t in atr:
        for s in (t.get("segments") or []):
            tt=g(s,"target_timerange",dflt={}) or {}
            st=g(s,"source_timerange",dflt={}) or {}
            m=AUD.get(s.get("material_id")) or {}
            nm=g(m,"material_name","name",dflt=None) or os.path.basename(g(m,"path",dflt="") or "")
            print("  %-9s %-8s in=%-8s vol=%-5s %s"%(tc(tt.get("start",0)),tc(tt.get("duration",0)),
                  tc(st.get("start",0)),g(s,"volume",dflt="-"),(nm or "?")[:48]))
    print("")

ttr=[t for t in tr if t.get("type")=="text"]
if ttr:
    print("=== TEXTOS ===")
    for t in ttr:
        for s in (t.get("segments") or []):
            tt=g(s,"target_timerange",dflt={}) or {}
            m=TXT.get(s.get("material_id")) or {}
            raw=g(m,"content",dflt="") or ""
            try:
                j=json.loads(raw); raw=j.get("text",raw)
            except Exception: pass
            print("  %-9s %-8s %s"%(tc(tt.get("start",0)),tc(tt.get("duration",0)),str(raw).replace("\n"," ")[:60]))
    print("")

print("=== RITMO ===")
if rows:
    ds=sorted(r[2] for r in rows)
    n=len(ds)
    print("  clips: %d   total: %s"%(n,tc(sum(ds))))
    print("  duracion media: %s   mediana: %s   min: %s   max: %s"%(
        tc(sum(ds)/n),tc(ds[n//2]),tc(ds[0]),tc(ds[-1])))
    lon=[r for r in rows if r[2]>=6*US]
    print("  clips >= 6s (%d): %s"%(len(lon),", ".join("#%d %s"%(r[0],tc(r[2])) for r in lon) or "-"))
    cor=[r for r in rows if r[2]<0.6*US]
    print("  clips < 0.6s (%d): %s"%(len(cor),", ".join("#%d %s"%(r[0],tc(r[2])) for r in cor) or "-"))
    ntr=sum(1 for s in segs for r in (s.get("extra_material_refs") or []) if r in TRN)
    print("  transiciones: %d"%ntr)
print("")
print("=== REDUNDANCIA (mismo archivo usado varias veces) ===")
rep=[(k,v) for k,v in sorted(use.items(),key=lambda x:-x[1]) if v>1]
for k,v in rep: print("  %dx  %s"%(v,k[:60]))
if not rep: print("  ninguno")
print("")
if MEDIA and os.path.isdir(os.path.expanduser(MEDIA)):
    MEDIA=os.path.expanduser(MEDIA)
    disk=sorted(f for f in os.listdir(MEDIA) if f.lower().endswith((".mp4",".mov",".m4v",".avi",".mts")))
    used={k.lower() for k in use}
    for m in VID.values():
        b=os.path.basename(g(m,"path",dflt="") or "")
        if b: used.add(b.lower())
    unused=[f for f in disk if f.lower() not in used]
    print("=== MATERIAL EN %s ==="%MEDIA)
    print("  archivos en disco: %d   usados en la edicion: %d   SIN USAR: %d"%(
        len(disk),len(disk)-len(unused),len(unused)))
    print("  --- sin usar ---")
    line=[]
    for f in unused:
        line.append(f)
        if len(line)==8: print("   "+" ".join(line)); line=[]
    if line: print("   "+" ".join(line))
    falt=[k for k in use if k.lower() not in {d.lower() for d in disk}]
    if falt:
        print("  --- usados en la edicion pero NO en esa carpeta ---")
        for f in falt: print("   %s"%f[:60])
    print("")

print("=== CONTINUIDAD (huecos / solapes en la pista principal) ===")
prev=None; bad=0
for r in rows:
    st=r[1]
    if prev is not None and st!=prev:
        bad+=1
        print("  entre #%d y #%d : %s de %s"%(r[0]-1,r[0],"HUECO" if st>prev else "SOLAPE",tc(abs(st-prev))))
    prev=r[1]+r[2]
if not bad: print("  sin huecos ni solapes")
print("")
print("FIN")
