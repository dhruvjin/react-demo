// NodeDataInput.js
import React from 'react';

const NodeDataInput = ({ label, value, onChange, placeholder }) => {
  return (
    <div>
      <label>{label}</label>
      <input type="text" value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
};

export default NodeDataInput;
