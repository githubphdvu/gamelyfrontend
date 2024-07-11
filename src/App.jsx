import {createContext, useEffect, useState} from "react"//https://react.dev
import {NavLink, Outlet} from "react-router-dom"//https://reactrouter.com/
import {Container,Navbar,Nav,NavDropdown} from "react-bootstrap"//https://react-bootstrap.netlify.app/
import {jwtDecode} from "jwt-decode"//https://www.npmjs.com/package/jwt-decode

import GamelyApi from "./api"
import LoadingSpinner from "./LoadingSpinner"

export const TOKEN_STORAGE_ID = "blahblahblah"// Storage key for auth token
export const UserContext = createContext(null)//to share user info and authentication functions across the app

function NavigationBar({ onLogout, currentUser }) {
  const isLoggedIn = currentUser !== null
  const is_admin = currentUser && currentUser.is_admin// Check if user is admin

  return (
    <Navbar style={{backgroundImage: "url(/bgimage.jpg)",backgroundSize: "cover",backgroundPosition: "center",color: "white"}} data-bs-theme="dark">
      <Container fluid>
        <Navbar.Brand as={NavLink} to="/" className="col-auto" style={{ fontSize: "1.5em" }}>
          <img alt="" src="/logo.png" width="500" height="70" className="d-inline-block align-top"/>{" "}
        </Navbar.Brand>
        <NavDropdown title="More..." id="basic-nav-dropdown">
          <NavDropdown.Item as={NavLink} to="/about">About</NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item href="https://www.linkedin.com/in/vualan/">LinkedIn</NavDropdown.Item>
        </NavDropdown>
        <Nav className="col-auto">
          {!isLoggedIn && (
            <>
              <Nav.Link as={NavLink} to="/login">Login</Nav.Link>
              <Nav.Link as={NavLink} to="/signup">Signup</Nav.Link>
            </>
          )}
          {isLoggedIn && (
            <>
              <Nav.Link as={NavLink} to="/genres">Genres</Nav.Link>
              <Nav.Link as={NavLink} to="/games">Games</Nav.Link>
              <Nav.Link as={NavLink} to="/profile">Profile</Nav.Link>
              {is_admin && (<Nav.Link as={NavLink} to="/users">Users</Nav.Link>)} {/*}Render only if user is admin*/}
              <Nav.Link onClick={onLogout} as={NavLink} to="/">Logout: {currentUser.username}</Nav.Link>
            </>
          )}
        </Nav>
      </Container>
    </Navbar>
  )
}
function useLocalStorage(key, firstVal = null) {
  const initialValue = window.localStorage.getItem(key) || firstVal
  const [storedValue, setStoredValue] = useState(initialValue)
  useEffect(() => {
    //to load current user when token changes
    // console.log(`hooks useLocalStorage ${storedValue}`)
    if (!storedValue) localStorage.removeItem(key)
    else localStorage.setItem(key, storedValue)
  }, [key, storedValue]);
  return [storedValue, setStoredValue]
}
export default function App() {
  //3 states: token, currentUser, infoLoaded
  const [token, setToken] = useLocalStorage(TOKEN_STORAGE_ID)//custom hook,to manage authentication token in local storage
  const [currentUser, setCurrentUser] = useState(null)//state for current user
  const [infoLoaded, setInfoLoaded] = useState(false)//state for info loaded
  useEffect(() => {
    //for load user information when component mounts or token changes
    async function getCurrentUser() {
      if (token) {
        try {
          let { username } = jwtDecode(token)
          GamelyApi.token = token
          let currentUser = await GamelyApi.getCurrentUser(username)
          setCurrentUser(currentUser)
        } 
        catch (error) {console.error("App loadUserInfo: problem loading", error)}
      }
      setInfoLoaded(true)
    }
    getCurrentUser()
  }, [token])
  async function login(loginData) {
    try {
      const token = await GamelyApi.authToken(loginData)
      setToken(token)
      return { success: true }
    } 
    catch (error) {return { success: false, error }}
  }
  async function signup(signupData) {
    try {
      const token = await GamelyApi.createUser(signupData)
      setToken(token)
      return { success: true }
    } 
    catch (error) {return { success: false, error }}
  }
  async function updateUser(username, updateData) {
    try {
      const updatedUser = await GamelyApi.updateUser(username, updateData)
      setCurrentUser(user=>({...user,first_name: updatedUser.first_name,last_name: updatedUser.last_name,email: updatedUser.email}))
      return { success: true }
    } 
    catch (error) {return { success: false, error }}
  }
  async function likeGame(username, game_id) {
    const likedGameId = await GamelyApi.likeGame(username, game_id)
    setCurrentUser((user) => ({...user,likes: [...user.likes, likedGameId]}))
  }
  function onLogout() {
    setCurrentUser(null)
    setToken(null)
  }
  if (!infoLoaded) return <LoadingSpinner />
  return (
    <>
      <NavigationBar onLogout={onLogout} currentUser={currentUser} />
      <div className="container">
        <div className="row justify-content-center">
          <Outlet context={{ currentUser, login, signup, updateUser, likeGame }}/>
        </div>
      </div>
    </>
  )
}