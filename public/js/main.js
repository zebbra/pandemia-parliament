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
  const urlParams = getUrlParams(window.location.search); // Assume location.search = "?a=1&b=2b2"
  console.log(urlParams); // Prints { "a": 1, "b": "2b2" }

  if (urlParams.hasOwnProperty("u") && urlParams.u === "admin") {
    console.log("you are the admin");
    $(".roster").removeAttr("style");
  }

  // Socket i.o
  if (window.location.href.indexOf("lobby") > -1) {
    const socket = io.connect("http://localhost:8000");
    socket.on("clients", (clients) => {
      const container = $("<div />");
      for (i in clients) {
        container.append(
          `<button type="button" class="btn btn-light btn-sm roster-btn" id="${clients[i].id}" name="name${clients[i].id}">${clients[i].id}</button>`
        );
      }
      $(".roster").html(container);
    });
    options.roomName = "VersusVirusTeam1162-lobby";
    const api = new JitsiMeetExternalAPI(domain, options);

    $(".roster").on("click", ".roster-btn", (event) => {
      socket.emit("redirect", `${event.target.id}`);
      return false;
    });

    socket.on("redirect", (message) => {
      console.log("message: ", message);
      window.location.href = "/session";
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
    window.location.href = "/lobby";
    return false;
  });

  if (window.location.href.indexOf("session") > -1) {
    let api = new JitsiMeetExternalAPI(domain, options);
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
      d3.select("#d3-parliament-svg").datum(d).call(parliament);
    });
  }
});
