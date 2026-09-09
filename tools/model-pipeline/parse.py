# MIT licence, (c) 2026 Imyala — Tower Lords model pipeline (local pre-pass, numpy only). Keep the credit, link back, and say what you changed.
import numpy as np, time
t=time.time()
V=np.fromfile('v.txt',sep=' ',dtype=np.float32).reshape(-1,3)
VT=np.fromfile('vt.txt',sep=' ',dtype=np.float32).reshape(-1,2)
F=np.fromfile('f.txt',sep=' ',dtype=np.int64).reshape(-1,9)
print('parsed',V.shape,VT.shape,F.shape,time.time()-t)
fv=(F[:,[0,3,6]]-1).astype(np.int32); ft=(F[:,[1,4,7]]-1).astype(np.int32)
np.save('V.npy',V); np.save('VT.npy',VT); np.save('fv.npy',fv); np.save('ft.npy',ft)
mn=V.min(0); mx=V.max(0); print('bbox',mn,mx,'size',mx-mn)
print('uv range',VT.min(0),VT.max(0))
