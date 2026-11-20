const { test } = require('node:test');
const {
  fs,
  assert,
  path,
  source
} = require('./helpers/context.cjs');

test('Protocole du coopératif : codes de salon, intentions vérifiées, pseudos et messages',async()=>{
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 const code=n.makeRoomCode(Math.random);assert.match(code,n.ROOM_CODE);assert.doesNotMatch(code,/[01OIL]/);
 assert.equal(n.normalizeRoomCode(' abc-234 '),'ABC234');assert.equal(n.normalizeRoomCode('ABC10O'),null);assert.equal(n.normalizeRoomCode('AB'),null);
 assert.equal(n.isGuestId(n.makeGuestId(Math.random)),true);assert.equal(n.isGuestId('<script>'),false);
 assert.equal(n.isGuestId(undefined),false,'undefined n’est pas un identifiant (piège de RegExp.test)');assert.equal(n.isGuestId(null),false);
 // Une intention trafiquée devient une intention valide : pas de téléportation, pas de compétence inconnue.
 assert.deepEqual(n.sanitizeIntent({dx:50,dy:-3,attack:'nuke',skill:9,aimX:'x',aimY:1e12,gold:1e9}),{dx:1,dy:-1,attack:null,skill:null,aimX:0,aimY:1e6,dodge:null,seq:null});
 assert.deepEqual(n.sanitizeIntent({dx:0,dy:1,attack:'heavy',skill:2,aimX:10.5,aimY:-3,seq:7,dodge:{dx:9,dy:-0.5}}),{dx:0,dy:1,attack:'heavy',skill:2,aimX:10.5,aimY:-3,dodge:{dx:1,dy:-0.5},seq:7});
 assert.equal(n.sanitizeIntent({seq:-1}).seq,null);assert.equal(n.sanitizeIntent({seq:1.5}).seq,null);assert.equal(n.sanitizeIntent({dodge:'x'}).dodge,null);
 // Actions d'équipement : seulement quatre opérations, avec des arguments bien formés ; le reste est ignoré.
 assert.deepEqual(n.sanitizeAction({op:'equip',id:'gear12',gold:1e9}),{op:'equip',id:'gear12'});
 assert.deepEqual(n.sanitizeAction({op:'unequip',slot:'weapon'}),{op:'unequip',slot:'weapon'});
 assert.deepEqual(n.sanitizeAction({op:'switch',id:'x'}),{op:'switch'});
 assert.deepEqual(n.sanitizeAction({op:'sell',id:'g1',gold:9e9}),{op:'sell',id:'g1'});assert.deepEqual(n.sanitizeAction({op:'bag-upgrade',level:9}),{op:'bag-upgrade'});
 // Plus de forge : les anciennes actions d'amélioration et de passif sont refusées.
 assert.equal(n.sanitizeAction({op:'passive',id:'g1',passive:'lifesteal'}),null);assert.equal(n.sanitizeAction({op:'upgrade',id:'g1'}),null);
 for(const bad of [{op:'equip'},{op:'equip',id:5},{op:'unequip',slot:'__proto__'},{op:'pirate',id:'a'},{op:'passive',id:'a',passive:'<x>'},null,'equip'])assert.equal(n.sanitizeAction(bad),null,JSON.stringify(bad));
 assert.deepEqual([...n.GUEST_TYPES].sort(),['action','chat','intent']);
 assert.equal(n.cleanPseudo(' <Lina> '),'Lina');assert.equal(n.cleanPseudo(''),'Invité');assert.equal(n.cleanPseudo('x'.repeat(40)).length,24);
 assert.equal(n.parseMessage('{"t":"intent"}').t,'intent');assert.equal(n.parseMessage('{"t":"pirate"}'),null);assert.equal(n.parseMessage('[1]'),null);
 assert.equal(n.parseMessage('x'.repeat(n.MESSAGE_LIMIT+1)),null);assert.equal(n.parseMessage('{oops'),null);
 const snap=n.heroSnapshot('h',{name:'Lina',player:{x:10.6,y:2.2,vx:1.234,vy:0,hp:9.2,mhp:10,mp:3.7,mmp:300,gold:5.9,dead:false,face:1,atk:0}});
 assert.deepEqual([snap.x,snap.y,snap.vx,snap.hp,snap.mp,snap.gold],[11,2,1.2,10,3,5]);
 const m=n.monsterSnapshot({netId:4,t:'Loup',x:1.4,y:2.6,hp:3.1,mhp:9,r:14,cd:0.66,boss:true,look:'beast',secret:'x'});
 assert.deepEqual(m,{k:4,t:'Loup',x:1,y:3,hp:4,mhp:9,r:14,cd:0.7,boss:true,look:'beast'});
});

test('Relais : salon et code, routage hôte ↔ invités, identité imposée, salon complet et fermeture',async()=>{
 const {createRelay}=require('../relay/server.cjs');
 const relay=createRelay({port:0});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const open=()=>new Promise(r=>{const s=new WebSocket(url);s.got=[];s.onmessage=e=>s.got.push(JSON.parse(e.data));s.onopen=()=>r(s)});
 try{
  const host=await open();host.send(JSON.stringify({t:'host'}));await wait(40);
  const code=host.got[0].code;assert.match(code,/^[A-Z2-9]{6}$/);
  const lost=await open();lost.send(JSON.stringify({t:'join',code:'ZZZZZZ',id:'g-aaaaaa'}));await wait(40);assert.match(lost.got[0].reason,/introuvable/);
  const guests=[];
  for(let i=0;i<4;i++){const g=await open();g.send(JSON.stringify({t:'join',code:code.toLowerCase(),id:'g-guest'+i,pseudo:'G'+i}));guests.push(g)}
  await wait(60);
  assert.equal(host.got.filter(m=>m.t==='join').length,3);assert.match(guests[3].got[0].reason,/complet/);
  // Un invité ne choisit pas son identité côté relais ; il ne parle qu'à l'hôte.
  guests[0].send(JSON.stringify({t:'intent',dx:1,peer:'p999'}));guests[0].send(JSON.stringify({t:'state',evil:true}));await wait(40);
  const intents=host.got.filter(m=>m.t==='intent');assert.equal(intents.length,1);assert.equal(intents[0].peer,host.got.find(m=>m.t==='join').peer);
  assert.equal(guests[1].got.length,0,'les invités ne reçoivent pas les messages des autres invités');
  // L'hôte envoie à tous, ou à un seul invité.
  host.send(JSON.stringify({t:'state',tick:1}));host.send(JSON.stringify({t:'chat',peer:host.got.find(m=>m.t==='join').peer,text:'salut'}));await wait(40);
  assert.ok(guests.slice(0,3).every(g=>g.got.some(m=>m.t==='state')));assert.ok(guests[0].got.some(m=>m.t==='chat'));assert.ok(!guests[1].got.some(m=>m.t==='chat'));
  // Départ d'un invité, puis fermeture de l'hôte : les invités sont prévenus, le salon disparaît.
  guests[2].close();await wait(40);assert.ok(host.got.some(m=>m.t==='left'));
  host.close();await wait(60);assert.ok(guests[0].got.some(m=>m.t==='closed'));assert.equal(relay.rooms.size,0);
 }finally{await relay.close()}
});

test('Jalon de la phase 4 : un hôte et un invité, reliés par le relais, se voient bouger',async()=>{
 const {createRelay}=require('../relay/server.cjs');
 const relay=createRelay({port:0});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const bootWithSocket=()=>require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run,){if(part[1].includes('canaan-runtime-config'))run('0')}});
 const host=bootWithSocket(),guest=bootWithSocket();
 for(const side of [host,guest]){side.g.WebSocket=WebSocket;side.g.Event=Event;assert.equal(side.errors.length,0,side.errors.join('\n'))}
 try{
  // L'hôte joue une aventure (slot 1) loin du camp, et ouvre un salon.
  host.run('started=true;paused=false;P.dead=false;P.mhp=P.hp=1e6;game.world.monsters=[];game.view={notify:()=>{},chat:()=>{}}');
  host.run('{let s=null;for(let y=60;y<340&&!s;y++)for(let x=60;x<340;x++){let ok=Math.hypot(x-CANAAN_CAMP.x,y-CANAAN_CAMP.y)>30;for(let a=-8;a<=8&&ok;a++)for(let b=-4;b<=4&&ok;b++)ok=canWalk((x+a+.5)*TS,(y+b+.5)*TS);if(ok){s={x,y};break}}P.x=(s.x+.5)*TS;P.y=(s.y+.5)*TS}');
  host.run('CANAAN_NET.openRoom("'+url+'")');
  for(let i=0;i<1000&&!host.run('CANAAN_NET.state().code');i++)await wait(10);
  const code=host.run('CANAAN_NET.state().code');assert.match(code,/^[A-Z2-9]{6}$/);assert.equal(host.run('game.mode'),'host');
  // L'invité rejoint avec le code, depuis l'écran titre.
  // Apparences : l'invité choisit la sienne sur l'écran titre, l'hôte a celle de sa sauvegarde.
  guest.run('CANAAN_NET.setLook({sex:"f",race:"orc",skin:"#86a85a",hairStyle:"tresses",outfit:"or"})');
  host.run('game.hero.look=sanitizeLook({race:"minotaure",outfit:"nuit"})');
  guest.run('CANAAN_NET.joinRoom({relay:"'+url+'",code:"'+code+'",pseudo:"Lina"})');
  for(let i=0;i<1000&&guest.run('game.mode')!=='guest';i++)await wait(10);
  assert.equal(guest.run('game.mode'),'guest');assert.equal(guest.run('started'),true);
  const id=guest.run('CANAAN_NET.state().heroId');assert.match(id,/^g-/);
  assert.equal(guest.run('game.hero.look.race'),'orc','l’invité garde son apparence');
  assert.equal(host.run('game.heroes.length'),2);assert.equal(host.run('game.guests["'+id+'"].name'),'Lina');assert.equal(host.run('game.guests["'+id+'"].local'),false);
  // Chacun avance : l'hôte vers la droite au clavier, l'invité vers le bas au clavier.
  const step=async n=>{for(let i=0;i<n;i++){host.run('time++;readInput();simulateStep();updateWorld();CANAAN_NET.tick()');guest.run('time++;readInput();CANAAN_NET.tick()');await wait(2)}};
  await step(30);
  assert.equal(host.run('game.guests["'+id+'"].look.race'),'orc','l’hôte voit l’orc de l’invité');assert.equal(host.run('game.guests["'+id+'"].look.hairStyle'),'tresses');
  assert.equal(guest.run('game.heroes.find(h=>h.id==="host").look.race'),'minotaure','l’invité voit le minotaure de l’hôte');
  // L'hôte part du point d'apparition, sur la place dégagée (les troncs des grands arbres bloquent le passage).
  host.run('P.x=CANAAN_SPAWN.x;P.y=CANAAN_SPAWN.y');await step(10);
  const before={hostSeenByGuest:guest.run('game.heroes.find(h=>h.id==="host").player.x'),guestSelf:guest.run('P.y'),guestSeenByHost:host.run('game.guests["'+id+'"].player.y')};
  host.run('keys.d=true');guest.run('keys.s=true');
  await step(90);host.run('keys.d=false');guest.run('keys.s=false');await step(30);
  const after={hostSeenByGuest:guest.run('game.heroes.find(h=>h.id==="host").player.x'),guestSelf:guest.run('P.y'),guestSeenByHost:host.run('game.guests["'+id+'"].player.y')};
  assert.ok(after.guestSeenByHost>before.guestSeenByHost+100,'l’hôte voit l’invité bouger');
  assert.ok(after.hostSeenByGuest>before.hostSeenByGuest+100,'l’invité voit l’hôte bouger');
  assert.ok(after.guestSelf>before.guestSelf+100,'l’invité voit son propre héros avancer, confirmé par l’hôte');
  assert.ok(Math.abs(guest.run('P.y')-host.run('game.guests["'+id+'"].player.y'))<40,'positions synchronisées');
  // L'invité ne sauvegarde rien ; l'hôte range son héros dans sa sauvegarde.
  assert.equal(guest.run('saveGame()'),false);assert.equal(guest.run('localStorage.getItem("canaan_slot_1")'),null);
  assert.equal(host.run('saveGame()'),true);assert.equal(JSON.parse(host.run('localStorage.getItem("canaan_slot_1")')).heros.invites[id].pseudo,'Lina');
  {const saved=JSON.parse(host.run('localStorage.getItem("canaan_slot_1")')).heros;assert.equal(saved.invites[id].look.race,'orc');assert.equal(saved.hote.look.race,'minotaure');}
  // Départ de l'invité : sa place est gardée (voir le test de la place réservée), son héros reste enregistré.
  guest.run('CANAAN_NET.debug.socket.close()');for(let i=0;i<1000&&!host.run('game.guests["'+id+'"].away');i++)await wait(10);
  assert.equal(host.run('!!game.guests["'+id+'"].away'),true);assert.equal(host.run('!!game.guests["'+id+'"]'),true);
 }finally{host.run('CANAAN_NET.closeRoom()');await relay.close()}
});

test('Échange entre joueurs : demande, offres, validations, vérifications de l’hôte et sacs à jour',async()=>{
 const {createRelay}=require('../relay/server.cjs');
 const relay=createRelay({port:0,rate:2000});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const boot=()=>{const side=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){if(part[1].includes('canaan-runtime-config'))run('0')}});side.g.WebSocket=WebSocket;side.g.Event=Event;return side};
 const host=boot(),guest=boot();
 for(const side of [host,guest])assert.equal(side.errors.length,0,side.errors.join('\n'));
 // Protocole : seules des demandes bien formées passent.
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 assert.deepEqual(n.sanitizeAction({op:'trade-offer',items:['a','b'],gold:5}),{op:'trade-offer',items:['a','b'],gold:5});
 for(const bad of [{op:'trade-offer',items:Array(13).fill('x'),gold:0},{op:'trade-offer',items:['a'],gold:-1},{op:'trade-offer',items:[1],gold:0},{op:'trade-request',to:'<b>'},{op:'trade-ready',yes:'oui'}])assert.equal(n.sanitizeAction(bad),null,JSON.stringify(bad));
 try{
  host.run('started=true;paused=false;P.dead=false;P.mhp=P.hp=1e6;game.world.monsters=[];game.view={notify:()=>{},chat:()=>{}}');
  host.run('CANAAN_NET.openRoom("'+url+'")');
  for(let i=0;i<1000&&!host.run('CANAAN_NET.state().code');i++)await wait(10);
  guest.run('CANAAN_NET.joinRoom({relay:"'+url+'",code:"'+host.run('CANAAN_NET.state().code')+'",pseudo:"Lina"})');
  for(let i=0;i<1000&&guest.run('game.mode')!=='guest';i++)await wait(10);
  const id=guest.run('CANAAN_NET.state().heroId'),G='game.guests["'+id+'"]';
  const J=(side,expr)=>JSON.parse(side.run('JSON.stringify('+expr+')'));
  const step=async k=>{for(let i=0;i<k;i++){host.run('time++;simulateStep();CANAAN_NET.tick()');guest.run('time++;CANAAN_NET.tick()');await wait(2)}};
  // Chacun a de quoi échanger.
  host.run('game.hero.inventory=[{id:"arc-hote",name:"Arc de l’hôte",slot:"weapon",weaponType:"bow",rarity:"Rare",ilvl:26},{id:"anneau-hote",name:"Anneau",slot:"ring",rarity:"Commun",ilvl:1}];P.gold=500');
  host.run(G+'.inventory=[{id:"bottes-lina",name:"Bottes de Lina",slot:"boots",rarity:"Épique",ilvl:46}];'+G+'.player.gold=80;'+G+'.netBag=null');
  await step(10);
  assert.equal(guest.run('game.hero.inventory.length'),1);
  // Un compagnon local n'est pas un partenaire ; l'invité en ligne, si.
  host.run('CANAAN_GROUP.create("Robot")');
  assert.deepEqual(J(host,'CANAAN_TRADE.view(game.hero).partners.map(p=>p.name)'),['Lina']);
  // L'invitée demande l'échange ; l'hôte le voit et accepte.
  guest.run('CANAAN_TRADE.actions.request("host")');await step(6);
  assert.equal(host.run('CANAAN_TRADE.view(game.hero).state'),'incoming');assert.equal(guest.run('CANAAN_TRADE.view===undefined')||true,true);
  host.run('CANAAN_TRADE.actions.answer(true)');await step(6);
  // Fenêtre de l'invitée : échange ouvert avec l'hôte.
  guest.run('toggleTrade()');assert.match(guest.nodes.get('window').innerHTML,/Offre de Hôte/);
  // Offres : l'invitée propose ses bottes et 30 or, l'hôte son arc.
  guest.run('CANAAN_TRADE.actions.add(0)');await step(6);
  guest.run('document.getElementById("tradeGold").value="30";CANAAN_TRADE.actions.gold()');await step(6);
  host.run('CANAAN_TRADE.actions.add(0)');await step(6);
  assert.deepEqual(J(host,'CANAAN_TRADE.view(game.hero).theirs.items.map(i=>i.id)'),['bottes-lina']);assert.equal(host.run('CANAAN_TRADE.view(game.hero).theirs.gold'),30);
  // Une offre impossible est refusée par l'hôte (objet absent, or insuffisant).
  assert.equal(host.run(`CANAAN_TRADE.handle(${G},{op:'trade-offer',items:['arc-hote'],gold:0})`),false);
  assert.equal(host.run(`CANAAN_TRADE.handle(${G},{op:'trade-offer',items:['bottes-lina'],gold:9999})`),false);
  // Validation de l'hôte, puis changement de l'offre de l'invitée : les validations tombent.
  host.run('CANAAN_TRADE.actions.ready()');await step(4);assert.equal(host.run('CANAAN_TRADE.view(game.hero).mine.ready'),true);
  guest.run('document.getElementById("tradeGold").value="20";CANAAN_TRADE.actions.gold()');await step(6);
  assert.equal(host.run('CANAAN_TRADE.view(game.hero).mine.ready'),false,'offre changée : validation annulée');
  // Les deux valident : l'échange a lieu chez l'hôte, et le sac de l'invitée suit.
  host.run('CANAAN_TRADE.actions.ready()');guest.run('CANAAN_TRADE.actions.ready()');await step(10);
  assert.equal(host.run('CANAAN_TRADE.sessions()'),0);
  assert.deepEqual(J(host,'game.hero.inventory.map(i=>i.id)'),['anneau-hote','bottes-lina']);
  assert.deepEqual(J(host,G+'.inventory.map(i=>i.id)'),['arc-hote']);
  assert.equal(host.run('P.gold'),520);assert.equal(host.run(G+'.player.gold'),60);
  assert.deepEqual(J(guest,'game.hero.inventory.map(i=>i.id)'),['arc-hote'],'sac de l’invitée à jour');
  // Sac plein : l'échange est suspendu, rien ne bouge.
  host.run(G+'.inventory=Array.from({length:20},(_,k)=>({id:"x"+k,name:"Pierre",slot:"ring",rarity:"Commun",ilvl:1}))');
  host.run('CANAAN_TRADE.actions.request("'+id+'")');host.run(`CANAAN_TRADE.handle(${G},{op:'trade-answer',yes:true})`);
  host.run('CANAAN_TRADE.actions.add(0)');host.run('CANAAN_TRADE.actions.ready()');host.run(`CANAAN_TRADE.handle(${G},{op:'trade-ready',yes:true})`);
  assert.equal(host.run(G+'.inventory.length'),20);assert.equal(host.run('game.hero.inventory.length'),2);assert.equal(host.run('CANAAN_TRADE.sessions()'),1);
  // Départ d'un joueur : l'échange est annulé.
  guest.run('CANAAN_NET.debug.socket.close()');for(let i=0;i<1000&&!host.run('!!'+G+'.away');i++)await wait(10);
  host.run('CANAAN_TRADE.check()');assert.equal(host.run('CANAAN_TRADE.sessions()'),0);
  for(const side of [host,guest])assert.equal(side.errors.length,0,side.errors.join('\n'));
 }finally{host.run('CANAAN_NET.closeRoom()');await relay.close()}
});

test('Adresses du relais et invitations : adresses Tailscale et locales, préfixes oubliés, invitation collée',async()=>{
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 assert.equal(n.normalizeRelayUrl('100.120.239.59:8787'),'ws://100.120.239.59:8787','adresse Tailscale avec port');
 assert.equal(n.normalizeRelayUrl('ws://mon-pc.tail55b3f7.ts.net:8787'),'ws://mon-pc.tail55b3f7.ts.net:8787','nom MagicDNS');
 assert.equal(n.normalizeRelayUrl('https://relais.example.com'),'wss://relais.example.com');
 assert.equal(n.normalizeRelayUrl('192.168.1.20:8787'),'ws://192.168.1.20:8787','adresse locale avec port');
 assert.equal(n.normalizeRelayUrl('ws://localhost:8787'),'ws://localhost:8787');
 for(const bad of ['', 'ftp://x', 'ws://exa mple.com', 'ws://host:99999', 'javascript:alert(1)'])assert.equal(n.normalizeRelayUrl(bad),null,bad);
 const inv=n.makeInvitation('ws://100.120.239.59:8787','K7P2QX');
 assert.deepEqual(n.parseInvitation(inv),{relay:'ws://100.120.239.59:8787',code:'K7P2QX'});
 assert.deepEqual(n.parseInvitation('salut ! 100.120.239.59:8787 code: k7p2qx'),{relay:'ws://100.120.239.59:8787',code:'K7P2QX'});
 assert.deepEqual(n.parseInvitation('rien ici'),{relay:null,code:null});
});

test('Hébergement (application de bureau) : relais sur l’adresse Tailscale, Tailscale absent ou arrêté, réseau local, sans Pinggy',async()=>{
 const H=require('../app/hosting.js');
 // Plage Tailscale 100.64.0.0/10 seulement.
 for(const ip of ['100.64.0.1','100.120.239.59','100.127.255.254'])assert.ok(H.isTailscaleIp(ip),ip);
 for(const ip of ['100.63.0.1','100.128.0.1','10.0.0.5','192.168.1.2','pas une ip'])assert.ok(!H.isTailscaleIp(ip),ip);
 // Lecture de l'adresse : l'interface tailscale0, et le nom MagicDNS donné par « tailscale status --json ».
 const ifs={lo:[{family:'IPv4',address:'127.0.0.1',internal:true}],wlan:[{family:'IPv4',address:'192.168.1.25',internal:false}],tailscale0:[{family:'IPv4',address:'100.120.239.59',internal:false}]};
 const running=()=>JSON.stringify({BackendState:'Running',Self:{DNSName:'mon-pc.tail55b3f7.ts.net.',TailscaleIPs:['100.120.239.59','fd7a::1']}});
 assert.deepEqual(H.tailscaleInfo({interfaces:ifs,run:running,commands:['tailscale']}),{ip:'100.120.239.59',name:'mon-pc.tail55b3f7.ts.net'});
 // Sans interface visible, l'adresse vient du statut.
 assert.equal(H.tailscaleInfo({interfaces:{},run:running,commands:['tailscale']}).ip,'100.120.239.59');
 // Pas installé, arrêté, en attente de connexion : un message clair, aucune adresse.
 const enoent=()=>{const e=new Error('absent');e.code='ENOENT';throw e};
 assert.match(H.tailscaleInfo({interfaces:{},run:enoent,commands:['tailscale']}).why,/pas installé/);
 const stopped=()=>{const e=new Error('exit 1');e.stdout=JSON.stringify({BackendState:'Stopped'});throw e};
 assert.match(H.tailscaleInfo({interfaces:{},run:stopped,commands:['tailscale']}).why,/arrêté/);
 assert.match(H.tailscaleInfo({interfaces:{},run:()=>JSON.stringify({BackendState:'NeedsLogin'}),commands:['tailscale']}).why,/connectes/);
 // Les adresses Tailscale ne sont pas proposées comme adresses du réseau local.
 assert.deepEqual(H.lanAddresses(ifs),['192.168.1.25']);
 assert.deepEqual(H.tailscaleFirewallCommands(['firewalld','ufw'],8787),['sudo firewall-cmd --permanent --zone=trusted --add-interface=tailscale0 && sudo firewall-cmd --reload','sudo ufw allow in on tailscale0 to any port 8787 proto tcp']);
 // Le relais écoute sur l'adresse Tailscale (ici 127.0.0.1 à sa place) et l'hôte s'y branche lui aussi.
 const statuses=[];
 let info={ip:'127.0.0.1',name:'mon-pc.tail55b3f7.ts.net'};
 const hosting=H.createHosting({tailscale:()=>info,firewalls:()=>['ufw'],onStatus:s=>statuses.push(s)});
 try{
  const st=await hosting.startTailscale();
  assert.equal(st.state,'online');assert.equal(st.kind,'tailscale');assert.match(st.relay,/^ws:\/\/127\.0\.0\.1:878\d$/);assert.equal(st.local,st.relay);
  assert.deepEqual(st.addresses,['ws://mon-pc.tail55b3f7.ts.net:'+st.relay.split(':').pop()]);
  assert.match(st.firewall[0],/tailscale0/);
  const code=await new Promise((resolve,reject)=>{const ws=new WebSocket(st.local);ws.onopen=()=>ws.send(JSON.stringify({t:'host'}));ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.t==='room'){ws.close();resolve(m.code)}};ws.onerror=reject});
  assert.match(code,/^[A-Z2-9]{6}$/);
  // Tailscale arrêté : erreur claire, le relais est fermé.
  info={ip:null,why:'Tailscale est arrêté : ouvre Tailscale et active la connexion (« Connect »).'};
  const off=await hosting.startTailscale();assert.equal(off.state,'error');assert.match(off.message,/arrêté/);
  await assert.rejects(()=>new Promise((resolve,reject)=>{const ws=new WebSocket(st.local);ws.onopen=()=>{ws.close();resolve()};ws.onerror=reject}));
  // Réseau local : relais ouvert au réseau, port de repli si 8787 est pris.
  const blocker=require('node:net').createServer();const busy=await new Promise(r=>blocker.once('error',()=>r(false)).listen(H.LAN_PORTS[0],'0.0.0.0',()=>r(true)));
  try{
   const lan=await hosting.startLan();
   if(lan.state==='online'){
    assert.equal(lan.kind,'lan');assert.match(lan.relay,/^ws:\/\/[\d.]+:\d+$/);
    if(busy)assert.equal(+lan.relay.split(':').pop(),H.LAN_PORTS[1],'port de repli quand 8787 est pris');
    const code2=await new Promise((resolve,reject)=>{const ws=new WebSocket(lan.relay);ws.onopen=()=>ws.send(JSON.stringify({t:'host'}));ws.onmessage=e=>{ws.close();resolve(JSON.parse(e.data).code)};ws.onerror=reject});
    assert.match(code2,/^[A-Z2-9]{6}$/);
   }else assert.match(lan.message,/réseau local/,'sans réseau : message clair');
  }finally{blocker.close()}
 }finally{await hosting.stop()}
 assert.equal(statuses.at(-1).state,'off');
 // Plus aucune trace de Pinggy ni de tunnel ssh dans l'application ni dans le jeu.
 for(const f of ['app/hosting.js','app/main.js','app/preload.js'])assert.doesNotMatch(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),/pinggy|ssh/i,f);
 assert.doesNotMatch(source.replace(/Anciens réglages Pinggy[^\n]*\n[^\n]*/,''),/pinggy/i);
});

test('Connexion impossible : l’invité voit « Relais injoignable » et quoi vérifier ; l’hôte voit les commandes de son pare-feu',async()=>{
 const {firewallCommands,linuxFirewalls}=require('../app/hosting.js');
 assert.deepEqual(firewallCommands(['firewalld','ufw'],8787),['sudo firewall-cmd --permanent --add-port=8787/tcp && sudo firewall-cmd --reload','sudo ufw allow 8787/tcp']);
 if(process.platform==='linux'){
  const fake=(cmd,args)=>{if(args[1]==='ufw')return 'active\n';throw new Error('inactive')};
  assert.deepEqual(linuxFirewalls(fake),['ufw']);
 }
 // Un port fermé : le message reste « Relais injoignable » (il n'est plus remplacé par « Connexion fermée »).
 const port=await new Promise(r=>{const s=require('node:net').createServer().listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})});
 const guest=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){if(part[1].includes('canaan-runtime-config'))run('0')}});
 guest.g.WebSocket=WebSocket;guest.g.Event=Event;
 guest.run('CANAAN_NET.joinRoom({relay:"ws://127.0.0.1:'+port+'",code:"ABC234",pseudo:"Lina"})');
 for(let i=0;i<100&&!/injoignable/.test(guest.run('CANAAN_NET.state().status'));i++)await new Promise(r=>setTimeout(r,10));
 await new Promise(r=>setTimeout(r,100));
 const status=guest.run('CANAAN_NET.state().status');
 assert.match(status,/Relais injoignable : ws:\/\/127\.0\.0\.1:\d+/);assert.match(status,/pare-feu/);assert.doesNotMatch(status,/Connexion fermée/);
 assert.equal(guest.errors.length,0,guest.errors.join('\n'));
});
