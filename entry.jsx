import React from 'react';
import {render} from 'react-dom';

import Fatt from './src/components/Index'

class App extends React.Component {
  render () {
    return <Fatt />
  }
}

render(<App/>, document.getElementById('app'));
