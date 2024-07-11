/*frontend Vitejs can be run in both Windows(much better for hot loading) and Ubuntu
////////////////////////////////////////////////////////////////////
1)Component Organization:structures into functional components for various purposes like GenreList, GenreDetail, GameList, etc
2)Error Handling:implements error handling in useGenres and useGames custom hooks. This is good practice to ensure that your app gracefully handles errors that might occur during data fetching from the API.
3)Loading States:uses LoadingSpinner to indicate when data is being fetched from the API. This provides good feedback to users about the state of the like.
4)Routing:uses react-router-dom for routing (createBrowserRouter,RouterProvider,Navigate,Outlet,Link) is appropriate for handling navigation between different pages like /genres, /games, /profile, etc.
5)Context Usage:implements UserContext using createContext to manage user authentication (token, currentUser). This is crucial for maintaining user sessions across different parts of app.
6)Form Handling: SignupForm,ProfileForm components use custom hooks (useFormData) for managing form state (formData) and handling form submissions. This makes your forms reusable and reduces redundant code.
7)Backend Integration: API methods in api.js to interact with backend services, handling operations like authentication (login, signup), 
    fetching genres (getAllGenres, getGenreByName), games (getAllGames, getGamesByTitle), and user profile updates (updateUser, likeGame)
8)Styling using react-bootstrap
/*/ //////////////////////////////////////////////////////////////////
import React, { useState, useEffect } from "react"
import ReactDOM from "react-dom/client"
import axios from "axios"
import App from "./App.jsx"
import "bootstrap/dist/css/bootstrap.min.css"
import GamelyApi from "./api"
import {Alert,Button,Card,Form,Container,Table,ListGroup,Image,Row,Col,Badge} from "react-bootstrap"
import {useParams,useNavigate,createBrowserRouter,RouterProvider,Navigate,Outlet,useOutletContext,Link} from "react-router-dom"
const BACKEND_URL =import.meta.env.VITE_REACT_APP_BASE_URL
// const BACKEND_URL ="http://localhost:3001"
import LoadingSpinner from "./LoadingSpinner"
//////////////////////////////////////////////////////////
function CustomAlert({ type, title, messages, visible, onClose }) {//for SignupForm,LoginForm,ProfileForm
  return (
    <>
      {visible && (
        <Alert variant={type} onClose={onClose} dismissible>
          <Alert.Heading>{title}</Alert.Heading>
          {messages.map(message=> (<p key={message}>{message}</p>))}
        </Alert>
      )}
    </>
  )
}
function GenreList() {
  const [query, setQuery] = useState("")
  const { data: genres, error, isLoading } = useGenres(query)
  const [shuffledGenres, setShuffledGenres] = useState([])

  useEffect(() => {
    if (genres.length > 0) {
      const shuffled = [...genres].sort(() => 0.5 - Math.random())
      setShuffledGenres(shuffled)
    }
  }, [genres])

  const handleSetQuery = (query) => {
    setQuery(query)
  }
  return (
    <Container fluid>
      <Row className="justify-content-center">
        <Col md={8}>
          <SearchBox onSearch={handleSetQuery} searchType='genres'/>
          {isLoading && <LoadingSpinner />}
          {error && (<Alert variant="danger">Error fetching genres: {error.message}</Alert>)}
          {!shuffledGenres.length && !isLoading && (<Alert variant="info">No genres found</Alert>)}
          {shuffledGenres.map(genre=>(
            <Card key={genre.handle} className="mb-3">
              <Link style={{ textDecoration: "none", color: "black" }} to={`/genres/${genre.handle}`}>
                <Card.Body>
                  <Card.Title>{genre.name}</Card.Title>
                  <Card.Text className="text-secondary">{genre.description}</Card.Text>
                </Card.Body>
                <ListGroup className="list-group-flush">
                  <ListGroup.Item>
                    <div>
                      <span className="ml-1 text-muted">Games Count: </span>
                      <Badge pill>{genre.games_count}</Badge>
                    </div>
                    {genre.logo_url && (<Image src={genre.logo_url} alt="" fluid style={{ maxWidth: "100%", maxHeight: "150px" }} className="rounded mx-auto d-block"/>)}
                  </ListGroup.Item>
                </ListGroup>
              </Link>
            </Card>
          ))}
        </Col>
      </Row>
    </Container>
  )
}
function GenreDetail() {
  const { handle } = useParams()
  const [genre, setGenre] = useState(null)
  useEffect(() => {GamelyApi.getGenre(`${handle}`).then((res) => setGenre(res))}, [handle])
  if (!genre) return <div>Loading...</div>
  return (
    <div>
      <h1>Genre: {genre.name}</h1>
      <p>{genre.description}</p>
      {genre.games.map(({ id, title,rating, release_date, developer }) => (<GameCard id={id} genre_handle={genre.name} title={title} rating={rating} release_date={release_date} developer={developer}/>))}
    </div>
  )
}
function GameCard({ id, title, genre_handle,rating,release_date, developer }) {
  const { likeGame, currentUser } = useOutletContext()//Assuming useOutletContext provides currentUser and likeGame function
  const [liked, setLiked] = useState(false)//State to track whether the game is liked or not
  useEffect(() => {// Check if current game is liked by user when component mounts
    setLiked(isLiked(id))
  }, [id])// Dependency array ensures this effect runs when id changes
  const handleGameLike = async (id) => {
    try {
      await likeGame(currentUser.username, id)
      setLiked(!liked)// Toggle liked state after successfully liking/unliking
    } 
    catch (error) {console.error("Error toggling like status:", error)}
  }
  const isLiked=id=>{
    const { likes } = currentUser
    return likes.includes(id)
  }
  return (
    <Card className="mb-3">
      <Card.Body>
        <Card.Title>{title}</Card.Title>
        <Card.Text>Genre: {genre_handle}</Card.Text>
        Rating: <Badge>{rating}</Badge>
        <Card.Text>Release Date: {formatReleaseDate(release_date)}</Card.Text>
        <div className="d-flex justify-content-between align-items-center">
          <Card.Text>Developer: {developer}</Card.Text>
          <Button onClick={() => handleGameLike(id)} variant={liked ? "success" : "outline-success"}>
            {liked ? "Liked👍" : "Like it❓"}
          </Button>
        </div>
      </Card.Body>
    </Card>
  )
}
function GameList() {
  const [query, setQuery] = useState("")
  const { data: games, error, isLoading } = useGames(query)
  const [shuffledGames, setShuffledGames] = useState([])

  useEffect(() => {
    if (games.length) {
      const shuffled = [...games].sort(() => 0.5 - Math.random())
      setShuffledGames(shuffled)
    }
  }, [games])
  const handleSetQuery=query=>{setQuery(query)}
  return (
    <div>
      <SearchBox onSearch={handleSetQuery} searchType='games'/>
      {isLoading && <LoadingSpinner />}
      {error && <div>Error fetching games: {error.message}</div>}
      {!shuffledGames.length && !isLoading && <div>No games found</div>}
      {shuffledGames.map(({id,title,genre_handle,rating,release_date,developer })=>(<GameCard title={title} genre_handle={genre_handle} rating={rating} release_date={release_date} developer={developer} key={id} id={id}/>))}
    </div>
  )
}
function formatReleaseDate(dateStr) {
  const [month, day, year] = new Date(dateStr).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"2-digit"}).replace(",", "").split(" ")
  return `${month}-${day}-${year}`
}
function useGenres(query) {
  const [data, setData] = useState([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        let result
        if (!query) result = await GamelyApi.getAllGenres()
        else result = await GamelyApi.getGenreByName(query)
        setData(result)
        setIsLoading(false)
        setError(null)
      } 
      catch (error) {
        console.error("Error fetching genres:", error)
        setError(error)
        setIsLoading(false)
      }
    }
    fetchData()
  }, [query])
  return { data, error, isLoading }
}
function useGames(query) {
  const [data, setData] = useState([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        let result
        if (!query) result = await GamelyApi.getAllGames()
        else result = await GamelyApi.getGamesByTitle(query)
        setData(result)
        setIsLoading(false)
      } 
      catch (error) {
        console.error("Error fetching genres:", error)
        setError(error)
        setIsLoading(false)
      }
    }
    fetchData()
  }, [query])
  return { data, error, isLoading }
}
////////////////////////////////////////////////
function About() {
  return (
    <div className="container-fluid">
      <div className="container">
        <h1 className="mt-5">Gamely - Your Game Search Platform</h1>
        <h2 className="mt-4">Overview</h2>
        <p>Gamely is a full stack web app where users can search for games, view genre details, and manage their profiles. 
          The frontend is built with React, the backend with Express, and PostgreSQL is used as the database.
        </p>
        <h2 className="mt-4">Features</h2>
        <ul>
          <li>User authentication: Users can sign up, log in, and log out.</li>
          <li>Profile management: Users can update their profiles with personal information and preferences</li>
          <li>Game search: Users can search for games by title, genre, and location.</li>
          <li>Genre details: Users can view detailed information about genres.</li>
          <li>Game app: Users can like games directly through the platform.</li>
        </ul>
        <h2 className="mt-4">Stacks Used</h2>
        <ul>
          <li>React</li>
          <li>Express</li>
          <li>Node.js</li>
          <li>PostgreSQL</li>
          <li>Axios (for making HTTP requests)</li>
          <li>JWT (for authentication)</li>
        </ul>
        <h2 className="mt-4">Usage</h2>
        <ol>
          <li>Register for a new account or log in with existing credentials.</li>
          <li>Search for games using the search bar and filters.</li>
          <li>Click on a game listing to view its details.</li>
          <li>Like/Unlike a game</li>
          <li>View and update your profile by navigating to the profile section.</li>
          <li>Log out when finished.</li>
        </ol>
        <h2>Set up and run the project</h2>
        <p>To set up and run this project locally, follow these steps:</p>
        <ul>
          <li>Clone the repository:<pre><code>git clone &lt;repository_url&gt;</code></pre></li>
          <li>
            Navigate to the backend directory and install dependencies:
            <pre>
              <code>
                cd backend<br />
                npm install
              </code>
            </pre>
          </li>
          <li>
            Create a PostgreSQL database:<pre><code>createdb gamely</code></pre></li>
          <li>
            Set up environment variables in a <code>.env</code> file:
            <pre>
              <code>
                DATABASE_URL=postgresql://localhost/gamely<br />
                SECRET_KEY=your_secret_key<br />
                PORT=3001
              </code>
            </pre>
          </li>
          <li>Run the backend server:<pre><code>npm start</code></pre></li>
          <li>
            Navigate to the frontend directory and install dependencies:
            <pre>
              <code>
                cd frontend<br />
                npm install
              </code>
            </pre>
          </li>
          <li>Set up environment variables in a <code>.env</code> file:<pre><code>BACKEND_URL=http://localhost:3001</code></pre></li>
          <li>
            Run the frontend development server:<pre><code>npm run dev</code></pre></li>
          <li>Access the app in your web browser at{" "}<code>http://localhost:5173</code></li>
        </ul>
        <div className="mt-5"><img src="./dbSchemaDiagram-Gamely.jpg" alt="" style={{ maxWidth: "100%" }}/></div>
      </div>
    </div>
  )
}
function SignupForm() {
  const [formData, setFormData] = useFormData()
  const [formErrors, setFormErrors] = useState([])
  const [alertVisible, setAlertVisible] = useState(true)
  const { signup, currentUser } = useOutletContext()
  async function handleSubmit(e) {
    e.preventDefault();
    let result = await signup(formData);
    if (result.success) return <Navigate to="/" />
    else {
      setFormErrors(result.error)
      setAlertVisible(true)
    }
  }
  if (currentUser) return <Navigate to="/" />
  return (
    <div className="col-md-4">
      <Form className="mx-2" onSubmit={handleSubmit}>
        {formErrors.length > 0 && (<CustomAlert type="danger" title="Ops..." messages={formErrors} visible={alertVisible} onClose={() => setAlertVisible(false)}/>)}
        <Form.Group className="mb-3" controlId="formBasicUsername">
          <Form.Label>Username</Form.Label>
          <Form.Control name="username" type="text" onChange={setFormData} />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control name="password" type="password" onChange={setFormData}/>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicFirstName">
          <Form.Label>First name</Form.Label>
          <Form.Control name="first_name" type="text" onChange={setFormData} />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicLastName">
          <Form.Label>Last name</Form.Label>
          <Form.Control name="last_name" type="text" onChange={setFormData} />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control name="email" type="email" onChange={setFormData} />
        </Form.Group>
        <Button variant="primary" type="submit">
          Signup
        </Button>
      </Form>
    </div>
  )
}
function LoginForm() {
  const [formData, setFormData] = useFormData({ username: "", password: "" })
  const [formErrors, setFormErrors] = useState([])
  const [alertVisible, setAlertVisible] = useState(true)

  const { login, currentUser } = useOutletContext()
  const handleSubmit = async (e) => {
    e.preventDefault()
    let result = await login(formData)
    if (result.success) return <Navigate to="/" />
    else {
      setFormErrors(result.error)
      setAlertVisible(true)
    }
  }
  if (currentUser) return <Navigate to="/" />
  return (
    <div className="col-md-4">
      <Form onSubmit={handleSubmit}>
        {formErrors.length > 0 && (<CustomAlert type="danger" title="Ops..." messages={formErrors} visible={alertVisible} onClose={() => setAlertVisible(false)}/>)}
        <Form.Group controlId="formBasicUsername">
          <Form.Control name="username" type="text" placeholder="username" required value={formData.username} onChange={setFormData}/>
        </Form.Group>
        <Form.Group controlId="formBasicPassword">
          <Form.Control type="password" name="password" placeholder="password" required value={formData.password} onChange={setFormData}/>
        </Form.Group>
        <Button variant="primary" type="submit" className="mt-1">Login</Button>
        <Link to="/request-reset">Forgot Password?</Link>
      </Form>
    </div>
  )
}
function ErrorPage() {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="col-md-4 text-center">
        <h1 className="mb-3">404 Not Found</h1>
        <Link to="/" className="btn btn-primary mt-3">Home</Link>
      </div>
    </div>
  )
}
function PrivateRoutes() {
  const context = useOutletContext()
  if (!context?.currentUser) return <Navigate to="/login" />
  return <Outlet context={context} />
}
function useFormData(initialValue) {
  const [formData, setFormData] = useState(initialValue)
  const updateFormData = e=> {
    const { name, value } = e.target
    setFormData((data) => ({ ...data, [name]: value }))
  }
  return [formData, updateFormData]
}
function MainPage() {
  const { currentUser } = useOutletContext() || {}
  return (
    <div className="col-md-4">
      <div className="text-center mb-1"></div>
      <div className="text-center mb-1"></div>
      <div className="text-center mb-1">
        {currentUser?.first_name && currentUser?.last_name 
        ? (<h1>Hi {currentUser?.first_name} {currentUser?.last_name}</h1>) 
        : (<>
            <h1>
              Welcome to<br></br>
              GAMELY<br></br>
              Fun is just a search away
            </h1>
            Login/Signup to start exploring fun games today
          </>
        )}
      </div>
    </div>
  )
}
function ProfileForm() {
  const { currentUser, updateUser } = useOutletContext()
  const { username, first_name, last_name, email } = currentUser
  const [formErrors, setFormErrors] = useState([])
  const [isSaved, setIsSaved] = useState(false)
  const [formData, setFormData] = useFormData({username,first_name,last_name,email})
  const [alertVisible, setAlertVisible] = useState(true)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { username, ...sendingData } = formData
    let result = await updateUser(currentUser.username, sendingData)

    if (result.success) {
      setIsSaved(true)
      setAlertVisible(true)
    } else {
      setFormErrors(result.error)
      setAlertVisible(true)
    }
  }
  return (
    <div className="col-md-4">
      {formErrors.length > 0 && (<CustomAlert type="danger" title="Ops..." messages={formErrors} visible={alertVisible} onClose={() => setAlertVisible(false)}/>)}
      {isSaved && (<CustomAlert type="success" title="Success" messages={["Profile updated"]} visible={alertVisible} onClose={() => setAlertVisible(false)}/>)}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formBasicUsername">
          <Form.Label>Username:</Form.Label>
          <Form.Control name="username" type="text" placeholder="Enter username" disabled value={currentUser.username}/>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicFirstName">
          <Form.Label>First name</Form.Label>
          <Form.Control name="first_name" type="text" onChange={setFormData} value={formData.first_name}/>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicLastName">
          <Form.Label>Last name</Form.Label>
          <Form.Control name="last_name" type="text" value={formData.last_name} onChange={setFormData}/>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control name="email" type="email" value={formData.email} onChange={setFormData}/>
        </Form.Group>
        <Button variant="primary" type="submit">Update</Button>
      </Form>
    </div>
  )
}
function SearchBox({ onSearch,searchType }) {
  const [query, setQuery] = useState("")
  const handleChange =e=> {setQuery(e.target.value)}
  const handleSubmit =e=> {
    e.preventDefault()
    onSearch(query)
    setQuery("")
  }
  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <Form onSubmit={handleSubmit} className="d-flex mb-4">
          <Form.Control type="text" placeholder={searchType === 'genres' ? 'Search genres...' : 'Search games...'} value={query} onChange={handleChange}/>
          <Button type="submit" variant="primary" className="ms-2">Search</Button>
        </Form>
      </div>
    </div>
  )
}
function Users() {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        const usersData = await GamelyApi.getAllUsers()
        setUsers(usersData)
        setIsLoading(false)
        setError(null)
      } 
      catch (error) {
        console.error("ERROR FETCHING USERS:", error)
        setError(error)
        setIsLoading(false)
      }
    }
    fetchUsers()
  }, [])
  const deleteUser = async (username) => {
    try {
      await GamelyApi.deleteUser(username)
      setUsers(users.filter((user) => user.username !== username))
    } 
    catch (error) {
      console.error("ERROR DELETING USER:", error)
      setError(error)
    }
  }
  if (isLoading) return <LoadingSpinner />
  if (error) return <div>ERROR IS: {error.message}</div>
  return (
    <Container>
      {users.length === 0 && <p>No users found</p>}
      {users.length > 0 && (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Username</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>is_admin</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.username}>
                <td>{user.username}</td>
                <td>{user.first_name}</td>
                <td>{user.last_name}</td>
                <td>{user.email}</td>
                <td>{user.is_admin ? "Yes" : "No"}</td>
                <td><Button variant="danger" onClick={() => deleteUser(user.username)}>DELETE</Button></td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  )
}
function RequestResetForm() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`${BACKEND_URL}/auth/request-reset`, { email })
      setMessage(res.data.message)
    } 
    catch (err) {setMessage(err.response.data.error.message)}
  }
  return (
    <form onSubmit={handleSubmit}>
      <label>Email:<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required/></label>
      <button type="submit">Request Password Reset</button>
      {message && <p>{message}</p>}
    </form>
  )
}
function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState("")
  const [message, setMessage] = useState("")
  const [alertType, setAlertType] = useState("")
  const { token } = useParams()
  const navigate = useNavigate()
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`${BACKEND_URL}/auth/reset-password`, {token,newPassword})
      setMessage(res.data.message)
      setAlertType("success")
      setTimeout(() => {navigate("/login")}, 3000)
    } 
    catch (err) {
      setMessage(err.response.data.error.message)
      setAlertType("danger")
    }
  }
  return (
    <Container className="col-md-4 mt-5">
      {message && (<CustomAlert type={alertType} title={alertType === "success" ? "Success" : "Error"} messages={[message]} visible={true} onClose={() => setMessage("")}/>)}
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formNewPassword">
          <Form.Label>New Password</Form.Label>
          <Form.Control type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required/>
        </Form.Group>
        <Button variant="primary" type="submit" className="mt-3">Reset Password</Button>
      </Form>
    </Container>
  )
}
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={createBrowserRouter([
      {path: "/",errorElement: <ErrorPage />,
        element: <App />,
        children: [
            { path: "/", element: <MainPage /> },
            { path: "/login", element: <LoginForm /> },
            { path: "/signup", element: <SignupForm /> },
            { path: "/about", element: <About /> },
            { path: "/request-reset", element: <RequestResetForm /> },
            { path: "/reset-password/:token", element: <ResetPasswordForm /> },
            {
              element: <PrivateRoutes />,
              children: [
                { path: "/genres", element: <GenreList /> },
                { path: "/genres/:handle", element: <GenreDetail /> },
                { path: "/games", element: <GameList /> },
                { path: "/users", element: <Users /> },
                { path: "/profile", element: <ProfileForm /> },
              ],
            },
          ],
        },
      ])}
    >
      <App />
    </RouterProvider>
  </React.StrictMode>
)