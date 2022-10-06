import { Amplify, API, Auth, Cache, Hub } from "aws-amplify";
import React, { useEffect, useState } from "react";
import "./App.css";
import awsconfig from "./aws-exports";
import { createTodo } from "./graphql/mutations";
import { listTodos } from "./graphql/queries";

Amplify.configure(awsconfig);

function App() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);

  async function getTodos() {
    const { data } = await API.graphql({
      query: listTodos,
    });

    return data;
  }

  async function onCreateTodo(user) {
    await API.graphql({
      query: createTodo,
      variables: {
        input: {
          name: `New Todo ${user.email} - ${Date()}`,
          description: `${user.email} - ${Date()}\n`,
        },
      },
    });
  }

  useEffect(() => {
    const getUserAndTodos = () =>
      getUser().then((userData) => {
        setUser(userData);

        // required until amplify-js library is patched to handle this use case
        // suggested PR: https://github.com/kevinold/amplify-js/pull/1/files
        Cache.setItem("federatedInfo", {
          token: userData.signInUserSession.accessToken.jwtToken,
        });

        getTodos()
          .then((data) => setTodos(data.listTodos.items))
          .catch(() => console.log("error with todos"));
      });

    Hub.listen("auth", ({ payload: { event, data } }) => {
      switch (event) {
        case "signIn":
          getUserAndTodos();
          break;
        case "signOut":
          setUser(null);
          break;
        case "signIn_failure":
          break;
        default:
      }
    });

    getUserAndTodos();
  }, []);

  function getUser() {
    return Auth.currentAuthenticatedUser()
      .then((userData) => userData)
      .catch(() => console.log("Not signed in user"));
  }

  if (!user) {
    return (
      <button onClick={() => Auth.federatedSignIn({ customProvider: "Auth0" })}>
        Sign via Auth0
      </button>
    );
  }

  return (
    <div>
      <div>
        <button onClick={() => Auth.signOut()}>Sign Out</button>
      </div>
      <div>User: {user.username} </div>
      <div>
        <button onClick={() => onCreateTodo(user) && getTodos()}>
          Create Todo
        </button>
      </div>
      <div>
        <ul>{todos && todos.map((t, i) => <li key={i}>{t.name}</li>)}</ul>
      </div>
    </div>
  );
}

export default App;
