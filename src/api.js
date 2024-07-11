import axios from "axios"

const BASE_URL=import.meta.env.VITE_REACT_APP_BASE_URL || "http://localhost:3001"

export default class GamelyApi{//utility class to make API requests to backend server using Axios
  //static methods mean don't need to instantiate an object of GamelyApi to use them.They can be called directly on the class itself (GamelyApi.method())
  static token
  //Performs actual HTTP request using Axios
  //data: Optional data to send with POST,PUT,PATCH,DELETE requests
  //Returns with data from the server's response if successful(throws an error if request fails)
  static async request(endpoint,data={},method="get") {
    // const params = method==="get" ? data : {}
    try {
      return (
        await axios({
          url:`${BASE_URL}/${endpoint}`,
          method: method,
          data:  method==="get" ? {} : data,
          params:method==="get" ? data : {},
          headers:{Authorization:`Bearer ${this.token}`} })
      ).data
    } 
    catch (err){let message=err.response.data.error.message;throw Array.isArray(message) ? message : [message]}
  }
  // Requests authentication token from backend server
  static async authToken(data) {
    let res = await this.request(`auth/token`, data, "post")//GamelyApi.token: eyJ....eyJ....q6...
    return res.token
  }    
  static async getCurrentUser(username) {// Retrieves information about user: username
    let res = await this.request(`users/${username}`)
    return res.user
  } 
  static async createUser(data){//Registers new user by sending registration data to backend.Return JWT token
    let res = await this.request(`auth/register`, data, "post")
    return res.token
  }
  static async updateUser(username, data) {
    let res = await this.request(`users/${username}`, data, "patch")
    return res.user
  }
  static async getGenre(handle) {
    let res = await this.request(`genres/${handle}`)
    return res.genre
  }
  static async getAllGenres() {
    let res = await this.request(`genres`)
    return res.genres
  }
  static async getGenreByName(name) {
    let res = await this.request(`genres?name=${name}`)
    return res.genres
  }
  static async getAllGames() {
    let res = await this.request("games")
    return res.games
  }
  static async getGamesByTitle(title) {
    let res = await this.request(`games?title=${title}`)
    return res.games
  }
  static async likeGame(username, game_id) {//ORIGINAL
    let res = await this.request(`users/${username}/games/${game_id}`, {}, "post")
    return res.liked
  }  
  static async getAllUsers() {
    let res = await this.request("users")//there's an endpoint on backend server that returns all users
    return res.users
  }
  static async deleteUser(username) {
    await this.request(`users/${username}`, {}, "delete")
  }
}