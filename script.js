import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ТВОИ ДАННЫЕ ИЗ ССЫЛКИ (Проект cs2t-1c50c)
const firebaseConfig = {
  apiKey: "AIzaSyDzugruZhNUhzNTxx5YhbPPEDCoa2thiBc",
  authDomain: "cs2t-1c50c.firebaseapp.com",
  // Исправленный URL (Европейский регион)
  databaseURL: "https://cs2t-1c50c-default-rtdb.europe-west1.firebasedatabase.app", 
  projectId: "cs2t-1c50c",
  storageBucket: "cs2t-1c50c.firebasestorage.app",
  messagingSenderId: "630964872351",
  appId: "1:630964872351:web:0cc8c0ce1ec1367ab82eaa"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const DB_PATH = "tournament_data"; 
const ADMIN_PASSWORD = "admin123";

const DEFAULT = {
  quarters: [
    { name: "Team 1", score: 0, time: "12:00" }, { name: "Team 2", score: 0 },
    { name: "Team 3", score: 0, time: "13:00" }, { name: "Team 4", score: 0 },
    { name: "Team 5", score: 0, time: "14:00" }, { name: "Team 6", score: 0 },
    { name: "Team 7", score: 0, time: "15:00" }, { name: "Team 8", score: 0 }
  ],
  semis: [
    { name: "", score: 0, time: "18:00" }, { name: "", score: 0 },
    { name: "", score: 0, time: "19:00" }, { name: "", score: 0 }
  ],
  final: { t1: "", t2: "", score1: 0, score2: 0, time: "21:00" },
  champion: ""
};

let currentData = JSON.parse(JSON.stringify(DEFAULT));

function saveData(data){
  set(ref(db, DB_PATH), data);
}

const getWinner = (t1, s1, t2, s2) => {
  if (s1 > s2) return t1;
  if (s2 > s1) return t2;
  return ""; 
};

function compute(data){
  data.semis[0].name = getWinner(data.quarters[0].name, data.quarters[0].score, data.quarters[1].name, data.quarters[1].score);
  data.semis[1].name = getWinner(data.quarters[2].name, data.quarters[2].score, data.quarters[3].name, data.quarters[3].score);
  data.semis[2].name = getWinner(data.quarters[4].name, data.quarters[4].score, data.quarters[5].name, data.quarters[5].score);
  data.semis[3].name = getWinner(data.quarters[6].name, data.quarters[6].score, data.quarters[7].name, data.quarters[7].score);

  data.final.t1 = getWinner(data.semis[0].name, data.semis[0].score, data.semis[1].name, data.semis[1].score);
  data.final.t2 = getWinner(data.semis[2].name, data.semis[2].score, data.semis[3].name, data.semis[3].score);

  if(data.final.t1 && data.final.t2) {
    data.champion = getWinner(data.final.t1, data.final.score1, data.final.t2, data.final.score2);
  } else {
    data.champion = "";
  }
  return data;
}

function renderAll(data){
  const computedData = compute(data);
  const el = id => document.getElementById(id);
  const setText = (id, text) => { if(el(id)) el(id).innerText = text; };
  const setVal = (id, val) => { if(el(id)) el(id).value = val; };

  // Рендер страницы зрителя
  if(el("qt1")){ 
    for(let i=0; i<8; i++){
      setText(`qt${i+1}`, computedData.quarters[i].name || "-");
      setText(`qs${i+1}`, computedData.quarters[i].score);
    }
    setText("qtime1", computedData.quarters[0].time);
    setText("qtime2", computedData.quarters[2].time);
    setText("qtime3", computedData.quarters[4].time);
    setText("qtime4", computedData.quarters[6].time);

    for(let i=0; i<4; i++){
      setText(`st${i+1}`, computedData.semis[i].name || "-");
      setText(`ss${i+1}`, computedData.semis[i].score);
    }
    setText("stime1", computedData.semis[0].time);
    setText("stime2", computedData.semis[2].time);

    setText("ft1", computedData.final.t1 || "-");
    setText("fs1", computedData.final.score1);
    setText("ft2", computedData.final.t2 || "-");
    setText("fs2", computedData.final.score2);
    setText("ftime", computedData.final.time);
    setText("champ", computedData.champion ? "🏆 Champion: " + computedData.champion : "");
  }

  // Рендер страницы админа
  if(el("qteam1")){
    for(let i=0; i<8; i++){
      setVal(`qteam${i+1}`, computedData.quarters[i].name);
      setVal(`qscore${i+1}`, computedData.quarters[i].score);
    }
    setVal("qtime1", computedData.quarters[0].time);
    setVal("qtime2", computedData.quarters[2].time);
    setVal("qtime3", computedData.quarters[4].time);
    setVal("qtime4", computedData.quarters[6].time);

    for(let i=0; i<4; i++){
      setText(`sname${i+1}`, computedData.semis[i].name || "Очікування...");
      setVal(`sscore${i+1}`, computedData.semis[i].score);
    }
    setVal("stime1", computedData.semis[0].time);
    setVal("stime2", computedData.semis[2].time);

    setText("fname1", computedData.final.t1 || "Очікування...");
    setText("fname2", computedData.final.t2 || "Очікування...");
    setVal("fscore1", computedData.final.score1);
    setVal("fscore2", computedData.final.score2);
    setVal("ftime", computedData.final.time);
    setText("championAdmin", computedData.champion ? computedData.champion : "-");
  }
}

function applyAdminChanges(){
  const el = id => document.getElementById(id);
  const safeStr = v => (v === null || v === undefined) ? "" : String(v).trim();

  for(let i=0; i<8; i++){
    currentData.quarters[i].name = safeStr(el(`qteam${i+1}`).value) || `Team ${i+1}`;
    currentData.quarters[i].score = Number(el(`qscore${i+1}`).value) || 0;
  }
  currentData.quarters[0].time = safeStr(el("qtime1").value);
  currentData.quarters[2].time = safeStr(el("qtime2").value);
  currentData.quarters[4].time = safeStr(el("qtime3").value);
  currentData.quarters[6].time = safeStr(el("qtime4").value);

  for(let i=0; i<4; i++){
    currentData.semis[i].score = Number(el(`sscore${i+1}`).value) || 0;
  }
  currentData.semis[0].time = safeStr(el("stime1").value);
  currentData.semis[2].time = safeStr(el("stime2").value);

  currentData.final.score1 = Number(el("fscore1").value) || 0;
  currentData.final.score2 = Number(el("fscore2").value) || 0;
  currentData.final.time = safeStr(el("ftime").value);

  const finalData = compute(currentData);
  saveData(finalData);
}

function tryLogin(){
  const pw = document.getElementById("adminPw")?.value || "";
  if(pw === ADMIN_PASSWORD){
    document.getElementById("adminPanel").style.display = "block";
    document.getElementById("badPw").style.display = "none";
    document.getElementById("adminPw").value = "";
  } else {
    document.getElementById("badPw").style.display = "block";
    document.getElementById("adminPanel").style.display = "none";
  }
}

function resetToDefault(){
  saveData(JSON.parse(JSON.stringify(DEFAULT)));
}

function exportJSON(){
  const blob = new Blob([JSON.stringify(currentData, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "tournament_8teams.json";
  a.click(); URL.revokeObjectURL(url);
}

function importJSON(file){
  const reader = new FileReader();
  reader.onload = e => {
    try{
      const parsed = JSON.parse(e.target.result);
      saveData(parsed); 
    }catch(err){ alert("Помилка імпорту"); }
  };
  reader.readAsText(file);
}

document.addEventListener("DOMContentLoaded", ()=>{
  const dbRef = ref(db, DB_PATH);
  onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      currentData = data;
    } else {
      currentData = JSON.parse(JSON.stringify(DEFAULT));
    }
    renderAll(currentData); 
  });

  if(document.getElementById("saveBtn")) {
    document.getElementById("saveBtn").addEventListener("click", applyAdminChanges);
    document.getElementById("loginBtn").addEventListener("click", tryLogin);
    
    document.getElementById("resetBtn").addEventListener("click", ()=>{
      if(confirm("Ви впевнені?")) resetToDefault();
    });

    document.getElementById("exportBtn").addEventListener("click", exportJSON);
    document.getElementById("importFile").addEventListener("change", (ev)=>{
      if(ev.target.files[0]) importJSON(ev.target.files[0]);
    });
  }
});
