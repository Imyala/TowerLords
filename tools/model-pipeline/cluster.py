# MIT licence, (c) 2026 Imyala — Tower Lords model pipeline (local pre-pass, numpy only). Keep the credit, link back, and say what you changed.
import numpy as np, time, sys
V=np.load('V.npy'); VT=np.load('VT.npy'); fv=np.load('fv.npy'); ft=np.load('ft.npy')
mn=V.min(0)
def run(h, save=False):
    cell=np.floor((V-mn)/h).astype(np.int64)
    key=(cell[:,0]*100003+cell[:,1])*100003+cell[:,2]
    uk,inv=np.unique(key,return_inverse=True)
    n=len(uk); C=np.zeros((n,3),np.float64); cnt=np.bincount(inv,minlength=n)
    for k in range(3): C[:,k]=np.bincount(inv,weights=V[:,k],minlength=n)/cnt
    f=inv[fv]
    ok=(f[:,0]!=f[:,1])&(f[:,1]!=f[:,2])&(f[:,0]!=f[:,2])
    f=f[ok]; t=ft[ok]
    # drop duplicate faces (same sorted triple)
    s=np.sort(f,1); sk=(s[:,0].astype(np.int64)*n+s[:,1])*n+s[:,2]
    _,first=np.unique(sk,return_index=True); f=f[first]; t=t[first]
    print('h',h,'verts',n,'faces',len(f))
    if save:
        uv=VT[t]  # (F,3,2)
        np.savez_compressed('gob_clustered.npz', V=C.astype(np.float32), F=f.astype(np.int32), UV=(np.clip(uv,0,1)*65535+.5).astype(np.uint16))
    return len(f)
for h in [float(a) for a in sys.argv[1:]]: run(h, save=len(sys.argv)==2)
