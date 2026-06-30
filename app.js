const API_URL = "https://script.google.com/macros/s/AKfycbySulYfYcP-iXmxINIZEqMTetncz7_BbYiH493HGUiy3IBwJP531bcvA7rNyi2ESmtf/exec";

let calendar;
let events = [];

// 색상 매핑
const colorMap = {
  "김창수": "#ef4444",
  "서동주": "#3b82f6",
  "차지민": "#10b981",
  "A6000": "#6366f1",
  "4090": "#f97316"
};

// 초기 로딩
document.addEventListener("DOMContentLoaded", async function () {
  calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
    initialView: 'timeGridWeek',
    height: "auto",
    events: []
  });

  calendar.render();
  await loadData();

  setInterval(loadData, 5000);
});

// 데이터 로딩
async function loadData() {
  const res = await fetch(API_URL);
  const data = await res.json();

  events = data.map(r => ({
    title: `${r.user} (${r.gpu})`,
    start: r.start,
    end: r.end,
    backgroundColor: colorMap[r.user] || "#999",
    borderColor: colorMap[r.gpu] || "#333"
  }));

  calendar.removeAllEvents();
  calendar.addEventSource(events);
}

// 충돌 체크
function hasConflict(newEvent, data) {
  const ns = new Date(newEvent.start).getTime();
  const ne = new Date(newEvent.end).getTime();

  return data.some(e => {
    if (e.gpu !== newEvent.gpu) return false;

    const es = new Date(e.start).getTime();
    const ee = new Date(e.end).getTime();

    return ns < ee && ne > es;
  });
}

// 예약 추가
async function addReservation() {
  const user = document.getElementById("user").value;
  const gpu = document.getElementById("gpu").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;

  if (!start || !end) {
    alert("시간 입력");
    return;
  }

  const newEvent = { user, gpu, start, end };

  // 최신 데이터 다시 가져와서 충돌 체크
  const res = await fetch(API_URL);
  const data = await res.json();

  if (hasConflict(newEvent, data)) {
    alert("❌ GPU 시간 겹침 (예약 불가)");
    return;
  }

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(newEvent)
  });

  loadData();
}