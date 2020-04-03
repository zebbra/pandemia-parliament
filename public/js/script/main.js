const domain = 'open.meet.switch.ch'// pp.paulson.ee/';
const options = {
    roomName: 'VersusVirusTeam116',
    width: 700,
    height: 700,
    parentNode: document.querySelector('#meet')
};
const api = new JitsiMeetExternalAPI(domain, options);