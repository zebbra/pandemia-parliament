const domain = ['open.meet.switch.ch',  'pp.paulson.ee', 'www.kuketz-meet.de', 'together.lambda-it.ch'][0];
const options = {
    roomName: 'VersusVirusTeam1162',
    width: 700,
    height: 500,
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

// if (window.location.href)
// 

// setTimeout(() => {
//   api.getAvailableDevices().then(devices => {
//     console.log("DEBUG", devices)
//   })
// }, 2000)

$(document).ready(function() {

  // Socket i.o
  let socket = io.connect(window.location.href);
  socket.on('greet', function (data) {
    console.log(data);
    socket.emit('respond', { message: 'Hey there, server!' });
  });
  
  
  $("#gotosession").click(function(){
    console.log('gotosession')
    window.location.href = "/session"
    return false;
  });

  $("#visitor_access").click(function(){
    console.log('visitor_access')
    window.location.href = "/visitor"
    return false;
  });

  $("#parliamentarian_access").click(function(){
    console.log('parliamentarian_access')
    window.location.href = "/register"
    return false;
  });

  $("#after_registration").click(function(){
    console.log('after_registration')
    window.location.href = "/lobby"
    return false;
  });
  

  if (window.location.href.indexOf("session") > -1) {
    let api = new JitsiMeetExternalAPI(domain, options);
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
  
  
    var parliament = d3.parliament();
    console.log("parliament d3", parliament)
    parliament.width(600).height(400).innerRadiusCoef(0.4);
    parliament.enter.fromCenter(true).smallToBig(true);
    parliament.exit.toCenter(false).bigToSmall(true);
  
    /* register event listeners */
    parliament.on("click", function(d) { alert("You clicked on a seat of " + d.party.name); });
    parliament.on("mouseover", function(d) { console.log("mouse on " + d.party.name); });
    parliament.on("mouseout", function(d) { console.log("mouse out of " + d.party.name); });
  
    /* add the parliament to the page */
    d3.json("/data/parliament.json", function(d) {
        d3.select("svg").datum(d).call(parliament);
    });

  }

});