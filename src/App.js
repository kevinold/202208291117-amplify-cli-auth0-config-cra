import { useAuth0 } from "@auth0/auth0-react";
import { Amplify } from "aws-amplify";
import React from "react";
import './App.css';
import awsExports from "./aws-exports";
Amplify.configure(awsExports)


const LoginButton = () => {
  const { loginWithRedirect } = useAuth0();

  return <button onClick={() => loginWithRedirect()}>Log In</button>;
};

const LogoutButton = () => {
  const { logout } = useAuth0();

  return (
    <button onClick={() => logout({ returnTo: window.location.origin })}>
      Log Out
    </button>
  );
};

const Profile = () => {
  const { user, isLoading } = useAuth0();

  if (isLoading) {
    return <div>Loading ...</div>;
  }

  return (
      <div>
        <img src={user.picture} alt={user.name} />
        <h2>{user.name}</h2>
        <p>{user.email}</p>
      </div>
  );
};

/*
// auth0 configuration, more info in: https://auth0.com/docs/libraries/auth0js/v9#available-parameters
Auth.configure({
    auth0: {
        domain: 'your auth0 domain', 
        clientID: 'your client id',
        redirectUri: 'your call back url',
        audience: 'https://your_domain/userinfo',
        responseType: 'token id_token', // for now we only support implicit grant flow
        scope: 'openid profile email', // the scope used by your app
        returnTo: 'your sign out url'
    }
});
*/

function App() {
  const { isAuthenticated } = useAuth0();

  if (!isAuthenticated) return <div className="App"><LoginButton /></div>

  return (
    <div className="App">
      <Profile />
      <LogoutButton />
    </div>
  );
}

export default App;
