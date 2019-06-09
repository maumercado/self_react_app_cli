import React from 'react';
import styled, { keyframes } from 'styled-components';

const AppTitle = styled.h1`
  font-weight: 900;
`;

const rotate360 = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const AppLogo = styled.img`
  animation: ${rotate360} infinite 2s linear;
  height: 80px;
  &:hover {
    animation: ${rotate360} infinite 0.5s linear;
  }
`;


const logo = 'https://user-images.githubusercontent.com/234708/37256552-32635a02-2554-11e8-8fe3-8ab5bd969d8e.png';

const Home = () => (
  <>
    <AppLogo src={logo} alt="logo" />
    <AppTitle>Welcome to your generated React app</AppTitle>
  </>
);
export default Home;
