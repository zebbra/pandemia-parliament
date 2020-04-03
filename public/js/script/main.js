const domain = ['open.meet.switch.ch',  'pp.paulson.ee', 'www.kuketz-meet.de', 'together.lambda-it.ch'][0];
const options = {
    roomName: 'VersusVirusTeam116',
    width: 1024,
    height: 600,
    parentNode: document.querySelector('#meet'),
    configOverwrite: {
      requireDisplayName: true,
      startWithAudioMuted: true,
      // filmStripOnly: true
    },
    userInfo: { //?
      email: 'email@jitsiexamplemail.com'
  }
};
let api = new JitsiMeetExternalAPI(domain, options);

// setTimeout(() => {
//   api.getAvailableDevices().then(devices => {
//     console.log("DEBUG", devices)
//   })
// }, 2000)

$(document).ready(function() {

  $(".nav-link").click(function(e){
    const action = $(event.target).text();
    console.log("action", action)
    if (action === "Hangup") {
      api.executeCommand('hangup');
    } else if (action === "Request to Talk") {
      api.executeCommand('avatarUrl', 'https://avatars0.githubusercontent.com/u/3671647');
      alert('duly noted')
    } else if (action === "Count") {
      alert("we have " + api.getNumberOfParticipants() + " members online")
    } else if (action === "Home") {
      api.executeCommand('toggleFilmStrip');
      api.executeCommand('toggleChat');
      api.executeCommand('subject', 'Lets talk about ' + (Math.random()*1000).toFixed(0));
    } else if (action === "Change Room") {
      api.executeCommand('hangup');
      alert("you are being moved....")
      $("#meet").empty()
      setTimeout(() => {
        options.roomName = options.roomName + "2"
        api = new JitsiMeetExternalAPI(domain, options);
      }, 1000)
    }
  });
});