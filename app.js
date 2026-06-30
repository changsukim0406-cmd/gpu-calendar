const API_URL = "https://script.google.com/macros/s/AKfycbx4pm2pqiIthdNixw4rYBBhgfbmSh_wrTi3yKwFmH3KMzwtga6fgLREOcBNxyJnvHWv/exec";

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

    eventClick: async function(info) {
      const id = info.event.id;

      console.log("clicked event id:", id);

      if (!id) {
        alert("삭제 실패: event id 없음 (loadData 확인 필요)");
        return;
      }

      if (!confirm("삭제하시겠습니까?")) return;

      try {
        const res = await fetch(`${API_URL}?action=delete&id=${id}`);
        const text = await res.text();

        console.log("delete response:", text);

        await loadData();
      } catch (err) {
        console.error("delete error:", err);
        alert("삭제 실패");
      }
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
    id: r.id,
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
  const id = Date.now();

  if (!start || !end) {
    alert("시간을 입력하세요.");
    return;
  }

  const newEvent = { id, user, gpu, start, end };

  // 기존 예약 불러오기
  const res = await fetch(API_URL);
  const data = await res.json();

  // 충돌 검사
  if (hasConflict(newEvent, data)) {
    alert("❌ GPU 사용 시간이 겹칩니다.");
    return;
  }

  // 예약 추가
  const url =
    `${API_URL}?action=add` +
    `&id=${id}` +
    `&user=${encodeURIComponent(user)}` +
    `&gpu=${encodeURIComponent(gpu)}` +
    `&start=${encodeURIComponent(start)}` +
    `&end=${encodeURIComponent(end)}`;

  await fetch(url);

  await loadData();
}