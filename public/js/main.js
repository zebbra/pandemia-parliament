const domain = [
  "open.meet.switch.ch",
  "pp.paulson.ee",
  "www.kuketz-meet.de",
  "together.lambda-it.ch",
][0];
const options = {
  roomName: "VersusVirusTeam1162",
  width: 700,
  height: 500,
  parentNode: document.querySelector("#meet"),
  configOverwrite: {
    requireDisplayName: true,
    startWithAudioMuted: true,
    // filmStripOnly: true
  },
  userInfo: {
    // ?
    email: "email@jitsiexamplemail.com",
  },
};
const adminUid = 1346;
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

$(document).ready(() => {
  const searchForMember = (query) => {
    let matches = members.slice(0, 10);
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
    const container = $("<div />");
    for (matchIdx in matches) {
      container.append(
        `<div class="btn btn-light btn-sm roster-btn" id="${matches[matchIdx].id}">` +
          `<img id="${matches[matchIdx].id}" src="https://www.parlament.ch/sitecollectionimages/profil/portrait-260/${matches[matchIdx].person_id}.jpg" />${matches[matchIdx].name}</div>`
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

  if (uid === adminUid) {
    // console.log('you are the admin')
    $(".roster").removeAttr("style");
  }

  if (window.location.href.indexOf("lobby") > -1) {
    const socketurl = `${window.location.protocol}//${window.location.host}/lobby`;
    const socket = io.connect(socketurl);

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

    options.roomName = "VersusVirusTeam1162-lobby";
    const api = new JitsiMeetExternalAPI(domain, options);
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
  }

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

  if (window.location.href.indexOf("session") > -1) {
    // Session socket.io
    const socketurl = `${window.location.protocol}//${window.location.host}/session`;
    const socket = io.connect(socketurl, {
      transports: ["websocket"],
    });

    $("#vote-yes").click(() => {
      console.log("lol");
      socket.emit("vote", {
        session: "session id",
        topic: "the current topic in the agenda",
        voting: "yes",
        member: "the member who voted",
      });
      return false;
    });

    $("#vote-no").click(() => {
      socket.emit("vote", {
        session: "session id",
        topic: "the current topic in the agenda",
        voting: "no",
        member: "the member who voted",
      });
      return false;
    });

    $("#vote-skip").click(() => {
      socket.emit("vote", {
        session: "session id",
        topic: "the current topic in the agenda",
        voting: "skip",
        member: "the member who voted",
      });
      return false;
    });

    if (uid != adminUid) {
      options.interfaceConfigOverwrite = {
        filmStripOnly: false,
        TOOLBAR_BUTTONS: [],

        SETTINGS_SECTIONS: [],
      };
    }

    let api = new JitsiMeetExternalAPI(domain, options);
    api.executeCommand("displayName", username);

    $(".nav-link").click((e) => {
      const action = $(event.target).text();
      console.log("action", action);
      if (action === "Hangup") {
        api.executeCommand("hangup");
      } else if (action === "Request to Talk") {
        api.executeCommand(
          "avatarUrl",
          "https://avatars0.githubusercontent.com/u/3671647"
        );
        alert("duly noted");
      } else if (action === "Count") {
        alert(`we have ${api.getNumberOfParticipants()} members online`);
      } else if (action === "Home") {
        api.executeCommand("toggleFilmStrip");
        api.executeCommand("toggleChat");
        api.executeCommand(
          "subject",
          `Lets talk about ${(Math.random() * 1000).toFixed(0)}`
        );
      } else if (action === "Change Room") {
        api.executeCommand("hangup");
        alert("you are being moved....");
        $("#meet").empty();
        setTimeout(() => {
          options.roomName += "2";
          api = new JitsiMeetExternalAPI(domain, options);
        }, 1000);
      }
    });

    const parliament = d3.parliament();
    console.log("parliament d3", parliament);
    parliament.width(600).height(400).innerRadiusCoef(0.4);
    parliament.enter.fromCenter(true).smallToBig(true);
    parliament.exit.toCenter(false).bigToSmall(true);

    /* register event listeners */
    parliament.on("click", (d) => {
      alert(`You clicked on a seat of ${d.party.name}`);
    });
    parliament.on("mouseover", (d) => {
      console.log(`mouse on ${d.party.name}`);
    });
    parliament.on("mouseout", (d) => {
      console.log(`mouse out of ${d.party.name}`);
    });

    /* add the parliament to the page */
    d3.json("/data/parliament.json", (d) => {
      d3.select("svg").datum(d).call(parliament);
    });

    socket.emit("joining", {
      username,
    });
    socket.on("members", (members) => {
      console.log("members: ", members);
      const container = $(
        '<div class="d-flex flex-column bd-highlight mb-3"/>'
      );
      for (clientId in members) {
        if (uid === adminUid) {
          container.append(
            `<button type="button" class="btn btn-light btn-sm member-btn m-1" id="${clientId}" name="${members[clientId].username}">${members[clientId].username}</button>`
          );
        } else {
          container.append(
            `<a href="#" class="btn btn-light btn-sm member-btn m-1 disabled" tabindex="-1" role="button" aria-disabled="true" id="${clientId}">${members[clientId].username}</a>`
          );
        }
      }
      $(".membersRoster").html(container);
    });

    socket.on("toggleMute", (message) => {
      console.log("message: ", message);
      api.executeCommand("toggleAudio");
    });

    $(".membersRoster").on("click", ".member-btn", (event) => {
      socket.emit("toggleMute", `${event.target.id}`);
      return false;
    });
  }
});
