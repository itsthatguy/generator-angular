import React            from 'react';
import connectToStores  from 'alt/utils/connectToStores';
import request          from 'reqwest';

import HomeStore   from './HomeStore';
import HomeActions from './HomeActions';

class Home extends React.Component {

  static getStores () {
    return [HomeStore];
  }

  static getPropsFromStores () {
    return HomeStore.getState();
  }

  componentWillMount () {
    request({
      url: `${CONFIG.api}/default`
    })
    .then((response) => {
      HomeActions.setTitle(response.data.title);
    })
    .catch((error) => {
      throw new Error(error);
    });
  }

  componentWillReceiveProps () { }

  render () {
    return (
      <div className='home__wrapper'>
        <h1>{this.props.title}</h1>
      </div>
    );
  }
}

export default connectToStores(Home);
