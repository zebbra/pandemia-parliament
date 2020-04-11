/**
 * Module dependencies.
 */
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const flash = require('express-flash');
const path = require('path');
// const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const multer = require('multer');

const upload = multer({ dest: path.join(__dirname, 'uploads') });

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: '.env.example' });

/**
 * Controllers (route handlers).
 */
const lobbyController = require('./controllers/lobby');
const sessionController = require('./controllers/session');
const contactController = require('./controllers/contact');
const welcomeController = require('./controllers/welcome');
const registerController = require('./controllers/register');
const visitorController = require('./controllers/visitor');
const videoController = require('./controllers/video');


/**
 * Create Express server.
 */
const app = express();

/**
 * Express configuration.
 */
app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// app.use(expressStatusMonitor());
app.use(compression());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public')
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  cookie: { maxAge: 1209600000 } // two weeks in milliseconds
}));
app.use(flash());
app.use((req, res, next) => {
  if (req.path === '/api/upload') {
    // Multer multipart/form-data handling needs to occur before the Lusca CSRF check.
    next();
  } else {
    lusca.csrf()(req, res, next);
  }
});
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user
    && req.path !== '/login'
    && req.path !== '/signup'
    && !req.path.match(/^\/auth/)
    && !req.path.match(/\./)) {
    req.session.returnTo = req.originalUrl;
  } else if (req.user
    && (req.path === '/account' || req.path.match(/^\/api/))) {
    req.session.returnTo = req.originalUrl;
  }
  next();
});
app.use('/', express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/chart.js/dist'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/popper.js/dist/umd'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/jquery/dist'), { maxAge: 31557600000 }));
app.use('/webfonts', express.static(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/webfonts'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/d3-parliament'), { maxAge: 31557600000 }));


/**
 * Primary app routes.
 */
app.get('/', welcomeController.index);
app.get('/visitor', visitorController.index);
app.get('/register', registerController.index);
app.get('/lobby', lobbyController.index);
app.get('/session', sessionController.index);
app.get('/video', videoController.index);

// // letsencrypt
// app.get('/.well-known/acme-challenge/:content', (req, res) => {
//   res.send('mVGXITfqgG_oDn5aj3g5w_JuKMiotFJa0i0z9-c0yes.xMyvIUr0UL-PLKNrJWIQGrk0lJKEIf5_VVhRVhkW0Xk')
// })

/**
 * Scoket io
 */
//const io = require('socket.io').listen(server);
const server = require('http').Server(app);
const io = require("socket.io")(server);
let users = {};

const lobbynsp = io.of('/lobby');
const sessnp = io.of('/session');

lobbynsp.on("connection", (socket) => {
  console.log(`Client connected [id=${socket.id}]`);
  // initialize this client's sequence number
  const newClient = {
    id: socket.id,
  };
  lobbynsp.emit('users', users);

  socket.on('redirect', msg => {
    lobbynsp.to(`${msg}`).emit('redirect', 'hey, the admin know you');
  });

  // when socket disconnects, remove it from the list:
  socket.on("disconnect", () => {
    delete users[socket.id];
    console.log(`Client gone [id=${socket.id}]`);
    lobbynsp.emit('users', users);
  });

  socket.on('joining', (msg) => {
    console.log(msg);
    users[socket.id] = msg;
    lobbynsp.emit('users', users);
  });
});

let agenda = [
  {
    name: 'Welcome',
    status: 'done',
    id: 1
  },
  {
    name: 'Council President election',
    status: 'active',
    candidate: '',
    id: 2
  },
  {
    name: 'Funding of pademia parliament',
    status: 'up',
    id: 3
  },
  {
    name: 'Livestock summer grazing.',
    status: 'up',
    id: 4
  },
]

let members = {};
let sessionState = {started:false, voteActive:false, agenda:agenda}
let adminUid = 1346

let votesession = {
  topic:'',
  pieData: {
    yes: 0,
    no: 0,
    skip: 0,
  },
};

const _moveToNextTopic = () => {
  const currentActieIndex = agenda.findIndex(item => item.status === 'active')
  agenda[currentActieIndex].status = 'done'
  agenda[currentActieIndex + 1].status = 'active'
}

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

const checkVotes = () => {
  const numberOfVotes = votesession.pieData.yes + votesession.pieData.skip + votesession.pieData.no
  if (numberOfVotes === Object.keys(members).length) {
    console.log('all have voted')
    const highest = Math.max(votesession.pieData.yes,  votesession.pieData.skip, votesession.pieData.no);
    const result = getKeyByValue(votesession.pieData, highest)
    console.log('result: ', result)
    return result
  }
};

sessnp.on("connection", (socket) => {
  console.log(`Client connected to session namespace [id=${socket.id}]`);
  // initialize this client's sequence number
  socket.on('joining', (msg) => {
    console.log(msg);
    members[socket.id] = msg;
    sessnp.emit('members', members);
  });

  socket.on("disconnect", () => {
    delete members[socket.id];
    console.log(`Client gone form session [id=${socket.id}]`);
    sessnp.emit('members', members);  });

  socket.on('toggleMute', msg => {
    const socketID = Object.keys(members).find(key => members[key].id === parseInt(msg));
    console.log('toggleMute on : ', {msg:msg, socketID:socketID})
    sessnp.to(`${socketID}`).emit('toggleMute', 'hey, lets toggle your audio');
  });

  socket.on('toggleRaiseHand', msg => {
    const adminSocketId = Object.keys(members).find(key => members[key].id === adminUid);
    console.log('toggleRaiseHand on : ', {msg:msg, adminSocketId:adminSocketId})
    sessnp.to(adminSocketId).emit('toggleRaiseHand', msg);
  });

  socket.on('vote', msg => {
    console.log('vote: ', {msg:msg})
    if (msg === 'reset'){
      io.of('/session').emit('vote', 'reset');
      votesession.pieData = {yes: 0, no: 0, skip: 0}; 
    }
    if (msg === 'start'){
      const currentTopic = agenda.filter(item => {
        return item.status === 'active'
      })
      votesession.topic = currentTopic
      io.of('/session').emit('vote', 'start');
    }

    if (msg.voting === 'skip'){
      votesession.pieData.skip ++
    }
    if (msg.voting === 'yes'){
      votesession.pieData.yes ++
    }
    if (msg.voting === 'no'){
      votesession.pieData.no ++
    }

    if (checkVotes() === 'yes'){
      if (agenda[1].status === 'active'){
        const msg = votesession.topic[0].candidate.id
        adminUid = msg
        const socketID = Object.keys(members).find(key => members[key].id === parseInt(msg));
        io.of('/session').emit('vote', 'reset');
        votesession.pieData = {yes: 0, no: 0, skip: 0};
        sessionState.voteActive = false
        _moveToNextTopic()
        io.of('/session').emit('notification', {voteResult:{agenda:{id:1}, winner:members[socketID]}});
        io.of('/session').emit('stateOfSession', sessionState);
      }
    }
    io.of('/session').emit('vote', votesession);
  });
  
  socket.on('voteSession', () => {
    socket.emit('voteSession', votesession);
  });

  socket.on('getSession', () => {
    if (Object.keys(members).length === 0 && members.constructor === Object) {
      socket.emit('getSession', false);
    } else {
      socket.emit('getSession', true);
    }
  });

  socket.on('stateOfSession', () => {
    socket.emit('stateOfSession', sessionState);
  })

  socket.on('startDemo', () => {
    sessionState.started = true
    sessionState.voteActive = true
    sessionState.agenda[1].candidate = randomProperty(members)
    socket.emit('stateOfSession', sessionState);
  })

  socket.on('adminUid', () => {
    socket.emit('adminUid', adminUid);
  })

  socket.on('resetSession', () => {
    agenda = [
      {
        name: 'Welcome',
        status: 'done'
      },
      {
        name: 'Council President election',
        status: 'active',
        candidate: ''
      },
      {
        name: 'Funding of pademia parliament',
        status: 'up'
      },
      {
        name: 'Funding of pademia parliament ballot',
        status: 'up'
      },
    ]
    
    sessionState = {started:false, voteActive:false, agenda:agenda}
    adminUid = 1346
    
    votesession = {
      topic:'',
      pieData: {
        yes: 0,
        no: 0,
        skip: 0,
      },
    };
    io.of('/session').emit('resetSession');
  })

});

//to get random value from object
var randomProperty = function (obj) {
  var keys = Object.keys(obj);
  return obj[keys[ keys.length * Math.random() << 0]];
};

/**
 * Error Handler.
 */
if (process.env.NODE_ENV === 'development') {
  // only use in development
  app.use(errorHandler());
} else {
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Server Error');
  });
}

/**
 * Start Express server.
 */
server.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});

module.exports = app;
