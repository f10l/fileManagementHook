import React, { useState } from 'react';
import './App.css';

import { useFileManagement } from './useFileManagement';


// mock a service, incomplete (no folder handling and so on)
const service = {
  getFile: (name) => {
    console.log('get file name ', name);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          {
            name,
            content: "test file content for " + name,
          }
        )
      }, 2000);
    });

  },
  deleteFile: (name) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true)
      }, 2000);
    });
  },
  putFile: (name) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true)
      }, 2000);
    });
  }
}

function App() {

  const [files, fileFunctions] = useFileManagement(service);


  const [renameFile, showRename] = useState('');
  const [newFileName, handleRenameInput] = useState('');

  return (
    <div className="App">
      This is a test of a custom file management react hook<br /><br />
      <button onClick={() => fileFunctions.getFile("test" + Math.random())} type="button">add file </button>
      <button onClick={() => fileFunctions.getAndSelectFile("test" + Math.random())} type="button">add file and select it</button>
      <br /><br />
      State:<br />
      {JSON.stringify(files, null, 2)}
      <br /><br />
      <b>Current file:</b>{JSON.stringify(fileFunctions.selectCurrentFile(), null, 2)}
      <br /><br />
      <b>Files:</b><br />
      {fileFunctions.selectFileList().map(f => (
        <div key={f}>{f} &nbsp;

          <button onClick={() => fileFunctions.selectFile(f)}>select</button>
          <button onClick={() => fileFunctions.deleteFile(f)}>delete</button>
          &nbsp; &nbsp;
          <button onClick={() => showRename(f)}>rename</button>
        </div>
      ))}
      <br /><br />
      {renameFile !== '' && (
        <>
          <b>Rename File:</b><br />
          <input type="text" name="newFileName" value={newFileName} onChange={(e) => handleRenameInput(e.target.value)} />
          <button onClick={() => fileFunctions.renameFile(renameFile, newFileName)}>Rename now</button>
        </>
      )}
    </div>
  );
}

export default App;
