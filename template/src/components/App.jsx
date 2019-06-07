import React from 'react';
import reactLogo from '../assets/React-icon.png';

const App = () => (
  <main className="container">
    <div>
      <h1>hello world!</h1>
      <img className="container__image" alt="react logo" src={reactLogo} />
      <p>If you see this everything is working!</p>
    </div>
  </main>
);

export default App;
