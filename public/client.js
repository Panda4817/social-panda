$(document).ready(function () {
  /*global io*/
  let socket = io();
  socket.on('user', data => {
    $('#num-users').text(data.currentUsers + ' users online');
    let message =
      data.name +
      (data.connected ? ' has joined the chat.' : ' has left the chat.');
    let name = 'Admin'
    let date = 'Today ' + new Date().toLocaleTimeString()
    $('#messages').append($('<li class="notMe rounded-pill col-md-6">').html('<p class="m-1">' + message + '</p><p class="small m-2">' + name + ' - ' + date + '</p>'));
  });

  socket.on('chat message', (data) => {
    let date = 'Today ' + new Date().toLocaleTimeString();
    if (document.querySelector('#user').innerHTML == data.name) {
      $('#messages').append($('<li class=" me rounded-pill col-md-6 ml-auto">').html('<p class="m-1">' + data.message + '</p><p class="small m-2">' + data.name + ' - ' + date + '</p>'));
    } else {
      $('#messages').append($('<li class="notMe rounded-pill col-md-6 ml-auto">').html('<p class="m-1">' + data.message + '</p><p class="small m-2">' + data.name + ' - ' + date + '</p>'));
    }
    
  });

  // Form submittion with new message in field with id 'm'
  $('form').submit(function () {
    var messageToSend = $('#m').val();
    $('.emoji-wysiwyg-editor').text('');
    socket.emit('chat message', messageToSend);
    return false; // prevent form submit from refreshing page
  });
});
