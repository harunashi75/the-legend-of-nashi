// DOM et Canvas minimaux : vérifie le chargement et les appels, sans simuler le rendu visuel.
const vm=require('node:vm');
module.exports=function boot(source,{beforeScript=()=>{}}={}){
const nodes=new Map(),errors=[];const noop=()=>{};
// Écouteurs d'événements retenus par cible : fire() les déclenche comme le navigateur.
const listen=function(type,fn){((this.listeners??={})[type]??=[]).push(fn)};
const context=new Proxy({measureText:t=>({width:String(t).length*6}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),createPattern:()=>({}),getImageData:()=>({data:new Uint8ClampedArray(48*48*4)})},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
function element(id=''){
 const selectors=new Map();
 const el={id,textContent:'',innerHTML:'',value:'',title:'',width:194,height:194,offsetWidth:200,offsetHeight:100,scrollTop:0,dataset:{},children:[],style:{setProperty:noop,removeProperty:noop},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
 getContext:()=>context,querySelector(selector){if(!selectors.has(selector))selectors.set(selector,element());return selectors.get(selector)},querySelectorAll:()=>[],addEventListener:listen,setAttribute:noop,getAttribute:()=>'',hasAttribute:()=>false,appendChild(n){this.children.push(n);n.parentElement=this;n.parentNode=this;return n},remove:noop,insertBefore:noop,before:noop,insertAdjacentElement:noop,getBoundingClientRect:()=>({left:0,top:0}),setPointerCapture:noop,blur:noop,focus:noop};
 el.parentElement=el;el.parentNode=el;return el;
}
const db=new Map();
let g={location:{reload(){}},document:{head:element('head'),body:element('body'),hidden:false,activeElement:null,getElementById(id){if(!nodes.has(id))nodes.set(id,element(id));return nodes.get(id)},createElement:()=>element(),querySelector:()=>element(),querySelectorAll:()=>[],addEventListener:listen},
 localStorage:{getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,v),removeItem:k=>db.delete(k)},innerWidth:1280,innerHeight:720,devicePixelRatio:1,addEventListener:(type,fn)=>listen.call(g,type,fn),requestAnimationFrame:()=>1,setInterval:()=>1,clearInterval:noop,setTimeout:()=>1,clearTimeout:noop,performance:{now:()=>0},confirm:()=>true,
 console:{info:noop,warn:noop,log:noop,error:(...a)=>errors.push(a.map(x=>x?.stack||String(x)).join(' '))}};
// Global sans intercepteurs (DONT_CONTEXTIFY) : les scripts lisent leurs variables globales à la vitesse d'un vrai
// navigateur ; un contexte « contextifié » ralentit chaque accès global (démarrage de 6 s au lieu de quelques centaines de ms).
const ctx=vm.createContext(vm.constants.DONT_CONTEXTIFY);for(const k of Object.keys(g))ctx[k]=g[k];ctx.window=ctx;g=ctx;
const scripts=[...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
for(let i=0;i<scripts.length;i++){
 beforeScript(scripts[i],code=>vm.runInContext(code,g));
 try{vm.runInContext(scripts[i][2],g,{filename:`script-${i}${scripts[i][1]}`,timeout:20000})}
 catch(e){console.log('ÉCHEC bloc',i,scripts[i][1]);throw e}
}
// Déclenche un événement sur une cible (g, g.document ou un élément) : clavier, souris, clic…
const fire=(target,type,props={})=>{const event={type,target,repeat:false,preventDefault:noop,stopPropagation:noop,...props};for(const fn of target.listeners?.[type]||[])fn(event);return event};
// Clic sur un bouton data-action (arguments en data-*), par le gestionnaire délégué du document, comme un joueur.
const click=(action,data={})=>{const button={dataset:{action,...data},disabled:false,closest(){return this}};return fire(g.document,'click',{target:button})};
return {g,nodes,errors,fire,click,run:code=>vm.runInContext(code,g)};
};
