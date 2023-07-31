import './App.css';
import ReactFlow, { Background, Controls,Handle, MiniMap } from 'react-flow-renderer';
import  {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  getIncomers,
  getOutgoers,
  getConnectedEdges,
  updateEdge,
  Panel


} from 'reactflow';
import React, { useState, useRef, useCallback,useEffect,ArrowHead} from 'react';
import customtext from './customtext';
import io from 'socket.io-client';
import { GroupNode } from './GroupNode';
import NodeDataInput from './NodeDataInput';

const SOCKET_SERVER_URL = 'https://react-demo-nu-lake.vercel.app/';


const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourceHandleX, sourceHandleY, targetHandleX, targetHandleY, style = {} }) => {
  const markerId = `marker-${id}`;

  return (
    <>
      <line
        x1={sourceX + sourceHandleX}
        y1={sourceY + sourceHandleY}
        x2={targetX + targetHandleX}
        y2={targetY + targetHandleY}
        style={{ fill: 'none', stroke: '#ccc', strokeWidth: 2, ...style }}
      />
      <marker
        id={markerId}
        viewBox="0 -5 10 10"
        refX="5"
        refY="0"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,-5L10,0L0,5" fill="#ccc" />
      </marker>
      <line
        x1={sourceX + sourceHandleX}
        y1={sourceY + sourceHandleY}
        x2={targetX + targetHandleX}
        y2={targetY + targetHandleY}
        style={{
          fill: 'none',
          stroke: '#ccc',
          strokeWidth: 2,
          markerEnd: `url(#${markerId})`,
          ...style,
        }}
      />
    </>
  );
};




const initialEdges = [
  {
    id: '1-2',
    source: '1',
    target: '2',
    label: 'to the',
    type: 'custom',
  },
];




const initialNodes = [
  
  
  {
    id: '1',
    data: { label: 'Delete ME' },
    position: { x: 100, y: 100 },
  },
];

const SquareNode = ({ data}) => {
  
  return (
    <div style={{ width: 70, height: 70, border: '.2px solid' }}
   >
      {data.label}
      <Handle type="target" position="top" isConnectable={true} />
      <Handle type="source" position="bottom" isConnectable={true} />
    </div>
  );
};

const CircleNode = ({ data }) => {
  return (
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        border: '.2px solid',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      draggable
      onDrag={(event) => {
        event.stopPropagation();
        const { offsetX, offsetY } = event.nativeEvent;
        const position = { x: offsetX, y: offsetY };
        const updatedNode = { ...data, position };
        
      }}
    >
      {data.label}
      <Handle type="target" position="top" isConnectable={true} />
      <Handle type="source" position="bottom" isConnectable={true} />
    </div>
  );
};

const TextNode = ({ data }) => {
  const [customLabel, setCustomLabel] = useState(data.label);

  const handleChangeLabel = (e) => {
    setCustomLabel(e.target.value);
  };

  return (
    <div style={{ padding: '10px', border: '1px solid', minWidth: '80px' }}>
      <input type="text" value={customLabel} onChange={handleChangeLabel} />
      <Handle type="target" position="top" isConnectable={true} />
      <Handle type="source" position="bottom" isConnectable={true} />
    </div>
  );
};
const nodeTypes = {
  textUpdater: TextNode,
  square: SquareNode,
  circle:CircleNode,
  group: GroupNode,
};


const edgeTypes = {
  custom:  CustomEdge

};




function App() {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [id, setId] = useState(2);
 const [socket,setSocket]=useState(null);
  const [elements, setElements] = useState(initialNodes);
  const [group, setGroupedNodes] = useState({});


  useEffect(() => {
 const socketConnection = io(SOCKET_SERVER_URL);
    setSocket(socketConnection);

   
    return () => {
      socketConnection.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;


    fetch(SOCKET_SERVER_URL + '/nodes')
      .then((response) => response.json())
      .then((data) => {
        setNodes(data);
      })
      .catch((error) => console.error('Error fetching initial nodes:', error));

    socket.on('initialNodes', (initialNodes) => {
      
      setNodes(initialNodes);
    });

    socket.on('newNode', (newNode) => {
      setNodes((prevNodes) => [...prevNodes, newNode]);
    });

    socket.on('newEdge', (newEdge) => {
      setEdges((prevEdges) => addEdge(newEdge, prevEdges));
   
    });
  
    
    socket.on('updateEdge', (updatedEdge) => {
      setEdges((prevEdges) =>
        prevEdges.map((edge) => (edge.id === updatedEdge.id ? { ...edge, ...updatedEdge } : edge))
      );
    });

    socket.on('deleteNodes', (deletedNodeIds) => {
      setNodes((prevNodes) => prevNodes.filter((node) => !deletedNodeIds.includes(node.id)));
    });
    socket.on('deleteEdge', (deletedEdgeId) => {
      setEdges((prevEdges) => prevEdges.filter((edge) => edge.id !== deletedEdgeId));
    });

    socket.on('updateNodePosition', (updatedNode) => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => (node.id === updatedNode.id ? { ...node, position: updatedNode.position } : node))
      );
    });
  }, [socket]);
  
  const handleNodeDragStop = (event, node) => {
    if (!socket) return;
  
    const { id, position } = node;
    const updatedNode = { id, position };
  

    socket.emit('updateNodePosition', updatedNode);
  

    setNodes((prevNodes) =>
      prevNodes.map((n) => (n.id === id ? { ...n, position } : n))
    );
  };
  
  
  const handleSave = () => {
    const savedState = { nodes, edges };
    localStorage.setItem('flowState', JSON.stringify(savedState));
    alert('Flow state saved.');
  };

  const handleRestore = () => {
    const savedState = localStorage.getItem('flowState');
    if (savedState) {
      const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedState);
      setNodes(savedNodes);
      setEdges(savedEdges);
      alert('Flow state restored.');
    } else {
      alert('No saved flow state found.');
    }
  };


  const [newNodeShape, setNewNodeShape] = useState('textUpdater');

  const onEdgeUpdate = useCallback(
    (oldEdge, newConnection) => {
      setEdges((prevEdges) => updateEdge(oldEdge, newConnection, prevEdges));
  
     
      socket.emit('updateEdge', newConnection);
    },
    [setEdges, socket]
  );
  
  const onConnect = useCallback(
    (params) => {
      setEdges((prevEdges) => addEdge(params, prevEdges));
  
     
      socket.emit('newEdge', params);
    },
    [setEdges, socket]
  );
  
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null); 
  const [availableNodes, setAvailableNodes] = useState([]);

  const handleNodeClick = (event, element) => {
    if (element.type === 'input' || element.type === 'output') {
      
      return;
    }
  
    if (element.type === 'node') {
      
      setSelectedNodes((prevSelectedNodes) =>
        prevSelectedNodes.includes(element.id)
          ? prevSelectedNodes.filter((id) => id !== element.id)
          : [...prevSelectedNodes, element.id]
      );
    }
  };
  
  const handleShapeSelection = (event) => {
    setNewNodeShape(event.target.value);
  };

 const [showForm, setShowForm] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeData, setNewNodeData] = useState({
    name: '',
    age: '',
    address: '',
    // Add other properties as needed
  });

   const handleInsertNode = () => {
    setShowForm(true); // Show the form when "Insert Node" is clicked
  };

  const handleFormSubmit = () => {
    const newNode = {
      id: id.toString(),
      type: newNodeShape,
      position: {
        x: 200,
        y: 200,
      },
      data: {
        label: newNodeLabel,
        ...newNodeData,
      },
      updatable: 'target',
      style: newNodeShape === 'textUpdater' ? {} : nodeTypes[newNodeShape].style,
      isConnectable: true,
    };
    setAvailableNodes((nodes) => [...nodes, newNode]);
    setNodes((nodes) => [...nodes, newNode]);
    setId((prevId) => prevId + 1); 
    setNewNodeLabel('');
  setShowForm(false)
    
    if (socket) {
      socket.emit('newNode', newNode);
    }
  };

  const [isMouseOverNode, setIsMouseOverNode] = useState(false);
  const [hoveredNodeData, setHoveredNodeData] = useState(null);
  
  const handleNodeMouseEnter = (event, node) => {
    setHoveredNodeData(node);
    setIsMouseOverNode(true);
  };


  const handleNodeMouseLeave = () => {
    setIsMouseOverNode(false);
    setHoveredNodeData(null);
  };
  

  const onNodesDelete = useCallback((deletedNodes) => {
    setEdges((prevEdges) =>
      prevEdges.filter(
        (edge) =>
          !deletedNodes.includes(edge.source) && !deletedNodes.includes(edge.target)
      )
    );
    setNodes((prevNodes) => prevNodes.filter((node) => !deletedNodes.includes(node.id)));
    const deletedNodeIds = deletedNodes.map((node) => node.id);
    socket.emit('deleteNodes', deletedNodeIds); 
  }, [socket]);

  const handleEdgeDelete = (edgeId) => {
    setEdges((edges) => edges.filter((edge) => edge.id !== edgeId));
  
console.log(edgeId)
 

  if (socket) {
    socket.emit('deleteEdge', edgeId);
  }
};


  
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      const newNode = {
        id: id,
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );
  
  const handleGroupNodesPrompt = () => {
    const nodeIds = window.prompt('Enter the IDs of the nodes to group (comma-separated):');
  
    if (nodeIds) {
      const selectedNodeIds = nodeIds.split(',').map((id) => id.trim());
  
    
      const selectedNodesData = nodes.filter((node) => selectedNodeIds.includes(node.id));
  
     
      handleGroupNodes(selectedNodesData);
    }
  };



  
  const [containerPosition, setContainerPosition] = useState({ x: 0, y: 0 });


  
  
  const handleGroupNodes = (selectedNodes) => {
    
    console.log(selectedNodes);


    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;

    selectedNodes.forEach((node) => {
      const { x, y } = node.position;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });

    const containerX = (minX + maxX) / 2;
    const containerY = (minY + maxY) / 2;

    setContainerPosition({ x: containerX, y: containerY });

    const newGroupId = `group-${Date.now()}`;
    const newGroupNode = {
      id: newGroupId,
      type: 'group',
      position: { x: 0, y: 0 },
      data: { label: `Group ${newGroupId}` },
      nodes: selectedNodes.map((node) => node.id), 
    };

    
    setNodes((prevNodes) => [...prevNodes, newGroupNode]);

    
    setGroupedNodes((prevGroupedNodes) => ({
      ...prevGroupedNodes,
      [newGroupNode.id]: newGroupNode,
    }));

    
    const updatedNodes = moveNode(selectedNodes, { x: containerX, y: containerY });

    
    setSelectedNodes([]);

  
    setNodes((prevNodes) => prevNodes.map((node) => updatedNodes.find((n) => n.id === node.id) || node));
  };

  const moveNode = (selectedNodes, containerPosition) => {
    const updatedNodes = selectedNodes.map((node) => {
      
      const nodePosition = {
        x: node.position.x - containerPosition.x,
        y: node.position.y - containerPosition.y,
      };

      return {
        ...node,
        position: nodePosition,
      };
    });
   return updatedNodes;
  }

  return (
    <ReactFlowProvider>
      <Panel id='save-restore'>
      <button className='but-sz' onClick={handleSave}>Save</button>
        <button className='but-sz' onClick={handleRestore}>Restore</button>

      </Panel>

      <select value={newNodeShape} onChange={handleShapeSelection}>
    <option value="textUpdater">Text</option>
    <option value="square">Square</option>
    <option value="circle">Circle</option>
  </select>
    <div style={{ height: '89vh' }}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}  onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            group={Object.values(group)}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodesDelete={onNodesDelete}
            onEdgeContextMenu={(event, edge) => handleEdgeDelete(edge.id)}
          
    onEdgeUpdate={onEdgeUpdate}
         onConnect={onConnect}
         onNodeDragStop={handleNodeDragStop}
            onElementClick={handleNodeClick} 
            onNodeMouseEnter={handleNodeMouseEnter}
            onNodeMouseLeave={handleNodeMouseLeave}
            fitView>
             
        <Controls />
        <Background />
        <MiniMap/>
      </ReactFlow>
    </div>
    <div>
   {showForm ? (
          <div>
            <input
              type="text"
              value={newNodeLabel}
              onChange={(e) => setNewNodeLabel(e.target.value)}
              placeholder="Enter node label"
            />
            {/* Use NodeDataInput component for each additional data input */}
            <NodeDataInput
              label="Name:"
              value={newNodeData.name}
              onChange={(e) => setNewNodeData({ ...newNodeData, name: e.target.value })}
              placeholder="Enter name"
            />
            <NodeDataInput
              label="Age:"
              value={newNodeData.age}
              onChange={(e) => setNewNodeData({ ...newNodeData, age: e.target.value })}
              placeholder="Enter age"
            />
            <NodeDataInput
              label="Address:"
              value={newNodeData.address}
              onChange={(e) => setNewNodeData({ ...newNodeData, address: e.target.value })}
              placeholder="Enter address"
            />
            {/* Add other NodeDataInput components for additional data as needed */}
            <button onClick={handleFormSubmit}>Submit</button>
          </div>
        ) : (
          <button onClick={handleInsertNode}>Insert Node</button>
        )}
       
  <button className='bu-sz' onClick={handleGroupNodesPrompt}>Group</button>

        </div>
        {hoveredNodeData && isMouseOverNode &&  (
        // Show the node information when the mouse is over a node
        <div
          style={{
            position: 'absolute',
            top: hoveredNodeData.position.y,
            left: hoveredNodeData.position.x,
            background: 'white',
            padding: '8px',
            border: '1px solid black',
          }}
        >
          <h3>{hoveredNodeData.data.label}</h3>
          <p>id: {hoveredNodeData.id}</p>
          <p>Name: {hoveredNodeData.data.name}</p>
          <p>Age: {hoveredNodeData.data.age}</p>
          <p>Address: {hoveredNodeData.data.address}</p>
          
        </div>
      )}
    </ReactFlowProvider>
  );
}

export  default App;
