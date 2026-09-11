import json,os,sys,subprocess
TL=sys.argv[1]
MEDIA=os.path.expanduser(sys.argv[2])
US=1000000.0
def mmss(s):
    try: s=float(s)
    except: return "  ?  "
    return "%d:%04.1f"%(int(s//60),s%60)

D=json.load(open(os.path.join(TL,"draft_info.json"),encoding="utf-8"))
tr=D.get("tracks") or []
VID={m["id"]:m for m in ((D.get("materials") or {}).get("videos") or []) if m.get("id")}
segs=[s for t in tr if t.get("type")=="video" for s in (t.get("segments") or [])]

used={}
for s in segs:
    m=VID.get(s.get("material_id")) or {}
    nm=m.get("material_name") or os.path.basename(m.get("path") or "")
    if not nm: continue
    d=(s.get("target_timerange") or {}).get("duration",0)/US
    u=used.setdefault(nm.upper(),{"n":0,"scr":0.0,"src":(m.get("duration") or 0)/US})
    u["n"]+=1; u["scr"]+=d

print("=== USO POR ARCHIVO (%d usados) ==="%len(used))
print("  archivo      fuente   cortes  en pantalla   aprovechado")
for nm,u in sorted(used.items(),key=lambda x:-x[1]["scr"]):
    pct = (100*u["scr"]/u["src"]) if u["src"] else 0
    print("  %-12s %-8s %4d   %-9s   %5.1f%%"%(nm,mmss(u["src"]),u["n"],mmss(u["scr"]),pct))
print("")

def meta(p):
    try:
        out=subprocess.run(["mdls","-name","kMDItemContentCreationDate",
                            "-name","kMDItemFSCreationDate",
                            "-name","kMDItemDurationSeconds",p],
                           capture_output=True,text=True,timeout=20).stdout
    except Exception:
        return None,None
    dur=None; cre=None
    for L in out.splitlines():
        if "=" not in L: continue
        k,v=L.split("=",1); k=k.strip(); v=v.strip()
        if v in ("(null)",""): continue
        if k=="kMDItemDurationSeconds":
            try: dur=float(v)
            except: pass
        elif k in ("kMDItemContentCreationDate","kMDItemFSCreationDate") and cre is None:
            cre=v
    return dur,cre

files=sorted(f for f in os.listdir(MEDIA) if f.lower().endswith((".mp4",".mov",".m4v",".mts")))
rec=[]
for f in files:
    d,c=meta(os.path.join(MEDIA,f))
    rec.append((c or "zzzz",f,d))
rec.sort()
print("=== CRONOLOGIA REAL (%d archivos, por hora de grabacion) ==="%len(rec))
print("  hora                  archivo      dur      estado")
tu=ts=0.0
for c,f,d in rec:
    st="USADO" if f.upper() in used else "-"
    if d:
        ts+=d
        if st=="USADO": tu+=d
    print("  %-20s  %-12s %-8s %s"%(str(c)[:19],f,mmss(d) if d else "?",st))
print("")
print("  material total: %s   en archivos usados: %s"%(mmss(ts),mmss(tu)))
print("FIN")
