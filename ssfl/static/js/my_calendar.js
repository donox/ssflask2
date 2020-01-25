$(document).ready(function () {
  // var foo = $.fn.Calendar;
  var calendar = new FullCalendar.Calendar(calendarEl, {
    dateClick: function () {
      alert('a day has been clicked!');
    }
  });
// cal.on('dateClick', function(info) {
//   console.log('clicked on ' + info.dateStr);
// });
  alert("IMPORTED");
})