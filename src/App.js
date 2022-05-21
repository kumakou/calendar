import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import allLocales from "@fullcalendar/core/locales-all";
import holiday_jp from "@holiday-jp/holiday_jp";
import interactionPlugin from "@fullcalendar/interaction";
import { useCallback, useEffect, useState, createRef } from "react";
import { v4 as uuidv4 } from "uuid";
import "./App.css";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";

function App() {
  const [events, setEvent] = useState([]);
  const [holiday, setHoliday] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const holidays = holiday_jp.between(
        new Date("2022-04-01"),
        new Date("2030-04-01")
      );
      const holidays_to_calender = holidays.map((holiday) => {
        const date = holiday.date.toISOString().replace(/T.*$/, "");
        return {
          id: uuidv4(),
          title: holiday.name,
          date,
          classNames: ["holiday"],
          display: "background",
          backgroundColor: "#ffeaea",
          borderColor: "#ffeaea",
        };
      });

      const querySnapshot = await getDocs(collection(db, "events"));
      querySnapshot.forEach((doc) => {
        console.log(doc.id, " => ", doc.data());
        setEvent((pre) => [...pre, doc.data()]);
      });

      setHoliday(holidays_to_calender);
    }
    fetchData();
  }, []);

  const calendarRef = createRef();

  const handleSelect = useCallback(async (arg) => {
    let title = prompt("追加するイベント名を入力してください");
    if (title) {
      const id = uuidv4();
      setEvent((pre) => [
        ...pre,
        { id, title, start: arg.startStr, end: arg.endStr },
      ]);

      await setDoc(doc(db, "events", id), {
        id,
        title,
        start: arg.startStr,
        end: arg.endStr,
      });
    }
  }, []);

  const handleEventClick = useCallback(async (arg) => {
    if (window.confirm(`「${arg.event.title}」を消しますか？`)) {
      setEvent((pre) => pre.filter((event) => event.id !== arg.event.id));

      await deleteDoc(doc(db, "events", arg.event.id));
    }
  }, []);

  return (
    <div className="App">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        headerToolbar={{
          center: "title",
          right: "prev,next today",
        }}
        events={{ events: [...events, ...holiday] }}
        initialView="dayGridMonth"
        locales={allLocales}
        locale="ja"
        selectable={true}
        dayMaxEvents={true}
        eventClick={handleEventClick}
        select={handleSelect}
        validRange={{
          start: "2022-04-01",
          end: "2030-04-01",
        }}
      />
    </div>
  );
}

export default App;
