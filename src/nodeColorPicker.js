import React, { useState } from 'react';
import { ChromePicker } from 'react-color';

const NodeColorPicker = ({ node, onChange }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleClick = () => {
    setShowColorPicker((prevState) => !prevState);
  };

  const handleChange = (color) => {
    const newStyle = { ...node.style, background: color.hex };
    onChange(node.id, newStyle);
  };

  return (
    <div>
      <button onClick={handleClick}>Pick Color</button>
      {showColorPicker && <ChromePicker color={node.style.background} onChange={handleChange} />}
    </div>
  );
};

export { NodeColorPicker };
