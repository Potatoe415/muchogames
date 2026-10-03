const VEG=[{key:"tomate",short:"TM"},{key:"salade",short:"SL"},{key:"poivron",short:"PV"},{key:"chou-fleur",short:"CF"}];
const ASSETS={tomate:{legume:"tomate.png",tabou:"tomate_x.png"},salade:{legume:"salade.png",tabou:"salad_x.png"},poivron:{legume:"poivron.png",tabou:"poivron_x.png"},"chou-fleur":{legume:"choux.png",tabou:"choux_x.png"}};
const RULES={fr:"rules-fr.html",en:"rules-en.html",es:"rules-es.html"};
const I18N={fr:{htmlLang:"fr",eyebrow:"Jeu oral tactile",title:"Salade de Cafards",intro:"Configure la partie, puis touchez la pile active pour reveler chaque nouvelle carte.",players:"Nombre de joueurs",deck:"Cartes totales",winners:"Nombre de gagnants",timer:"Minuteur",timerToggle:"Activer la lumiere rouge",timerSeconds:"Secondes avant alerte",note:"Jeu officiel : 112 cartes legumes (28 de chaque type) et 16 cartes taboues (4 par legume).",start:"Lancer la partie",activePile:"Pile active",restart:"Reconfigurer",pile:"Pile",waitingTimer:"Minuteur en attente",timerOff:"Minuteur desactive",alertIn:"Alerte dans {value} s",timeUp:"Temps depasse",gameOver:"Partie terminee",touchActive:"Touchez uniquement la pile active.",noCards:"n'a plus de cartes. Victoire immediate.",wins:"a vide sa main et gagne la partie.",starts:"commence. Touchez la pile active pour reveler une carte.",revealed:"revele",tabooReveal:"revele un CAFARD {veg}. Le legume devient tabou, on bascule de pile.",onPile:"sur la pile {pile}.",nothingToCollect:"Aucune carte a ramasser pour l'instant.",collects:"ramasse {count} cartes et la table repart sur la pile A.",hand:"Main",taken:"Cartes ramassees",collectBtn:"Faire ramasser {player}",setupReady:"Pret a lancer la partie.",setupError:"Demarrage impossible : {message}",rulesTitle:"Regles"},en:{htmlLang:"en",eyebrow:"Touch-first spoken play",title:"Cockroach Salad",intro:"Set up the match, then tap the active pile to reveal each new card.",players:"Players",deck:"Total cards",winners:"Number of winners",timer:"Timer",timerToggle:"Enable red warning light",timerSeconds:"Seconds before alert",note:"Official deck: 112 vegetable cards (28 of each type) and 16 taboo cards (4 per vegetable).",start:"Start game",activePile:"Active pile",restart:"Back to setup",pile:"Pile",waitingTimer:"Timer waiting",timerOff:"Timer disabled",alertIn:"Alert in {value} s",timeUp:"Time is up",gameOver:"Game over",touchActive:"Tap only the active pile.",noCards:"has no cards left. Instant win.",wins:"emptied their hand and wins the game.",starts:"starts. Tap the active pile to reveal a card.",revealed:"reveals",tabooReveal:"reveals a COCKROACH {veg}. That vegetable is now taboo, switch piles.",onPile:"on pile {pile}.",nothingToCollect:"There are no cards to collect right now.",collects:"collects {count} cards and play restarts on pile A.",hand:"Hand",taken:"Collected cards",collectBtn:"Give cards to {player}",setupReady:"Ready to start the game.",setupError:"Unable to start: {message}",rulesTitle:"Rules"},es:{htmlLang:"es",eyebrow:"Juego oral tactil",title:"Ensalada de Cucarachas",intro:"Configura la partida y luego toca la pila activa para revelar cada carta nueva.",players:"Jugadores",deck:"Cartas totales",winners:"Número de ganadores",timer:"Temporizador",timerToggle:"Activar luz roja",timerSeconds:"Segundos antes de la alerta",note:"Mazo oficial: 112 cartas de verduras (28 de cada tipo) y 16 cartas prohibidas (4 por verdura).",start:"Empezar partida",activePile:"Pila activa",restart:"Volver a configurar",pile:"Pila",waitingTimer:"Temporizador en espera",timerOff:"Temporizador desactivado",alertIn:"Alerta en {value} s",timeUp:"Tiempo agotado",gameOver:"Partida terminada",touchActive:"Toca solo la pila activa.",noCards:"ya no tiene cartas. Victoria inmediata.",wins:"vacio su mano y gana la partida.",starts:"empieza. Toca la pila activa para revelar una carta.",revealed:"revela",tabooReveal:"revela una CUCARACHA {veg}. Esa verdura queda prohibida y se cambia de pila.",onPile:"en la pila {pile}.",nothingToCollect:"No hay cartas para recoger ahora mismo.",collects:"recoge {count} cartas y la mesa vuelve a la pila A.",hand:"Mano",taken:"Cartas recogidas",collectBtn:"Hacer que recoja {player}",setupReady:"Listo para empezar la partida.",setupError:"No se puede iniciar: {message}",rulesTitle:"Reglas"}};
function readHubLang(){try{const stored=localStorage.getItem("bergamots-lang");return ["fr","en","es"].includes(stored)?stored:"fr";}catch{return "fr";}}
const state={lang:readHubLang(),players:[],piles:[[],[]],activePile:0,current:0,timerId:null,timerTickId:null,started:false,config:{count:4,deckSize:128,winners:1,timerOn:true,timerMs:1500}}; let el={};
const q=(s)=>document.querySelector(s), qa=(s)=>[...document.querySelectorAll(s)];
function t(k,v={}){let s=(I18N[state.lang]&&I18N[state.lang][k])||I18N.fr[k]||k; Object.entries(v).forEach(([n,x])=>s=s.replace(`{${n}}`,x)); return s;}
function vegLabel(key){const labels={fr:{tomate:"tomate",salade:"salade",poivron:"poivron","chou-fleur":"chou-fleur"},en:{tomate:"tomato",salade:"lettuce",poivron:"pepper","chou-fleur":"cauliflower"},es:{tomate:"tomate",salade:"lechuga",poivron:"pimiento","chou-fleur":"coliflor"}}; return labels[state.lang][key];}
const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};
function cacheDom(){el={setup:q("#setup"),game:q("#game"),playerCount:q("#playerCount"),deckSize:q("#deckSize"),winnersCount:q("#winnersCount"),timerEnabled:q("#timerEnabled"),timerSeconds:q("#timerSeconds"),startBtn:q("#startBtn"),backBtn:q("#backBtn"),timerLight:q("#timerLight"),timerText:q("#timerText"),pileA:q("#pileA"),pileB:q("#pileB"),pileAHit:q("#pileAHit"),pileBHit:q("#pileBHit"),pileACta:q("#pileACta"),pileBCta:q("#pileBCta"),pileShells:qa(".pile-shell"),players:q("#players"),cardTpl:q("#cardTpl"),langButtons:qa(".lang-btn"),i18nNodes:qa("[data-i18n]"),optionsBtn:q("#optionsBtn"),optionsPanel:q("#optionsPanel"),rulesFrame:q("#rulesFrame"),winnerOverlay:q("#winnerOverlay"),winnerText:q("#winnerText")};}
function setSetupStatus(){/* no-op: status removed from splash UI */}
function renderPileLabels(){}
function applyI18n(){document.documentElement.lang=t("htmlLang"); el.i18nNodes.forEach((n)=>n.textContent=t(n.dataset.i18n)); renderPileLabels(); el.pileACta.textContent="Tap here!"; el.pileBCta.textContent="Tap here!"; el.timerText.textContent=state.started?el.timerText.textContent:t("waitingTimer"); el.langButtons.forEach((b)=>b.classList.toggle("active",b.dataset.lang===state.lang)); setSetupStatus(t("setupReady")); renderPlayers(); if(el.rulesFrame&&!el.optionsPanel.hidden) el.rulesFrame.src=RULES[state.lang];}
function readConfig(){
  const playersRaw=Number(el.playerCount.value)||4;
  state.config.count=Math.min(8,Math.max(2,playersRaw));
  const deckRaw=Number(el.deckSize.value)||128;
  state.config.deckSize=Math.min(256,Math.max(32,deckRaw));
  const winnersRaw=Number(el.winnersCount.value)||1;
  state.config.winners=Math.min(state.config.count,Math.max(1,winnersRaw));
  const baseMs=(Number(el.timerSeconds.value)||1.5)*1000;
  state.config.timerOn=el.timerEnabled.checked;
  state.config.timerMs=Math.max(500,baseMs);
}
function createExactDeck(){const cards=[]; VEG.forEach((veg)=>{for(let i=0;i<28;i++)cards.push({type:"legume",veg:veg.key}); for(let i=0;i<4;i++)cards.push({type:"tabou",veg:veg.key});}); return shuffle(cards);}
function createBalancedDeck(total){
  const cards=[];
  const targetTabooTotal=Math.max(VEG.length,Math.round(total/8));
  const basePerVeg=Math.floor(targetTabooTotal/VEG.length);
  let remainder=targetTabooTotal-basePerVeg*VEG.length;
  VEG.forEach((veg)=>{
    const count=basePerVeg+(remainder>0?1:0);
    if(remainder>0)remainder-=1;
    for(let i=0;i<count;i++)cards.push({type:"tabou",veg:veg.key});
  });
  const remaining=Math.max(0,total-cards.length);
  const perVeg=Math.floor(remaining/VEG.length);
  VEG.forEach((veg)=>{
    for(let i=0;i<perVeg;i++)cards.push({type:"legume",veg:veg.key});
  });
  while(cards.length<total){
    const veg=VEG[cards.length%VEG.length];
    cards.push({type:"legume",veg:veg.key});
  }
  return shuffle(cards);
}
const createDeck=(total)=>total===128?createExactDeck():createBalancedDeck(total);
function deal(){
  const playersCount=state.config.count;
  const targetTotal=state.config.deckSize-(state.config.deckSize%playersCount);
  const total=Math.max(playersCount,targetTotal);
  const deck=createDeck(total);
  state.players=Array.from({length:playersCount},()=>({hand:[],losses:0}));
  deck.forEach((card,i)=>state.players[i%playersCount].hand.push(card));
}
const currentPlayer=()=>state.players[state.current%state.players.length];
function makePose(index,pileIndex){
  const spread=Math.min(index,12);
  const direction=index%2===0?1:-1;
  const baseAngle=7+Math.random()*7;
  const isMobile=typeof window!=="undefined"&&window.matchMedia&&window.matchMedia("(max-width: 900px)").matches;
  const verticalShift=isMobile&&pileIndex===0?-52:0;
  return {
    left:24+spread*2+Math.random()*7,
    top:24+spread*3+Math.random()*8+verticalShift,
    angle:direction*baseAngle+(pileIndex?1.5:-1.5)
  };
}
const cardAsset=(card)=>`assets/cards/${card.type==="tabou"?ASSETS[card.veg].tabou:ASSETS[card.veg].legume}`;
function setActivePile(index){state.activePile=index; if(el.turnLabel){el.turnLabel.textContent=`${t("pile")} ${index?"B":"A"}`;} el.pileShells.forEach((shell,i)=>shell.classList.toggle("active",i===index));}
function clearTimer(){clearTimeout(state.timerId); clearInterval(state.timerTickId); state.timerId=null; state.timerTickId=null;}
function resetTimer(){clearTimer(); el.timerLight.classList.remove("on"); if(!state.started)return; if(!state.config.timerOn)return void(el.timerText.textContent=t("timerOff")); const deadline=Date.now()+state.config.timerMs; const update=()=>{const remaining=Math.max(0,deadline-Date.now()); el.timerText.textContent=t("alertIn",{value:(remaining/1000).toFixed(1)});}; update(); state.timerTickId=setInterval(update,100); state.timerId=setTimeout(()=>{clearInterval(state.timerTickId); state.timerTickId=null; el.timerLight.classList.add("on"); el.timerText.textContent=t("timeUp");},state.config.timerMs);}
function nextTurn(){state.current=(state.current+1)%state.players.length; renderPlayers(); resetTimer();}
let optionsPanelApi=null;
function closeOptionsPanel(){ if(optionsPanelApi) optionsPanelApi.close(); el.rulesFrame.src="about:blank"; }
async function startGame(){if(!(await window.MuchogamesMatch.start("cafards"))||state.started)return; try{ closeOptionsPanel(); readConfig(); deal(); state.started=true; state.current=0; state.piles=[[],[]]; setActivePile(0); document.body.className="mode-game"; render(); resetTimer();}catch(error){setSetupStatus(t("setupError",{message:error.message||String(error)}),true);}}
function restartToSetup(){
  window.MuchogamesMatch.finish();
  clearTimer();
  closeOptionsPanel();
  state.started=false;
  state.current=0;
  state.piles=[[],[]];
  state.players=[];
  document.body.className="mode-setup";
  if(el.timerText){el.timerText.textContent=t("waitingTimer");}
  if(el.winnerOverlay){el.winnerOverlay.hidden=true;}
  renderPiles();
  renderPlayers();
  setSetupStatus(t("setupReady"));
}
function showWinnerBanner(index){
  if(!el.winnerOverlay||!el.winnerText)return;
  el.winnerText.textContent=`Player ${index+1} win!`;
  el.winnerOverlay.hidden=false;
  window.setTimeout(()=>{if(el.winnerOverlay)el.winnerOverlay.hidden=true;},1400);
}
function checkWinCondition(){
  let newlyWinningIndex=-1;
  state.players.forEach((p,idx)=>{
    if(p.hand.length===0&&!p.alreadyWon){
      p.alreadyWon=true;
      newlyWinningIndex=idx;
    }
  });
  const zeroCount=state.players.filter((p)=>p.hand.length===0).length;
  if(zeroCount>=state.config.winners){
    window.MuchogamesMatch.finish();
    state.started=false;
    clearTimer();
    el.timerText.textContent=t("gameOver");
    if(newlyWinningIndex>=0)showWinnerBanner(newlyWinningIndex);
    return true;
  }
  if(newlyWinningIndex>=0)showWinnerBanner(newlyWinningIndex);
  return false;
}
function handleBackClick(){
  const body=document.body;
  if(body.classList.contains("mode-game")){
    restartToSetup();
    return;
  }
  window.location.href="../../index.html";
}
function revealFromPile(index){
  if(!state.started)return;
  if(index!==state.activePile)return;
  const player=currentPlayer();
  if(!player.hand.length){
    window.MuchogamesMatch.finish();
    state.started=false;
    clearTimer();
    return;
  }
  const card=player.hand.pop();
  card.pose=makePose(state.piles[index].length,index);
  card.justRevealed=true;
  state.piles[index].push(card);
  if(card.type==="tabou")setActivePile(index?0:1);
  render();
  if(checkWinCondition())return;
  nextTurn();
}
function collectCards(playerIndex){
  if(!state.started)return;
  const collected=[...state.piles[0],...state.piles[1]];
  if(!collected.length)return;
  const player=state.players[playerIndex];
  const previousCount=player.hand.length;
  player.hand.unshift(...shuffle(collected));
  player.losses+=collected.length;
  state.piles=[[],[]];
  setActivePile(0);
  player.animateFrom=previousCount;
  player.animateTo=player.hand.length;
  render();
  if(checkWinCondition())return;
  resetTimer();
}
function cardNode(card,index,isTop){
  const node=el.cardTpl.content.firstElementChild.cloneNode(true);
  node.classList.add(card.veg);
  if(card.type==="tabou")node.classList.add("tabou");
  if(isTop)node.classList.add("card-new");
  node.style.left=`${card.pose.left}px`;
  node.style.top=`${card.pose.top}px`;
  node.style.transform=`rotate(${card.pose.angle}deg)`;
  node.style.zIndex=index+1;
  node.style.backgroundImage=`linear-gradient(155deg, transparent, transparent), url("${cardAsset(card)}")`;
  return node;
}
function renderPiles(){
  [el.pileA,el.pileB].forEach((container,pileIndex)=>{
    const pile=state.piles[pileIndex];
    const showMessage=state.started&&pileIndex===state.activePile&&pile.length===0;
    container.innerHTML=showMessage?`<span class="pile-message">Tap here!</span>`:"";
    const start=Math.max(0,pile.length-3);
    pile.slice(start).forEach((card,offset)=>{
      const index=start+offset;
      const isTop=index===pile.length-1&&card.justRevealed;
      container.appendChild(cardNode(card,index,isTop));
      if(card.justRevealed)card.justRevealed=false;
    });
  });
  renderPileLabels();
}
function renderPlayers(){
  if(!el.players)return;
  el.players.innerHTML="";
  state.players.forEach((player,index)=>{
    const chip=document.createElement("button");
    const isActive=index===state.current&&state.started;
    chip.type="button";
    chip.className=`player-chip player-${index}${isActive?" active":""}`;
    const targetCount=player.hand.length;
    const from=typeof player.animateFrom==="number"?player.animateFrom:targetCount;
    chip.textContent=String(from);
    chip.addEventListener("click",()=>collectCards(index));
    el.players.appendChild(chip);
    if(typeof player.animateFrom==="number"&&typeof player.animateTo==="number"&&player.animateTo>player.animateFrom){
      animateChipCount(chip,player.animateFrom,player.animateTo);
      delete player.animateFrom;
      delete player.animateTo;
    }
  });
}
function animateChipCount(chip,from,to){
  let current=from;
  const step=()=>{
    if(!chip||current>=to)return;
    current+=1;
    chip.textContent=String(current);
    if(current<to)window.setTimeout(step,35);
  };
  step();
}
const render=()=>{renderPiles(); renderPlayers();};
function bindEvents(){
  [el.pileAHit,el.pileBHit].forEach((button,index)=>{button.addEventListener("click",()=>revealFromPile(index)); button.addEventListener("dblclick",()=>revealFromPile(index));});
  el.startBtn.addEventListener("click",startGame);
  if(el.backBtn){el.backBtn.addEventListener("click",handleBackClick);}
  el.timerEnabled.addEventListener("change",()=>{el.timerSeconds.disabled=!el.timerEnabled.checked;});
  el.langButtons.forEach((btn)=>btn.addEventListener("click",()=>{state.lang=btn.dataset.lang; applyI18n();}));
  if(window.GameHeader){
    optionsPanelApi=window.GameHeader.initOptionsPanel(el.optionsBtn,el.optionsPanel);
  }
  el.optionsBtn.addEventListener("click",()=>{
    if(!el.optionsPanel.hidden) el.rulesFrame.src=RULES[state.lang];
  });
}
function init(){cacheDom(); bindEvents(); el.timerSeconds.disabled=!el.timerEnabled.checked; el.timerText.textContent=t("waitingTimer"); renderPileLabels(); applyI18n();}
window.addEventListener("error",(event)=>{if(el.setupStatus&&!state.started)setSetupStatus(t("setupError",{message:event.message||"unknown error"}),true);});
document.addEventListener("DOMContentLoaded",init);


