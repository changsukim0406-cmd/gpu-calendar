const API_URL = "https://script.google.com/macros/s/AKfycbw7bqTuP6ScCrHtxgmcYG6eqki7xGV_cTjUnUQQHu8a75k0_BQFBQBu1DmlfRdbPy5S/exec";

let calendar;
let events = [];

const colorMap = {
  "김창수": "#ef4444",
  "서동주": "#3b82f6",
  "차지민": "#10b981"
};

document.addEventListener("DOMContentLoaded", async function () {
  calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    },
    height: "auto",
    events: []
  });

  calendar.render();

  await loadData();
  setInterval(loadData, 5000);
});

async function loadData() {
  const res = await fetch(API_URL);
  const data = await res.json();

  events = data.map(r => ({
    title: `${r.user} (${r.gpu})`,
    start: r.start,
    end: r.end,
    backgroundColor: colorMap[r.user] || "#999"
  }));

  calendar.removeAllEvents();
  calendar.addEventSource(events);
}

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

async function addReservation() {
  const user = document.getElementById("user").value;
  const gpu = document.getElementById("gpu").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;

  if (!start || !end) {
    alert("시간을 입력하세요.");
    return;
  }

  const newEvent = { user, gpu, start, end };

  const res = await fetch(API_URL);
  const data = await res.json();

  if (hasConflict(newEvent, data)) {
    alert("❌ GPU 사용 시간이 겹칩니다.");
    return;
  }

  await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(newEvent)
  });

  await loadData();
}