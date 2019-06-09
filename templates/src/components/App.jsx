import React from 'react';
import styled from 'styled-components';
import { Router, Link } from '@reach/router';
import Theme from '../contexts/ThemeContext';
import ThemeSelect from './ThemeSelect';
import { Button } from '../theme/globalStyle';

import About from '../pages/About';
import Home from '../pages/Home';

const AppWrapper = styled.div`
  text-align: center;
`;

const AppHeader = styled.div`
  height: 16rem;
  padding: 1rem;
  color: ${props => props.theme.dark};
  background-color: ${props => props.theme.primary};
`;


const AppIntro = styled.p`
  color: ${props => props.theme.dark};
  font-size: large;
  code {
    font-size: 1.3rem;
  }
`;

const EmojiWrapper = styled.span.attrs(props => ({
  role: 'img',
  'aria-label': props.arial,
}))``;


const Underline = styled.span`
  border-bottom: 4px solid ${props => props.theme.secondary};
`;

const BigButt = styled(Button)`
  height: 3rem;
  font-size: 2rem;
  width: 40vw;
  border-radius: 30px;
`;


const App = () => (
  <Theme>
    <AppWrapper>
      <AppHeader>
        <Router>
          <Home path="/" />
          <About path="about" />
        </Router>
        <Link to="/"><h2>Home</h2></Link>
        <Link to="about"><h2>About</h2></Link>
      </AppHeader>
      <AppIntro>
          Bootstrapped with
        {' '}
        <Underline>
          <code>create-react-app</code>
        </Underline>
.
      </AppIntro>
      <AppIntro>
          Components styled with
        {' '}
        <Underline>
          <code>styled-components</code>
        </Underline>
        {' '}
        <EmojiWrapper arial="nail_polish">💅</EmojiWrapper>
      </AppIntro>
      <Button>Normal Button</Button>
      <Button primary>Primary Button</Button>
      <ThemeSelect />
      <BigButt>Big Button</BigButt>
    </AppWrapper>
  </Theme>
);


export default App;
