// MIT licence, (c) 2026 Imyala — Tower Lords model pipeline. Keep the credit, link back, and say what you changed.
// Quadric edge-collapse decimation (Garland–Heckbert) with boundary preservation and fold-over rejection.
// Input : binary file  int32 nv, int32 nf, float64 verts[nv*3], int32 faces[nf*3]
// Output: same layout with the surviving mesh.
// Usage : qem in.bin out.bin target_faces
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

typedef struct { double q[10]; } Quad;            // symmetric 4x4: [a2 ab ac ad b2 bc bd c2 cd d2]
typedef struct { int *f; int n, cap; } IList;
typedef struct { double cost; int v1, v2, ver1, ver2; double p[3]; } Edge;

static int nv, nf; static double *V; static int *F; static char *fAlive, *vAlive; static int *vVer;
static Quad *Q; static IList *adj;
static Edge *heap; static int hn = 0, hcap = 0;

static void il_add(IList *l, int x){ if(l->n==l->cap){ l->cap=l->cap?l->cap*2:8; l->f=realloc(l->f,sizeof(int)*l->cap);} l->f[l->n++]=x; }
static void il_del(IList *l, int x){ for(int i=0;i<l->n;i++) if(l->f[i]==x){ l->f[i]=l->f[--l->n]; return; } }
static void qadd(Quad *a, const Quad *b){ for(int i=0;i<10;i++) a->q[i]+=b->q[i]; }
static void qplane(Quad *a, double n0,double n1,double n2,double d,double w){
  double p[4]={n0,n1,n2,d}; int k=0; for(int i=0;i<4;i++) for(int j=i;j<4;j++) a->q[k++]+=w*p[i]*p[j]; }
static double qeval(const Quad *a, const double *p){ const double *q=a->q; double x=p[0],y=p[1],z=p[2];
  return q[0]*x*x+2*q[1]*x*y+2*q[2]*x*z+2*q[3]*x+q[4]*y*y+2*q[5]*y*z+2*q[6]*y+q[7]*z*z+2*q[8]*z+q[9]; }
static int qsolve(const Quad *a, double *out){ const double *q=a->q;
  double A[3][3]={{q[0],q[1],q[2]},{q[1],q[4],q[5]},{q[2],q[5],q[7]}}; double b[3]={-q[3],-q[6],-q[8]};
  double det=A[0][0]*(A[1][1]*A[2][2]-A[1][2]*A[2][1])-A[0][1]*(A[1][0]*A[2][2]-A[1][2]*A[2][0])+A[0][2]*(A[1][0]*A[2][1]-A[1][1]*A[2][0]);
  double tr=fabs(A[0][0])+fabs(A[1][1])+fabs(A[2][2]); if(fabs(det)<1e-9*tr*tr*tr+1e-30) return 0;
  double inv[3][3]; inv[0][0]=(A[1][1]*A[2][2]-A[1][2]*A[2][1])/det; inv[0][1]=(A[0][2]*A[2][1]-A[0][1]*A[2][2])/det; inv[0][2]=(A[0][1]*A[1][2]-A[0][2]*A[1][1])/det;
  inv[1][0]=(A[1][2]*A[2][0]-A[1][0]*A[2][2])/det; inv[1][1]=(A[0][0]*A[2][2]-A[0][2]*A[2][0])/det; inv[1][2]=(A[0][2]*A[1][0]-A[0][0]*A[1][2])/det;
  inv[2][0]=(A[1][0]*A[2][1]-A[1][1]*A[2][0])/det; inv[2][1]=(A[0][1]*A[2][0]-A[0][0]*A[2][1])/det; inv[2][2]=(A[0][0]*A[1][1]-A[0][1]*A[1][0])/det;
  for(int i=0;i<3;i++) out[i]=inv[i][0]*b[0]+inv[i][1]*b[1]+inv[i][2]*b[2]; return 1; }

static void hpush(Edge e){ if(hn==hcap){ hcap=hcap?hcap*2:1<<20; heap=realloc(heap,sizeof(Edge)*hcap);} int i=hn++; heap[i]=e;
  while(i>0){ int p=(i-1)/2; if(heap[p].cost<=heap[i].cost) break; Edge t=heap[p]; heap[p]=heap[i]; heap[i]=t; i=p; } }
static Edge hpop(void){ Edge r=heap[0]; heap[0]=heap[--hn]; int i=0;
  for(;;){ int l=2*i+1, rr=l+1, m=i; if(l<hn&&heap[l].cost<heap[m].cost) m=l; if(rr<hn&&heap[rr].cost<heap[m].cost) m=rr; if(m==i) break; Edge t=heap[m]; heap[m]=heap[i]; heap[i]=t; i=m; } return r; }

static void fnormal(int fi, const double *override, int ov, double *n){ // normal of face fi with vertex ov moved to override
  double p[3][3]; for(int k=0;k<3;k++){ int v=F[fi*3+k]; const double *s=(v==ov&&override)?override:&V[v*3]; p[k][0]=s[0];p[k][1]=s[1];p[k][2]=s[2]; }
  double a[3]={p[1][0]-p[0][0],p[1][1]-p[0][1],p[1][2]-p[0][2]}, b[3]={p[2][0]-p[0][0],p[2][1]-p[0][1],p[2][2]-p[0][2]};
  n[0]=a[1]*b[2]-a[2]*b[1]; n[1]=a[2]*b[0]-a[0]*b[2]; n[2]=a[0]*b[1]-a[1]*b[0]; }

static void make_edge(int v1, int v2){ if(v1==v2) return; if(v1>v2){int t=v1;v1=v2;v2=t;} Quad s=Q[v1]; qadd(&s,&Q[v2]);
  Edge e; e.v1=v1; e.v2=v2; e.ver1=vVer[v1]; e.ver2=vVer[v2]; double best[3]; double c;
  if(qsolve(&s,best)){ c=qeval(&s,best);
    // guard against wild solutions: keep within 2x the edge length of the midpoint
    double mx=(V[v1*3]+V[v2*3])/2,my=(V[v1*3+1]+V[v2*3+1])/2,mz=(V[v1*3+2]+V[v2*3+2])/2;
    double el=sqrt(pow(V[v1*3]-V[v2*3],2)+pow(V[v1*3+1]-V[v2*3+1],2)+pow(V[v1*3+2]-V[v2*3+2],2));
    if(sqrt(pow(best[0]-mx,2)+pow(best[1]-my,2)+pow(best[2]-mz,2))>2*el+1e-9){ best[0]=mx;best[1]=my;best[2]=mz; c=qeval(&s,best); } }
  else { double m[3]={(V[v1*3]+V[v2*3])/2,(V[v1*3+1]+V[v2*3+1])/2,(V[v1*3+2]+V[v2*3+2])/2}; c=qeval(&s,m); memcpy(best,m,sizeof m);
    double c1=qeval(&s,&V[v1*3]), c2=qeval(&s,&V[v2*3]); if(c1<c){c=c1;memcpy(best,&V[v1*3],sizeof m);} if(c2<c){c=c2;memcpy(best,&V[v2*3],sizeof m);} }
  e.cost=c<0?0:c; memcpy(e.p,best,sizeof best); hpush(e); }

static int cmp64(const void*a,const void*b){ unsigned long long x=*(unsigned long long*)a,y=*(unsigned long long*)b; return x<y?-1:x>y; }

int main(int argc,char**argv){ if(argc<4){fprintf(stderr,"usage\n");return 1;}
  FILE*fi=fopen(argv[1],"rb"); fread(&nv,4,1,fi); fread(&nf,4,1,fi); V=malloc(sizeof(double)*3*nv); F=malloc(sizeof(int)*3*nf);
  fread(V,sizeof(double),3*nv,fi); fread(F,sizeof(int),3*nf,fi); fclose(fi); int target=atoi(argv[3]);
  fAlive=calloc(nf,1); vAlive=calloc(nv,1); vVer=calloc(nv,sizeof(int)); Q=calloc(nv,sizeof(Quad)); adj=calloc(nv,sizeof(IList));
  memset(fAlive,1,nf); memset(vAlive,1,nv);
  // face quadrics (area-weighted planes) and adjacency
  for(int f=0;f<nf;f++){ double n[3]; fnormal(f,NULL,-1,n); double a=sqrt(n[0]*n[0]+n[1]*n[1]+n[2]*n[2]); if(a<1e-18){fAlive[f]=0;continue;}
    n[0]/=a;n[1]/=a;n[2]/=a; const double*p=&V[F[f*3]*3]; double d=-(n[0]*p[0]+n[1]*p[1]+n[2]*p[2]);
    for(int k=0;k<3;k++){ qplane(&Q[F[f*3+k]],n[0],n[1],n[2],d,a); il_add(&adj[F[f*3+k]],f); } }
  // boundary edges: perpendicular constraint planes
  unsigned long long *ek=malloc(sizeof(unsigned long long)*3*nf); int ne=0;
  for(int f=0;f<nf;f++){ if(!fAlive[f])continue; for(int k=0;k<3;k++){ int a=F[f*3+k],b=F[f*3+(k+1)%3]; if(a>b){int t=a;a=b;b=t;} ek[ne++]=((unsigned long long)a<<32)|(unsigned)b; } }
  qsort(ek,ne,8,cmp64); int nb=0;
  for(int i=0;i<ne;){ int j=i; while(j<ne&&ek[j]==ek[i]) j++; if(j-i==1){ int a=(int)(ek[i]>>32), b=(int)(ek[i]&0xffffffffu); nb++;
      // find the one face with this edge to get its normal
      for(int t=0;t<adj[a].n;t++){ int f=adj[a].f[t]; int has=0; for(int k=0;k<3;k++) if(F[f*3+k]==b) has=1; if(!has) continue;
        double n[3]; fnormal(f,NULL,-1,n); double e[3]={V[b*3]-V[a*3],V[b*3+1]-V[a*3+1],V[b*3+2]-V[a*3+2]};
        double c[3]={n[1]*e[2]-n[2]*e[1],n[2]*e[0]-n[0]*e[2],n[0]*e[1]-n[1]*e[0]}; double l=sqrt(c[0]*c[0]+c[1]*c[1]+c[2]*c[2]); if(l<1e-18) break;
        c[0]/=l;c[1]/=l;c[2]/=l; double d=-(c[0]*V[a*3]+c[1]*V[a*3+1]+c[2]*V[a*3+2]); double w=sqrt(e[0]*e[0]+e[1]*e[1]+e[2]*e[2])*50.0;
        qplane(&Q[a],c[0],c[1],c[2],d,w); qplane(&Q[b],c[0],c[1],c[2],d,w); break; } }
    i=j; }
  fprintf(stderr,"faces %d verts %d boundary edges %d\n",nf,nv,nb);
  for(int i=0;i<ne;){ int j=i; while(j<ne&&ek[j]==ek[i]) j++; make_edge((int)(ek[i]>>32),(int)(ek[i]&0xffffffffu)); i=j; } free(ek);
  int alive=0; for(int f=0;f<nf;f++) alive+=fAlive[f];
  long rejected=0;
  while(alive>target && hn>0){ Edge e=hpop(); int v1=e.v1,v2=e.v2;
    if(!vAlive[v1]||!vAlive[v2]||vVer[v1]!=e.ver1||vVer[v2]!=e.ver2) continue;
    // fold-over check on every face touching v1 or v2 that survives the collapse
    int bad=0;
    for(int side=0;side<2&&!bad;side++){ int v=side?v2:v1; for(int t=0;t<adj[v].n;t++){ int f=adj[v].f[t]; int hasOther=0; for(int k=0;k<3;k++) if(F[f*3+k]==(side?v1:v2)) hasOther=1; if(hasOther) continue;
        double n0[3],n1[3]; fnormal(f,NULL,-1,n0); fnormal(f,e.p,v,n1); double l0=sqrt(n0[0]*n0[0]+n0[1]*n0[1]+n0[2]*n0[2]), l1=sqrt(n1[0]*n1[0]+n1[1]*n1[1]+n1[2]*n1[2]);
        if(l1<1e-14*(1+l0)||(n0[0]*n1[0]+n0[1]*n1[1]+n0[2]*n1[2])<0.2*l0*l1){ bad=1; break; } } }
    if(bad){ rejected++; continue; }
    // collapse v2 -> v1
    V[v1*3]=e.p[0];V[v1*3+1]=e.p[1];V[v1*3+2]=e.p[2]; qadd(&Q[v1],&Q[v2]);
    for(int t=0;t<adj[v2].n;t++){ int f=adj[v2].f[t]; int hasV1=0; for(int k=0;k<3;k++) if(F[f*3+k]==v1) hasV1=1;
      if(hasV1){ fAlive[f]=0; alive--; for(int k=0;k<3;k++){ int o=F[f*3+k]; if(o!=v2) il_del(&adj[o],f); } }
      else { for(int k=0;k<3;k++) if(F[f*3+k]==v2) F[f*3+k]=v1; il_add(&adj[v1],f); } }
    adj[v2].n=0; vAlive[v2]=0; vVer[v1]++;
    // re-evaluate edges around v1 (dedupe by marking)
    for(int t=0;t<adj[v1].n;t++){ int f=adj[v1].f[t]; for(int k=0;k<3;k++){ int o=F[f*3+k]; if(o==v1) continue; int seen=0;
        for(int t2=0;t2<t&&!seen;t2++){ int f2=adj[v1].f[t2]; for(int k2=0;k2<3;k2++) if(F[f2*3+k2]==o) seen=1; } if(!seen) make_edge(v1,o); } } }
  fprintf(stderr,"done: faces %d rejected %ld heap %d\n",alive,rejected,hn);
  // compact
  int *remap=malloc(sizeof(int)*nv); int nv2=0; for(int v=0;v<nv;v++) remap[v]=-1;
  for(int f=0;f<nf;f++) if(fAlive[f]) for(int k=0;k<3;k++){ int v=F[f*3+k]; if(remap[v]<0) remap[v]=nv2++; }
  FILE*fo=fopen(argv[2],"wb"); fwrite(&nv2,4,1,fo); fwrite(&alive,4,1,fo);
  double *V2=malloc(sizeof(double)*3*nv2); for(int v=0;v<nv;v++) if(remap[v]>=0) memcpy(&V2[remap[v]*3],&V[v*3],sizeof(double)*3);
  fwrite(V2,sizeof(double),3*nv2,fo); for(int f=0;f<nf;f++) if(fAlive[f]){ int t[3]={remap[F[f*3]],remap[F[f*3+1]],remap[F[f*3+2]]}; fwrite(t,4,3,fo); } fclose(fo);
  return 0; }
