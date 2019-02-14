import { useReducer } from 'react';

/*
 * This custom hooks does a full set of file management things
 * e.g. delete, rename, and so on
 * Specialty: It syncs over the passed service with an external API.
 * Service functions are documented in the prop types
 */

const defaultStates = {
  asyncActive: false,
  error: '',
}

const defaultFileService = {
  getFile: () => { },
  putFile: () => { },
  deleteFile: () => { },
}


function reducer(state, action) {
  switch (action.type) {
    case 'loadFile_request':
      return {
        ...state,
        ...defaultStates,
        fileLoading: [...state.fileLoading, action.payload.name],
        asyncActive: true,
      }
    case 'loadFile_success':
      return {
        ...state,
        ...defaultStates,
        fileLoading: [...state.fileLoading.filter(a => a !== action.payload.name)],
        code: {
          ...state.code,
          [action.payload.name]: action.payload.content
        },
      }
    case 'loadFile_failure':
      return {
        ...state,
        ...defaultStates,
        fileLoading: [...state.fileLoading.filter(a => a !== action.payload.name)],
        error: 'loadFile_failure',
      }

    case 'putFile_request': // async push to server requested
      return {
        ...state,
        ...defaultStates,
        code: {
          ...state.code,
          [action.payload.name]: action.payload.content
        },
        asyncActive: true,
      }
    case 'putFile_success': // after sync with server
      return {
        ...state,
        ...defaultStates
      }
    case 'putFile_failure': { // delete file again from state
      const newCode = { ...state.code };
      return {
        ...state,
        ...defaultStates,
        code: newCode,
        error: 'loadFile_failure',
      }
    }
    case 'deleteFile_request':
      return {
        ...state,
        ...defaultStates,
        deleteRequested: [...state.deleteRequested, action.payload.name],
        asyncActive: true,
      }
    case 'deleteFile_success': {
      const newCode = { ...state.code };
      delete newCode[action.payload.name];
      return {
        ...state,
        ...defaultStates,
        code: newCode,
        deleteRequested: [...state.deleteRequested.filter(a => a !== action.payload.name)],
      }
    }
    case 'deleteFile_failure':
      return {
        ...state,
        ...defaultStates,
        deleteRequested: [...state.deleteRequested, action.payload.name],
        error: 'deleteFile_failure'
      }

    case 'renameFolder_request':
      // TODO: implement
      return {
        ...state,
        ...defaultStates,
        error: 'renameFolder_request'
      }

    case 'selectFile':
      return {
        ...state,
        ...defaultStates,
        selectedFile: action.payload.name,
      }
    default:
      return state;
  }
}

// by passing service with empty functions to it, it will be possible to use only local file handling
export function useFileManagement(service = defaultFileService) {

  const initialState = {
    code: {},
    selectedFile: '',
    deleteRequested: [],
    fileLoading: [],
    ...defaultStates,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  const fileFunctions = {
    // file handler functions
    selectFile(name) {
      dispatch({ type: 'selectFile', payload: { name } });
    }
    ,
    getAndSelectFile(name) {
      this.selectFile(name);
      this.getFile(name);
    }
    ,
    async getFile(name) {
      dispatch({ type: 'loadFile_request', payload: { name } });
      try {
        const newFile = await service.getFile(name);
        dispatch({ type: 'loadFile_success', payload: { ...newFile } });
      } catch (e) {
        console.log(e);
        dispatch({ type: 'loadFile_failure' })
      }
    }
    ,
    async putFile(name, content) {
      dispatch({ type: 'putFile_request', payload: { name, content } });
      try {
        await service.putFile(name, content);
        // basically doing nothing if success
        dispatch({ type: 'putFile_success' });
      } catch (e) {
        console.log(e);
        dispatch({ type: 'putFile_failure', payload: { name } })
      }
    }
    ,
    async deleteFile(name) {
      console.log('delete ', name);
      dispatch({ type: 'deleteFile_request', payload: { name } });
      try {
        await service.deleteFile(name);
        dispatch({ type: 'deleteFile_success', payload: { name } });
      } catch (e) {
        console.log(e);
        dispatch({ type: 'deleteFile_failure' })
      }
    }
    ,
    async renameFile(oldName, newName) {
      // dispatch({ type: 'renameFile_request', payload: { oldName, newName } });
      try {
        // get old file
        const fileContent = this.selectFileContent(oldName);
        await Promise.all([this.putFile(newName, fileContent), this.deleteFile(oldName)])
        // dispatch({ type: 'renameFile_success', payload: { oldName, newName } });
      } catch (e) {
        console.log(e);
        dispatch({ type: 'renameFile_failure' })
      }
    }
    ,
    async renameFolder(oldName, newName) {
      dispatch({ type: 'renameFolder_request', payload: { oldName, newName } });
    }

    ,

    /*
     * selector functions 
     */
    selectCurrentFile() {
      if (state.deleteRequested.includes(state.selectedFile)) {
        return null;
      }
      if (!state.code[state.selectedFile]) {
        return null;
      }
      return {
        name: state.selectedFile,
        content: state.code[state.selectedFile]
      };
    },
    selectFileList() {
      return [...Object.keys(state.code), ...state.fileLoading].filter(a => !state.deleteRequested.includes(a));
    },
    selectFileContent(name) {
      if (!state.code[name]) {
        return null;
      }
      return state.code[name];
    },
    selectAsyncActive() {
      return state.asyncActive;
    },
  }

  return [state, fileFunctions];
}
