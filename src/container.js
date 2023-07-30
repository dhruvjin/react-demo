 const ContainerOutline = ({ position, dimensions }) => {
    return (
      <div
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: dimensions.width,
          height: dimensions.height,
          border: '2px solid blue', 
          pointerEvents: 'none', 
          zIndex: 9999,
        }}
      ></div>
    );
  };
  export default ContainerOutline;
  