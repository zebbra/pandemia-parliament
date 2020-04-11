const domain = [
  "open.meet.switch.ch",
  "meet.jit.si",
  "www.kuketz-meet.de",
  "together.lambda-it.ch",
][0];
let options = {
    roomName: 'pandemia-covernment',
    // width: 700,
    // height: 500,
    parentNode: document.querySelector('#meet'),
    configOverwrite: {
      requireDisplayName: false,
      startWithAudioMuted: true,
      // filmStripOnly: true
    },
    interfaceConfigOverwrite: {
      TOOLBAR_BUTTONS: [
        'microphone', 'camera', 'desktop', 'fullscreen',
        'fodeviceselection', 'hangup', 'profile', 'chat',
        'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
        'videoquality', 'filmstrip', 'invite', 'stats',
        'tileview',  'help', 'mute-everyone'
      ],
      // not used options:'closedcaptions', 'recording', 'feedback', 'shortcuts', 'videobackgroundblur',  'download',
    }
    // userInfo: { //?
    //   email: 'email@jitsiexamplemail.com'
    // }
};

let adminUid = 1346
const lobbyAdminUid = 1346
/**
 * Make an element's height equal to its width and sets an event handler to keep doing it
 * @param {string} element - Selector of the element to make square
 * @param {float} [ratio=1] - What ratio to keep between the width and height
 * @param {integer} [minLimit=0] - Only square the element when the viewport width is above this limit
 */
function squareThis (element, ratio, minLimit)
{
    // First of all, let's square the element
    square(ratio, minLimit);

    // Now we'll add an event listener so it happens automatically
    window.addEventListener('resize', function(event) {
        square(ratio, minLimit);
    });
    
    // This is just an inner function to help us keep DRY
    function square(ratio, minLimit)
    {
        if(typeof(ratio) === "undefined")
        {
            ratio = 1;
        }
        if(typeof(minLimit) === "undefined")
        {
            minLimit = 0;
        }
        var viewportWidth = window.innerWidth;
        
        if(viewportWidth >= minLimit)
        {
            var newElementHeight = $(element).width() * ratio;
            $(element).height(newElementHeight);
        }
        else
        {
            $(element).height('auto');
        }
    }
}

/**
 * Accepts either a URL or querystring and returns an object associating
 * each querystring parameter to its value.
 *
 * Returns an empty object if no querystring parameters found.
 */
function getUrlParams(urlOrQueryString) {
  if ((i = urlOrQueryString.indexOf("?")) >= 0) {
    const queryString = urlOrQueryString.substring(i + 1);
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
    .split("&")
    .map((keyValueString) => keyValueString.split("="))
    .reduce((urlParams, [key, value]) => {
      if (Number.isInteger(parseInt(value)) && parseInt(value) == value) {
        urlParams[key] = parseInt(value);
      } else {
        urlParams[key] = decodeURI(value);
      }
      return urlParams;
    }, {});
}

// move user to https if http is used
const dev = true

if (!dev && location.protocol !== 'https:') {
  location.replace(`https:${location.href.substring(location.protocol.length)}`);
}

$.fn.redraw = function(){
  $(this).each(function(){
    var redraw = this.offsetHeight;
  });
};

$(document).ready(function() {

  $('#resetSession').hide()
  $(function () {
    $('[data-toggle="tooltip"]').tooltip()
  })

  const memberImage = (id, person_id) =>
    `<img id="${id}" src="https://www.parlament.ch/sitecollectionimages/profil/portrait-260/${person_id}.jpg" class="img-thumbnail rounded"/>`;

  const memberById = (id) =>
    members.find((member) => member['id'] === id);

  const searchForMember = (query) => {
    let matches = members.slice(0, 3);
    if (query) {
      const queryLower = query.toLowerCase();
      matches = members
        .filter(
          (value) =>
            value.given_name.toLowerCase().startsWith(queryLower) ||
            value.family_name.toLowerCase().startsWith(queryLower)
        )
        .slice(0, 10);
    }
    const container = $('<div class="d-flex flex-row"/>');
    for (matchIdx in matches) {
      container.append(
        '<div class="d-flex flex-column btn btn-light btn-sm roster-btn" id="' + matches[matchIdx]['id'] + '">' +
          memberImage(matches[matchIdx]['id'], matches[matchIdx]['person_id']) +
          matches[matchIdx]['name'] +
        '</div>'
      );
    }
    $(".registration_members_list").html(container);

    $(".registration_members_list").on("click", ".roster-btn", (event) => {
      const uid = event.target.id;
      const member = members.find((value) => value.id === uid);
      const username = member.name;
      window.location.href = `/lobby?u=${username}&uid=${member.id}`;
    });
  };

  let members = [];
  $.getJSON("/data/members.json", (data) => {
    members = data;
    searchForMember();
  });

  const urlParams = getUrlParams(window.location.search); // Assume location.search = "?a=1&b=2b2"
  // console.log(urlParams); // Prints { "a": 1, "b": "2b2" }

  const username = urlParams.hasOwnProperty("u") ? urlParams.u : undefined;
  const uid = urlParams.hasOwnProperty("uid") ? urlParams.uid : undefined;

  console.log("using uid", uid);

  if (uid === lobbyAdminUid) {
    // console.log('you are the admin')
    $(".roster").removeAttr("style");
  }
  if (window.location.href.indexOf("visitor") > -1) {

    squareThis('#visitorview', 0.67);

    // $('#visitorview').css('opacity', '0');
    $('#visitorview').hide();
    $('#visitorviewText').text('Currently there is no Live session');

    options = {
      roomName: 'pandemia-covernment',
      parentNode: document.querySelector("#visitorview"),
      configOverwrite: {
        requireDisplayName: true,
        startWithAudioMuted: true,
        startWithVideoMuted: true,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: ["chat", "tileview"], // 'hangup'
        SETTINGS_SECTIONS: [], // 'devices'
      },
    };

    const socketurl = window.location.protocol+'//'+window.location.host+'/session'
    let socket = io.connect(socketurl);
    socket.emit('getSession');
    socket.on('getSession', (msg) => {
      if (msg) {
        const api = new JitsiMeetExternalAPI(domain, options);
        api.executeCommand("displayName", 'Visitor');
        $('#visitorviewText').text('Livestream of Swiss Parliament EXTRAORDINARY SESSION');
        $('#visitorview').show();
        $('#noVideoIcon').hide();
      }
    });
  }

  /////// Lobbbyy

  if (window.location.href.indexOf("lobby") > -1){

    squareThis('#meet', 0.67);

    const socketurl = window.location.protocol+'//'+window.location.host+'/lobby'
    let socket = io.connect(socketurl);

    socket.emit("joining", { username });

    socket.on("users", (users) => {
      const container = $("<div />");
      for (clientId in users) {
        // if (clientId === socket.id) {
        container.append(
          `<button type="button" class="btn btn-light btn-sm roster-btn" id="${clientId}" name="${users[clientId].username}">${users[clientId].username}</button>`
        );
        // }
      }
      $(".roster").html(container);
    });

    options.roomName = 'pandemia-covernment-lobby'
    let api = new JitsiMeetExternalAPI(domain, options);
    api.executeCommand("displayName", username);

    $(".roster").on("click", ".roster-btn", (event) => {
      socket.emit("redirect", `${event.target.id}`);
      return false;
    });

    socket.on("redirect", (message) => {
      console.log("message: ", message);
      getUrlParams(window.location.search);
      window.location.href = `/session?u=${username}&uid=${uid}`;
    });
    
    let count = 10
    $('#countdown').text(count);

    var x = setInterval(function() {
      if (count > 0) {
        count --
        $('#countdown').text(count);
      } else {
        window.location.href = `/session?u=${username}&uid=${uid}`;
      }
    }, 1000);
  
  }

  /////// Overall

  $("#gotosession").click(() => {
    console.log("gotosession");
    window.location.href = "/session";
    return false;
  });

  $("#visitor_access").click(() => {
    console.log("visitor_access");
    window.location.href = "/visitor";
    return false;
  });

  $("#parliamentarian_access").click(() => {
    console.log("parliamentarian_access");
    window.location.href = "/register";
    return false;
  });

  $("#after_registration").click(() => {
    console.log("after_registration");
    const username = $("#registration_name").val();
    window.location.href = `/lobby?u=${username}`;
    return false;
  });

  $("#registration_name").keyup((e) => {
    const { value } = e.target;
    searchForMember(value);
  });


  /////// SESSION

  const _renderMembers = (members_in_session) => {
    setTimeout(() => {
      console.log('members: ', members_in_session)
      let container = $('<div class="d-flex flex-column bd-highlight mb-3"/>');
      for (clientId in members_in_session) {
        const member = members_in_session[clientId];
        const memberObj = members.find((m) => m.id == member.id);
        if (uid === adminUid) {
          // container.append('<button type="button" class="btn btn-light btn-sm member-btn m-1" id="' + clientId + '" name="' + member.username + '">' + member.username + '</button>');
          container.append(
            '<a href="#" class="btn btn-light btn-sm member-btn m-1" tabindex="-1" role="button" aria-disabled="true" id="' + clientId + '">' +
            memberImage(member.id, memberObj.person_id) +
            member.username +
            '</a>');
        } else {
          container.append(
            '<a href="#" class="btn btn-light btn-sm member-btn m-1 disabled" tabindex="-1" role="button" aria-disabled="true" id="' + clientId + '">' +
            memberImage(member.id, memberObj.person_id) +
            member.username +
            '</a>');
        }
      }
      $('.membersRoster')
        .html(container);
    }, members === undefined ? 1000 : 0);
  }

  /* const _startJits = (options) => {
    let api = new JitsiMeetExternalAPI(domain, options);
    api.executeCommand("displayName", username);
  } */

  if (window.location.href.indexOf("session") > -1) {
    $('#resetSession').show()

    $.confirm({
        title: 'You are now in session',
        content: 'The first topic of today is election of Council President, You will be able to vote down below. If you arrived late to the session another topic could be active. The agenda of the day is on the left side, members of parliament are listed on the rights side. If you want to adress some points please raise hand before talking. Have fun!',
        type: 'blue',
        buttons: {   
            ok: {
                text: "ok!",
                btnClass: 'btn-primary',
                keys: ['enter'],
                action: function(){
                    console.log('the user clicked confirm');
                }
            },

        }
    });

    // Session socket.io
    const socketurl = `${window.location.protocol}//${window.location.host}/session`;
    const socket = io.connect(socketurl, {
      transports: ["websocket"],
    });
    socket.emit("adminUid");

    socket.on("adminUid", (msg) => {
      adminUid = msg
      if (uid === adminUid) {
        $("#startVote").show()
      }
    });

    if (uid != adminUid) {
      options.interfaceConfigOverwrite = {
        filmStripOnly: false,
        // TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'raisehand'],
        TOOLBAR_BUTTONS: ['camera', 'desktop'],
        SETTINGS_SECTIONS: [],
      };
      $("#startVote").hide()
    }

    let api = new JitsiMeetExternalAPI(domain, options);
    api.executeCommand("displayName", username);

    let members_in_session

    let requestToTalkActive = false
    let voteStarted = false

    $(".votingElement").hide()

    socket.on("notification", (msg) => {
      if (msg.voteResult.agenda.id === 1) {
        //Check if I am winner
        if (msg.voteResult.winner.id === parseInt(uid)) {
          adminUid = uid
          _renderMembers(members_in_session)
          $("#startVote").show()
          $.confirm({
            title: 'Congratulations',
            content: 'You have been voted to be the Council President, you are now in admin mode which gives you the  the ability to let other members talks and initiate votes on other topics.',
            type: 'blue',
            buttons: {   
              ok: {
                  text: "ok!",
                  btnClass: 'btn-primary',
                  keys: ['enter'],
                  action: function(){
                      console.log('the user clicked confirm');
                  }
              },
            }
          })
        } else {
          $.confirm({
            title: 'New President has been elected',
            content: `By popular vote, the new President is ${msg.voteResult.winner.username}. Now you have the possibility to discuss over the next topic in the Agenda, If you wish to talk please raise your hand and the president can give you access to the floor.`,
            type: 'blue',
            buttons: {   
              ok: {
                  text: "ok!",
                  btnClass: 'btn-primary',
                  keys: ['enter'],
                  action: function(){
                      console.log('the user clicked confirm');
                  }
              },
            }
          })
        }
      }
    });

    socket.emit("voteSession", {
      session: "session id",
    });
    socket.on("voteSession", (msg) => {
      if (msg.pieData.yes > 0 || msg.pieData > 0 || msg.pieData.skip > 0) { setVoteData(msg.pieData) }
    });
    socket.on("vote", (msg) => {
      if (msg === 'reset'){
        console.log('vote reset')
        voteStarted = false
        $(".votingElement").hide()
      } 

      if (msg === 'start') {
        console.log('vote start')
        $(".votingElement").show()
        $("#vote-no").show()
        $("#vote-yes").show()
        $("#vote-skip").show()
        
      }
      if (msg.pieData) {
        setVoteData(msg.pieData)
      }
    });

    $("#vote-yes").click(() => {
      console.log("vote-yes");
      socket.emit("vote", {
        session: "session id",
        topic: "the current topic in the agenda",
        voting: "yes",
        member: uid,
      });
      $("#vote-no").hide()
      $("#vote-yes").hide()
      $("#vote-skip").hide()
      return false;
    });
    squareThis('#meet', 0.67);

    $("#vote-no").click(() => {
      console.log("vote-no");
      socket.emit("vote", {
        session: "session id",
        topic: "the current topic in the agenda",
        voting: "no",
        member: uid,
      });
      $("#vote-no").hide()
      $("#vote-yes").hide()
      $("#vote-skip").hide()
      return false;
    });

    $("#vote-skip").click(() => {
      console.log("vote-skip");
      socket.emit("vote", {
        session: "session id",
        topic: "the current topic in the agenda",
        voting: "skip",
        member: uid,
      });
      $("#vote-no").hide()
      $("#vote-yes").hide()
      $("#vote-skip").hide()
      return false;
    });
    
/*     const parliament = d3.parliament();
    console.log("parliament d3", parliament);
    parliament.width(600).height(400).innerRadiusCoef(0.4);
    parliament.enter.fromCenter(true).smallToBig(true);
    parliament.exit.toCenter(false).bigToSmall(true);

    // register event listeners
    parliament.on("click", (d) => {
      alert(`You clicked on a seat of ${d.party.name}`);
    });
    parliament.on("mouseover", (d) => {
      console.log(`mouse on ${d.party.name}`);
    });
    parliament.on("mouseout", (d) => {
      console.log(`mouse out of ${d.party.name}`);
    });

    // add the parliament to the page
    d3.json("/data/parliament.json", (d) => {
      d3.select("svg").datum(d).call(parliament);
    }); */

    // Session socket.io
    socket.emit('joining', {username: username, id: uid});

    socket.on('members', msg => {
      members_in_session = msg
      // as members may not have been loaded delay rendering... ...
      _renderMembers(members_in_session)
    });

    socket.on("toggleMute", (message) => {
      api.executeCommand("toggleAudio");
      api.isAudioMuted().then(muted => {
        if (muted){
          $("#meet").removeClass("border border-primary border-3");
        } else {
          $("#meet").addClass("border border-primary border-3");
        }
      });
      //console.log("message: ", message);
      $("#requestToTalk").addClass("text-muted");
      $("#requestToTalk").removeClass("text-primary");
      requestToTalkActive = !requestToTalkActive
    });

    $(".membersRoster").on("click", ".member-btn", (event) => {
      $(`#${event.target.id}`).removeClass("btn-primary");
      socket.emit("toggleMute", `${event.target.id}`);
      return false;
    });

    socket.on("toggleRaiseHand", (message) => {
      console.log(message)
      if (message.state){
        $(`#${message.id}`).addClass("btn-primary");
      } else {
        $(`#${message.id}`).removeClass("btn-primary");
      }
    });

    $("#sessionControl").on("click", "#requestToTalk", (event) => {
      if (requestToTalkActive) {
        $("#requestToTalk").addClass("text-muted");
        $("#requestToTalk").removeClass("text-primary");
        $("#requestToTalkIcon").addClass( "text-info" )
        socket.emit("toggleRaiseHand", {state:!requestToTalkActive, id:uid});
      } else {
        $("#requestToTalk").removeClass("text-muted");
        $("#requestToTalk").addClass("text-primary");
        $("#requestToTalkIcon").removeClass( "text-info" )
        socket.emit("toggleRaiseHand", {state:!requestToTalkActive, id:uid});
      } 
      requestToTalkActive = !requestToTalkActive
    }); 

    $("#requestToTalk").hover(() => {
      if (!requestToTalkActive) {
        $("#requestToTalkIcon").toggleClass( "text-info" )
      }
    });

    $("#sessionControl").on("click", "#startVote", (event) => {
      if (voteStarted) {
        //End vote
        socket.emit("vote", "reset");
      } else {
        //Start vote
        socket.emit("vote", "start");
        socket.emit("voteSession", {
          session: "session id",
        });
      } 
      voteStarted = !voteStarted
    });

    ///// SELF-Service Demo
    socket.emit("stateOfSession")
    socket.on("stateOfSession" , (msg) => {
      if (!msg.started){
        socket.emit("startDemo")
      }
      //console.log(msg)
      let container = $('<div class="list-group"/>');
      for (item in msg.agenda) {
        if (msg.agenda[item].status === 'done') {
          container.append('<button class="btn-sm list-group-item list-group-item-action disabled">' + msg.agenda[item].name + '</button>');
        }
        if (msg.agenda[item].status === 'active') {
          container.append('<button class="btn-sm list-group-item list-group-item-action active">' + msg.agenda[item].name + '</button>');
        }
        if (msg.agenda[item].status === 'up') {
          container.append('<button class="btn-sm list-group-item list-group-item-action disabled">' + msg.agenda[item].name + '</button>');
        }
      }
      $('#agenda').html(container);

      if(msg.voteActive){
        $("#startVote").click();
        const topic = msg.agenda.filter(item => {
          console.log(item.status)
          return item.status === 'active'
        })
        if (topic[0].candidate){
          $("#votingMessage").text(`Vote ${topic[0].candidate.username} for Council President`);
        } else {
          $("#votingMessage").text(`Vote active for topic: ${topic[0].name}`);
        } 
      }
      if (!msg.voteActive) {
        $("#votingMessage").text('')
      }

    })
    $('#resetSession').click(() => {
      socket.emit('resetSession')
    })
    socket.on('resetSession', () => {
      window.location.href = `/lobby?u=${username}&uid=${uid}`
    })
  }
});
