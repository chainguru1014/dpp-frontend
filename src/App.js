import './App.css';
import Page from './pages';
import {StyledEngineProvider} from '@mui/material/styles'

function App() {
  return (
    <div className="App">
      <StyledEngineProvider injectFirst>
        <Page />
      </StyledEngineProvider>
      
    </div>
  );
}

export default App;
