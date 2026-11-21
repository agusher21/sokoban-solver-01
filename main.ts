import{readFileSync as R,writeFileSync as W,mkdirSync as M}from'fs'
const L='udlrUDLR',C=1024,SN=1023 // cell base (boards here are <1024 cells), sentinel box slot
let w,Y,E
// 0-1 BFS (cost = pushes) over (boxes,player), push-optimal.
// Memory: per state only parent index + 1 move byte + 4 packed box cells + player
// cell in typed arrays; visited is a custom open-addressing table keyed by one
// exact 50-bit number (boxes packed base-1024 * 1024 + player). No move strings,
// no string keys, no per-state JS objects.
// Buffers are allocated ONCE and reused across rooms: allocating fresh typed
// arrays per room left freed pages in the allocator and RSS crept up ~300MB;
// reuse keeps peak RSS near the single biggest room's live set.
let cap=1<<21,len=0
let par=new Int32Array(cap),mov=new Uint8Array(cap)
let bx=new Uint16Array(cap*4),pl=new Uint16Array(cap)
let hc=1<<21,hm=hc-1,hs=0
let hk=new Float64Array(hc),hv=new Int32Array(hc) // hk stores key+1, 0 = empty
const pk=(a,b,c,d)=>(((a*C+b)*C+c)*C+d)
const hh=k=>Math.imul((k%4294967296)^((k/4294967296)|0),2654435761)>>>0
function grow(){
  cap*=2
  let np=new Int32Array(cap);np.set(par);par=np
  let nm=new Uint8Array(cap);nm.set(mov);mov=nm
  let nb=new Uint16Array(cap*4);nb.set(bx);bx=nb
  let nl=new Uint16Array(cap);nl.set(pl);pl=nl
}
function add(P,mv,a,b,c,d,q){
  if(len===cap)grow()
  let i=len++
  par[i]=P;mov[i]=mv
  let o=i*4;bx[o]=a;bx[o+1]=b;bx[o+2]=c;bx[o+3]=d;pl[i]=q
  return i
}
function hget(k){
  let h=hh(k)&hm
  while(hk[h]){if(hk[h]===k+1)return hv[h];h=(h+1)&hm}
  return -1
}
function hput(k,v){
  if((hs+1)*10>hc*7){
    let oh=hk,ov=hv;hc*=2;hm=hc-1
    hk=new Float64Array(hc);hv=new Int32Array(hc);hs=0
    for(let i=0;i<oh.length;i++)if(oh[i])hput(oh[i]-1,ov[i])
  }
  let h=hh(k)&hm
  while(hk[h])h=(h+1)&hm
  hk[h]=k+1;hv[h]=v;hs++
}
function path(s){
  let o=[]
  while(s>0){o.push(L[mov[s]]);s=par[s]}
  return o.reverse().join('')
}
function S(A,g,B,p){
  const n=B.length
  const gk=pk(...[...g].sort((x,y)=>x-y),...Array(4-n).fill(SN))
  len=0;hs=0;hk.fill(0)
  let sb=[...B].sort((x,y)=>x-y)
  while(sb.length<4)sb.push(SN)
  let b0=sb[0],b1=sb[1],b2=sb[2],b3=sb[3]
  let bk=pk(b0,b1,b2,b3)
  if(bk===gk){E=p;return''}
  add(-1,0,b0,b1,b2,b3,p)
  hput(bk*C+p,0)
  let Q=[[0]]
  for(let c=0;c<Q.length;c++){
    let bucket=Q[c]
    if(!bucket)continue
    for(let j=0;j<bucket.length;j++){
      let s=bucket[j],o=s*4
      let a0=bx[o],a1=bx[o+1],a2=bx[o+2],a3=bx[o+3]
      let cb=pk(a0,a1,a2,a3),q=pl[s]
      for(let i=0;i<4;i++){
        let np=q+Y[i]
        if(A[np])continue
        if(np===a0||np===a1||np===a2||np===a3){
          let t=np+Y[i]
          if(A[t]||t===a0||t===a1||t===a2||t===a3)continue
          let x=a0,y=a1,z=a2,u=a3
          if(x===np)x=t;else if(y===np)y=t;else if(z===np)z=t;else u=t
          if(x>y){let T=x;x=y;y=T}
          if(z>u){let T=z;z=u;u=T}
          if(x>z){let T=x;x=z;z=T}
          if(y>u){let T=y;y=u;u=T}
          if(y>z){let T=y;y=z;z=T}
          let nb=pk(x,y,z,u)
          if(nb===gk){let ni=add(s,i+4,x,y,z,u,np);E=np;return path(ni)}
          let nk=nb*C+np
          if(hget(nk)>=0)continue
          let ni=add(s,i+4,x,y,z,u,np)
          hput(nk,ni)
          ;(Q[c+1]??=[]).push(ni)
        }else{
          let nk=cb*C+np
          if(hget(nk)>=0)continue
          let ni=add(s,i,a0,a1,a2,a3,np)
          hput(nk,ni)
          bucket.push(ni)
        }
      }
    }
  }
  return null
}
function Z(t){
  let s=t.replace(/\n/g,'')
  w=t.indexOf('\n');Y=[-w,w,-1,1]
  let W=new Uint8Array(s.length).fill(1),G=[],B=[],p=0
  for(let i=0;i<s.length;i++){
    let h=s[i]
    if(h=='#')continue
    W[i]=0
    if('.*+'.includes(h))G.push(i)
    if('$*'.includes(h))B.push(i)
    if('@+'.includes(h))p=i
  }
  let X=[[],[],[],[]],Z2=[[],[],[],[]],R=i=>(i%w>6)*2+(i/w>(p/w|0))
  for(let b of B)X[R(b)].push(b)
  for(let g of G)Z2[R(g)].push(g)
  let m=''
  for(let i=0;i<4;i++){
    if(!X[i].length)continue
    let A=W.slice()
    for(let o of X)if(o!=X[i])for(let b of o)A[b]=1
    let q=S(A,Z2[i],X[i],p)
    if(q==null)return''
    m+=q;p=E;X[i]=Z2[i]
  }
  return m
}
for(let k=1;k<6;k++){
  let d='i00'+k
  M('/output/'+d,{recursive:true})
  W('/output/'+d+'/solution.txt',Z(R('/input/'+d+'/level.txt','utf8'))+'\n')
}
