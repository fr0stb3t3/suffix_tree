import React, {useState} from 'react';
import logo from './logo.svg';
import './App.css';
import SuffixTree , {TreeNode} from './Modules/UkkonenSuffixTree_Class_Stack'


function App() {
  
  const [tree, setTree] = useState<SuffixTree | null>(null);
  const [step, setStep] = useState<number>(0);
  const doThis = () => {
    let inputElement : HTMLInputElement = document.getElementById("textInput") as HTMLInputElement;
    let value = inputElement.value;
    let tree: SuffixTree = new SuffixTree(value);
    console.table(tree.stackTrace)
  }

  
  return (
    <div className="App">
      <div className = "main">
        <div className="content">
          <div>
            <h1>Ukkonens Visualizer</h1>
            <input id="textInput" type="text"></input>
            <button onClick={doThis} >submit </button>
          </div>
          <div className="graphScreen">
            <button onClick = {() => {setStep(step => step-1)}}> Prev </button>
            {step}
            <button onClick = {() => {setStep(step => step+1)}}> Next </button>
          </div>
        </div>
        <div className="stackTrace"></div>
      </div>
  
    </div>
  );
}

export default App;
