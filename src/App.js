import { Amplify, API, Auth, Hub } from 'aws-amplify';
import React, { useEffect, useState } from "react";
import './App.css';
import awsconfig from './aws-exports';
import { createTodo } from "./graphql/mutations";
import { listTodos } from "./graphql/queries";


Amplify.configure(awsconfig)
//Amplify.configure({
  // graphql_headers: async () => ({
  //   Authorization: await Auth.currentAuthenticatedUser().signInUserSession.idToken.jwtToken
  // }),
//  ...awsconfig});

async function onCreate(user) {
  await API.graphql({
    authMode: "OPENID_CONNECT",
    query: createTodo,
    variables: {
      input: {
        name: `New Todo ${user.username} - ${Date()}`,
        description: `${user.username} - ${Date()}\n`,
      },
    },
  });
}

/*
async function onDelete(id) {
  await API.graphql({
    authMode: "OPENID_CONNECT",
    query: deleteTodo,
    variables: {
      input: {
        id,
      },
    },
  });
}
*/

async function onQuery(setTodos) {
  const { data } = await API.graphql({
    query: listTodos,
    authMode: "OPENID_CONNECT"
  });

  setTodos(data.listTodos.items);
}

function App() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    Hub.listen('auth', ({ payload: { event, data } }) => {
      switch (event) {
        case 'signIn':
          //console.log(event)
          //console.log(data)
          getUser().then(userData => setUser(userData));
          break;
        case 'signOut':
          setUser(null);
          break;
        case 'signIn_failure':
          //console.log('Sign in failure', data);
          break;
        default:
      }
    });

    getUser().then(userData => setUser(userData)).then(() => onQuery(setTodos));
  }, []);

  function getUser() {
    return Auth.currentAuthenticatedUser()
      .then(userData => userData)
      //.then(userData => Cache.setItem('federatedInfo', { token: userData.signInUserSession.idToken.jwtToken }))
      .catch(() => console.log('Not signed in'));
  }

  if (!user) {
    return <button onClick={() => Auth.federatedSignIn({customProvider: "Auth0"})}>Sign via Auth0</button>
  }

  console.log('user', user)
  return (
    <div>
      <div>
        <button onClick={() => Auth.signOut()}>Sign Out</button>
      </div>
      <div>User: {user.username} </div>
      <div>
        <button onClick={() => onCreate(user)}>Create Todo</button>
      </div>
      <div>
      <ul>
        {todos && todos.map((t, i) => <li key={i}>{t.name}</li>)}
      </ul>
      </div>
    </div>
  );
}

export default App;
