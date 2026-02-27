import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const GymCalendar = () => {
  const [date, setDate] = useState(new Date());

  const handleDateChange = (date) => {
    setDate(date);
  };

  return (
    <>
      <h2>Gym Schedule</h2>
      <Calendar
        onChange={handleDateChange}
        value={date}
      />
      <p>Selected Date: {date.toDateString()}</p>
      </>
  );
};

export default GymCalendar;
