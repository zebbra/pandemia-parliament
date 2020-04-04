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

/**
 * Accepts either a URL or querystring and returns an object associating
 * each querystring parameter to its value.
 *
 * Returns an empty object if no querystring parameters found.
 */
function getUrlParams(urlOrQueryString) {
  if ((i = urlOrQueryString.indexOf('?')) >= 0) {
    const queryString = urlOrQueryString.substring(i+1);
    if (queryString) {
      return _mapUrlParams(queryString);
    }
  }
  return {};
}

/**
 * Helper function for `getUrlParams()`
 * Builds the querystring parameter to value object map.
 *
 * @param queryString {string} - The full querystring, without the leading '?'.
 */
function _mapUrlParams(queryString) {
  return queryString
    .split('&')
    .map(function(keyValueString) { return keyValueString.split('=') })
    .reduce(function(urlParams, [key, value]) {
      if (Number.isInteger(parseInt(value)) && parseInt(value) == value) {
        urlParams[key] = parseInt(value);
      } else {
        urlParams[key] = decodeURI(value);
      }
      return urlParams;
    }, {});
}


$(document).ready(function() {


  let urlParams = getUrlParams(window.location.search); // Assume location.search = "?a=1&b=2b2"
  //console.log(urlParams); // Prints { "a": 1, "b": "2b2" }

  const username = urlParams.hasOwnProperty('u') ? urlParams.u : undefined;
  //console.log("using username", username);

  if (username === 'admin'){
    //console.log('you are the admin')
    $(".roster").removeAttr("style");
  }

  if (window.location.href.indexOf("lobby") > -1){
    
    const socketurl = window.location.protocol+'//'+window.location.host+'/lobby'

    let socket = io.connect(socketurl);

    socket.emit('joining', {username: username});

    socket.on('users', users => {
      let container = $('<div />');
      for(clientId in users) {
        // if (clientId === socket.id) {
        container.append('<button type="button" class="btn btn-light btn-sm roster-btn" id="' + clientId + '" name="' + users[clientId].username + '">' + users[clientId].username + '</button>');
        // }
      }
      $('.roster').html(container);
    });

    options.roomName = 'VersusVirusTeam1162-lobby'
    //let api = new JitsiMeetExternalAPI(domain, options);

    $(".roster").on("click", ".roster-btn", function(event) {
      socket.emit('redirect', `${event.target.id}`)
      return false;
    });

    socket.on("redirect", message => {
      console.log('message: ', message)
      getUrlParams(window.location.search)
      window.location.href = "/session?u="+username
    })
  }

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
    console.log('after_registration');
    const username = $('#registration_name').val();
    window.location.href = "/lobby?u=" + username;
    return false;
  });

  if (window.location.href.indexOf("session") > -1) {

    if (username != 'admin'){
      options.interfaceConfigOverwrite = {
        filmStripOnly: false,
        TOOLBAR_BUTTONS: [
        ],
  
        SETTINGS_SECTIONS: [ ],
      }
    }

    let api = new JitsiMeetExternalAPI(domain, options);
    api.executeCommand('displayName', username);

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

    // Session socket.io 
    const socketurl = window.location.protocol+'//'+window.location.host+'/session'
    let socket = io.connect(socketurl, {transports: ['websocket']});
    socket.emit('joining', {username: username});
    socket.on('members', members => {
      console.log('members: ', members)
      let container = $('<div class="d-flex flex-column bd-highlight mb-3"/>');
      for(clientId in members) {
        if(username === 'admin'){
          container.append('<button type="button" class="btn btn-light btn-sm member-btn m-1" id="' + clientId + '" name="' + members[clientId].username + '">' + members[clientId].username + '</button>');
        } else {
          container.append('<a href="#" class="btn btn-light btn-sm member-btn m-1 disabled" tabindex="-1" role="button" aria-disabled="true" id="' + clientId + '">' + members[clientId].username + '</a>');
        }
      }
      $('.membersRoster').html(container);
    });

    socket.on("toggleMute", message => {
      console.log('message: ', message)
      api.executeCommand('toggleAudio');
    })

    $(".membersRoster").on("click", ".member-btn", function(event) {
      socket.emit('toggleMute', `${event.target.id}`)
      return false;
    });
  }
});
