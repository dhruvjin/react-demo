export const updateNodePositionOnSocket = (socket, node) => {
    const { id, position } = node;
    socket.emit('updateNodePosition', { id, position });
  }; 