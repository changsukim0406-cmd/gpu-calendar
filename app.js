const API_URL = "https://script.google.com/macros/s/AKfycbx4pm2pqiIthdNixw4rYBBhgfbmSh_wrTi3yKwFmH3KMzwtga6fgLREOcBNxyJnvHWv/exec";

let calendar;
let events = [];

const colorMap = {
  "김창수": "#ef4444",
  "서동주": "#3b82f6",
  "차지민": "#10b981"
};

document.addEventListener("DOMContentLoaded", async function () {
  calendar = new FullCalendar.Calendar(document.getElementById("calendar"), {
    initialView: "dayGridMonth",

    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek"
    },

    eventClick: async function(info) {
      const id = info.event.id;

      if (!id) {
        alert("삭제 실패: event id 없음");
        return;
      }

      if (!confirm("삭제하시겠습니까?")) return;

      try {
        await fetch(`${API_URL}?action=delete&id=${id}`);
        await loadData();
      } catch (err) {
        console.error("delete error:", err);
        alert("삭제 실패");
      }
    },

    eventDidMount: function(info) {
      const start = info.event.start;
      const end = info.event.end;

      info.el.title =
        `${info.event.title}\n` +
        `Start: ${start}\n` +
        `End: ${end}`;
    },

    height: "auto",
    events: []
  });

  calendar.render();

  await loadData();
  setInterval(loadData, 5000);
});

function formatTime(datetimeStr) {
  const d = new Date(datetimeStr);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function formatDate(datetimeStr) {
  const d = new Date(datetimeStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${formatTime(datetimeStr)}`;
}

function formatEventTitle(r) {
  const start = new Date(r.start);
  const end = new Date(r.end);

  const sameDay =
    start.toDateString() === end.toDateString();

  if (sameDay) {
    return `${formatTime(r.start)}-${formatTime(r.end)} | ${r.user} (${r.gpu})`;
  }

  return `${formatDate(r.start)} ~ ${formatDate(r.end)} | ${r.user} (${r.gpu})`;
}

async function loadData() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    events = data.map(r => ({
      id: r.id,
      title: formatEventTitle(r),
      start: r.start,
      end: r.end,
      backgroundColor: colorMap[r.user] || "#999"
    }));

    calendar.removeAllEvents();
    calendar.addEventSource(events);
  } catch (err) {
    console.error("loadData error:", err);
  }
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
  const id = Date.now();

  if (!start || !end) {
    alert("시간을 입력하세요.");
    return;
  }

  if (new Date(end) <= new Date(start)) {
    alert("종료 시간은 시작 시간보다 늦어야 합니다.");
    return;
  }

  const newEvent = { id, user, gpu, start, end };

  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    if (hasConflict(newEvent, data)) {
      alert("❌ GPU 사용 시간이 겹칩니다.");
      return;
    }

    const url =
      `${API_URL}?action=add` +
      `&id=${id}` +
      `&user=${encodeURIComponent(user)}` +
      `&gpu=${encodeURIComponent(gpu)}` +
      `&start=${encodeURIComponent(start)}` +
      `&end=${encodeURIComponent(end)}`;

    await fetch(url);
    await loadData();

  } catch (err) {
    console.error("addReservation error:", err);
    alert("예약 실패");
  }
}