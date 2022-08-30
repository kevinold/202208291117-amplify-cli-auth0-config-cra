import { useAuth0 } from "@auth0/auth0-react";
import { Amplify, Auth } from "aws-amplify";
import jwt_decode from "jwt-decode";
 
import React, { useEffect, useState } from "react";
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

function App() {
  const [claims, setClaims] = useState(null)
  const { isAuthenticated, user, getIdTokenClaims } = useAuth0();

  useEffect(() => {
    async function getAuth0IdToken() {
      const claims = await getIdTokenClaims();
      if (claims) {
        // @ts-ignore
        setClaims(claims)
      }
    }

    async function federatedSignIntoCognito() {
      // @ts-ignore
      const { email } = user
      // @ts-ignore
      const idToken = claims.__raw
      // @ts-ignore
      const { exp } = jwt_decode(idToken);

      await Auth.federatedSignIn(
          "dev-kevold-amz.us.auth0.com",
          {
              token: idToken, // The id token from Auth0
              expires_at: exp * 1000 // the expiration timestamp
          },
          // @ts-ignore
          { 
              email, // Optional, the email address
          } 
      )
    }

    getAuth0IdToken()
    if (claims) {
      federatedSignIntoCognito()
    }

  }, [claims, user, getIdTokenClaims])

  if (!isAuthenticated) return <div className="App"><LoginButton /></div>

  return (
    <div className="App">
      <Profile />
      <code>
        <pre>{JSON.stringify(user, null, 2)}</pre>
        <pre>{JSON.stringify(claims, null, 2)}</pre>
      </code>
      <LogoutButton />
    </div>
  );
}

export default App;
