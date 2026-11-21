import{readFileSync as a,writeFileSync as b,mkdirSync as c}from'fs'
let w,W,G,Y,L='udlrUDLR',EP
function P(t){
let s=t.replace(/\n/g,''),n=s.length
w=t.indexOf('\n');Y=[-w,w,-1,1]
W=new Uint8Array(n).fill(1);G=[];let B=[],p=0
for(let i=0;i<n;i++){let ch=s[i];if(ch=='#')continue;W[i]=0;if('.*+'.includes(ch))G.push(i);if('$*'.includes(ch))B.push(i);if('@+'.includes(ch))p=i}
return{W,G,B,p}
}
function S(wall,goals,boxes,player){
W=wall;G=goals
let done=b=>b+''==G+''
if(done(boxes)){EP=player;return''}
let B=[[[boxes,player,'']]],V=new Set([player+','+boxes])
for(let c=0;c<B.length;c++)for(let st of B[c]||[]){
let[bs,pl,mv]=st
for(let d=0;d<4;d++){let np=pl+Y[d]
if(W[np])continue
if(bs.includes(np)){let t=np+Y[d]
if(W[t]||bs.includes(t))continue
let n=bs.slice();n[n.indexOf(np)]=t;n.sort((x,y)=>x-y);let k=np+','+n
if(V.has(k))continue
V.add(k)
let mv2=mv+L[d+4]
if(done(n)){EP=np;return mv2}
;(B[c+1]??=[]).push([n,np,mv2])}
else{let k=np+','+bs
if(V.has(k))continue
V.add(k)
;(B[c]??=[]).push([bs,np,mv+L[d]])}}}
return null
}
function solve(t){
let lv=P(t),B2=[[],[],[],[]],G2=[[],[],[],[]],H=lv.p/w|0
let ri=i=>(i%w>6)*2+(i/w>H)
for(let b of lv.B)B2[ri(b)].push(b)
for(let g of lv.G)G2[ri(g)].push(g)
let pl=lv.p,m=''
for(let i=0;i<4;i++){
if(!B2[i].length)continue
let wall=lv.W.slice()
for(let j=0;j<4;j++)if(j!=i)for(let b of B2[j])wall[b]=1
let s=S(wall,G2[i],B2[i],pl)
if(s==null)return''
m+=s;pl=EP;B2[i]=G2[i]}
return m
}
for(let k=1;k<6;k++){let d='i00'+k;c('/output/'+d,{recursive:true});b('/output/'+d+'/solution.txt',solve(a('/input/'+d+'/level.txt','utf8'))+'\n')}
