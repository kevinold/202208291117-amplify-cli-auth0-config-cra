import { Amplify, API, Auth, Cache, Hub } from "aws-amplify";
import React, { useEffect, useState } from "react";
import "./App.css";
import awsconfig from "./aws-exports";
import { createTodo } from "./graphql/mutations";
import { listTodos } from "./graphql/queries";

Amplify.configure(awsconfig);

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

function App() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState({});
  const [todos, setTodos] = useState([]);

  let additionalHeaders = session
    ? {
        // @ts-ignore
        //Authorization: session.idToken.jwtToken,
      }
    : {};

  async function getTodos() {
    const { data } = await API.graphql(
      {
        query: listTodos,
        //authMode: "OPENID_CONNECT",
      },
      // @ts-ignore
      additionalHeaders
    );

    setTodos(data.listTodos.items);
  }

  async function onCreateTodo(user) {
    console.log("Cache federatedInfo", Cache.getItem("federatedInfo"));
    await API.graphql(
      {
        //authMode: "OPENID_CONNECT",
        query: createTodo,
        variables: {
          input: {
            name: `New Todo ${user.email} - ${Date()}`,
            description: `${user.email} - ${Date()}\n`,
          },
        },
      },
      // @ts-ignore
      additionalHeaders
    );
  }

  useEffect(() => {
    Hub.listen("auth", ({ payload: { event, data } }) => {
      switch (event) {
        case "signIn":
          console.log("Hub: Sign in");
          console.log(event);
          console.log(data);
          getUser().then((userData) => {
            console.log("user", userData);
            setUser(userData);
          });
          // getSession()
          //   .then((sessionData) => {
          //     Cache.setItem("federatedInfo", {
          //       // @ts-ignore
          //       token: sessionData.idToken.jwtToken,
          //     });
          //     return sessionData;
          //   })
          //   // @ts-ignore
          //   .then((sessionData) => setSession(sessionData));
          break;
        case "signOut":
          console.log("Hub: Sign out");
          setUser(null);
          break;
        case "signIn_failure":
          console.log("Hub: Sign in failure", data);
          break;
        default:
      }
    });

    // getUser()
    //   .then((userData) => setUser(userData))
    //   .then(() => getSession())
    //   .then(() => getTodos());
  }, []);

  function getUser() {
    return Auth.currentAuthenticatedUser()
      .then((userData) => userData)
      .catch(() => console.log("Not signed in user"));
  }

  function getSession() {
    return (
      Auth.currentSession()
        .then((sessionData) => sessionData)
        .then((sessionData) => console.log("session", sessionData))
        // .then((sessionData) =>
        //   // @ts-ignore
        //   Cache.setItem("federatedInfo", { token: sessionData.idToken.jwtToken })
        // )
        .catch(() => console.log("Not signed in session"))
    );
  }

  console.log("user", user);
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
        <button onClick={() => onCreateTodo(user)}>Create Todo</button>
      </div>
      <div>
        <ul>{todos && todos.map((t, i) => <li key={i}>{t.name}</li>)}</ul>
      </div>
    </div>
  );
}

export default App;
