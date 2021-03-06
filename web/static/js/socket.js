import { Socket } from 'phoenix';
// import { updatePlayersList, initNewPlayer, handlePlayerLeft } from './login';
import * as chat from './chat';
import * as login from './login/index';
import { handlePlayers } from './index';
let players = {};
let channel = 'dupa';
// Start the connection to the socket and joins the channel
// Does initialization and key binding

function addChannelListeners(channel, document) {
  var chatOpen = false;
  document.getElementById('leftButton').addEventListener('click', () => {
    channel.push('player:left', { });
  });

  chat.sendButton.addEventListener('click', () => {
    chat.pushMessage(channel);
  });

  document.addEventListener('keyup', function(event) {
    switch (event.keyCode) {
    case 13: // [ENTER]
      event.preventDefault();
      chatOpen = chat.handleNewMessaged(channel, chatOpen);
    }
  });
}


function connectToSocket(player, document) {
  // connects to the socket endpoint
  const socket = new Socket('/socket', { params: { player_id: player } });
  socket.connect();
  channel = socket.channel('lobby:init', {});
  var currentPlayer = player;

  // joins the channel
  channel.join()
  // on joining channel, we receive the current players list
    .receive('ok', initialPlayers => {
      players = initialPlayers.players;
      login.initNewPlayer(players, currentPlayer);
      addChannelListeners(channel, document);
      setupChannelMessageHandlers(channel);
    });
  return channel;
}


function setupChannelMessageHandlers(channel) {
  // New player joined the game
  channel.on('player:joined', ({ player: player }) => {
    players[player.id] = player;
    login.updatePlayersList(players);
  });
  // Player left the game
  channel.on('player:left', ({ player: players_updated }) => {
    login.updatePlayersList(players_updated);
    login.handlePlayerLeft();
  });

  channel.on('player:send_message', (
    { player: { message: message, author: author } }) => {
    chat.updateMessageBox(message, author);
  });

  channel.on('player:init_heroes', (
    { player: players }) => {
    handlePlayers(players);
  });
}

export { connectToSocket, channel };
