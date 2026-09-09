# MIT licence, (c) 2026 Imyala — Tower Lords model pipeline (local pre-pass, numpy only). Keep the credit, link back, and say what you changed.
import numpy as np
from PIL import Image
V=np.load('V.npy'); VT=np.load('VT.npy'); fv=np.load('fv.npy'); ft=np.load('ft.npy')
tex=np.asarray(Image.open('Meshy_AI_Dagger_Eared_Goblin_0909211815_texture_obj/Meshy_AI_Dagger_Eared_Goblin_0909211815_texture.png').convert('RGB'))
H,W,_=tex.shape
def sample(uv):
    x=np.clip((uv[:,0]*W).astype(np.int64),0,W-1); y=np.clip(((1-uv[:,1])*H).astype(np.int64),0,H-1)
    return tex[y,x]
# per-vertex: first corner's uv
u,first=np.unique(fv.ravel(),return_index=True)
vuv=np.zeros((len(V),2),np.float32); vuv[u]=VT[ft.ravel()[first]]
vcol=sample(vuv)
# per-face centroid samples (every face) with averaged corner uv -> uv of centroid inside the face
cuv=VT[ft].mean(1); cpos=V[fv].mean(1).astype(np.float32); ccol=sample(cuv)
P=np.concatenate([V,cpos]); C=np.concatenate([vcol,ccol])
print(P.shape,C.shape)
np.savez_compressed('gob_points.npz',P=P,C=C)
