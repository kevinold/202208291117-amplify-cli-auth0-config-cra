import { Amplify, Auth, Hub } from 'aws-amplify';
import React, { useEffect, useState } from "react";
import './App.css';
import awsconfig from './aws-exports';

Amplify.configure(awsconfig);

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    Hub.listen('auth', ({ payload: { event, data } }) => {
      switch (event) {
        case 'signIn':
          console.log(event)
          console.log(data)
          getUser().then(userData => setUser(userData));
          break;
        case 'signOut':
          setUser(null);
          break;
        case 'signIn_failure':
          console.log('Sign in failure', data);
          break;
        default:
      }
    });

    getUser().then(userData => setUser(userData));
  }, []);

  function getUser() {
    return Auth.currentAuthenticatedUser()
      .then(userData => userData)
      .catch(() => console.log('Not signed in'));
  }


  return (
    <div>
      {user ? (
        <button onClick={() => Auth.signOut()}>Sign Out</button>
      ) : (
        <button onClick={() => Auth.federatedSignIn({customProvider: "Auth0"})}>Sign via Auth0</button>
      )}
    </div>
  );
}

export default App;
